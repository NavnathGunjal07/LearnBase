export type ExercisePayload = {
  question: string;
  exercise: string;
  hints: string[];
  test_cases: { input: string; output: string }[];
  progress?: number;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchExercise(topic: string, level: string): Promise<ExercisePayload> {
  const res = await fetch(`${API_URL}/exercise?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}`);
  if (!res.ok) throw new Error('Failed to fetch exercise');
  return res.json();
}

export async function validateCode(code: string, test_cases: { input: string; output: string }[], language: 'python' | 'js' = 'python') {
  const res = await fetch(`${API_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, test_cases, language }),
  });
  if (!res.ok) throw new Error('Failed to validate');
  return res.json();
}

export async function bumpProgress(topic: string, delta: number) {
  const res = await fetch(`${API_URL}/progress?topic=${encodeURIComponent(topic)}&delta=${delta}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to update progress');
  return res.json();
}


