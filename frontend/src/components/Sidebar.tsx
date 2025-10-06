import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Palette, PlusCircle, Settings, LogOut, User } from 'lucide-react';
import type { SelectionState, Topic } from '../utils/types';

function ProgressRing({ value, size = 20, stroke = 3 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-none">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
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
      />
    </svg>
  );
}

export default function Sidebar({
  collapsedInitially = false,
  topics,
  topicProgressMap,
  selection,
  onSelectTopic,
  onSelectSubtopic,
  onAddTopic,
}: {
  collapsedInitially?: boolean;
  topics: Topic[];
  topicProgressMap: Record<string, number>;
  selection: SelectionState;
  onSelectTopic: (topicId: string) => void;
  onSelectSubtopic: (topicId: string, subtopicId: string) => void;
  onAddTopic: (name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(collapsedInitially);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groupedSubtopicsByLevel = useMemo(() => {
    const map: Record<string, { basic: typeof topics[number]['subtopics']; intermediate: typeof topics[number]['subtopics']; advanced: typeof topics[number]['subtopics'] }> = {};
    topics.forEach((t) => {
      map[t.id] = { basic: [], intermediate: [], advanced: [] } as any;
      t.subtopics.forEach((s) => {
        map[t.id][s.level].push(s);
      });
    });
    return map;
  }, [topics]);

  return (
    <aside className={`hidden md:flex ${collapsed ? 'w-16' : 'md:w-64 lg:w-72 xl:w-80'} flex-col bg-gray-100 border-r border-default text-[var(--fg-default)]`}>
      <div className="flex items-center justify-between p-3 border-b border-default">
        <div className={`text-base font-semibold transition ${collapsed ? 'sr-only' : ''}`}>Learnbase</div>
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
            onClick={() => {
              const name = prompt('New topic name');
              if (name) onAddTopic(name);
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm bg-white hover:bg-gray-200 transition ${collapsed ? 'px-0' : ''}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className={`${collapsed ? 'sr-only' : ''}`}>New Topic</span>
          </button>
        </div>

        {topics.map((t) => {
          const isExpanded = expanded[t.id] ?? true;
          const isSelected = selection.topicId === t.id;
          const grouped = groupedSubtopicsByLevel[t.id] || { basic: [], intermediate: [], advanced: [] };
          return (
            <div key={t.id} className="">
              <button
                onClick={() => {
                  onSelectTopic(t.id);
                  setExpanded((prev) => ({ ...prev, [t.id]: !(prev[t.id] ?? true) }));
                }}
                className={`group relative w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm hover:bg-gray-200 transition`}
              >
                <div className="flex items-center gap-2">
                  <ProgressRing value={topicProgressMap[t.id] ?? 0} />
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
                            onClick={() => onSelectSubtopic(t.id, s.id)}
                            className={`w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-gray-200 transition ${
                              isSelected && selection.subtopicId === s.id ? 'bg-white' : ''
                            }`}
                          >
                            <span className="text-gray-600">{s.name}</span>
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
      </div>

      <div className="p-3 border-t border-default">
        <div className="flex items-center justify-center gap-2 overflow-visible">
          {(
            (collapsed
              ? [{ icon: Settings, label: 'Settings' }]
              : [
                  { icon: User, label: 'Account' },
                  { icon: Settings, label: 'Settings' },
                  { icon: LogOut, label: 'Logout' },
                ])
          ).map(({ icon: Icon, label }) => (
            <button key={label} className="group relative p-2 rounded-md hover:bg-[color:var(--bg-input)/0.9] transition flex-none">
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
    </aside>
  );
}
