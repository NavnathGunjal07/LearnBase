import json
import os
from typing import List

from ..models.schemas import ExerciseResponse, TestCase


def _level_to_difficulty(level: str) -> str:
  level = (level or '').lower()
  if level in ("basic", "beginner"): return "basic"
  if level in ("intermediate", "medium"): return "intermediate"
  if level in ("advanced", "hard"): return "advanced"
  return "basic"


def _fallback_generate(topic: str, level: str) -> ExerciseResponse:
  lvl = _level_to_difficulty(level)
  topic_clean = topic.strip() or "General Programming"
  if lvl == 'basic':
    question = f"List two key concepts in {topic_clean}."
    exercise = "Write a function solve() that reads a single line and prints it in uppercase."
    hints = ["Use input() to read.", "Use .upper()."]
    tests = [TestCase(input="hello\n", output="HELLO\n"), TestCase(input="Learnbase\n", output="LEARNBASE\n")]
  elif lvl == 'intermediate':
    question = f"Explain how you'd structure a module for {topic_clean}."
    exercise = "Implement solve() reading a CSV line of ints, print sum of unique numbers."
    hints = ["Split by comma and convert to int.", "Use set() to deduplicate."]
    tests = [TestCase(input="1,2,2,3\n", output="6\n"), TestCase(input="10,10,10\n", output="10\n")]
  else:
    question = f"Describe an edge case in {topic_clean} and how to mitigate it."
    exercise = "Implement solve() reading JSON with key 'nums', print median as float with one decimal."
    hints = ["json.loads for parsing.", "Handle even/odd lengths."]
    tests = [
      TestCase(input=json.dumps({"nums": [1,2,3]}) + "\n", output="2.0\n"),
      TestCase(input=json.dumps({"nums": [1,2,3,4]}) + "\n", output="2.5\n"),
    ]
  return ExerciseResponse(question=question, exercise=exercise, hints=hints, test_cases=tests)


def generate_exercise(topic: str, level: str) -> ExerciseResponse:
  api_key = os.getenv('OPENAI_API_KEY')
  if not api_key:
    return _fallback_generate(topic, level)
  try:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    system = (
      "You are an AI coding tutor. Given a topic and level, produce a JSON with keys: "
      "question, exercise, hints (array), test_cases (array of {input, output})."
    )
    user = f"topic={topic}\nlevel={level}"
    resp = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
      temperature=0.3,
    )
    content = resp.choices[0].message.content or "{}"
    data = json.loads(content)
    return ExerciseResponse(
      question=data.get('question', ''),
      exercise=data.get('exercise', ''),
      hints=list(data.get('hints', [])),
      test_cases=[TestCase(**tc) for tc in data.get('test_cases', [])],
    )
  except Exception:
    return _fallback_generate(topic, level)


