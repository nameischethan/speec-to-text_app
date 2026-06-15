from fastapi import FastAPI

from database import engine
from models.user import User

from routers.auth import router as auth_router
from models.document import Document
from routers.document import router as document_router

app = FastAPI()

from database import Base

Base.metadata.create_all(bind=engine)

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    document_router,
    prefix="/api/document",
    tags=["Document"]
)

@app.get("/")
def home():
    return {
        "message": "Document Signature API Running"
    }