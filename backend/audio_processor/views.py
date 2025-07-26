from django.shortcuts import render

# Create your views here.
# audio_processor/views.py

 
import os
import json
from django.http import FileResponse, Http404
from django.template.loader import get_template
from django.conf import settings
from xhtml2pdf import pisa # For PDF generation
from io import BytesIO # For handling PDF in memory
import requests
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from .models import Session, AnalysisResult
from .serializers import FileUploadSerializer, SessionSerializer, AnalysisResultSerializer # Import new serializer
from .tasks import process_session_task

# --- Configuration for LLM (re-used from tasks.py for Q&A endpoint) ---
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL_NAME = "deepseek-r1:1.5b" # Must match the model used in tasks.py

class SessionUploadView(APIView):
    """
    API endpoint for uploading audio/video files and initiating processing.
    Requires authentication.
    """
    parser_classes = (MultiPartParser, FormParser) # Allows file uploads via form data
    permission_classes = [IsAuthenticated] # Only authenticated users can upload

    def post(self, request, *args, **kwargs):
        serializer = FileUploadSerializer(data=request.data)

        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']
            processing_mode = serializer.validated_data['processing_mode']
            title = serializer.validated_data.get('title', '') # Get title, default to empty string

            # Create a new Session instance
            session = Session.objects.create(
                user=request.user, # Link to the authenticated user
                title=title,
                original_file_name=uploaded_file.name,
                file_type='AUDIO' if uploaded_file.content_type.startswith('audio') else 'VIDEO', # Basic type detection
                # duration_seconds will be set by the processing task
                processing_mode=processing_mode,
                status='PENDING', # Initial status
                file_path=uploaded_file # Django's FileField handles saving the file
            )

            # Enqueue the Celery task for background processing
            # Pass the session ID so the task knows which session to process
            process_session_task.delay(session.id)

            # Return a 202 Accepted response with the new session's basic info
            return Response(
                SessionSerializer(session).data, # Use SessionSerializer for consistent output
                status=status.HTTP_202_ACCEPTED
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        
        
class SessionStatusView(generics.RetrieveAPIView):
    """
    API endpoint to get the status of a specific session.
    Requires authentication.
    """
    queryset = Session.objects.all()
    serializer_class = SessionSerializer # Use the existing SessionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk' # Use primary key for lookup (session ID)

    def get(self, request, *args, **kwargs):
        session = self.get_object()
        # Ensure the user can only retrieve their own session status
        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to access this session."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Manually select fields to return for status polling
        data = {
            'id': session.id,
            'status': session.status,
            'title': session.title,
            'original_file_name': session.original_file_name,
        }
        return Response(data) # Return only the specific data needed for status
    
    
    
    
    
class SessionResultsView(generics.RetrieveAPIView):
    """
    API endpoint to get the full analysis results for a specific session.
    Requires authentication.
    """
    queryset = Session.objects.all()
    serializer_class = SessionSerializer # Use SessionSerializer which now nests AnalysisResult
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        session = self.get_object()
        # Ensure the user can only retrieve their own session results
        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to access this session."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if analysis results exist and are completed
        if session.status != 'COMPLETED' or not hasattr(session, 'analysis_result'):
            return Response(
                {"detail": "Analysis not yet completed for this session."},
                status=status.HTTP_404_NOT_FOUND # Or 400 Bad Request
            )

        # The SessionSerializer will automatically include analysis_result
        serializer = self.get_serializer(session)
        return Response(serializer.data)

# --- New: API Endpoint for PDF Export ---
class ExportNotesPDFView(APIView):
    """
    API endpoint to export session notes as a PDF.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            session = Session.objects.get(pk=pk)
        except Session.DoesNotExist:
            raise Http404("Session not found.")

        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to access these notes."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not hasattr(session, 'analysis_result') or not session.analysis_result.notes_text:
            return Response(
                {"detail": "No notes available for this session."},
                status=status.HTTP_404_NOT_FOUND
            )

        notes_content = session.analysis_result.notes_text
        session_title = session.title or session.original_file_name or f"Session {session.id}"

        # Create an HTML template for the PDF
        # You might want to create a dedicated template file (e.g., 'pdf_notes.html')
        # in audio_processor/templates/audio_processor/
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{session_title} Notes</title>
            <style>
                body {{ font-family: sans-serif; margin: 40px; }}
                h1 {{ color: #312E81; text-align: center; }}
                h2 {{ color: #4F46E5; margin-top: 30px; }}
                pre {{ background-color: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }}
                ul, ol {{ margin-left: 20px; }}
                li {{ margin-bottom: 5px; }}
            </style>
        </head>
        <body>
            <h1>Notes for: {session_title}</h1>
            <p>Generated on: {session.analysis_result.processed_timestamp.strftime('%Y-%m-%d %H:%M')}</p>
            <hr/>
            <h2>Detailed Notes</h2>
            <pre>{notes_content}</pre>
            <hr/>
            <h2>Summary</h2>
            <pre>{session.analysis_result.summary_text}</pre>
             <hr/>
            <h2>Suggestions and Resources</h2>
            <pre>{session.analysis_result.suggestions_resources_text}</pre>
        </body>
        </html>
        """
        # Alternatively, load from a template file:
        # template = get_template('audio_processor/pdf_notes.html')
        # html_content = template.render({'session_title': session_title, 'notes_content': notes_content, ...})

        result_file = BytesIO()
        pisa_status = pisa.CreatePDF(
            html_template,
            dest=result_file,
            encoding="UTF-8"
        )
        if pisa_status.err:
            return Response({"detail": "Error generating PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        result_file.seek(0)
        response = FileResponse(result_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{session_title}_notes.pdf"'
        return response

# --- New: API Endpoint for Search ---
class SessionSearchAPIView(APIView):
    """
    API endpoint to search within a session's transcription, summary, or notes.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            session = Session.objects.get(pk=pk)
        except Session.DoesNotExist:
            raise Http404("Session not found.")

        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to search this session."},
                status=status.HTTP_403_FORBIDDEN
            )

        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"detail": "Search query 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(session, 'analysis_result'):
            return Response(
                {"detail": "Analysis not yet completed for this session."},
                status=status.HTTP_404_NOT_FOUND
            )

        analysis = session.analysis_result
        results = {}

        # Simple case-insensitive search using 'in' operator for now
        # For large texts, consider PostgreSQL Full-Text Search or dedicated search engines
        query_lower = query.lower()

        if query_lower in analysis.transcription_text.lower():
            results['transcription_matches'] = True
            # In a real app, you'd return snippets or highlight indices
        if query_lower in analysis.summary_text.lower():
            results['summary_matches'] = True
        if query_lower in analysis.notes_text.lower():
            results['notes_matches'] = True
        if query_lower in analysis.suggestions_resources_text.lower():
            results['suggestions_matches'] = True

        if not results:
            return Response({"detail": "No matches found."}, status=status.HTTP_200_OK)

        return Response(results, status=status.HTTP_200_OK)

# --- New: API Endpoint for Ask LLM / Q&A ---
class SessionQnAAPIView(APIView):
    """
    API endpoint to ask the LLM questions about a session's content.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            session = Session.objects.get(pk=pk)
        except Session.DoesNotExist:
            raise Http404("Session not found.")

        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to query this session."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not hasattr(session, 'analysis_result') or session.status != 'COMPLETED':
            return Response(
                {"detail": "Analysis not yet completed for this session."},
                status=status.HTTP_404_NOT_FOUND
            )

        user_question = request.data.get('question', '').strip()
        context_text = request.data.get('context', '').strip() # Optional context from frontend

        if not user_question:
            return Response({"detail": "Question is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Combine relevant content for LLM context
        analysis = session.analysis_result
        full_context = analysis.transcription_text # Always provide full transcription
        if context_text: # If frontend provides specific context, prepend it
            full_context = f"User provided context: {context_text}\n\nFull Transcription:\n{full_context}"
        else:
            # If no specific context, add summary/notes to enrich context
            full_context = f"Summary:\n{analysis.summary_text}\n\nNotes:\n{analysis.notes_text}\n\nFull Transcription:\n{full_context}"


        # Construct the prompt for the Q&A
        qna_prompt = f"""
        You are an AI assistant helping a user understand a lecture.
        Based on the provided lecture content, answer the following question.
        If the answer is not directly available in the content, state that you cannot answer based on the provided text.

        ---
        LECTURE CONTENT:
        {full_context}
        ---

        USER QUESTION: {user_question}

        AI ANSWER:
        """
        print(f"Sending Q&A prompt to LLM for session {pk}...")
        ollama_payload = {
            "model": OLLAMA_MODEL_NAME,
            "prompt": qna_prompt,
            "stream": False
        }

        try:
            llm_response = requests.post(OLLAMA_API_URL, json=ollama_payload)
            llm_response.raise_for_status()
            response_data = llm_response.json()
            print("AI answer: ",response_data)
            ai_answer = response_data.get('response', '').strip()
            return Response({"answer": ai_answer}, status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            print(f"LLM API error during Q&A for Session ID {pk}: {e}")
            return Response(
                {"detail": f"Failed to get answer from AI. LLM error: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            print(f"Unexpected error during Q&A for Session ID {pk}: {e}")
            return Response(
                {"detail": "An unexpected error occurred while asking the AI."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )    
    
    
    
# --- NEW: API Endpoint for Listing User Sessions ---
class SessionListView(generics.ListAPIView):
    """
    API endpoint to list all sessions for the authenticated user.
    Requires authentication.
    """
    
    queryset = Session.objects.all() # Base queryset
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset to return only sessions belonging to the authenticated user.
        Optionally, filters to only show 'COMPLETED' sessions for history.
        """
        user = self.request.user
        # For history, typically you only want to show completed sessions.
        # Remove .filter(status='COMPLETED') if you want to show all statuses.
        return self.queryset.filter(user=user).order_by('upload_timestamp')    
    
    
class SessionStatsView(APIView):
    """
    API endpoint to get summary statistics for the authenticated user's sessions.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        all_sessions = Session.objects.filter(user=user)

        total_sessions = all_sessions.count()
        completed_sessions = all_sessions.filter(status='COMPLETED').count()
        failed_sessions = all_sessions.filter(status='FAILED').count()
        pending_sessions = all_sessions.filter(status='PENDING').count()
        transcribing_sessions = all_sessions.filter(status='TRANSCRIBING').count()
        analyzing_sessions = all_sessions.filter(status='ANALYZING').count()

        last_session = all_sessions.order_by('-upload_timestamp').first()
        last_session_info = None
        if last_session:
            last_session_info = {
                'id': last_session.id,
                'title': last_session.title or last_session.original_file_name,
                'status': last_session.status,
                'upload_timestamp': last_session.upload_timestamp.isoformat(),
            }

        return Response({
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'failed_sessions': failed_sessions,
            'pending_sessions': pending_sessions,
            'transcribing_sessions': transcribing_sessions,
            'analyzing_sessions': analyzing_sessions,
            'last_session': last_session_info,
        }, status=status.HTTP_200_OK)

# --- NEW: SessionRetryView ---
class SessionRetryView(APIView):
    """
    API endpoint to retry processing for a specific session.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            session = Session.objects.get(pk=pk)
        except Session.DoesNotExist:
            raise Http404("Session not found.")

        if session.user != request.user:
            return Response(
                {"detail": "You do not have permission to retry this session."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only allow retry if session is in a retryable state
        if session.status not in ['PENDING', 'FAILED', 'TRANSCRIBING']:
            return Response(
                {"detail": f"Session status '{session.status}' is not retryable."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset status to PENDING and re-enqueue the task
        session.status = 'PENDING'
        session.save(update_fields=['status'])
        process_session_task.delay(session.id)

        return Response(
            {"detail": "Session processing re-enqueued.", "session_status": session.status},
            status=status.HTTP_200_OK
        )