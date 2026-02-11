import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self) -> None:
        self.database_url: str | None = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL not set. Create backend/.env with DATABASE_URL=...")

        # For local dev
        self.cors_origins: list[str] = ["http://localhost:5173"]

settings = Settings()