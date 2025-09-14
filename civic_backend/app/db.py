import os
import asyncpg
from typing import Optional
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def init_db():
    """Initialize database connection pool and create tables"""
    global db_pool
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    try:
        db_pool = await asyncpg.create_pool(
            database_url,
            min_size=1,
            max_size=10,
            command_timeout=60
        )
        logger.info("Database connection pool created successfully")
        
        # Create tables if they don't exist
        await create_tables()
        
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise

async def create_tables():
    """Create database tables if they don't exist"""
    if not db_pool:
        raise RuntimeError("Database pool not initialized")
    
    async with db_pool.acquire() as connection:
        # Create users table
        await connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create reports table
        await connection.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                image_url TEXT,
                category VARCHAR(100) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for better mobile query performance
        await connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)
        """)
        await connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)
        """)
        await connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category)
        """)
        await connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC)
        """)
        
        logger.info("Database tables created/verified successfully")

async def get_db():
    """Get database connection from pool"""
    if not db_pool:
        raise RuntimeError("Database pool not initialized")
    return db_pool

async def close_db():
    """Close database connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        db_pool = None
        logger.info("Database connection pool closed")