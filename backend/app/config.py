import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediKiosk AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medikiosk-clinical-secret-key-2026-secure-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Primary Database (MySQL)
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "medikiosk_db")
    
    # Database URL override or fallback
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)
    
    # AI configuration (Configurable LLM: Gemini / OpenAI)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # 'gemini', 'openai', or 'rule_fallback'
    
    # Upload folder
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 25

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
