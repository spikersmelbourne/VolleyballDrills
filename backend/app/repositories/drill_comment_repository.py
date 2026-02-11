from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.drill_comment import DrillComment


class DrillCommentRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_drill(self, drill_id):
        stmt = select(DrillComment).where(DrillComment.drill_id == drill_id).order_by(DrillComment.created_at.desc())
        return self.db.execute(stmt).scalars().all()

    def create(self, comment: DrillComment) -> DrillComment:
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def get(self, comment_id):
        stmt = select(DrillComment).where(DrillComment.id == comment_id)
        return self.db.execute(stmt).scalars().first()

    def delete(self, comment: DrillComment) -> None:
        self.db.delete(comment)
        self.db.commit()