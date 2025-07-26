from django.contrib import admin
from django.urls import path, include
from django.conf import settings # Import settings
from django.conf.urls.static import static # Import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')), # All auth endpoints under /api/auth/
    path('api/', include('audio_processor.urls')),  # All audio processing endpoints under /api/
     
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)