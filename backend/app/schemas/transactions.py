from datetime import date as CalendarDate
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TransactionWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: UUID
    amount_kopecks: Annotated[int, Field(strict=True, ge=1, le=99999999999)]
    date: CalendarDate
    comment: Annotated[str, Field(max_length=200)] = ""


class TransactionRead(TransactionWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
