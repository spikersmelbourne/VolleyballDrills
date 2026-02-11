from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from uuid import UUID

# ----------------------------
# DRILLS
# ----------------------------
class DrillCreate(BaseModel):
    url: HttpUrl

    levels: List[int] = Field(default_factory=list)
    fundamentals: List[str] = Field(default_factory=list)
    drill_types: List[str] = Field(default_factory=list)

    coach_participates: Optional[bool] = None
    good_for_many_players: Optional[bool] = None

    notes: Optional[str] = None

    created_by_name: str = Field(min_length=2, max_length=80)


class DrillUpdate(BaseModel):
    url: Optional[HttpUrl] = None

    levels: Optional[List[int]] = None
    fundamentals: Optional[List[str]] = None
    drill_types: Optional[List[str]] = None

    coach_participates: Optional[bool] = None
    good_for_many_players: Optional[bool] = None

    notes: Optional[str] = None


class DrillRead(BaseModel):
    id: UUID
    url: str

    levels: List[int] = Field(default_factory=list)
    fundamentals: List[str] = Field(default_factory=list)
    drill_types: List[str] = Field(default_factory=list)

    coach_participates: Optional[bool] = None
    good_for_many_players: Optional[bool] = None
    notes: Optional[str] = None

    created_by_name: str

    avg_rating: Optional[float] = None
    ratings_count: int = 0
    comments_count: int = 0
    tested: bool = False

    class Config:
        from_attributes = True


# ----------------------------
# COMMENTS
# ----------------------------
class DrillCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
    created_by_name: str = Field(min_length=2, max_length=80)


class DrillCommentRead(BaseModel):
    id: UUID
    drill_id: UUID
    comment: str
    created_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------
# RATINGS
# ----------------------------
class DrillRatingCreate(BaseModel):
    score: int = Field(ge=1, le=10)
    created_by_name: str = Field(min_length=2, max_length=80)


class DrillRatingRead(BaseModel):
    id: UUID
    drill_id: UUID
    score: int
    created_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True