# Path of Function - Backend API

FastAPI backend for research data collection from the Path of Function educational visual novel game.

## 🎯 Overview

This backend provides:
- **Admin API**: Code generation, batch management, analytics export
- **Student API**: Code validation, session management
- **Game API**: Event logging, checkpoint verification from Ren'Py

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```powershell
# Copy example environment file
Copy-Item .env.example .env

# Generate JWT secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit .env and add:
# - DATABASE_URL (from Supabase)
# - JWT_SECRET_KEY (generated above)
# - ADMIN_EMAIL and ADMIN_PASSWORD
```

### 3. Set Up Database

```powershell
# Deploy schema to Supabase:
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy contents of ../database/schema.sql
# 3. Execute the SQL script

# Alternatively, use psql:
# psql -h db.your-project.supabase.co -U postgres -d postgres -f ../database/schema.sql
```

### 4. Run Development Server

```powershell
# Start server with auto-reload
uvicorn app.main:app --reload --port 8000

# Or use Python directly
python -m app.main
```

Access the API:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── core/
│   │   ├── config.py        # Settings and environment variables
│   │   ├── database.py      # SQLAlchemy async connection
│   │   └── security.py      # JWT and password utilities
│   ├── middleware/
│   │   ├── auth.py          # Authentication dependencies
│   │   └── rate_limit.py    # Rate limiting middleware
│   ├── api/
│   │   ├── admin.py         # Admin routes
│   │   ├── student.py       # Student routes
│   │   └── game.py          # Game event routes
│   ├── models/              # SQLAlchemy models (TODO)
│   └── schemas/             # Pydantic schemas (TODO)
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

## 🔑 API Endpoints

### Admin Routes (`/api/admin`)
- `POST /login` - Admin authentication
- `POST /generate-codes` - Generate access code batch
- `GET /batches` - List code batches
- `GET /export/codes` - Export codes to CSV/JSON
- `GET /export/analytics` - Export session data
- `GET /dashboard/summary` - Dashboard statistics

### Student Routes (`/api/student`)
- `POST /validate-code` - Validate access code
- `POST /start-session` - Start new game session
- `POST /resume-session` - Resume existing session
- `GET /session/{id}/status` - Get session status

### Game Routes (`/api/game`)
- `POST /event` - Log single game event
- `POST /events/batch` - Log multiple events
- `POST /checkpoint` - Verify checkpoint code
- `POST /session-end` - End game session
- `GET /session/progress` - Get session progress

## 🔧 Development

### Testing the API

```powershell
# Test health endpoint
Invoke-WebRequest http://localhost:8000/health

# Test code validation (placeholder)
$body = @{code = "TEST123"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8000/api/student/validate-code -Method POST -Body $body -ContentType "application/json"
```

### View API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📊 Next Steps

**Phase 1 Remaining Tasks:**

1. **Create SQLAlchemy Models** (app/models/)
   - admin.py - AdminUser model
   - code.py - AccessCode, CodeBatch models
   - session.py - GameSession model
   - event.py - EventLog, QuizAttempt, CheckpointVerification models

2. **Create Pydantic Schemas** (app/schemas/)
   - admin.py - Login, code generation request/response
   - student.py - Code validation, session management
   - game.py - Event logging, checkpoint verification

3. **Implement Database Queries**
   - Uncomment TODO sections in API routes
   - Add SQLAlchemy queries to replace placeholders

4. **Testing**
   - Unit tests (pytest)
   - Integration tests with test database
   - Load testing (locust or artillery)

5. **Deployment**
   - Deploy to Railway
   - Configure production environment variables
   - Set up database backups

## 🔒 Security Notes

- **Never commit .env file** (already in .gitignore)
- **Generate unique JWT_SECRET_KEY** for each environment
- **Use strong admin passwords** (minimum 8 characters, mixed case, numbers)
- **Enable SSL/TLS** in production (handled by Railway)
- **Review CORS_ORIGINS** before production deployment

## 📝 Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret key for JWT signing
- `ADMIN_EMAIL` - Initial admin email
- `ADMIN_PASSWORD` - Initial admin password

**Optional:**
- `ENVIRONMENT` - development | production | staging
- `PORT` - Server port (default: 8000)
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `SESSION_TIMEOUT_DAYS` - Session expiration (default: 7)
- `RATE_LIMIT_PER_MINUTE` - API rate limit (default: 60)

## 🐛 Troubleshooting

**Database Connection Error:**
- Verify DATABASE_URL is correct in .env
- Check Supabase project is running
- Ensure database schema is deployed

**Import Errors:**
- Activate virtual environment: `.\venv\Scripts\Activate.ps1`
- Reinstall dependencies: `pip install -r requirements.txt`

**CORS Errors:**
- Add frontend URL to CORS_ORIGINS in .env
- Restart the server after changing .env

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)

---

**Version:** 1.0.0  
**Updated:** 2024-01-15
