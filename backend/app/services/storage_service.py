"""
Storage service for S3-compatible object storage.
"""
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings


class StorageService:
    """Service for interacting with S3-compatible object storage."""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the S3 client."""
        try:
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                region_name=settings.s3_region,
                config=Config(signature_version="s3v4"),
            )
            
            # Ensure bucket exists
            self._ensure_bucket_exists()
        except Exception as e:
            print(f"Warning: Could not initialize S3 client: {e}")
            self.client = None
    
    def _ensure_bucket_exists(self):
        """Create the bucket if it doesn't exist."""
        if not self.client:
            return
        
        try:
            self.client.head_bucket(Bucket=settings.s3_bucket)
        except ClientError:
            try:
                self.client.create_bucket(Bucket=settings.s3_bucket)
            except ClientError as e:
                print(f"Warning: Could not create bucket: {e}")
    
    def get_presigned_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> tuple[str, int]:
        """Get a presigned URL for uploading a file."""
        if not self.client:
            raise RuntimeError("S3 client not initialized")
        
        url = self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": storage_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return url, expires_in
    
    def get_presigned_download_url(
        self,
        storage_key: str,
        expires_in: int = 3600,
    ) -> str:
        """Get a presigned URL for downloading a file."""
        if not self.client:
            raise RuntimeError("S3 client not initialized")
        
        url = self.client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": storage_key,
            },
            ExpiresIn=expires_in,
        )
        return url
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete a file from storage."""
        if not self.client:
            return False
        
        try:
            self.client.delete_object(
                Bucket=settings.s3_bucket,
                Key=storage_key,
            )
            return True
        except ClientError:
            return False
    
    def file_exists(self, storage_key: str) -> bool:
        """Check if a file exists in storage."""
        if not self.client:
            return False
        
        try:
            self.client.head_object(
                Bucket=settings.s3_bucket,
                Key=storage_key,
            )
            return True
        except ClientError:
            return False


# Singleton instance
storage_service = StorageService()
