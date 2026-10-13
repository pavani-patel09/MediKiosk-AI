from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserCreate, UserOut, Token
from app.services.auth_service import verify_password, get_password_hash, create_access_token, require_authenticated_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive"
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )
    log_audit_event(db, action="USER_LOGIN", user_id=user.id, details=f"User {user.username} logged in with role {user.role}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "user_id": user.id,
        "department": user.department
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(require_authenticated_user)):
    return current_user

@router.post("/register", response_model=UserOut)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered"
        )
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department=user_in.department,
        license_no=user_in.license_no
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
