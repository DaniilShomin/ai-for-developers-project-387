from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EventType, Owner
from app.schemas import (
    EventType as EventTypeSchema,
    EventTypeCreate,
    EventTypeUpdate,
    ErrorResponse,
)

router = APIRouter(prefix="/event-types", tags=["Event Types"])


def get_or_create_default_owner(db: Session) -> Owner:
    """Helper to get default owner if needed"""
    from app.routers.owners import get_or_create_default_owner as get_owner

    return get_owner(db)


@router.get(
    "",
    response_model=list[EventTypeSchema],
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def list_event_types(
    owner_id: Annotated[
        str, Query(alias="ownerId", description="ID владельца (обязательно)")
    ],
    db: Session = Depends(get_db),
):
    """
    Получить список типов событий владельца.
    """
    event_types = db.query(EventType).filter(EventType.owner_id == owner_id).all()
    return event_types


@router.get(
    "/{id}",
    response_model=EventTypeSchema,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def get_event_type(id: str, db: Session = Depends(get_db)):
    """
    Получить детали типа события.
    """
    event_type = db.query(EventType).filter(EventType.id == id).first()

    if not event_type:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Event type not found"},
        )

    return event_type


@router.post(
    "",
    response_model=EventTypeSchema,
    status_code=201,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def create_event_type(data: EventTypeCreate, db: Session = Depends(get_db)):
    """
    Создать новый тип события.
    """
    # Verify owner exists
    owner = db.query(Owner).filter(Owner.id == data.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Owner not found"},
        )

    event_type = EventType(
        title=data.title,
        description=data.description,
        duration=data.duration,
        owner_id=data.owner_id,
    )

    db.add(event_type)
    db.commit()
    db.refresh(event_type)

    return event_type


@router.put(
    "/{id}",
    response_model=EventTypeSchema,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def update_event_type(id: str, data: EventTypeUpdate, db: Session = Depends(get_db)):
    """
    Обновить тип события.
    """
    event_type = db.query(EventType).filter(EventType.id == id).first()

    if not event_type:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Event type not found"},
        )

    if data.title is not None:
        event_type.title = data.title
    if data.description is not None:
        event_type.description = data.description
    if data.duration is not None:
        event_type.duration = data.duration

    db.commit()
    db.refresh(event_type)

    return event_type


@router.delete(
    "/{id}",
    status_code=204,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def delete_event_type(id: str, db: Session = Depends(get_db)):
    """
    Удалить тип события (только если нет бронирований).
    """
    event_type = db.query(EventType).filter(EventType.id == id).first()

    if not event_type:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Event type not found"},
        )

    # Check if there are any bookings for this event type
    if event_type.bookings:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "CONFLICT",
                "message": "Cannot delete event type with existing bookings",
            },
        )

    db.delete(event_type)
    db.commit()
