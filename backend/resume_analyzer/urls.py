from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login, name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/upload-resume/', views.upload_resume, name='upload_resume'),
    path('api/user-resumes/', views.get_user_resumes, name='user_resumes'),
    path('api/analyze-resume/<str:resume_id>/', views.analyze_resume, name='analyze_resume'),  # New endpoint
]