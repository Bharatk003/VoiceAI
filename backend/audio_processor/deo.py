from audio_processor.models import Session
from audio_processor.tasks import process_session_task
from django.contrib.auth import get_user_model

User = get_user_model()
# Assuming you have a user with username 'bharat'
user = User.objects.get(username='bharat')

# Create a dummy session (no file needed for this initial test)
session = Session.objects.create(
    user=user,
    title="Dummy Test Session",
    original_file_name="test.mp3",
    file_path="",
    file_type="AUDIO",
    duration_seconds=60,
    processing_mode="LECTURE",
    status="PENDING"
)
print(f"Created session with ID: {session.id}")

# Enqueue the task
process_session_task.delay(session.id)
print("Task enqueued. Check Celery worker terminal.")
# Exit shell
exit()