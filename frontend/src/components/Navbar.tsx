import type { Breadcrumb } from "../utils/types";

export default function Navbar({ breadcrumb }: { breadcrumb: Breadcrumb }) {
  return (
    <div className="w-full border-b border-default bg-white/70 backdrop-blur px-4 sm:px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {breadcrumb.topicName && (
            <span className="text-gray-700 font-medium">
              {breadcrumb.topicName}
            </span>
          )}
          {breadcrumb.topicName && breadcrumb.subtopicName && (
            <span className="mx-2 text-gray-400">→</span>
          )}
          {breadcrumb.subtopicName && (
            <span className="text-gray-600">{breadcrumb.subtopicName}</span>
          )}
        </div>
      </div>
    </div>
  );
}
