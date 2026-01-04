import { useState } from "react";
import { Menu } from "lucide-react";
import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";
import { useChat } from "../hooks/useChat";
import { useVisualizer } from "../hooks/useVisualizer";
import ConceptVisualizer from "../components/Visualizer/ConceptVisualizer";
import { CodingWorkspace } from "../components/CodingWorkspace/CodingWorkspace";

const Home = () => {
  const {
    isOpen: isVisualizerOpen,
    visualizerData,
    openVisualizer,
    closeVisualizer,
  } = useVisualizer();

  const chatHook = useChat({
    onVisualizer: openVisualizer,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceViewMode, setWorkspaceViewMode] = useState<
    "fullscreen" | "split"
  >("split");

  const isCodingOpen = chatHook.codingWorkspace.isOpen;

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)] overflow-hidden">
      <div className="flex h-dvh max-h-dvh">
        {/* Sidebar - Automatically collapse/hide when coding workspace is active */}
        <div
          className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
            isCodingOpen
              ? "w-0 -ml-[250px] md:ml-0 md:w-0 overflow-hidden opacity-0"
              : "w-auto opacity-100"
          }`}
        >
          <Sidebar
            chatHook={chatHook}
            mobileIsOpen={mobileMenuOpen}
            setMobileIsOpen={setMobileMenuOpen}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex w-full relative h-full">
          {/* Chat Container Column */}
          <div
            className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
              isCodingOpen
                ? workspaceViewMode === "split"
                  ? "w-[30%] border-r min-w-[320px] hidden md:flex"
                  : "w-0 hidden"
                : "w-full"
            }`}
          >
            {/* Mobile Header (Only show when sidebar is accessible/coding is closed) */}
            {!isCodingOpen && (
              <div className="md:hidden flex items-center p-3 border-b border-default bg-[var(--bg-default)] shrink-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 -ml-2 rounded-md hover:bg-[color:var(--bg-input)] transition"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span className="ml-2 font-semibold">LearnBase</span>
              </div>
            )}

            <ChatContainer chatHook={chatHook} />
          </div>

          {/* Coding Workspace Column / Overlay */}
          {isCodingOpen && (
            <div
              className={`${
                workspaceViewMode === "split" ? "flex-1 min-w-0" : ""
              }`}
            >
              <CodingWorkspace
                isOpen={isCodingOpen}
                challenge={chatHook.codingWorkspace.challenge}
                executionResult={chatHook.codingWorkspace.executionResult}
                onClose={() =>
                  chatHook.setCodingWorkspace((prev) => ({
                    ...prev,
                    isOpen: false,
                  }))
                }
                onRunCode={chatHook.submitCode}
                viewMode={workspaceViewMode}
                onToggleViewMode={() =>
                  setWorkspaceViewMode((prev) =>
                    prev === "split" ? "fullscreen" : "split"
                  )
                }
              />
            </div>
          )}

          <ConceptVisualizer
            isOpen={isVisualizerOpen}
            data={visualizerData}
            onClose={closeVisualizer}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
