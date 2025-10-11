import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Palette, PlusCircle, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopicSelectionModal from './TopicSelectionModal';
import TopicSkeleton from './TopicSkeleton';
import type { SelectionState, Subtopic, Topic } from '../utils/types';
import { useLearning } from '@/hooks/useLearning';

// Helper function to get icon for topic
function getTopicIcon(topicName: string): string {
  const iconMap: Record<string, string> = {
    'javascript': '🟨',
    'python': '🐍',
    'react': '⚛️',
    'node.js': '🟢',
    'nodejs': '🟢',
    'typescript': '🔷',
    'vue.js': '💚',
    'vue': '💚',
    'angular': '🅰️',
    'sql': '🗄️',
    'java': '☕',
    'c++': '⚙️',
    'go': '🐹',
    'rust': '🦀',
    'php': '🐘',
    'ruby': '💎',
    'swift': '🦅',
    'kotlin': '🎯',
  };

  const key = topicName.toLowerCase().replace(/\s+/g, '');
  return iconMap[key] || '📚';
}

function ProgressRing({
  value,
  size = 40,
  stroke = 3,
  icon = '📚',
  showTooltip = true
}: {
  value: number;
  size?: number;
  stroke?: number;
  icon?: string;
  showTooltip?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative group flex-none">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#14b8a6"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      {/* Icon in center */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        {icon.startsWith('http') ? (
          <img
            src={icon}
            alt="Topic icon"
            className="object-contain"
            style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.textContent = '📚';
            }}
          />
        ) : (
          <span style={{ fontSize: `${size * 0.5}px` }}>{icon}</span>
        )}
      </div>
      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition z-10">
          {value}% Complete
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-gray-800"></div>
        </div>
      )}

    </div>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const learning = useLearning();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupedSubtopicsByLevel = useMemo(() => {
    const map: Record<string, { basic: typeof learning.state.topics[number]['subtopics']; intermediate: typeof learning.state.topics[number]['subtopics']; advanced: typeof learning.state.topics[number]['subtopics'] }> = {};
    learning.state.topics.forEach((t: Topic) => {
      map[t.id] = { basic: [], intermediate: [], advanced: [] } as any;
      t.subtopics.forEach((s: Subtopic) => {
        if (s.difficultyLevel === 'basic') {
          map[t.id].basic.push(s);
        } else if (s.difficultyLevel === 'intermediate') {
          map[t.id].intermediate.push(s);
        } else {
          map[t.id].advanced.push(s);
        }
      });
    });
    return map;
  }, [learning.state.topics]);

  return (
    <aside className={`hidden md:flex ${collapsed ? 'w-16' : 'md:w-64 lg:w-72 xl:w-80'} flex-col bg-gray-100 border-r border-default text-[var(--fg-default)]`}>
      <div className="flex items-center justify-between p-3 border-b border-default">
        <div className={`text-sm font-semibold transition ${collapsed ? 'sr-only' : ''}`}>LearnBase</div>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={learning.loading}
            className={`w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm bg-white hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed ${collapsed ? 'px-0' : ''}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className={`${collapsed ? 'sr-only' : ''}`}>New Topic</span>
          </button>
        </div>

        {learning.loading && !collapsed ? (
          <TopicSkeleton />
        ) : learning.state.topics.length === 0 && !collapsed ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm text-gray-600 mb-2">No topics yet</p>
            <p className="text-xs text-gray-500">Click "New Topic" to get started</p>
          </div>
        ) : (
          < >
            {learning.state.topics.map((t: Topic) => {
              const isExpanded = expanded[t.id] ?? true;
              const isSelected = learning.state.selection.topicId === t.id;
              const grouped = groupedSubtopicsByLevel[t.id] || { basic: [], intermediate: [], advanced: [] };
              return (
                <div key={t.id} className="">
                  <button
                    onClick={() => {
                      learning.selectTopic(t.id);
                      setExpanded((prev) => ({ ...prev, [t.id]: !(prev[t.id] ?? true) }));
                    }}
                    className={`group relative w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm hover:bg-gray-200 transition`}
                  >
                    <div className="flex items-center gap-3">
                      <ProgressRing
                        value={learning.topicProgressMap[t.id] ?? 0}
                        icon={t.iconUrl || getTopicIcon(t.name)}
                        size={40}
                        stroke={3}
                      />
                      <span className={`${collapsed ? 'sr-only' : 'text-gray-800 font-medium'}`}>{t.name}</span>
                    </div>
                  </button>

                  {!collapsed && isExpanded && (
                    <div className="px-4 pb-2">
                      {(['basic', 'intermediate', 'advanced'] as const).map((lvl) => (
                        <div key={lvl} className="mt-4">
                          <div className="text-xs uppercase text-gray-500 mb-2">
                            {lvl === 'basic' ? 'Basic' : lvl === 'intermediate' ? 'Intermediate' : 'Advanced'}
                          </div>
                          <div className="space-y-1">
                            {grouped[lvl].map((s) => (
                              <button
                                key={s.id}
                                onClick={() => learning.selectSubtopic(t.id, s.id)}
                                className={`w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-gray-200 transition ${isSelected && learning.state.selection.subtopicId === s.id ? 'bg-white' : ''
                                  }`}
                              >
                                <span className="text-gray-600">{s.title}</span>
                                <span className="text-xs">
                                  {s.progress >= 100 ? '✅' : s.progress >= 50 ? '🟡' : '🟢'}
                                </span>
                              </button>
                            ))}
                            {grouped[lvl].length === 0 && (
                              <div className="text-xs text-gray-400">No subtopics</div>
                            )}
                          </div>
                        </div>
                      ))}
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
          {(
            (collapsed
              ? [{ icon: Settings, label: 'Settings', onClick: () => { } }]
              : [
                { icon: User, label: 'Account', onClick: () => { } },
                { icon: Settings, label: 'Settings', onClick: () => { } },
                { icon: LogOut, label: 'Logout', onClick: logout },
              ])
          ).map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="group relative p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition flex-none"
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
                const next = theme === 'dark' ? 'light' : 'dark';
                setTheme(next);
                const root = document.documentElement;
                if (next === 'light') root.setAttribute('data-theme', 'light');
                else root.removeAttribute('data-theme');
              }}
              className="group relative p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition flex-none"
            >
              <Palette className="w-5 h-5" />
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 rounded bg-[var(--bg-input)] text-xs text-[var(--fg-default)] opacity-0 group-hover:opacity-100 transition">
                {theme === 'dark' ? 'Light theme' : 'Dark theme'}
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
  );
}
