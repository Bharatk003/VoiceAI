# audio_processor/urls.py

from django.urls import path
from .views import (
    SessionUploadView,
    SessionStatusView,
    SessionResultsView,      
    ExportNotesPDFView,      
    SessionSearchAPIView,    
    SessionQnAAPIView,
    SessionListView ,       
    SessionStatsView ,
    SessionRetryView,
)

urlpatterns = [
    path('sessions/upload/', SessionUploadView.as_view(), name='session_upload'),
    path('sessions/<int:pk>/status/', SessionStatusView.as_view(), name='session_status'),
    path('sessions/<int:pk>/results/', SessionResultsView.as_view(), name='session_results'),  
    path('sessions/<int:pk>/pdf/', ExportNotesPDFView.as_view(), name='session_pdf_export'), 
    path('sessions/<int:pk>/search/', SessionSearchAPIView.as_view(), name='session_search'), 
    path('sessions/<int:pk>/qna/', SessionQnAAPIView.as_view(), name='session_qna'), 
    path('sessions/', SessionListView.as_view(), name='session_list'),
    path('sessions/stats/', SessionStatsView.as_view(), name='session_stats'), # <--- ADD THIS LINE
    path('sessions/<int:pk>/retry/', SessionRetryView.as_view(), name='session_retry'),
]
