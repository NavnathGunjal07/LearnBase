from fastapi import APIRouter, Query

from ..models.schemas import ExerciseResponse
from ..services.generator import generate_exercise
from ..storage.memory import progress_store

router = APIRouter(prefix="", tags=["exercise"])


@router.get('/exercise', response_model=ExerciseResponse)
def get_exercise(topic: str = Query(...), level: str = Query("basic")):
  ex = generate_exercise(topic, level)
  ex.progress = progress_store.get(topic)
  return ex


