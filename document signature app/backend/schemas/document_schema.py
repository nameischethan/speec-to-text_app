from pydantic import BaseModel

class DocumentUpload(BaseModel):
    title: str