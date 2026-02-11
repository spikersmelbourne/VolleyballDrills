from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.drill_rating import DrillRating
from app.repositories.drill_repository import DrillRepository
from app.repositories.drill_rating_repository import DrillRatingRepository
from app.schemas.drill import DrillRatingCreate


class DrillRatingService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DrillRatingRepository(db)
        self.drill_repo = DrillRepository(db)

    def list_ratings(self, drill_id: str):
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        if not self.drill_repo.get(drill_uuid):
            raise HTTPException(status_code=404, detail="Drill not found")

        return self.repo.list_for_drill(drill_uuid)

    def add_rating(self, drill_id: str, payload: DrillRatingCreate):
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        if not self.drill_repo.get(drill_uuid):
            raise HTTPException(status_code=404, detail="Drill not found")

        r = DrillRating(
            drill_id=drill_uuid,
            score=payload.score,
            created_by_name=payload.created_by_name,
            created_by_email=None,  # ← não usamos email mais
        )
        return self.repo.create(r)

    def delete_rating(self, rating_id: str):
        try:
            rating_uuid = UUID(str(rating_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid rating id")

        r = self.repo.get(rating_uuid)
        if not r:
            raise HTTPException(status_code=404, detail="Rating not found")

        self.repo.delete(r)