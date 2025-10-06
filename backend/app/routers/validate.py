from typing import Dict, Any, List
from fastapi import APIRouter

from ..models.schemas import ValidateRequest, ValidateResponse
from ..services.validator import run_python_and_capture

router = APIRouter(prefix="", tags=["validate"])


@router.post('/validate', response_model=ValidateResponse)
def validate_code(payload: ValidateRequest):
  if payload.language and payload.language.lower() != 'python':
    return ValidateResponse(passed=False, results=[], feedback='Only Python is supported in this prototype.')

  results: List[Dict[str, Any]] = []
  passed_all = True
  for tc in payload.test_cases:
    try:
      out = run_python_and_capture(payload.code, tc.input)
      ok = out == tc.output
      if not ok:
        passed_all = False
      results.append({"input": tc.input, "expected": tc.output, "actual": out, "passed": ok})
    except Exception as e:
      passed_all = False
      results.append({"input": tc.input, "error": str(e), "passed": False})

  feedback = (
    'Great job! All tests passed.' if passed_all else f"{len([r for r in results if not r.get('passed')])} test(s) failing. Compare expected vs actual output."
  )
  return ValidateResponse(passed=passed_all, results=results, feedback=feedback)


