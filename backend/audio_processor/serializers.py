# audio_processor/serializers.py

from rest_framework import serializers
from .models import Session, AnalysisResult, Session # Import your models



# audio_processor/serializers.py

from rest_framework import serializers
from .models import Session, AnalysisResult
from django.contrib.auth import get_user_model # Ensure CustomUser is accessible

User = get_user_model() # Get your CustomUser model

class AnalysisResultSerializer(serializers.ModelSerializer):
    """
    Serializer for the AnalysisResult model.
    """
    class Meta:
        model = AnalysisResult
        fields = [
            'transcription_text', 'summary_text', 'notes_text',
            'suggestions_resources_text', 'processed_timestamp',
            'llm_model_used', 'prompt_template_version'
        ]
        read_only_fields = ('__all__',)# Analysis results are read-only via API

class SessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Session model.
    Includes nested AnalysisResult when full details are requested.
    """
    user = serializers.ReadOnlyField(source='user.username') # Display username, not user ID
    analysis_result = AnalysisResultSerializer(read_only=True, required=False) # Nested serializer

    class Meta:
        model = Session
        fields = [
            'id', 'user', 'title', 'original_file_name', 'file_type',
            'duration_seconds', 'upload_timestamp', 'processing_mode', 'status',
            'analysis_result' # Include the nested analysis result
        ]
        read_only_fields = ['user', 'upload_timestamp', 'status', 'analysis_result']

 

class FileUploadSerializer(serializers.Serializer):
    """
    Serializer specifically for validating file uploads.
    It does not directly map to a model instance for creation,
    but validates the incoming data for the upload endpoint.
    """
    file = serializers.FileField(help_text="Audio or video file to process.")
    processing_mode = serializers.ChoiceField(
        choices=Session.PROCESSING_MODE_CHOICES,
        default='LECTURE',
        help_text="The mode for processing the session (e.g., 'LECTURE', 'MEETING')."
    )
    title = serializers.CharField(
        max_length=255,
        required=False, # Title is optional during upload
        allow_blank=True,
        help_text="An optional title for the session."
    )
    # You can add more validation for file types/sizes here if needed
    # e.g., validators=[FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'mp4'])]
    
    
