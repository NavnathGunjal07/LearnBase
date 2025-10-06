from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from .routers.exercise import router as exercise_router
from .routers.validate import router as validate_router
from .routers.progress import router as progress_router
from .routers.ws import router as ws_router


def create_app() -> FastAPI:
  app = FastAPI(title="Learnbase Tutor API")

  app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )

  app.include_router(exercise_router)
  app.include_router(validate_router)
  app.include_router(progress_router)
  app.include_router(ws_router)
  return app


app = create_app()


