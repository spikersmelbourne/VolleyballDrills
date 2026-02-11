from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.drill import (
    DrillCreate, DrillRead, DrillUpdate,
    DrillCommentCreate, DrillCommentRead
)
from app.services.drill_service import DrillService
from app.services.drill_comment_service import DrillCommentService
from app.schemas.drill import DrillRatingCreate, DrillRatingRead

from app.services.drill_rating_service import DrillRatingService
router = APIRouter(prefix="/drills", tags=["Drills"])


@router.post("", response_model=DrillRead)
def create_drill(payload: DrillCreate, db: Session = Depends(get_db)):
    service = DrillService(db)
    return service.create_drill(payload)


@router.get("", response_model=list[DrillRead])
def list_drills(
    levels: Optional[str] = Query(None),
    fundamentals: Optional[str] = Query(None),
    drill_types: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    coach: Optional[bool] = Query(None),
    many: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.list_drills(
        levels=levels,
        fundamentals=fundamentals,
        drill_types=drill_types,
        q=q,
        coach=coach,
        many=many,
    )


# ✅ CRUD
@router.get("/{drill_id}", response_model=DrillRead)
def get_drill(drill_id: str, db: Session = Depends(get_db)):
    service = DrillService(db)
    return service.get_drill(drill_id)


@router.put("/{drill_id}", response_model=DrillRead)
def update_drill(drill_id: str, payload: DrillUpdate, db: Session = Depends(get_db)):
    service = DrillService(db)
    return service.update_drill(drill_id, payload)


@router.delete("/{drill_id}")
def delete_drill(drill_id: str, db: Session = Depends(get_db)):
    service = DrillService(db)
    service.delete_drill(drill_id)
    return {"ok": True}


# ✅ Comments
@router.get("/{drill_id}/comments", response_model=list[DrillCommentRead])
def list_comments(drill_id: str, db: Session = Depends(get_db)):
    service = DrillCommentService(db)
    return service.list_comments(drill_id)


@router.post("/{drill_id}/comments", response_model=DrillCommentRead)
def add_comment(drill_id: str, payload: DrillCommentCreate, db: Session = Depends(get_db)):
    service = DrillCommentService(db)
    return service.add_comment(drill_id, payload)


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: str, db: Session = Depends(get_db)):
    service = DrillCommentService(db)
    service.delete_comment(comment_id)
    return {"ok": True}

@router.get("/{drill_id}/ratings", response_model=list[DrillRatingRead])
def list_ratings(drill_id: str, db: Session = Depends(get_db)):
    service = DrillRatingService(db)
    return service.list_ratings(drill_id)

@router.post("/{drill_id}/ratings", response_model=DrillRatingRead)
def add_rating(drill_id: str, payload: DrillRatingCreate, db: Session = Depends(get_db)):
    service = DrillRatingService(db)
    return service.add_rating(drill_id, payload)

@router.delete("/ratings/{rating_id}")
def delete_rating(rating_id: str, db: Session = Depends(get_db)):
    service = DrillRatingService(db)
    service.delete_rating(rating_id)
    return {"ok": True}