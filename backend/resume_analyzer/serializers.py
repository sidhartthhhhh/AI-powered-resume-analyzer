from rest_framework import serializers

class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    job_description = serializers.CharField()