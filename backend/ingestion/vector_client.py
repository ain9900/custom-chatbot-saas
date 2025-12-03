# minimal qdrant client wrapper (adjust to your qdrant deployment)
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
_client = None

def get_client():
    """Get or create Qdrant client (lazy initialization)"""
    global _client
    if _client is None:
        try:
            _client = QdrantClient(url=QDRANT_URL)
        except Exception as e:
            print(f"Warning: Could not initialize Qdrant client: {e}")
            raise
    return _client

# For backward compatibility - use get_client() instead
def client():
    return get_client()

def ensure_collection(namespace: str, vector_size: int = 1536):
    """Ensure collection exists, create if not"""
    try:
        client = get_client()
        try:
            collections = client.get_collections().collections
            collection_names = [c.name for c in collections]
        except Exception as e:
            error_msg = f"Could not connect to Qdrant at {QDRANT_URL}: {e}"
            print(f"✗ {error_msg}")
            raise ConnectionError(error_msg)
        
        if namespace not in collection_names:
            client.create_collection(
                collection_name=namespace,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
            print(f"✓ Created collection: {namespace} (vector size: {vector_size})")
        else:
            print(f"✓ Collection exists: {namespace}")
    except ConnectionError:
        raise  # Re-raise connection errors
    except Exception as e:
        error_msg = f"Error ensuring collection {namespace}: {e}"
        print(f"✗ {error_msg}")
        raise Exception(error_msg)

def upsert_vectors(namespace: str, vectors: list):
    """
    vectors: list of dict {"id": str, "payload": {...}, "vector": [floats]}
    """
    if not vectors:
        return
    
    client = get_client()
    
    # Ensure collection exists
    vector_size = len(vectors[0]["vector"]) if vectors else 1536
    ensure_collection(namespace, vector_size)
    
    # Convert to Qdrant format
    points = []
    for v in vectors:
        points.append({
            "id": v["id"],
            "vector": v["vector"],
            "payload": v.get("payload", {})
        })
    
    try:
        from qdrant_client.models import PointStruct
        # Convert to PointStruct format
        point_structs = [
            PointStruct(
                id=point["id"],
                vector=point["vector"],
                payload=point["payload"]
            ) for point in points
        ]
        client.upsert(collection_name=namespace, points=point_structs)
        print(f"✓ Upserted {len(points)} points to collection: {namespace}")
    except Exception as e:
        error_msg = f"Error upserting vectors to Qdrant: {e}"
        print(f"✗ {error_msg}")
        # Check if it's a connection error
        if "Connection" in str(e) or "refused" in str(e).lower():
            raise ConnectionError(f"Could not connect to Qdrant at {QDRANT_URL}. Make sure Qdrant is running.")
        raise Exception(error_msg)

def retrieve_top_k(namespace: str, query_text: str, k: int = 4):
    # This is now handled by ingestion/services.py search_similar
    # Keeping for backward compatibility
    from ingestion.services import search_similar
    return search_similar(namespace, query_text, k)
