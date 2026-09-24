from datetime import date
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field


def validate_month(value: date) -> date:
    if value.day != 1:
        raise ValueError("Месяц бюджета должен быть датой первого числа.")
    return value


BudgetMonth = Annotated[date, AfterValidator(validate_month)]


class BudgetWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: UUID
    month: BudgetMonth = Field(description="Первое число месяца, например 2026-09-01")
    limit_kopecks: Annotated[int, Field(strict=True, ge=1, le=99999999999)]


class BudgetRead(BudgetWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
