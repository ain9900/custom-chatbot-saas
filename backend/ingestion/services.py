import os
from typing import List, Dict, Optional
from openai import OpenAI
from django.conf import settings
from .vector_client import upsert_vectors, retrieve_top_k
import uuid

# Lazy initialization of OpenAI client
_openai_client = None

def get_openai_client():
    """Get or create OpenAI client"""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set. Please set it in your environment variables or Django settings.")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client

def get_embedding(text: str, model: str = "text-embedding-3-small") -> Optional[List[float]]:
    """Get embedding vector for text using OpenAI"""
    try:
        client = get_openai_client()
        response = client.embeddings.create(
            model=model,
            input=text
        )
        return response.data[0].embedding
    except ValueError as e:
        # API key not set
        print(f"OpenAI API key not configured: {e}")
        return None
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into chunks with overlap"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks

def process_text_for_ingestion(text: str, metadata: Dict = None) -> List[Dict]:
    """Process text into chunks and create vectors"""
    chunks = chunk_text(text)
    vectors = []
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        if embedding:
            vector_point = {
                "id": str(uuid.uuid4()),
                "payload": {
                    "text": chunk,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    **(metadata or {})
                },
                "vector": embedding
            }
            vectors.append(vector_point)
    
    return vectors

def ingest_documents(namespace: str, documents: List[str], metadata: Dict = None):
    """Ingest multiple documents into vector database"""
    if not documents:
        return 0
    
    all_vectors = []
    
    for doc_idx, doc_text in enumerate(documents):
        if not doc_text or not doc_text.strip():
            continue
            
        doc_metadata = {
            "document_index": doc_idx,
            **(metadata or {})
        }
        try:
            vectors = process_text_for_ingestion(doc_text, doc_metadata)
            all_vectors.extend(vectors)
            print(f"  Processed document {doc_idx + 1}: {len(vectors)} chunks created")
        except Exception as e:
            print(f"  Error processing document {doc_idx + 1}: {e}")
            continue
    
    if all_vectors:
        try:
            upsert_vectors(namespace, all_vectors)
            print(f"✓ Successfully stored {len(all_vectors)} vectors in namespace: {namespace}")
            return len(all_vectors)
        except Exception as e:
            print(f"✗ Error storing vectors in Qdrant: {e}")
            raise
    else:
        print("⚠ No vectors created from documents")
        return 0

def search_similar(namespace: str, query_text: str, k: int = 4) -> List[str]:
    """Search for similar documents in vector database"""
    try:
        # Get embedding for query
        query_embedding = get_embedding(query_text)
        if not query_embedding:
            return []
        
        # Use Qdrant client to search
        from ingestion.vector_client import get_client, ensure_collection
        client = get_client()
        # Ensure collection exists
        ensure_collection(namespace, len(query_embedding))
        
        results = client.search(
            collection_name=namespace,
            query_vector=query_embedding,
            limit=k
        )
        
        # Extract text from results
        texts = []
        for result in results:
            if hasattr(result, 'payload') and 'text' in result.payload:
                texts.append(result.payload['text'])
        
        return texts
    except Exception as e:
        print(f"Error searching vectors: {e}")
        return []

