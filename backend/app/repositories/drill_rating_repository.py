from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.drill_rating import DrillRating


class DrillRatingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, rating: DrillRating) -> DrillRating:
        self.db.add(rating)
        self.db.commit()
        self.db.refresh(rating)
        return rating

    def get(self, rating_id: UUID) -> Optional[DrillRating]:
        stmt = select(DrillRating).where(DrillRating.id == rating_id)
        return self.db.execute(stmt).scalars().first()

    def delete(self, rating: DrillRating) -> None:
        self.db.delete(rating)
        self.db.commit()

    def list_for_drill(self, drill_id: UUID):
        stmt = (
            select(DrillRating)
            .where(DrillRating.drill_id == drill_id)
            .order_by(DrillRating.created_at.desc())
        )
        return self.db.execute(stmt).scalars().all()