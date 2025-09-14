import os
from supabase import create_client, Client
from typing import Optional
import uuid
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "reports"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def upload_file(content: bytes, filename: str, content_type: str = "image/jpeg") -> Optional[str]:
    """
    Upload file to Supabase storage bucket
    Returns public URL if successful, None if failed
    """
    try:
        # Generate unique filename
        file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload file to bucket
        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=content,
            file_options={
                "content-type": content_type,
                "upsert": "false"
            }
        )
        
        if result.error:
            print(f"Upload error: {result.error}")
            return None
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
        return public_url
        
    except Exception as e:
        print(f"Storage upload error: {e}")
        return None

def delete_file(file_path: str) -> bool:
    """
    Delete file from Supabase storage bucket
    Returns True if successful, False if failed
    """
    try:
        result = supabase.storage.from_(BUCKET_NAME).remove([file_path])
        return not result.error
    except Exception as e:
        print(f"Storage delete error: {e}")
        return False

async def initialize_bucket():
    """Initialize storage bucket if it doesn't exist"""
    try:
        # Try to create bucket (will fail if it already exists, which is fine)
        supabase.storage.create_bucket(
            BUCKET_NAME,
            options={"public": True}
        )
        print(f"Bucket '{BUCKET_NAME}' created successfully")
    except Exception:
        # Bucket likely already exists
        print(f"Bucket '{BUCKET_NAME}' already exists or creation failed")