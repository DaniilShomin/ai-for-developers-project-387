from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking
from app.schemas import TimeSlot as TimeSlotSchema, ErrorResponse

router = APIRouter(prefix="/timeslots", tags=["Time Slots"])


@router.get(
    "",
    response_model=list[TimeSlotSchema],
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def list_time_slots(
    owner_id: Annotated[
        str, Query(alias="ownerId", description="ID владельца (обязательно)")
    ],
    date_from: Annotated[
        datetime | None, Query(alias="dateFrom", description="Начальная дата")
    ] = None,
    date_to: Annotated[
        datetime | None, Query(alias="dateTo", description="Конечная дата")
    ] = None,
    db: Session = Depends(get_db),
):
    """
    Получить список занятых временных слотов (confirmed бронирования).
    Возвращает только бронирования начиная с текущей даты (по умолчанию),
    или начиная с указанной date_from.
    """
    # Default: only return bookings from current datetime
    if date_from is None:
        date_from = datetime.utcnow()

    query = db.query(Booking).filter(
        Booking.owner_id == owner_id,
        Booking.status == "confirmed",
        Booking.start_time >= date_from,
    )

    if date_to:
        query = query.filter(Booking.start_time <= date_to)

    bookings = query.all()

    # Convert bookings to TimeSlot format for frontend filtering
    time_slots = []
    for booking in bookings:
        time_slots.append(
            TimeSlotSchema(
                id=booking.id,
                owner_id=booking.owner_id,
                start_time=booking.start_time,
                end_time=booking.end_time,
                is_booked=True,
            )
        )

    return time_slots
