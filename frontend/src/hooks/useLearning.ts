import { useMemo, useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { Breadcrumb, LearningState, Subtopic, Topic } from '../utils/types';

function calculateTopicProgress(topic: Topic): number {
  if (topic.subtopics.length === 0) return 0;
  const sum = topic.subtopics.reduce((acc, s) => acc + (s.progress ?? 0), 0);
  return Math.round(sum / topic.subtopics.length);
}

export function useLearning() {
  const [state, setState] = useState<LearningState>({
    topics: [],
    selection: { topicId: null, subtopicId: null },
  });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  // Fetch user's enrolled topics on mount
  useEffect(() => {
    let isMounted = true;
    if (hasFetched.current) return;
    hasFetched.current = true;
    const loadTopics = async () => {
      if (isMounted) {
        await fetchTopics();
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/topics');
      const topics: Topic[] = response.data.map((ut: any) => ({
        id: ut.id.toString(),
        masterTopicId: ut.masterTopicId,
        name: ut.name,
        description: ut.description || '',
        iconUrl: ut.iconUrl || '',
        category: ut.category || '',
        enrolledAt: ut.enrolledAt || new Date().toISOString(),
        lastAccessedAt: ut.lastAccessedAt || new Date().toISOString(),
        progress: ut.progress || 0,
        subtopics: ut.subtopics.map((s: any) => ({
          id: s.id.toString(),
          title: s.title,
          description: s.description || '',
          difficultyLevel: s.difficultyLevel,
          orderIndex: s.orderIndex,
          progress: s.progress || 0,
          completed: s.progress >= 100,
        })),
      }));

      setState({
        topics,
        selection: {
          topicId: topics[0]?.id ?? null,
          subtopicId: topics[0]?.subtopics[0]?.id ?? null,
        },
      });
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topicProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.topics.forEach((t) => {
      map[t.id] = calculateTopicProgress(t);
    });
    return map;
  }, [state.topics]);

  const selectedTopic: Topic | null = useMemo(
    () => state.topics.find((t) => t.id === state.selection.topicId) ?? null,
    [state.topics, state.selection.topicId]
  );
  const selectedSubtopic: Subtopic | null = useMemo(
    () => selectedTopic?.subtopics.find((s) => s.id === state.selection.subtopicId) ?? null,
    [selectedTopic, state.selection.subtopicId]
  );

  const breadcrumb: Breadcrumb = useMemo(() => ({
    topicName: selectedTopic?.name,
    subtopicName: selectedSubtopic?.title,
  }), [selectedTopic?.name, selectedSubtopic?.title]);

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

  async function updateSubtopicProgress(topicId: string, subtopicId: string, progress: number) {
    try {
      await axiosInstance.patch(`/topics/${topicId}/subtopics/${subtopicId}/progress`, {
        completedPercent: progress,
      });

      // Update local state
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
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  // Refresh topics after adding a new one
  function addTopic() {
    fetchTopics();
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
    loading,
  };
}


