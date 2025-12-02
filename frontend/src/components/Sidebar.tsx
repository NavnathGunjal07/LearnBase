import { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  PlusCircle,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TopicSelectionModal from "./TopicSelectionModal";
import TopicSkeleton from "./TopicSkeleton";
import type { Subtopic, Topic } from "../utils/types";
import { useLearning } from "@/hooks/useLearning";
import { CircularProgress } from "./CircularProgress";
import { LinearProgress } from "./LinearProgress";
import { APP_NAME } from "../utils/constants";
import Avatar from "./Chat/Avatar";

// Helper function to get icon for topic
function getTopicIcon(topicName: string): string {
  const iconMap: Record<string, string> = {
    javascript: "🟨",
    python: "🐍",
    react: "⚛️",
    "node.js": "🟢",
    nodejs: "🟢",
    typescript: "🔷",
    "vue.js": "💚",
    vue: "💚",
    angular: "🅰️",
    sql: "🗄️",
    java: "☕",
    "c++": "⚙️",
    go: "🐹",
    rust: "🦀",
    php: "🐘",
    ruby: "💎",
    swift: "🦅",
    kotlin: "🎯",
  };

  const key = topicName.toLowerCase().replace(/\s+/g, "");
  return iconMap[key] || "📚";
}

interface SidebarProps {
  chatHook: ReturnType<typeof import("../hooks/useChat").useChat>;
  mobileIsOpen?: boolean;
  setMobileIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({
  chatHook,
  mobileIsOpen = false,
  setMobileIsOpen,
}: SidebarProps) {
  const { logout } = useAuth();
  const learning = useLearning();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { sendTopicSelection, lastProgressUpdate } = chatHook;

  // Listen for progress updates from chat
  useEffect(() => {
    if (lastProgressUpdate) {
      learning.refreshTopics();
    }
  }, [lastProgressUpdate]);

  const groupedSubtopicsByLevel = useMemo(() => {
    const map: Record<
      string,
      {
        basic: (typeof learning.state.topics)[number]["subtopics"];
        intermediate: (typeof learning.state.topics)[number]["subtopics"];
        advanced: (typeof learning.state.topics)[number]["subtopics"];
      }
    > = {};
    learning.state.topics.forEach((t: Topic) => {
      map[t.id] = { basic: [], intermediate: [], advanced: [] } as any;
      t.subtopics.forEach((s: Subtopic) => {
        if (s.difficultyLevel === "basic") {
          map[t.id].basic.push(s);
        } else if (s.difficultyLevel === "intermediate") {
          map[t.id].intermediate.push(s);
        } else {
          map[t.id].advanced.push(s);
        }
      });
    });
    return map;
  }, [learning.state.topics]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileIsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileIsOpen?.(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-gray-100 border-r border-default text-[var(--fg-default)] transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:h-full md:flex-col
        ${mobileIsOpen ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "md:w-16" : "md:w-64 lg:w-72 xl:w-80"}
        w-64 flex flex-col h-full`}
      >
        <div className="flex items-center justify-between p-3 border-b border-default">
          <div
            className={`flex items-center transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {!collapsed && (
              <div className="mr-3">
                <Avatar size="small" mood="happy" />
              </div>
            )}
            <div
              className={`text-sm font-semibold ${collapsed ? "sr-only" : ""}`}
            >
              {APP_NAME}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition"
              onClick={() => setMobileIsOpen?.(false)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={learning.loading}
              className={`w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm bg-white hover:bg-gray-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                collapsed ? "px-0" : ""
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className={`${collapsed ? "sr-only" : ""}`}>New Topic</span>
            </button>
          </div>

          {learning.loading && !collapsed ? (
            <TopicSkeleton />
          ) : learning.state.topics.length === 0 && !collapsed ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-sm text-gray-600 mb-2">No topics yet</p>
              <p className="text-xs text-gray-500">
                Click "New Topic" to get started
              </p>
            </div>
          ) : (
            <>
              {learning.state.topics.map((t: Topic) => {
                const isExpanded = expanded[t.id] ?? true;
                const grouped = groupedSubtopicsByLevel[t.id] || {
                  basic: [],
                  intermediate: [],
                  advanced: [],
                };
                return (
                  <div key={t.id} className="">
                    <button
                      onClick={() => {
                        learning.selectTopic(t.id);
                        setExpanded((prev) => ({
                          ...prev,
                          [t.id]: !(prev[t.id] ?? true),
                        }));
                      }}
                      className={`group relative w-full flex items-center ${
                        collapsed ? "justify-center px-0" : "px-3"
                      } py-2 text-sm transition cursor-pointer ${
                        learning.state.selection.topicId === t.id
                          ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <CircularProgress
                          value={learning.topicProgressMap[t.id] ?? 0}
                          icon={t.iconUrl || getTopicIcon(t.name)}
                          size={40}
                          strokeWidth={3}
                          showTooltip={false}
                        />
                        <div
                          className={`flex-1 text-left ${
                            collapsed ? "sr-only" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-800 font-medium block">
                              {t.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(learning.topicProgressMap[t.id] ?? 0)}
                              %
                            </span>
                          </div>
                          <div className="w-full mt-1">
                            <LinearProgress
                              value={learning.topicProgressMap[t.id] ?? 0}
                              height={2}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {!collapsed && isExpanded && (
                      <div className="px-4 pb-2">
                        {(["basic", "intermediate", "advanced"] as const).map(
                          (lvl) => (
                            <div key={lvl} className="mt-4">
                              <div className="text-xs uppercase text-gray-500 mb-2">
                                {lvl === "basic"
                                  ? "Basic"
                                  : lvl === "intermediate"
                                  ? "Intermediate"
                                  : "Advanced"}
                              </div>
                              <div className="space-y-1">
                                {grouped[lvl].map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      learning.selectSubtopic(t.id, s.id);
                                      sendTopicSelection(
                                        t.name,
                                        s.title,
                                        parseInt(t.id),
                                        parseInt(s.id)
                                      );
                                    }}
                                    className={`w-full flex flex-col items-start rounded-md px-2 py-2 text-sm transition cursor-pointer ${
                                      learning.state.selection.subtopicId ===
                                      s.id
                                        ? "bg-blue-100 ring-1 ring-blue-200"
                                        : "hover:bg-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full mb-1">
                                      <span className="text-gray-600">
                                        {s.title}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {Math.round(s.progress)}%
                                      </span>
                                    </div>
                                    <LinearProgress
                                      value={s.progress}
                                      height={3}
                                    />
                                  </button>
                                ))}
                                {grouped[lvl].length === 0 && (
                                  <div className="text-xs text-gray-400">
                                    No subtopics
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-3 border-t border-default">
          <div className="flex items-center justify-center gap-2 overflow-visible">
            {(collapsed
              ? [{ icon: Settings, label: "Settings", onClick: () => {} }]
              : [
                  { icon: User, label: "Account", onClick: () => {} },
                  { icon: Settings, label: "Settings", onClick: () => {} },
                  { icon: LogOut, label: "Logout", onClick: logout },
                ]
            ).map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
              >
                <Icon className="w-5 h-5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 rounded bg-[var(--bg-input)] text-xs text-[var(--fg-default)] opacity-0 group-hover:opacity-100 transition">
                  {label}
                </span>
              </button>
            ))}
            {!collapsed && (
              <button
                aria-label="Toggle theme"
                onClick={() => {
                  const next = theme === "dark" ? "light" : "dark";
                  setTheme(next);
                  const root = document.documentElement;
                  if (next === "light")
                    root.setAttribute("data-theme", "light");
                  else root.removeAttribute("data-theme");
                }}
                className="group relative p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition flex-none"
              >
                <Palette className="w-5 h-5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 rounded bg-[var(--bg-input)] text-xs text-[var(--fg-default)] opacity-0 group-hover:opacity-100 transition">
                  {theme === "dark" ? "Light theme" : "Dark theme"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Topic Selection Modal */}
        <TopicSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTopicAdded={() => {
            setIsModalOpen(false);
            learning.addTopic();
          }}
        />
      </aside>
    </>
  );
}
