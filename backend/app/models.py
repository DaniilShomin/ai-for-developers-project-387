from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import uuid


class Base(DeclarativeBase):
    pass


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    timezone: Mapped[str] = mapped_column(String, default="UTC")
    work_start: Mapped[str] = mapped_column(String, default="09:00")  # Format "HH:MM"
    work_end: Mapped[str] = mapped_column(String, default="18:00")  # Format "HH:MM"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event_types: Mapped[list["EventType"]] = relationship(
        "EventType", back_populates="owner"
    )
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="owner")


class EventType(Base):
    __tablename__ = "event_types"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)  # Minutes
    owner_id: Mapped[str] = mapped_column(
        String, ForeignKey("owners.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["Owner"] = relationship("Owner", back_populates="event_types")
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="event_type"
    )


class Booker(Base):
    __tablename__ = "bookers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="booker")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    event_type_id: Mapped[str] = mapped_column(
        String, ForeignKey("event_types.id"), nullable=False
    )
    owner_id: Mapped[str] = mapped_column(
        String, ForeignKey("owners.id"), nullable=False
    )
    booker_id: Mapped[str] = mapped_column(
        String, ForeignKey("bookers.id"), nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event_type: Mapped["EventType"] = relationship(
        "EventType", back_populates="bookings"
    )
    owner: Mapped["Owner"] = relationship("Owner", back_populates="bookings")
    booker: Mapped["Booker"] = relationship("Booker", back_populates="bookings")
