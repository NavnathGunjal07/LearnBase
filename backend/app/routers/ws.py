from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import os
from openai import AsyncOpenAI

router = APIRouter()


@router.websocket('/ws')
async def websocket_endpoint(ws: WebSocket):
  await ws.accept()
  api_key = os.getenv('OPENAI_API_KEY')
  client = AsyncOpenAI(api_key=api_key) if api_key else None
  try:
    while True:
      user_text = await ws.receive_text()

      if not client:
        await ws.send_json({"type": "typing"})
        await ws.send_json({"type": "delta", "content": f"You said: {user_text}"})
        await ws.send_json({"type": "done"})
        continue

      try:
        await ws.send_json({"type": "typing"})
        # Use server-side streaming for incremental tokens
        stream = await client.chat.completions.create(
          model="gpt-4o-mini",
          messages=[
            {"role": "system", "content": "You are a helpful coding tutor chatting with a learner."},
            {"role": "user", "content": user_text},
          ],
          temperature=0.2,
          stream=True,
        )

        async for chunk in stream:
          try:
            delta = chunk.choices[0].delta.content or ""
          except Exception:
            delta = ""
          if delta:
            await ws.send_json({"type": "delta", "content": delta})
        await ws.send_json({"type": "done"})
      except Exception:
        await ws.send_json({"type": "typing"})
        await ws.send_json({"type": "delta", "content": f"You said: {user_text}"})
        await ws.send_json({"type": "done"})
  except WebSocketDisconnect:
    pass


