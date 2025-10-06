import os
import subprocess
import tempfile
import textwrap
from typing import List, Dict, Any


def run_python_and_capture(user_code: str, stdin_data: str, timeout_sec: float = 2.5) -> str:
  harness = textwrap.dedent(
    """
    import sys, json
    __input = sys.stdin.read()

    {USER_CODE}

    if 'solve' not in globals():
      raise SystemExit('No solve() function found')
    import io
    sys.stdin = io.StringIO(__input)
    solve()
    """
  ).replace("{USER_CODE}", user_code)

  with tempfile.TemporaryDirectory() as tmp:
    path = os.path.join(tmp, 'run.py')
    with open(path, 'w', encoding='utf-8') as f:
      f.write(harness)
    proc = subprocess.run(
      ["python", path],
      input=stdin_data.encode('utf-8'),
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      timeout=timeout_sec,
    )
    if proc.returncode != 0:
      raise RuntimeError(proc.stderr.decode('utf-8')[:500])
    return proc.stdout.decode('utf-8')


