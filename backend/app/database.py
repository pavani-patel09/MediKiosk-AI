import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("medikiosk.database")

Base = declarative_base()

def get_database_url() -> str:
    if settings.DATABASE_URL:
        return settings.DATABASE_URL
    
    # Check if MySQL credentials provided
    if settings.MYSQL_PASSWORD:
        return f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}?charset=utf8mb4"
    else:
        return f"mysql+pymysql://{settings.MYSQL_USER}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}?charset=utf8mb4"

def create_db_engine():
    mysql_url = get_database_url()
    try:
        # Test MySQL connection
        engine = create_engine(
            mysql_url,
            pool_recycle=3600,
            pool_pre_ping=True
        )
        # Try a quick test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to MySQL database.")
        return engine, "mysql"
    except Exception as e:
        logger.warning(f"MySQL connection test failed ({e}). Falling back to local SQLite database.")
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "medikiosk.db")
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False}
        )
        return engine, "sqlite"

engine, db_type = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
