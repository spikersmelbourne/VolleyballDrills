import uuid
from typing import Optional, List

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Text, Boolean, Integer, DateTime, func, text

from app.models.base import Base


class Drill(Base):
    __tablename__ = "drills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)

    platform: Mapped[str] = mapped_column(Text, nullable=False, default="other")
    video_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    levels: Mapped[List[int]] = mapped_column(ARRAY(Integer), nullable=False, default=list)
    fundamentals: Mapped[List[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    drill_types: Mapped[List[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)

    coach_participates: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    good_for_many_players: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    min_players: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_players: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ✅ NEW
    tested: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    tested_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tested_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_by_name: Mapped[str] = mapped_column(Text, nullable=False)
    

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )