import os
import subprocess
import requests
import json
from celery import shared_task
from django.conf import settings
from faster_whisper import WhisperModel

from .models import Session, AnalysisResult

# --- Configuration ---
WHISPER_MODEL_SIZE = "base"
WHISPER_DEVICE = "cpu"
WHISPER_COMPUTE_TYPE = "int8"

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL_NAME = "deepseek-r1:1.5b"

# Load Whisper model
try:
    whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
    print(f"Whisper model '{WHISPER_MODEL_SIZE}' loaded on {WHISPER_DEVICE} with {WHISPER_COMPUTE_TYPE} compute type.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    whisper_model = None

@shared_task
def process_session_task(session_id):
    session = None
    output_audio_path = None

    try:
        session = Session.objects.get(id=session_id)
        print(f"Starting processing for Session ID: {session_id} - Title: '{session.title}'")

        # --- 1. Set status ---
        session.status = 'TRANSCRIBING'
        session.save(update_fields=['status'])

        original_file_path = session.file_path.path
        if not os.path.exists(original_file_path):
            raise FileNotFoundError(f"Original file not found: {original_file_path}")

        # --- 2. Extract Audio with FFmpeg ---
        output_audio_name = f"temp_audio_{session.id}.wav"
        output_audio_path = os.path.join(settings.MEDIA_ROOT, 'temp_audio', output_audio_name)
        os.makedirs(os.path.dirname(output_audio_path), exist_ok=True)

        ffmpeg_command = [
            "ffmpeg", "-y", "-i", original_file_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            output_audio_path
        ]
        print(f"Running ffmpeg command: {' '.join(ffmpeg_command)}")
        subprocess.run(ffmpeg_command, check=True)

        print(f"Audio extracted to: {output_audio_path}")

        # --- 3. Transcription ---
        if not whisper_model:
            raise Exception("Whisper model not loaded. Cannot transcribe.")

        print(f"Starting transcription for session {session_id}...")
        segments, info = whisper_model.transcribe(output_audio_path, beam_size=5)
        transcription_full_text = " ".join([seg.text for seg in segments]).strip()
        print(f"Transcription completed. Length: {len(transcription_full_text)} characters")

        session.status = 'ANALYZING'
        session.save(update_fields=['status'])

        # --- 4. Prepare LLM Prompt ---
        llm_prompt = f"""
        You are DeepSeek, an advanced AI assistant skilled at analyzing lecture transcripts and extracting key information.
        Given the following lecture transcription, perform these tasks:
        1. Write a concise summary of the main ideas and themes.
        2. Create detailed notes using bullet points or numbered lists, highlighting important concepts, definitions, and facts.
        3. Suggest further study topics and recommend relevant resources (such as books, articles, or websites).

        Please format your response using these clear sections:

        ### SUMMARY
        [Insert concise summary here]

        ### DETAILED NOTES
        [Insert detailed notes here, using bullet points or numbered lists]

        ### SUGGESTIONS AND RESOURCES
        [Insert suggestions and recommended resources here]

        ---
        LECTURE TRANSCRIPTION:
        {transcription_full_text}
        ---
        """

        # --- 5. Call LLM via Ollama ---
        print(f"Sending transcription to LLM for session {session_id}...")
        llm_response = requests.post(OLLAMA_API_URL, json={
            "model": OLLAMA_MODEL_NAME,
            "prompt": llm_prompt,
            "stream": False
        })
        llm_response.raise_for_status()
        llm_generated_text = llm_response.json().get('response', '').strip()

        print(f"--- LLM Output START ---\n{llm_generated_text[:1000]}...\n--- END ---")

        # --- 6. Parse LLM Output ---
        summary_start = llm_generated_text.find("### SUMMARY")
        notes_start = llm_generated_text.find("### DETAILED NOTES")
        suggestions_start = llm_generated_text.find("### SUGGESTIONS AND RESOURCES")

        summary_end = notes_start if notes_start != -1 else suggestions_start if suggestions_start != -1 else len(llm_generated_text)
        notes_end = suggestions_start if suggestions_start != -1 else len(llm_generated_text)
        suggestions_end = len(llm_generated_text)

        summary_text = llm_generated_text[summary_start + len("### SUMMARY"):summary_end].strip() if summary_start != -1 else ""
        notes_text = llm_generated_text[notes_start + len("### DETAILED NOTES"):notes_end].strip() if notes_start != -1 else ""
        suggestions_text = llm_generated_text[suggestions_start + len("### SUGGESTIONS AND RESOURCES"):suggestions_end].strip() if suggestions_start != -1 else ""

        if not any([summary_text, notes_text, suggestions_text]):
            print("Warning: Failed to parse LLM output. Using full output as notes.")
            notes_text = llm_generated_text

        # --- 7. Save Result ---
        AnalysisResult.objects.update_or_create(
            session=session,
            defaults={
                'transcription_text': transcription_full_text,
                'summary_text': summary_text,
                'notes_text': notes_text,
                'suggestions_resources_text': suggestions_text,
                'llm_model_used': OLLAMA_MODEL_NAME,
                'prompt_template_version': 'lecture_v1.0'
            }
        )
        session.status = 'COMPLETED'
        session.save(update_fields=['status'])
        print(f"Session {session_id} COMPLETED.")

    except Session.DoesNotExist:
        print(f"Session with ID {session_id} not found.")
    except requests.exceptions.RequestException as e:
        print(f"LLM API error: {e}")
        if session:
            session.status = 'FAILED'
            session.save(update_fields=['status'])
    except Exception as e:
        print(f"Error processing session: {e}")
        if session:
            session.status = 'FAILED'
            session.save(update_fields=['status'])
    finally:
        if output_audio_path and os.path.exists(output_audio_path):
            try:
                os.remove(output_audio_path)
                print(f"Cleaned up: {output_audio_path}")
            except Exception as cleanup_error:
                print(f"Failed to clean up audio file: {cleanup_error}")
