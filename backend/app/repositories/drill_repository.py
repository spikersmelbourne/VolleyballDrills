from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session

from app.models.drill import Drill
from app.models.drill_comment import DrillComment
from app.models.drill_rating import DrillRating


class DrillRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, drill: Drill) -> Drill:
        self.db.add(drill)
        self.db.commit()
        self.db.refresh(drill)
        return drill

    def get(self, drill_id: UUID) -> Optional[Drill]:
        stmt = select(Drill).where(Drill.id == drill_id)
        return self.db.execute(stmt).scalars().first()

    def delete(self, drill: Drill) -> None:
        self.db.delete(drill)
        self.db.commit()

    def update(self, drill: Drill) -> Drill:
        self.db.add(drill)
        self.db.commit()
        self.db.refresh(drill)
        return drill

    def list(self, levels=None, fundamentals=None, drill_types=None, q=None, coach=None, many=None):
        stmt = (
            select(
                Drill,
                func.count(distinct(DrillComment.id)).label("comments_count"),
                func.count(distinct(DrillRating.id)).label("ratings_count"),
                func.avg(DrillRating.score).label("avg_rating"),
            )
            .outerjoin(DrillComment, DrillComment.drill_id == Drill.id)
            .outerjoin(DrillRating, DrillRating.drill_id == Drill.id)
            .group_by(Drill.id)
        )

        if levels:
            lvl_list = [int(x) for x in levels.split(",") if x.strip().isdigit()]
            if lvl_list:
                stmt = stmt.where(Drill.levels.overlap(lvl_list))

        if fundamentals:
            stmt = stmt.where(
                Drill.fundamentals.overlap([x.strip() for x in fundamentals.split(",") if x.strip()])
            )

        if drill_types:
            stmt = stmt.where(
                Drill.drill_types.overlap([x.strip() for x in drill_types.split(",") if x.strip()])
            )

        # (Se você não quer search, pode remover esse bloco do backend depois,
        # mas deixar aqui não quebra nada)
        if q:
            stmt = stmt.where(Drill.title.ilike(f"%{q}%"))

        if coach is True:
            stmt = stmt.where(Drill.coach_participates.is_(True))

        if many is True:
            stmt = stmt.where(Drill.good_for_many_players.is_(True))

        rows = self.db.execute(stmt).all()

        result = []
        for drill, comments_count, ratings_count, avg_rating in rows:
            ratings_count_int = int(ratings_count or 0)

            result.append({
                "id": drill.id,
                "title": drill.title,
                "url": drill.url,
                "platform": drill.platform,
                "video_id": drill.video_id,
                "levels": drill.levels or [],
                "fundamentals": drill.fundamentals or [],
                "drill_types": drill.drill_types or [],
                "coach_participates": drill.coach_participates,
                "good_for_many_players": drill.good_for_many_players,
                "notes": drill.notes,
                "created_by_name": drill.created_by_name,

                "comments_count": int(comments_count or 0),
                "ratings_count": ratings_count_int,
                "avg_rating": float(avg_rating) if avg_rating is not None else None,
                "tested": (ratings_count_int > 0),
            })

        return result

    def get_with_aggregates(self, drill_id: UUID) -> Optional[dict]:
        stmt = (
            select(
                Drill,
                func.count(distinct(DrillComment.id)).label("comments_count"),
                func.count(distinct(DrillRating.id)).label("ratings_count"),
                func.avg(DrillRating.score).label("avg_rating"),
            )
            .outerjoin(DrillComment, DrillComment.drill_id == Drill.id)
            .outerjoin(DrillRating, DrillRating.drill_id == Drill.id)
            .where(Drill.id == drill_id)
            .group_by(Drill.id)
        )

        row = self.db.execute(stmt).first()
        if not row:
            return None

        drill, comments_count, ratings_count, avg_rating = row
        ratings_count_int = int(ratings_count or 0)

        return {
            "id": drill.id,
            "title": drill.title,
            "url": drill.url,
            "platform": drill.platform,
            "video_id": drill.video_id,
            "levels": drill.levels or [],
            "fundamentals": drill.fundamentals or [],
            "drill_types": drill.drill_types or [],
            "coach_participates": drill.coach_participates,
            "good_for_many_players": drill.good_for_many_players,
            "notes": drill.notes,
            "created_by_name": drill.created_by_name,

            "comments_count": int(comments_count or 0),
            "ratings_count": ratings_count_int,
            "avg_rating": float(avg_rating) if avg_rating is not None else None,
            "tested": (ratings_count_int > 0),
        }