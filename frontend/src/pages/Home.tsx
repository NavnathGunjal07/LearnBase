import { useState } from "react";
import { Menu } from "lucide-react";
import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";
import { useChat } from "../hooks/useChat";
import { useVisualizer } from "../hooks/useVisualizer";
import ConceptVisualizer from "../components/Visualizer/ConceptVisualizer";

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

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh">
        <div className="flex-shrink-0 transition-all duration-300 ease-in-out">
          <Sidebar
            chatHook={chatHook}
            mobileIsOpen={mobileMenuOpen}
            setMobileIsOpen={setMobileMenuOpen}
          />
        </div>
        <div className="flex-1 flex flex-col w-full relative">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center p-3 border-b border-default bg-[var(--bg-default)]">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md hover:bg-[color:var(--bg-input)] transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="ml-2 font-semibold">LearnBase</span>
          </div>
          <ChatContainer chatHook={chatHook} />
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
