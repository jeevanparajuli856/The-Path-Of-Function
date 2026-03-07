"""
Create Initial Admin User
Run this script once to create the first admin user in the database
"""

import asyncio
import sys
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import init_db, close_db, get_db
from app.models.admin import AdminUser

settings = get_settings()


async def create_initial_admin():
    """Create the initial admin user from environment variables"""
    # Initialize database connection
    await init_db()
    
    # Use get_db() generator
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Check if admin already exists
        result = await db.execute(
            select(AdminUser).where(AdminUser.email == settings.ADMIN_EMAIL)
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"❌ Admin user already exists: {settings.ADMIN_EMAIL}")
            return False
        
        # Hash password directly with bcrypt
        password_bytes = settings.ADMIN_PASSWORD.encode('utf-8')
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        
        # Create new admin
        admin = AdminUser(
            email=settings.ADMIN_EMAIL,
            password_hash=hashed.decode('utf-8'),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   ID: {admin.id}")
        print(f"   Created: {admin.created_at}")
        print(f"\n⚠️  Remember to change the default password!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        return False
    finally:
        await close_db()


async def main():
    print("=" * 60)
    print("Creating Initial Admin User")
    print("=" * 60)
    print(f"Email: {settings.ADMIN_EMAIL}")
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'Unknown'}")
    print()
    
    success = await create_initial_admin()
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
