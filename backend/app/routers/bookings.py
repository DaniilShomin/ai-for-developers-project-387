from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.database import get_db
from app.models import Booker, Booking, EventType, Owner
from app.schemas import (
    Booking as BookingSchema,
    BookingWithDetails,
    BookingCreate,
    ErrorResponse,
    BookingStatus,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def check_time_conflict(
    db: Session,
    owner_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: str | None = None,
) -> bool:
    """
    Check if there's a confirmed booking that conflicts with the given time range.
    Returns True if conflict exists.
    """
    query = db.query(Booking).filter(
        Booking.owner_id == owner_id,
        Booking.status == "confirmed",
        or_(
            # New booking starts during existing booking
            and_(
                Booking.start_time <= start_time,
                Booking.end_time > start_time,
            ),
            # New booking ends during existing booking
            and_(
                Booking.start_time < end_time,
                Booking.end_time >= end_time,
            ),
            # New booking completely contains existing booking
            and_(
                Booking.start_time >= start_time,
                Booking.end_time <= end_time,
            ),
        ),
    )

    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    return query.first() is not None


@router.get(
    "",
    response_model=list[BookingWithDetails],
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def list_bookings(
    owner_id: Annotated[str, Query(alias="ownerId", description="ID владельца")],
    status: Annotated[
        BookingStatus | None, Query(alias="status", description="Статус бронирования")
    ] = None,
    date_from: Annotated[
        datetime | None, Query(alias="dateFrom", description="Начальная дата")
    ] = None,
    date_to: Annotated[
        datetime | None, Query(alias="dateTo", description="Конечная дата")
    ] = None,
    db: Session = Depends(get_db),
):
    """
    Получить список бронирований с деталями.
    """
    query = db.query(Booking).options(
        joinedload(Booking.event_type), joinedload(Booking.booker)
    )

    query = query.filter(Booking.owner_id == owner_id)

    if status:
        query = query.filter(Booking.status == status)
    if date_from:
        query = query.filter(Booking.start_time >= date_from)
    if date_to:
        query = query.filter(Booking.start_time <= date_to)

    return query.all()


@router.post(
    "",
    response_model=BookingSchema,
    status_code=201,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    """
    Создать новое бронирование.
    """
    # Check if event type exists
    event_type = db.query(EventType).filter(EventType.id == data.event_type_id).first()
    if not event_type:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Event type not found"},
        )

    # Check if owner exists
    owner = db.query(Owner).filter(Owner.id == data.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Owner not found"},
        )

    # Calculate end time based on event type duration
    end_time = data.start_time + timedelta(minutes=event_type.duration)

    # Check for time conflicts
    if check_time_conflict(db, data.owner_id, data.start_time, end_time):
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "Time slot already booked"},
        )

    # Find or create booker by email
    booker = db.query(Booker).filter(Booker.email == data.booker_email).first()
    if not booker:
        booker = Booker(
            name=data.booker_name,
            email=data.booker_email,
            phone=data.booker_phone,
        )
        db.add(booker)
        db.flush()

    # Create booking
    booking = Booking(
        event_type_id=data.event_type_id,
        owner_id=data.owner_id,
        booker_id=booker.id,
        start_time=data.start_time,
        end_time=end_time,
        notes=data.notes,
        status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get(
    "/{id}",
    response_model=BookingWithDetails,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def get_booking(id: str, db: Session = Depends(get_db)):
    """
    Получить детали конкретного бронирования.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.event_type), joinedload(Booking.booker))
        .filter(Booking.id == id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Booking not found"},
        )

    return booking


@router.delete(
    "/{id}",
    response_model=BookingSchema,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def cancel_booking(id: str, db: Session = Depends(get_db)):
    """
    Отменить бронирование (soft delete).
    """
    booking = db.query(Booking).filter(Booking.id == id).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Booking not found"},
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "Booking already cancelled"},
        )

    # Update booking status
    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return booking
