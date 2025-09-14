from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import asyncpg
from .db import get_db
from .auth import get_current_user
from .storage import upload_file

reports_router = APIRouter()

# Pydantic models
class ReportCreate(BaseModel):
    text: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    category: str

class ReportResponse(BaseModel):
    id: int
    user_id: int
    username: str
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    category: str
    status: str
    created_at: datetime

class ReportStats(BaseModel):
    total_reports: int
    pending_reports: int
    resolved_reports: int
    user_reports: int

class NearbyReportsRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: Optional[float] = 5.0

@reports_router.post("/upload", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    text: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    category: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Create a new civic issue report with optional image upload"""
    
    image_url = None
    
    # Handle image upload if provided
    if image:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Validate file size (max 10MB for mobile uploads)
        max_size = 10 * 1024 * 1024  # 10MB
        content = await image.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file too large. Maximum size is 10MB"
            )
        
        # Read file content
        try:
            image_url = await upload_file(
                content, 
                image.filename or "image.jpg", 
                image.content_type
            )
            
            if not image_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload image"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image upload failed: {str(e)}"
            )
    
    # Save report to database
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        try:
            report = await connection.fetchrow("""
                INSERT INTO reports (user_id, text, latitude, longitude, image_url, category, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                RETURNING id, user_id, text, latitude, longitude, image_url, category, status, created_at
            """, 
                current_user["id"],
                text,
                latitude,
                longitude,
                image_url,
                category
            )
            
            return ReportResponse(
                id=report["id"],
                user_id=report["user_id"],
                username=current_user["username"],
                text=report["text"],
                latitude=float(report["latitude"]) if report["latitude"] else None,
                longitude=float(report["longitude"]) if report["longitude"] else None,
                image_url=report["image_url"],
                category=report["category"],
                status=report["status"],
                created_at=report["created_at"]
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create report: {str(e)}"
            )

@reports_router.post("/nearby", response_model=List[ReportResponse])
async def get_nearby_reports(
    request: NearbyReportsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get reports within a specified radius (for mobile map view)"""
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        # Using Haversine formula for distance calculation
        reports = await connection.fetch("""
            SELECT r.*, u.username,
                   (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) 
                   * cos(radians(r.longitude) - radians($2)) 
                   + sin(radians($1)) * sin(radians(r.latitude)))) AS distance
            FROM reports r
            JOIN users u ON r.user_id = u.id
            WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL
            HAVING distance <= $3
            ORDER BY distance, r.created_at DESC
            LIMIT 50
        """, request.latitude, request.longitude, request.radius_km)
        
        return [
            ReportResponse(
                id=report["id"],
                user_id=report["user_id"],
                username=report["username"],
                text=report["text"],
                latitude=float(report["latitude"]) if report["latitude"] else None,
                longitude=float(report["longitude"]) if report["longitude"] else None,
                image_url=report["image_url"],
                category=report["category"],
                status=report["status"],
                created_at=report["created_at"]
            )
            for report in reports
        ]

@reports_router.get("/stats", response_model=ReportStats)
async def get_report_stats(current_user: dict = Depends(get_current_user)):
    """Get report statistics for dashboard"""
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        stats = await connection.fetchrow("""
            SELECT 
                COUNT(*) as total_reports,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
                COUNT(*) FILTER (WHERE user_id = $1) as user_reports
            FROM reports
        """, current_user["id"])
        
        return ReportStats(
            total_reports=stats["total_reports"],
            pending_reports=stats["pending_reports"],
            resolved_reports=stats["resolved_reports"],
            user_reports=stats["user_reports"]
        )

@reports_router.get("/categories")
async def get_categories():
    """Get available report categories for mobile dropdown"""
    return {
        "categories": [
            {"id": "infrastructure", "name": "Infrastructure", "icon": "🏗️"},
            {"id": "safety", "name": "Safety", "icon": "⚠️"},
            {"id": "environment", "name": "Environment", "icon": "🌱"},
            {"id": "transportation", "name": "Transportation", "icon": "🚗"},
            {"id": "utilities", "name": "Utilities", "icon": "💡"},
            {"id": "other", "name": "Other", "icon": "📝"}
        ]
    }

@reports_router.get("/my", response_model=List[ReportResponse])
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports for the current user"""
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        reports = await connection.fetch("""
            SELECT r.*, u.username
            FROM reports r
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        """, current_user["id"])
        
        return [
            ReportResponse(
                id=report["id"],
                user_id=report["user_id"],
                username=report["username"],
                text=report["text"],
                latitude=float(report["latitude"]) if report["latitude"] else None,
                longitude=float(report["longitude"]) if report["longitude"] else None,
                image_url=report["image_url"],
                category=report["category"],
                status=report["status"],
                created_at=report["created_at"]
            )
            for report in reports
        ]

@reports_router.get("/all", response_model=List[ReportResponse])
async def get_all_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports (admin/test endpoint)"""
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        reports = await connection.fetch("""
            SELECT r.*, u.username
            FROM reports r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        """)
        
        return [
            ReportResponse(
                id=report["id"],
                user_id=report["user_id"],
                username=report["username"],
                text=report["text"],
                latitude=float(report["latitude"]) if report["latitude"] else None,
                longitude=float(report["longitude"]) if report["longitude"] else None,
                image_url=report["image_url"],
                category=report["category"],
                status=report["status"],
                created_at=report["created_at"]
            )
            for report in reports
        ]

@reports_router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific report by ID"""
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        report = await connection.fetchrow("""
            SELECT r.*, u.username
            FROM reports r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = $1
        """, report_id)
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        return ReportResponse(
            id=report["id"],
            user_id=report["user_id"],
            username=report["username"],
            text=report["text"],
            latitude=float(report["latitude"]) if report["latitude"] else None,
            longitude=float(report["longitude"]) if report["longitude"] else None,
            image_url=report["image_url"],
            category=report["category"],
            status=report["status"],
            created_at=report["created_at"]
        )

@reports_router.put("/{report_id}/status")
async def update_report_status(
    report_id: int,
    status_update: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Update report status (for admin users or report owners)"""
    
    valid_statuses = ["pending", "in_progress", "resolved", "rejected"]
    if status_update not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        # Check if report exists and user has permission
        report = await connection.fetchrow(
            "SELECT id, user_id FROM reports WHERE id = $1",
            report_id
        )
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # For now, allow users to update their own reports
        # In production, you might want admin-only access
        if report["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this report"
            )
        
        # Update status
        await connection.execute(
            "UPDATE reports SET status = $1 WHERE id = $2",
            status_update,
            report_id
        )
        
        return {"message": "Report status updated successfully", "status": status_update}