import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Robustly find and load .env file from the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SupplyChain Copilot AI"
    API_V1_STR: str = "/api"
    
    # Database URL (PostgreSQL or SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./supplychain.db")
    
    # LLM Settings (Supports Groq & OpenAI)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
