from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import asyncpg
from .db import get_db
from .utils import hash_password, verify_password, create_access_token, decode_token

auth_router = APIRouter()
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    db_pool = await get_db()
    async with db_pool.acquire() as connection:
        user = await connection.fetchrow(
            "SELECT id, username FROM users WHERE id = $1",
            int(user_id)
        )
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {"id": user["id"], "username": user["username"]}

@auth_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        # Check if user already exists
        existing_user = await connection.fetchrow(
            "SELECT id FROM users WHERE username = $1",
            user_data.username
        )
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        
        try:
            user = await connection.fetchrow(
                "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
                user_data.username,
                hashed_password
            )
            
            # Create access token
            access_token = create_access_token(user["id"], user["username"])
            
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse(id=user["id"], username=user["username"])
            )
            
        except asyncpg.UniqueViolationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )

@auth_router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login user and return JWT token"""
    db_pool = await get_db()
    
    async with db_pool.acquire() as connection:
        user = await connection.fetchrow(
            "SELECT id, username, password FROM users WHERE username = $1",
            user_data.username
        )
        
        if not user or not verify_password(user_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Create access token
        access_token = create_access_token(user["id"], user["username"])
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(id=user["id"], username=user["username"])
        )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(id=current_user["id"], username=current_user["username"])