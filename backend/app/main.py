from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.deps import get_db
from app.db.session import engine
from app.models.base import Base

# 🔴 IMPORTANTE: importa os models
import app.models  # noqa

from app.api.drills import router as drills_router

app = FastAPI(title="Volleyball Drills API")

# 🔹 CRIA TODAS AS TABELAS (DEV MODE)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drills_router)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("select 1"))
    return {"status": "ok"}