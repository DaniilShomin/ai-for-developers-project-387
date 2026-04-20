from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator, PlainSerializer
from typing import Annotated


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split("_")
    return components[0] + "".join(word.capitalize() for word in components[1:])


def serialize_datetime_utc(dt: datetime) -> str:
    """Serialize datetime to ISO format with Z suffix (UTC)."""
    if dt.tzinfo is None:
        # Treat naive datetime as UTC
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        # Convert to UTC
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# Annotated type for UTC datetime serialization
UtcDatetime = Annotated[
    datetime, PlainSerializer(serialize_datetime_utc, return_type=str)
]


# Enums
BookingStatus = Literal["confirmed", "cancelled"]


# ============== Error Schema ==============
class ErrorResponse(BaseModel):
    code: str
    message: str


# ============== Owner Schemas ==============
class Owner(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: str
    name: str
    email: str
    timezone: str
    work_start: str
    work_end: str
    created_at: UtcDatetime


class OwnerUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str | None = None
    email: str | None = None
    timezone: str | None = None
    work_start: str | None = None
    work_end: str | None = None


# ============== EventType Schemas ==============
class EventType(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: str
    title: str
    description: str | None = None
    duration: int
    owner_id: str
    created_at: UtcDatetime


class EventTypeCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str
    description: str | None = None
    duration: int
    owner_id: str


class EventTypeUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str | None = None
    description: str | None = None
    duration: int | None = None


# ============== Booker Schemas ==============
class Booker(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: str
    name: str
    email: str
    phone: str | None = None
    created_at: UtcDatetime


# ============== TimeSlot Schema (for frontend filtering) ==============
class TimeSlot(BaseModel):
    """Represents a booked time slot for frontend filtering"""

    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: str  # booking id
    owner_id: str
    start_time: UtcDatetime
    end_time: UtcDatetime
    is_booked: bool = True


# ============== Booking Schemas ==============
class Booking(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: str
    event_type_id: str
    owner_id: str
    booker_id: str
    start_time: UtcDatetime
    end_time: UtcDatetime
    notes: str | None = None
    status: BookingStatus
    created_at: UtcDatetime


class BookingWithDetails(Booking):
    event_type: EventType
    booker: Booker


class BookingCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    event_type_id: str
    owner_id: str
    start_time: datetime
    booker_name: str
    booker_email: str
    booker_phone: str | None = None
    notes: str | None = None

    @field_validator("start_time", mode="before")
    @classmethod
    def parse_datetime(cls, value):
        if isinstance(value, str):
            # Parse ISO format with or without timezone
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            # Ensure UTC
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        return value
