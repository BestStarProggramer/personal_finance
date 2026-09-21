from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, StringConstraints


CategoryType = Literal["income", "expense"]
CategoryName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class CategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: CategoryName
    type: CategoryType


class CategoryRead(CategoryWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
