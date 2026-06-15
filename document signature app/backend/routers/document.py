from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.document import Document
import os

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {
        "message": "File uploaded successfully",
        "filename": file.filename
    }