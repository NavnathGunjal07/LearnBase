from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class TestCase(BaseModel):
  input: str
  output: str


class ExerciseResponse(BaseModel):
  question: str
  exercise: str
  hints: List[str]
  test_cases: List[TestCase]
  progress: Optional[int] = Field(default=None, description="0-100")


class ValidateRequest(BaseModel):
  code: str
  test_cases: List[TestCase]
  language: Optional[str] = Field(default="python")


class ValidateResponse(BaseModel):
  passed: bool
  results: List[Dict[str, Any]]
  feedback: str


