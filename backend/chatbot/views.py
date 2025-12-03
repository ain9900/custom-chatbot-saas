from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Chatbot
from .serializers import ChatbotCreateSerializer, ChatbotListSerializer
from tenants.models import Tenant
from fb.services import process_incoming_for_chatbot
from ingestion.services import ingest_documents

class ChatbotCreateView(generics.CreateAPIView):
    serializer_class = ChatbotCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        tenant = Tenant.objects.filter(owner=self.request.user).first()
        chatbot = serializer.save(tenant=tenant)
        
        # Process vector data if provided (optional - chatbot creation succeeds even if this fails)
        ingestion_result = {"success": False, "message": "", "chunks_ingested": 0}
        try:
            documents = self.request.FILES.getlist('documents') if hasattr(self.request, 'FILES') else []
            document_texts = self.request.data.get('document_texts', '')
            
            if documents or document_texts:
                # If files are uploaded, read them
                texts_to_ingest = []
                
                # Process uploaded files
                if documents:
                    for doc in documents:
                        try:
                            if hasattr(doc, 'read'):
                                content = doc.read().decode('utf-8')
                                if content.strip():
                                    texts_to_ingest.append(content)
                        except UnicodeDecodeError:
                            print(f"Error: File {doc.name} is not a valid text file (UTF-8)")
                        except Exception as e:
                            print(f"Error reading document {doc.name}: {e}")
                
                # Process text documents
                if document_texts:
                    if isinstance(document_texts, str) and document_texts.strip():
                        texts_to_ingest.append(document_texts.strip())
                    elif isinstance(document_texts, list):
                        for text in document_texts:
                            if isinstance(text, str) and text.strip():
                                texts_to_ingest.append(text.strip())
                
                # Ingest into vector database (optional - don't fail chatbot creation if this fails)
                if texts_to_ingest:
                    try:
                        metadata = {
                            "chatbot_id": chatbot.id,
                            "chatbot_name": chatbot.name,
                            "tenant_id": tenant.id
                        }
                        chunks_count = ingest_documents(chatbot.vector_namespace, texts_to_ingest, metadata)
                        ingestion_result = {
                            "success": True,
                            "message": f"Successfully ingested {chunks_count} document chunks",
                            "chunks_ingested": chunks_count
                        }
                        print(f"✓ Vector ingestion successful: {chunks_count} chunks ingested for chatbot {chatbot.name}")
                    except ValueError as e:
                        # API key or configuration issue
                        ingestion_result = {
                            "success": False,
                            "message": f"Configuration error: {str(e)}",
                            "chunks_ingested": 0
                        }
                        print(f"⚠ Configuration error during vector ingestion: {e}")
                    except Exception as e:
                        # Other errors (Qdrant connection, etc.)
                        ingestion_result = {
                            "success": False,
                            "message": f"Vector database error: {str(e)}",
                            "chunks_ingested": 0
                        }
                        print(f"⚠ Error ingesting documents into vector database: {e}")
                        print("   Chatbot created successfully, but vector database ingestion failed.")
                        import traceback
                        traceback.print_exc()
        except Exception as e:
            # Don't fail chatbot creation if vector processing fails
            ingestion_result = {
                "success": False,
                "message": f"Error processing vector data: {str(e)}",
                "chunks_ingested": 0
            }
            print(f"⚠ Error processing vector data: {e}")
            import traceback
            traceback.print_exc()
        
        # Store ingestion result in chatbot instance for potential response
        chatbot._ingestion_result = ingestion_result

class ChatbotListView(generics.ListAPIView):
    serializer_class = ChatbotListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = Tenant.objects.filter(owner=self.request.user).first()
        return Chatbot.objects.filter(tenant=tenant)

class ChatbotWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, webhook_key):
        try:
            chatbot = Chatbot.objects.get(webhook_key=webhook_key, is_active=True)
        except Chatbot.DoesNotExist:
            return Response({"error": "Chatbot not found"}, status=status.HTTP_404_NOT_FOUND)

        # Extract message from request
        text = request.data.get("message", "")
        sender_id = request.data.get("sender_id", request.data.get("user_id", "anonymous"))

        if not text:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Process the message
        reply = process_incoming_for_chatbot(chatbot, sender_id, text, channel="widget", fb_page=None)

        return Response({"reply": reply}, status=status.HTTP_200_OK)

class ChatbotIngestView(APIView):
    """Endpoint to add more documents to chatbot's vector database"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, chatbot_id):
        try:
            chatbot = Chatbot.objects.get(id=chatbot_id, tenant__owner=request.user)
        except Chatbot.DoesNotExist:
            return Response({"error": "Chatbot not found"}, status=status.HTTP_404_NOT_FOUND)

        documents = request.FILES.getlist('documents')
        document_texts = request.data.get('document_texts', [])
        
        texts_to_ingest = []
        
        # Process uploaded files
        for doc in documents:
            try:
                content = doc.read().decode('utf-8')
                texts_to_ingest.append(content)
            except Exception as e:
                return Response({"error": f"Error reading file {doc.name}: {str(e)}"}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        # Process text documents
        if document_texts:
            if isinstance(document_texts, str):
                texts_to_ingest.append(document_texts)
            elif isinstance(document_texts, list):
                texts_to_ingest.extend(document_texts)
        
        if not texts_to_ingest:
            return Response({"error": "No documents provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            metadata = {
                "chatbot_id": chatbot.id,
                "chatbot_name": chatbot.name,
                "tenant_id": chatbot.tenant.id
            }
            count = ingest_documents(chatbot.vector_namespace, texts_to_ingest, metadata)
            return Response({
                "message": f"Successfully ingested {count} document chunks",
                "chunks_count": count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error ingesting documents: {str(e)}"}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
