from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.utils.translation import gettext_lazy as _

class MongoDBUser:
    """
    A simple user class that mimics Django's User model for MongoDB users.
    """
    def __init__(self, user_data):
        self.id = user_data.get('user_id')
        self.email = user_data.get('email')
        self.name = user_data.get('name')
        self.is_authenticated = True  # Important for permission checks
    
    @property
    def is_anonymous(self):
        return False

class MongoJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication for MongoDB users.
    """
    def get_user(self, validated_token):
        """
        Return user using MongoDB ID instead of Django ORM.
        """
        # Extract user_id from the validated token
        user_id = validated_token.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed(_('Token contained no recognizable user identification'))
        
        # Create a MongoDBUser that has the required is_authenticated property
        user_data = {
            'user_id': user_id,
            'email': validated_token.get('email'),
            'name': validated_token.get('name')
        }
        
        return MongoDBUser(user_data)