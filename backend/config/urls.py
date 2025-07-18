from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')), # All auth endpoints under /api/auth/
    # Add other app URLs here, e.g.,
    # path('api/audio/', include('audio_processing_app.urls')),
]