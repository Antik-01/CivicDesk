# Civic Issues Backend API

A complete FastAPI backend for reporting civic issues with authentication, file uploads, and database integration.

## Features

- 🔐 **Authentication**: JWT-based auth with registration and login
- 📸 **File Uploads**: Image upload to Supabase storage
- 🗄️ **Database**: PostgreSQL with asyncpg for async operations
- 📍 **Location Support**: Latitude/longitude coordinates for reports
- 🏷️ **Categorization**: Report categorization and status tracking
- 🔒 **Security**: Password hashing with bcrypt
- 📚 **Documentation**: Auto-generated API docs with FastAPI

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Update the `.env` file with your actual database and Supabase credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/civic_issues
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SECRET_KEY=your-super-secret-jwt-key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Docker Setup (Optional)

```bash
# Build the image
docker build -t civic-issues-api .

# Run the container
docker run -p 8000:8000 --env-file .env civic-issues-api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Reports
- `POST /api/reports/upload` - Create new report (with optional image)
- `GET /api/reports/my` - Get current user's reports
- `GET /api/reports/all` - Get all reports
- `GET /api/reports/{id}` - Get specific report
- `PUT /api/reports/{id}/status` - Update report status

### System
- `GET /health` - Health check
- `GET /docs` - API documentation

## Project Structure

```
app/
├── __init__.py          # Package initialization
├── main.py             # FastAPI app setup and configuration
├── auth.py             # Authentication routes and JWT handling
├── routes.py           # Report management endpoints
├── db.py               # Database connection and table setup
├── storage.py          # Supabase storage integration
└── utils.py            # Utilities (password hashing, JWT helpers)
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Register a new user
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "securepass123"}'
```

### Upload a report with image
```bash
curl -X POST "http://localhost:8000/api/reports/upload" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "text=Broken streetlight on Main St" \
     -F "category=infrastructure" \
     -F "latitude=40.7128" \
     -F "longitude=-74.0060" \
     -F "image=@streetlight.jpg"
```

## Development

### Running in Development Mode
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API
Visit `http://localhost:8000/docs` for interactive API documentation.

## Production Deployment

1. Set secure environment variables
2. Use a production WSGI server like Gunicorn
3. Set up proper CORS policies
4. Configure database connection pooling
5. Implement proper logging and monitoring

## Security Notes

- Change the `SECRET_KEY` in production
- Use environment variables for all sensitive data
- Configure CORS properly for your frontend domain
- Implement rate limiting for production use
- Use HTTPS in production

## License

MIT License - see LICENSE file for details.