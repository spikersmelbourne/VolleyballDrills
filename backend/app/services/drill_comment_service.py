from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.drill_comment import DrillComment
from app.repositories.drill_comment_repository import DrillCommentRepository
from app.repositories.drill_repository import DrillRepository
from app.schemas.drill import DrillCommentCreate

class DrillCommentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DrillCommentRepository(db)
        self.drill_repo = DrillRepository(db)

    def list_comments(self, drill_id: str):
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        if not self.drill_repo.get(drill_uuid):
            raise HTTPException(status_code=404, detail="Drill not found")

        return self.repo.list_for_drill(drill_uuid)

    def add_comment(self, drill_id: str, payload: DrillCommentCreate):
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        if not self.drill_repo.get(drill_uuid):
            raise HTTPException(status_code=404, detail="Drill not found")

        comment = DrillComment(
            drill_id=drill_uuid,
            comment=payload.comment,
            created_by_name=payload.created_by_name,
            created_by_email="",  # mantém DB feliz
        )
        return self.repo.create(comment)

    def delete_comment(self, comment_id: str):
        try:
            comment_uuid = UUID(str(comment_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid comment id")

        c = self.repo.get(comment_uuid)
        if not c:
            raise HTTPException(status_code=404, detail="Comment not found")
        self.repo.delete(c)