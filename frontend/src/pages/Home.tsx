import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";
import { useChat } from "../hooks/useChat";

const Home = () => {
  const chatHook = useChat();

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh px-4">
        <div className="w-64 flex-shrink-0">
          <Sidebar chatHook={chatHook} />
        </div>
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4">
          {/* <Navbar breadcrumb={""} /> */}
          <ChatContainer chatHook={chatHook} />
        </div>
      </div>
    </div>
  );
};

export default Home;
