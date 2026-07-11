from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import get_db, get_redis
from app.core.security import get_current_user, oauth2_scheme
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, TokenRefresh
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=None, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db=Depends(get_db)):
    """Register a new user account."""
    result = await auth_service.register_user(db, user_data.model_dump())
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )
    return result


@router.post("/login", response_model=None)
async def login(user_data: UserLogin, db=Depends(get_db)):
    """Login with email and password."""
    result = await auth_service.login_user(db, user_data.email, user_data.password)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"],
        )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: TokenRefresh,
    db=Depends(get_db),
    redis=Depends(get_redis),
):
    """Refresh access token using refresh token."""
    result = await auth_service.refresh_tokens(db, redis, token_data.refresh_token)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"],
        )
    return result


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    token: str = Depends(oauth2_scheme),
    redis=Depends(get_redis),
):
    """Logout and blacklist current token."""
    await auth_service.logout_user(redis, token)
    return {"message": "Successfully logged out"}
