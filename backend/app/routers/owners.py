from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Owner
from app.schemas import Owner as OwnerSchema, OwnerUpdate, ErrorResponse

router = APIRouter(prefix="/owner", tags=["Owner"])


def get_or_create_default_owner(db: Session) -> Owner:
    """Get first existing owner or create default one"""
    # Get first owner from database (any)
    owner = db.query(Owner).first()
    if not owner:
        # Create default owner only if none exists
        owner = Owner(
            name="Администратор",
            email="admin@booking.local",
            timezone="Europe/Moscow",
            work_start="09:00",
            work_end="18:00",
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
    return owner


@router.get(
    "",
    response_model=OwnerSchema,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def get_owner(db: Session = Depends(get_db)):
    """
    Получить данные владельца (default owner).
    """
    owner = get_or_create_default_owner(db)
    return owner


@router.put(
    "",
    response_model=OwnerSchema,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def update_owner(
    data: OwnerUpdate,
    db: Session = Depends(get_db),
):
    """
    Обновить данные владельца (default owner).
    """
    owner = get_or_create_default_owner(db)

    if data.name is not None:
        owner.name = data.name
    if data.email is not None:
        owner.email = data.email
    if data.timezone is not None:
        owner.timezone = data.timezone
    if data.work_start is not None:
        owner.work_start = data.work_start
    if data.work_end is not None:
        owner.work_end = data.work_end

    db.commit()
    db.refresh(owner)
    return owner
