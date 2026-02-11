from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.repositories.drill_repository import DrillRepository
from app.models.drill import Drill
from app.schemas.drill import DrillCreate, DrillUpdate


class DrillService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DrillRepository(db)

    def create_drill(self, payload: DrillCreate) -> Drill:
        data = payload.model_dump()

        # HttpUrl -> str
        if "url" in data and data["url"] is not None:
            data["url"] = str(payload.url)

        # ✅ NÃO enviar campos que não existem no model Drill
        data.pop("created_by_email", None)

        # ✅ Se você já removeu title do schema, isso nem vem no payload.
        # Mas se a tabela ainda exige title NOT NULL, o insert vai quebrar.
        # Então, só garante um valor caso exista no model/tabela.
        if "title" not in data or data.get("title") is None:
            data["title"] = "drill"

        drill = Drill(**data)
        return self.repo.create(drill)

    def list_drills(self, levels=None, fundamentals=None, drill_types=None, q=None, coach=None, many=None):
        return self.repo.list(
            levels=levels,
            fundamentals=fundamentals,
            drill_types=drill_types,
            q=q,
            coach=coach,
            many=many,
        )

    def get_drill(self, drill_id: str) -> dict:
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        data = self.repo.get_with_aggregates(drill_uuid)
        if not data:
            raise HTTPException(status_code=404, detail="Drill not found")
        return data

    def update_drill(self, drill_id: str, payload: DrillUpdate) -> Drill:
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        drill = self.repo.get(drill_uuid)
        if not drill:
            raise HTTPException(status_code=404, detail="Drill not found")

        data = payload.model_dump(exclude_unset=True)

        if "url" in data and data["url"] is not None:
            data["url"] = str(payload.url)

        # ✅ NÃO enviar campos que não existem no model Drill
        data.pop("created_by_email", None)

        for k, v in data.items():
            setattr(drill, k, v)

        return self.repo.update(drill)

    def delete_drill(self, drill_id: str) -> None:
        try:
            drill_uuid = UUID(str(drill_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid drill id")

        drill = self.repo.get(drill_uuid)
        if not drill:
            raise HTTPException(status_code=404, detail="Drill not found")

        self.repo.delete(drill)