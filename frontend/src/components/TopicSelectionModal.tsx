import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { topicService } from "@/api";
import { Topic } from "@/utils/types";

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicAdded: (topicId: string, topicName: string) => void;
}

export default function TopicSelectionModal({
  isOpen,
  onClose,
  onTopicAdded,
}: TopicSelectionModalProps) {
  const [masterTopics, setMasterTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const { toast } = useToast();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetchedRef.current) {
      fetchMasterTopics();
      hasFetchedRef.current = true;
    }

    // Reset when modal closes
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [isOpen]);

  const fetchMasterTopics = async () => {
    setLoading(true);
    try {
      const response = await topicService.getTopics();
      setMasterTopics(response || []);
    } catch (error) {
      console.error("Failed to fetch master topics:", error);
      toast({
        title: "✕ Error",
        description: "Failed to load topics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (topicId: string, topicName: string) => {
    setEnrolling(topicId);
    try {
      await topicService.enrollInTopic(topicId);

      // Notify the parent component and close the modal
      toast({
        title: "✓ Success",
        description: `Successfully enrolled in ${topicName}`,
      });
      onTopicAdded(topicId, topicName);
      onClose();
    } catch (error) {
      console.error("Failed to enroll in topic:", error);
      toast({
        title: "✕ Error",
        description: "Failed to enroll in topic",
        variant: "destructive",
      });
    } finally {
      setEnrolling(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Topic</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a topic to start learning
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleEnroll(topic.id, topic.name)}
                  disabled={enrolling === topic.id}
                  className={`relative flex flex-col items-start p-5 border-2 rounded-lg text-left transition-all duration-300 ease-in-out 
        bg-white hover:bg-gray-50 hover:border-teal-500 hover:shadow-md cursor-pointer 
        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-14 h-14 mb-3 bg-gray-50 rounded-lg">
                    <img
                      src={topic.iconUrl}
                      alt={topic.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/40?text=" +
                          topic.name[0];
                      }}
                    />
                  </div>

                  {/* Category */}
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded mb-2">
                    {topic.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {topic.name}
                  </h3>

                  {/* Description or Progress */}
                  {enrolling === topic.id ? (
                    <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enrolling...
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && masterTopics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No topics available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
