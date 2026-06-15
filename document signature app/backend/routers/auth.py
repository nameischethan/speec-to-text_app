from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas.user_schema import UserCreate
from schemas.login_schema import LoginRequest

from models.user import User

from database import get_db

from utils.hash import (
    hash_password,
    verify_password
)

from utils.jwt_handler import create_access_token

router = APIRouter()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User saved successfully",
        "id": new_user.id
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        return {
            "message": "User not found"
        }

    if not verify_password(
        data.password,
        user.password
    ):
        return {
            "message": "Invalid password"
        }

    token = create_access_token(
        {"sub": user.email}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }