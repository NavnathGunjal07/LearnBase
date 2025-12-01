import { useState } from "react";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { useLearning } from "@/hooks/useLearning";
import { LinearProgress } from "../LinearProgress";

interface TopicSelectorProps {
  onTopicSelected: (
    topicId: number,
    topicName: string,
    subtopicId?: number,
    subtopicName?: string,
  ) => void;
}

export default function TopicSelector({ onTopicSelected }: TopicSelectorProps) {
  const learning = useLearning();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [step, setStep] = useState<"topic" | "subtopic">("topic");

  const selectedTopic = learning.state.topics.find(
    (t) => t.id === selectedTopicId,
  );

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    const topic = learning.state.topics.find((t) => t.id === topicId);

    if (topic && topic.subtopics.length > 0) {
      setStep("subtopic");
    } else {
      // No subtopics, start with just the topic
      onTopicSelected(parseInt(topicId), topic?.name || "");
    }
  };

  const handleSubtopicSelect = (subtopicId: string) => {
    if (selectedTopic) {
      const subtopic = selectedTopic.subtopics.find((s) => s.id === subtopicId);
      onTopicSelected(
        parseInt(selectedTopicId!),
        selectedTopic.name,
        parseInt(subtopicId),
        subtopic?.title,
      );
    }
  };

  const handleBack = () => {
    setStep("topic");
    setSelectedTopicId(null);
  };

  if (learning.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your topics...</p>
        </div>
      </div>
    );
  }

  if (learning.state.topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to LearnBase!
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't created any topics yet. Start your learning journey by
            creating your first topic.
          </p>

          <p className="text-sm text-gray-500">or</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-900 font-medium mb-2">
              💡 Quick Start:
            </p>
            <p className="text-sm text-blue-800">
              Create a topic like <strong>JavaScript</strong>,{" "}
              <strong>Python</strong>, or any subject you want to learn!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full">
        {step === "topic" ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Let's Start Learning!
              </h2>
              <p className="text-gray-600">
                Choose a topic to begin your learning session
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learning.state.topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{topic.iconUrl || "📚"}</div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {topic.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span>{topic.subtopics.length} subtopics</span>
                  </div>
                  {learning.topicProgressMap[topic.id] > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">
                          {Math.round(learning.topicProgressMap[topic.id])}%
                        </span>
                      </div>
                      <LinearProgress
                        value={learning.topicProgressMap[topic.id]}
                        height={6}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Choose a Subtopic
                </h2>
                <p className="text-gray-600">
                  Select a specific area within {selectedTopic?.name}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {["basic", "intermediate", "advanced"].map((level) => {
                const subtopics =
                  selectedTopic?.subtopics.filter(
                    (s) => s.difficultyLevel === level,
                  ) || [];

                if (subtopics.length === 0) return null;

                return (
                  <div key={level}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {level}
                    </h3>
                    <div className="space-y-2">
                      {subtopics.map((subtopic) => (
                        <button
                          key={subtopic.id}
                          onClick={() => handleSubtopicSelect(subtopic.id)}
                          className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {subtopic.title}
                              </h4>
                              {subtopic.progress > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1">
                                    <LinearProgress
                                      value={subtopic.progress}
                                      height={4}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500 w-8 text-right">
                                    {Math.round(subtopic.progress)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() =>
                onTopicSelected(
                  parseInt(selectedTopicId!),
                  selectedTopic?.name || "",
                )
              }
              className="w-full bg-gray-100 border-2 border-gray-300 rounded-lg p-4 hover:bg-gray-200 transition text-center"
            >
              <span className="text-gray-700 font-medium">
                Start with general {selectedTopic?.name} topic
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
