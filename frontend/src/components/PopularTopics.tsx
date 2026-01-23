import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { topicService } from "@/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PopularTopic {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  learnerCount: number;
  category: string;
}

interface PopularTopicsProps {
  onSelectTopic: (topicId: number, topicName: string) => void;
  className?: string;
}

export const PopularTopics = ({
  onSelectTopic,
  className,
}: PopularTopicsProps) => {
  const [topics, setTopics] = useState<PopularTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularTopics = async () => {
      try {
        const data = await topicService.getPopularTopics();
        setTopics(data);
      } catch (error) {
        console.error("Failed to fetch popular topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularTopics();
  }, []);

  if (loading) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-[var(--bg-elevated)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[var(--accent)]" />
        <h2 className="text-xl font-semibold">Popular Learning Paths</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer hover:border-[var(--accent)] transition-all hover:shadow-lg group bg-[var(--bg-elevated)] border-[var(--border-default)]"
              onClick={() => onSelectTopic(topic.id, topic.name)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {topic.iconUrl ? (
                      <img
                        src={topic.iconUrl}
                        alt={topic.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      "📚"
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {topic.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {topic.category || "General"}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[var(--bg-default)] text-[var(--fg-muted)]"
                >
                  {topic.learnerCount} learners
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--fg-muted)] line-clamp-2">
                  {topic.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
