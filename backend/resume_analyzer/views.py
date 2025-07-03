from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from bson.objectid import ObjectId
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import ResumeUploadSerializer
import bcrypt
import json
import datetime
from django.views.decorators.csrf import csrf_exempt
from backend.settings import db
from .authentication import MongoJWTAuthentication
import requests
import os
from PyPDF2 import PdfReader
import docx
import io
import re
from dotenv import load_dotenv
load_dotenv()

# ----------------------------- SIGN UP API -----------------------------

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    try:
        data = json.loads(request.body)
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not name or not email or not password or not confirm_password:
            return Response({"error": "All fields are required"}, status=400)
            
        # Basic email validation
        if '@' not in email or '.' not in email:
            return Response({"error": "Invalid email format"}, status=400)

        if password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)
            
        # Basic password strength check
        if len(password) < 8:
            return Response({"error": "Password must be at least 8 characters long"}, status=400)

        user_collection = db["users"]

        if user_collection.find_one({"email": email}):
            return Response({"error": "User already exists"}, status=400)

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        user_collection.insert_one({"name": name, "email": email, "password": hashed_password.decode()})

        return Response({"message": "User registered successfully"}, status=201)

    except Exception as e:
        print("Signup Error:", str(e))
        # Don't expose actual error details to client
        return Response({"error": "Registration failed. Please try again."}, status=500)
    
# ------------------------------------------- LOGIN API ------------------------------------------------------------
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return Response({"error": "All fields are required"}, status=400)
            
        # Basic email validation
        if '@' not in email or '.' not in email:
            return Response({"error": "Invalid email format"}, status=400)
        
        user_collection = db['users']
        user = user_collection.find_one({"email": email})

        if not user:
            return Response({"error": "No user exists-register first"}, status=404)
        
        if not bcrypt.checkpw(password.encode(), user["password"].encode()):
            return Response({"error": "Incorrect email or password"}, status=401)
        
        # Create RefreshToken directly instead of using for_user
        refresh = RefreshToken()
        
        # Add custom claims to identify the user
        refresh['user_id'] = str(user.get('_id'))
        refresh['email'] = user.get('email')
        refresh['name'] = user.get('name')
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "name": user.get('name'),
                "email": user.get('email')
            }
        }, status=200)
    except Exception as e:
        print("Login Error:", str(e))
        return Response({"error": "Internal Server Error"}, status=500)   

# ------------------------------------------- UPLOAD RESUME API ------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser]) 
def upload_resume(request):
    try:
        # Extract user_id from the MongoDBUser instance
        user_id = None
        
        # Now that we're using MongoDBUser, we can access id directly
        if hasattr(request.user, 'id'):
            user_id = request.user.id
        
        if not user_id:
            return Response({"error": "User identification failed. Please login again."}, status=401)
        
        print(f"Received resume upload from user: {user_id}")
        
        serializer = ResumeUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=400)
            
        file = serializer.validated_data['file']
        job_description = serializer.validated_data['job_description']
        
        # Check file type
        allowed_extensions = ['.pdf', '.doc', '.docx']
        file_extension = '.' + file.name.split('.')[-1].lower()
        
        if file_extension not in allowed_extensions:
            return Response({
                "error": "Invalid file type. Only PDF, DOC, and DOCX files are supported."
            }, status=400)
            
        # Check file size (limit to 5MB)
        if file.size > 5 * 1024 * 1024:  # 5MB in bytes
            return Response({
                "error": "File too large. Maximum file size is 5MB."
            }, status=400)
        
        # Read file content
        file_content = file.read()
        
        # Create resume document
        resume_data = {
            'user_id': user_id,
            'filename': file.name,
            'content_type': file.content_type,
            'file_size': file.size,
            'file_data': file_content,
            'job_description': job_description,
            'upload_date': datetime.datetime.now(),
            'analysis_results': {
                'status': 'pending',
                'score': None,
                'keywords_matched': [],
                'missing_keywords': [],
                'recommendations': []
            }
        }
        
        # Insert into MongoDB
        resume_collection = db['resumes']
        result = resume_collection.insert_one(resume_data)
        
        # Return success response with the resume ID
        return Response({
            "message": "Resume uploaded successfully!",
            "resume_id": str(result.inserted_id)
        }, status=200)
        
    except Exception as e:
        print("Resume Upload Error:", str(e))
        return Response({"error": "Failed to upload resume. Please try again."}, status=500)

# ------------------------------------------- GET USER RESUMES API -------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_resumes(request):
    try:
        # Extract user_id from token payload
        user_id = None
        if hasattr(request, 'auth') and isinstance(request.auth, dict):
            user_id = request.auth.get('user_id')
        
        if not user_id:
            # Try getting it from the token payload directly
            if hasattr(request, 'user') and hasattr(request.user, 'user_id'):
                user_id = request.user.user_id
                
        if not user_id:
            return Response({"error": "User identification failed"}, status=401)
        
        # Get resumes for this user
        resume_collection = db['resumes']
        user_resumes = list(resume_collection.find(
            {"user_id": user_id},
            {"file_data": 0}  # Exclude file data to reduce response size
        ))
        
        # Format response data
        resumes_data = []
        for resume in user_resumes:
            resumes_data.append({
                "id": str(resume.get('_id')),
                "filename": resume.get('filename'),
                "upload_date": resume.get('upload_date').strftime("%Y-%m-%d %H:%M:%S"),
                "job_description": resume.get('job_description')[:100] + "..." if len(resume.get('job_description', "")) > 100 else resume.get('job_description', ""),
                "analysis_status": resume.get('analysis_results', {}).get('status', 'pending'),
                "score": resume.get('analysis_results', {}).get('score')
            })
        
        return Response({
            "resumes": resumes_data
        }, status=200)
        
    except Exception as e:
        print("Get Resumes Error:", str(e))
        return Response({"error": "Failed to retrieve resumes"}, status=500)

# ------------------------------------------- ANALYZE RESUME API -------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_resume(request, resume_id):
    try:
        # Extract user_id from token payload
        user_id = None
        if hasattr(request, 'auth') and isinstance(request.auth, dict):
            user_id = request.auth.get('user_id')
        
        if not user_id:
            # Try getting it from the user object
            if hasattr(request.user, 'id'):
                user_id = request.user.id
                
        if not user_id:
            return Response({"error": "User identification failed"}, status=401)
        
        # Get the resume from MongoDB
        resume_collection = db['resumes']
        resume = resume_collection.find_one({
            "_id": ObjectId(resume_id),
            "user_id": user_id  # Security check to ensure the resume belongs to this user
        })
        
        if not resume:
            return Response({"error": "Resume not found or access denied"}, status=404)
        
        # Extract text from resume based on file type
        resume_text = extract_text_from_resume(resume)
        job_description = resume.get('job_description', '')
        
        if not resume_text:
            return Response({"error": "Could not extract text from resume"}, status=400)
        
        if not job_description:
            return Response({"error": "Job description is missing"}, status=400)
        
        # Call Hugging Face API for analysis
        analysis_results = analyze_resume_with_huggingface(resume_text, job_description)
        
        if not analysis_results:
            return Response({"error": "Failed to analyze resume. API service may be unavailable."}, status=500)
        
        # Update resume document with analysis results
        resume_collection.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "analysis_results": {
                    "status": "completed",
                    "score": analysis_results.get("match_score", 0),
                    "keywords_matched": analysis_results.get("keywords_matched", []),
                    "missing_keywords": analysis_results.get("missing_keywords", []),
                    "recommendations": analysis_results.get("recommendations", []),
                    "analysis_date": datetime.datetime.now()
                }
            }}
        )
        
        # Return the analysis results
        return Response({
            "message": "Resume analyzed successfully",
            "analysis": analysis_results
        }, status=200)
        
    except Exception as e:
        print("Resume Analysis Error:", str(e))
        return Response({"error": f"Failed to analyze resume: {str(e)}"}, status=500)

# ------------------------------------------- HELPER FUNCTIONS -------------------------------------------

def extract_text_from_resume(resume):
    """Extract text content from different file formats."""
    try:
        file_data = resume.get('file_data')
        content_type = resume.get('content_type')
        
        if not file_data:
            return None
        
        text = ""
        
        # PDF files
        if content_type == 'application/pdf':
            pdf_file = io.BytesIO(file_data)
            pdf_reader = PdfReader(pdf_file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
        # DOCX files
        elif content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            docx_file = io.BytesIO(file_data)
            doc = docx.Document(docx_file)
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        # DOC files - Note: This is simplified and may not work for all DOC files
        elif content_type == 'application/msword':
            # Basic extraction - for better results you might need a converter
            # Another option is to use textract library or docx2txt
            text = "Text could not be extracted from DOC format. Please convert to DOCX or PDF."
            
        return text
        
    except Exception as e:
        print(f"Text extraction error: {str(e)}")
        return None

def analyze_resume_with_huggingface(resume_text, job_description):
    """
    Send resume and job description to Hugging Face for analysis.
    
    You need to:
    1. Create a Hugging Face account (free)
    2. Get an API token from https://huggingface.co/settings/tokens
    3. Set HUGGINGFACE_API_TOKEN as an environment variable
    """
    try:
        # Get API token from environment variable 
        api_token = os.environ.get('HUGGINGFACE_API_TOKEN')
        
        if not api_token:
            print("HUGGINGFACE_API_TOKEN not found in environment variables")
            # For development/testing, use a fallback mock response
            return get_mock_analysis_response(resume_text, job_description)
        
        # Prepare the prompt with more detailed instructions for better JSON output
        prompt = f"""
        You are a professional resume analyzer and career advisor. Your task is to analyze how well a resume matches a job description.

        Resume:
        {resume_text}

        Job Description:
        {job_description}

        Analyze the resume against the job description and provide:
        1. A match score from 0-100 based on skills, experience, and qualifications
        2. The top 10 skills or keywords from the job that appear in the resume
        3. The top 10 important skills or keywords from the job that are missing in the resume
        4. 5 specific, actionable recommendations to improve the resume (limit each to 80 characters)

        Return ONLY a JSON object with this exact structure:
        {{
            "match_score": (number between 0-100),
            "keywords_matched": ["keyword1", "keyword2", ...],
            "missing_keywords": ["keyword1", "keyword2", ...],
            "recommendations": ["recommendation1", "recommendation2", ...]
        }}

        Your response must be VALID JSON only - no explanations, no extra text, no markdown formatting.
        Be extremely careful with quotes, commas, and brackets to ensure the JSON is correctly formatted.
        Do not use trailing commas in arrays.
        """
        
        # Try multiple models in sequence for better reliability
        model_options = [
            "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "HuggingFaceH4/zephyr-7b-beta", 
            "microsoft/phi-2",
            "mistralai/Mistral-7B-Instruct-v0.1",
            "google/flan-t5-xl"
        ]
        
        response = None
        for model in model_options:
            try:
                print(f"Trying model: {model}")
                response = requests.post(
                    f"https://api-inference.huggingface.co/models/{model}",
                    headers={
                        "Authorization": f"Bearer {api_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "max_new_tokens": 1024,
                            "temperature": 0.7,
                            "return_full_text": False
                        }
                    },
                    timeout=45  # Extended timeout for model inference
                )
                
                if response.status_code == 200:
                    print(f"Successful response from model: {model}")
                    break
                else:
                    print(f"Failed with model {model}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Error with model {model}: {str(e)}")
                continue
        
        if not response or response.status_code != 200:
            print("All models failed, using fallback analysis")
            return get_mock_analysis_response(resume_text, job_description)
            
        result = response.json()
        
        # Parse the response - handle different response formats from different models
        generated_text = ""
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get('generated_text', '')
        elif isinstance(result, dict):
            generated_text = result.get('generated_text', '')
        
        # Clean and extract JSON from the text
        # Look for JSON pattern in the response
        json_match = re.search(r'({[\s\S]*})', generated_text)
        
        if json_match:
            try:
                # First try direct parsing
                json_text = json_match.group(1)
                try:
                    analysis_json = json.loads(json_text)
                except json.JSONDecodeError:
                    print("Initial JSON parsing failed, attempting to fix JSON format")
                    
                    # Fix common JSON formatting errors
                    # 1. Fix missing commas between items
                    json_text = re.sub(r'"\s*"', '", "', json_text)
                    
                    # 2. Fix trailing commas in arrays
                    json_text = re.sub(r',\s*]', ']', json_text)
                    
                    # 3. Fix missing quotes around keys
                    json_text = re.sub(r'(\{|\,)\s*([a-zA-Z0-9_]+)\s*:', r'\1 "\2":', json_text)
                    
                    # 4. Add missing quotes to string values
                    json_text = re.sub(r':\s*([a-zA-Z][a-zA-Z0-9_]*)\s*(,|})', r': "\1"\2', json_text)
                    
                    print(f"Attempting to parse fixed JSON")
                    try:
                        analysis_json = json.loads(json_text)
                    except json.JSONDecodeError as e:
                        print(f"Fixed JSON still invalid: {str(e)}")
                        
                        # Use regex to extract each component separately
                        print("Attempting component-by-component extraction")
                        try:
                            # Extract match score
                            match_score_match = re.search(r'"match_score"\s*:\s*(\d+)', json_text)
                            match_score = int(match_score_match.group(1)) if match_score_match else 0
                            
                            # Extract keywords_matched array
                            keywords_matched = []
                            matched_array = re.search(r'"keywords_matched"\s*:\s*\[(.*?)\]', json_text, re.DOTALL)
                            if matched_array:
                                # Split by commas, handle quoted strings
                                array_content = matched_array.group(1).strip()
                                if array_content:
                                    # Extract all quoted strings
                                    item_matches = re.findall(r'"([^"]*)"', array_content)
                                    if item_matches:
                                        keywords_matched = item_matches
                                    else:
                                        # Fallback to simple comma splitting if no quoted strings
                                        keywords_matched = [k.strip(' "\'') for k in array_content.split(',')]
                                        keywords_matched = [k for k in keywords_matched if k and len(k) > 1]
                            
                            # Extract missing_keywords array
                            missing_keywords = []
                            missing_array = re.search(r'"missing_keywords"\s*:\s*\[(.*?)\]', json_text, re.DOTALL) 
                            if missing_array:
                                array_content = missing_array.group(1).strip()
                                if array_content:
                                    # Extract all quoted strings
                                    item_matches = re.findall(r'"([^"]*)"', array_content)
                                    if item_matches:
                                        missing_keywords = item_matches
                                    else:
                                        # Fallback to simple comma splitting
                                        missing_keywords = [k.strip(' "\'') for k in array_content.split(',')]
                                        missing_keywords = [k for k in missing_keywords if k and len(k) > 1]
                            
                            # Extract recommendations array
                            recommendations = []
                            recommendations_array = re.search(r'"recommendations"\s*:\s*\[(.*?)\]', json_text, re.DOTALL)
                            if recommendations_array:
                                array_content = recommendations_array.group(1).strip()
                                if array_content:
                                    # Extract all quoted strings
                                    item_matches = re.findall(r'"([^"]*)"', array_content)
                                    if item_matches:
                                        recommendations = item_matches
                                    else:
                                        # Try to split by commas while preserving meaningful phrases
                                        recommendations = [k.strip(' "\'') for k in array_content.split(',')]
                                        recommendations = [k for k in recommendations if k and len(k) > 10]
                            
                            # Use fallback recommendations if needed
                            if not recommendations or len(recommendations) < 3:
                                recommendations = [
                                    "Add more specific skills that match the job description",
                                    "Quantify your achievements with metrics",
                                    "Include relevant certifications or training",
                                    "Highlight experience related to the key requirements",
                                    "Customize your resume objective to align with the job"
                                ]
                            
                            # Construct the analysis JSON
                            analysis_json = {
                                "match_score": match_score,
                                "keywords_matched": keywords_matched[:10],
                                "missing_keywords": missing_keywords[:10],
                                "recommendations": recommendations[:5]
                            }
                            
                            print("Successfully extracted components from malformed JSON")
                            
                        except Exception as extraction_error:
                            print(f"Component extraction failed: {str(extraction_error)}")
                            return get_mock_analysis_response(resume_text, job_description)
                
                # Now that we have analysis_json (one way or another), validate its structure
                required_fields = ["match_score", "keywords_matched", "missing_keywords", "recommendations"]
                missing_fields = [field for field in required_fields if field not in analysis_json]
                
                if missing_fields:
                    print(f"Missing fields in JSON: {missing_fields}")
                    return get_mock_analysis_response(resume_text, job_description)
                
                # Ensure match_score is a number between 0-100
                try:
                    match_score = float(analysis_json["match_score"])
                    if match_score < 0:
                        match_score = 0
                    elif match_score > 100:
                        match_score = 100
                    analysis_json["match_score"] = int(match_score)
                except (ValueError, TypeError):
                    print("Invalid match_score type")
                    analysis_json["match_score"] = 0
                
                # Ensure keywords_matched and missing_keywords are lists
                if not isinstance(analysis_json["keywords_matched"], list):
                    analysis_json["keywords_matched"] = []
                if not isinstance(analysis_json["missing_keywords"], list):
                    analysis_json["missing_keywords"] = []
                if not isinstance(analysis_json["recommendations"], list):
                    analysis_json["recommendations"] = [
                        "Add more specific skills that match the job description",
                        "Quantify your achievements with metrics",
                        "Include relevant certifications or training",
                        "Highlight experience related to the key requirements",
                        "Customize your resume objective to align with the job"
                    ]
                
                # Clean the lists: remove empty items and ensure string types
                analysis_json["keywords_matched"] = [str(k).strip() for k in analysis_json["keywords_matched"] if k]
                analysis_json["missing_keywords"] = [str(k).strip() for k in analysis_json["missing_keywords"] if k]
                analysis_json["recommendations"] = [str(r).strip() for r in analysis_json["recommendations"] if r]
                
                # Limit the length of lists
                analysis_json["keywords_matched"] = analysis_json["keywords_matched"][:10]
                analysis_json["missing_keywords"] = analysis_json["missing_keywords"][:10]
                analysis_json["recommendations"] = analysis_json["recommendations"][:5]
                
                # Ensure recommendations are not too long
                analysis_json["recommendations"] = [
                    rec[:80] for rec in analysis_json["recommendations"]
                ]
                
                # Fill in recommendations if empty
                if not analysis_json["recommendations"]:
                    analysis_json["recommendations"] = [
                        "Add more specific skills that match the job description",
                        "Quantify your achievements with metrics",
                        "Include relevant certifications or training",
                        "Highlight experience related to the key requirements",
                        "Customize your resume objective to align with the job"
                    ]
                
                return analysis_json
                    
            except Exception as e:
                print(f"JSON handling error: {str(e)}")
                return get_mock_analysis_response(resume_text, job_description)
            
        else:
            print("No JSON found in response")
            # Try to extract structured data from unstructured text
            try:
                # Look for match score
                match_score_pattern = r'match(?:\s+)?score(?:\s+)?(?:is|:)?(?:\s+)?(\d+)'
                match_score_match = re.search(match_score_pattern, generated_text, re.IGNORECASE)
                match_score = int(match_score_match.group(1)) if match_score_match else 0
                
                # Look for matched keywords
                matched_section = re.search(r'keywords[\s_]+matched:?(.*?)(?:missing|recommendations)', 
                                           generated_text, re.IGNORECASE | re.DOTALL)
                matched_keywords = []
                if matched_section:
                    matched_text = matched_section.group(1)
                    matched_keywords = re.findall(r'\b\w+\b', matched_text)
                    matched_keywords = [k for k in matched_keywords if len(k) > 3][:10]
                
                # Look for missing keywords
                missing_section = re.search(r'missing[\s_]+keywords:?(.*?)(?:recommendations)', 
                                           generated_text, re.IGNORECASE | re.DOTALL)
                missing_keywords = []
                if missing_section:
                    missing_text = missing_section.group(1)
                    missing_keywords = re.findall(r'\b\w+\b', missing_text)
                    missing_keywords = [k for k in missing_keywords if len(k) > 3][:10]
                
                # Look for recommendations
                recommendations = []
                recommendation_matches = re.findall(r'\d+\.\s+(.*?)(?:\d+\.|$)', 
                                                  generated_text, re.MULTILINE | re.DOTALL)
                if recommendation_matches:
                    recommendations = [r.strip()[:80] for r in recommendation_matches if len(r.strip()) > 10][:5]
                
                if len(recommendations) < 3:
                    recommendations = [
                        "Add more specific skills that match the job description",
                        "Quantify your achievements with metrics",
                        "Include relevant certifications or training",
                        "Highlight experience related to the key requirements",
                        "Customize your resume objective to align with the job"
                    ]
                
                return {
                    "match_score": match_score,
                    "keywords_matched": matched_keywords,
                    "missing_keywords": missing_keywords,
                    "recommendations": recommendations
                }
                
            except Exception as extraction_error:
                print(f"Extraction error: {str(extraction_error)}")
                return get_mock_analysis_response(resume_text, job_description)
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        return get_mock_analysis_response(resume_text, job_description)
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return get_mock_analysis_response(resume_text, job_description)

def get_mock_analysis_response(resume_text, job_description):
    """Provide a fallback response when API is unavailable."""
    # Extract basic keywords from job description
    job_keywords = set()
    for word in job_description.lower().split():
        if len(word) > 4 and word.isalpha():  # Simple filtering
            job_keywords.add(word)
    
    # Check which keywords are in the resume
    resume_lower = resume_text.lower()
    matched_keywords = []
    missing_keywords = []
    
    for keyword in job_keywords:
        if keyword in resume_lower:
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)
    
    # Calculate a basic match score
    if len(job_keywords) > 0:
        match_score = int((len(matched_keywords) / len(job_keywords)) * 100)
    else:
        match_score = 0
    
    # Limit to top keywords
    matched_keywords = matched_keywords[:10]
    missing_keywords = missing_keywords[:10]
    
    return {
        "match_score": match_score,
        "keywords_matched": matched_keywords,
        "missing_keywords": missing_keywords,
        "recommendations": [
            "Add more specific skills that match the job description",
            "Quantify your achievements with metrics",
            "Include relevant certifications or training",
            "Highlight experience related to the key requirements",
            "Customize your resume objective to align with the job"
        ]
    }

# ------------------------------------------- GET RESUME ANALYSIS API -------------------------------------------