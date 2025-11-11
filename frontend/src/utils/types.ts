export interface ChatMessageType {
  sender: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isComplete?: boolean; // For streaming messages
}

export type LearningLevel = 'basic' | 'intermediate' | 'advanced';

export interface LearningObjective {
  text: string;
}

export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export interface Subtopic {
  id: string;
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  orderIndex: number;
  progress: number; // 0-100
  completed?: boolean; // derived from progress === 100
}

export interface Topic {
  id: string;
  masterTopicId: number;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  enrolledAt: string; // ISO string from API
  lastAccessedAt: string; // ISO string from API
  progress: number; // overall topic progress
  subtopics: Subtopic[];
}


export interface SelectionState {
  topicId: string | null;
  subtopicId: string | null;
}

export interface LearningState {
  topics: Topic[];
  selection: SelectionState;
}

export interface Breadcrumb {
  topicName?: string;
  subtopicName?: string;
}
  