from typing import Dict


class MemoryProgress:
  def __init__(self) -> None:
    self.store: Dict[str, int] = {}

  def get(self, topic: str) -> int:
    return self.store.get(topic, 0)

  def bump(self, topic: str, delta: int) -> int:
    cur = self.get(topic)
    cur = max(0, min(100, cur + delta))
    self.store[topic] = cur
    return cur

  def set(self, topic: str, value: int) -> int:
    value = max(0, min(100, value))
    self.store[topic] = value
    return value

progress_store = MemoryProgress()


