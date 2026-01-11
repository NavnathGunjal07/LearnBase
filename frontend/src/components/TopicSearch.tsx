import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { topicService } from "@/api";
import { Topic } from "@/utils/types";

interface TopicSearchProps {
  onTopicAdded: (topicId: string, topicName: string) => void;
  onNewChat: () => void;
  collapsed?: boolean;
}

export default function TopicSearch({
  onTopicAdded,
  onNewChat,
  collapsed,
}: TopicSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [masterTopics, setMasterTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTopics = async () => {
    if (hasFetched) return;
    setLoading(true);
    try {
      const response = await topicService.getTopics();
      setMasterTopics(response || []);
      setHasFetched(true);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    fetchTopics();
  };

  const handleEnroll = async (topic: Topic) => {
    setEnrolling(topic.id);
    try {
      await topicService.enrollInTopic(topic.id);
      toast({
        title: "✓ Success",
        description: `Enrolled in ${topic.name}`,
      });
      onTopicAdded(topic.id, topic.name);
      setIsOpen(false);
      setQuery("");
    } catch (error) {
      console.error("Failed to enroll:", error);
      toast({
        title: "Error",
        description: "Failed to enroll in topic",
        variant: "destructive",
      });
    } finally {
      setEnrolling(null);
    }
  };

  const filteredTopics = masterTopics.filter((topic) =>
    topic.name.toLowerCase().includes(query.toLowerCase())
  );

  if (collapsed) {
    return (
      <button
        onClick={() => {
          // If collapsed, maybe expand sidebar or show a tooltip?
          // For now, let's just show the search icon
        }}
        className="w-full flex items-center justify-center py-2 text-gray-500 hover:bg-gray-200 rounded-md transition"
        title="Expand sidebar to search topics"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search & add topics..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--fg-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all placeholder:text-[var(--fg-muted)]"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-[var(--fg-muted)]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="py-1">
              {/* New Chat Option */}
              <button
                onClick={() => {
                  onNewChat();
                  setIsOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--bg-input)] transition-colors text-[var(--accent)] font-medium border-b border-[var(--border-default)]"
              >
                <span className="text-lg">✨</span>
                <span>New Chat</span>
              </button>

              {filteredTopics.length === 0 ? (
                <div className="p-3 text-sm text-[var(--fg-muted)] text-center">
                  {query ? "No matching topics found" : "Type to search topics"}
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleEnroll(topic)}
                    disabled={!!enrolling}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-[var(--bg-input)] transition-colors disabled:opacity-50 text-[var(--fg-default)]"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-lg flex-shrink-0">
                        {topic.iconUrl ? (
                          <img
                            src={topic.iconUrl}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          "📚"
                        )}
                      </span>
                      <span className="truncate font-medium text-[var(--fg-default)]">
                        {topic.name}
                      </span>
                    </div>
                    {enrolling === topic.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
                    ) : (
                      <Plus className="w-3 h-3 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
