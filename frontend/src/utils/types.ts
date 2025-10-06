export interface ChatMessageType {
  sender: 'user' | 'assistant';
  content: string;
}

export type LearningLevel = 'basic' | 'intermediate' | 'advanced';

export interface LearningObjective {
  text: string;
}

export interface Subtopic {
  id: string;
  name: string;
  level: LearningLevel;
  objectives: LearningObjective[];
  progress: number; // 0-100
  completed?: boolean; // derived from progress === 100, may be persisted
}

export interface Topic {
  id: string;
  name: string;
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
  