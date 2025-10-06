from fastapi import APIRouter, Query

from ..storage.memory import progress_store

router = APIRouter(prefix="", tags=["progress"])


@router.post('/progress')
def update_progress(topic: str = Query(...), delta: int = Query(0)):
  value = progress_store.bump(topic, delta)
  return {"topic": topic, "progress": value}


