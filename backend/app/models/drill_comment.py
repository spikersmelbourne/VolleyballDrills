import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, DateTime, func, ForeignKey

from app.models.base import Base


class DrillComment(Base):
    __tablename__ = "drill_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    drill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("drills.id", ondelete="CASCADE"), nullable=False)

    comment: Mapped[str] = mapped_column(Text, nullable=False)

    created_by_name: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_email: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)