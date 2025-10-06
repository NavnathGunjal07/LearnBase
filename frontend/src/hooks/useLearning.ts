import { useMemo, useState } from 'react';
import type { Breadcrumb, LearningState, LearningLevel, Subtopic, Topic } from '../utils/types';

function calculateTopicProgress(topic: Topic): number {
  if (topic.subtopics.length === 0) return 0;
  const sum = topic.subtopics.reduce((acc, s) => acc + (s.progress ?? 0), 0);
  return Math.round(sum / topic.subtopics.length);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const seedTopics: Topic[] = [
  {
    id: 't-js-fundamentals',
    name: 'JavaScript Fundamentals',
    subtopics: [
      { id: 'st-vars', name: 'Variables', level: 'basic', progress: 60, objectives: [{ text: 'Understand let/const/var' }, { text: 'Know scope basics' }] },
      { id: 'st-funcs', name: 'Functions', level: 'basic', progress: 40, objectives: [{ text: 'Function declarations vs expressions' }] },
      { id: 'st-closures', name: 'Closures', level: 'intermediate', progress: 10, objectives: [{ text: 'Explain closure mechanics' }] },
      { id: 'st-promises', name: 'Promises', level: 'intermediate', progress: 0, objectives: [{ text: 'Create and consume promises' }] },
      { id: 'st-event-loop', name: 'Event Loop', level: 'advanced', progress: 0, objectives: [{ text: 'Trace micro/macro tasks' }] },
    ],
  },
  {
    id: 't-react-basics',
    name: 'React Basics',
    subtopics: [
      { id: 'st-components', name: 'Components', level: 'basic', progress: 80, objectives: [{ text: 'Build functional components' }] },
      { id: 'st-state', name: 'State & Props', level: 'basic', progress: 30, objectives: [{ text: 'Prop drilling vs lifting state' }] },
      { id: 'st-hooks', name: 'Hooks', level: 'intermediate', progress: 20, objectives: [{ text: 'useEffect/useMemo basics' }] },
    ],
  },
];

export function useLearning() {
  const [state, setState] = useState<LearningState>({
    topics: seedTopics,
    selection: { topicId: seedTopics[0]?.id ?? null, subtopicId: seedTopics[0]?.subtopics[0]?.id ?? null },
  });

  const topicProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.topics.forEach((t) => {
      map[t.id] = calculateTopicProgress(t);
    });
    return map;
  }, [state.topics]);

  const selectedTopic = useMemo(
    () => state.topics.find((t) => t.id === state.selection.topicId) ?? null,
    [state.topics, state.selection.topicId]
  );
  const selectedSubtopic = useMemo(
    () => selectedTopic?.subtopics.find((s) => s.id === state.selection.subtopicId) ?? null,
    [selectedTopic, state.selection.subtopicId]
  );

  const breadcrumb: Breadcrumb = useMemo(() => ({
    topicName: selectedTopic?.name,
    subtopicName: selectedSubtopic?.name,
  }), [selectedTopic?.name, selectedSubtopic?.name]);

  function selectTopic(topicId: string) {
    setState((prev) => {
      const topic = prev.topics.find((t) => t.id === topicId) ?? null;
      const firstSub = topic?.subtopics[0] ?? null;
      return { ...prev, selection: { topicId, subtopicId: firstSub?.id ?? null } };
    });
  }

  function selectSubtopic(topicId: string, subtopicId: string) {
    setState((prev) => ({ ...prev, selection: { topicId, subtopicId } }));
  }

  function updateSubtopicProgress(topicId: string, subtopicId: string, progress: number) {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              subtopics: t.subtopics.map((s) => (s.id === subtopicId ? { ...s, progress, completed: progress >= 100 } : s)),
            }
      ),
    }));
  }

  function addTopic(name: string) {
    const newTopic: Topic = { id: makeId('topic'), name, subtopics: [] };
    setState((prev) => ({ ...prev, topics: [newTopic, ...prev.topics] }));
  }

  function addSubtopic(topicId: string, name: string, level: LearningLevel) {
    const newSub: Subtopic = { id: makeId('sub'), name, level, progress: 0, objectives: [] };
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) => (t.id === topicId ? { ...t, subtopics: [...t.subtopics, newSub] } : t)),
    }));
  }

  return {
    state,
    topicProgressMap,
    selectedTopic,
    selectedSubtopic,
    breadcrumb,
    selectTopic,
    selectSubtopic,
    updateSubtopicProgress,
    addTopic,
    addSubtopic,
  };
}


