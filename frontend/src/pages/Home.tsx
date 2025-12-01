import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";
import { useChat } from "../hooks/useChat";

const Home = () => {
  const chatHook = useChat();

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh">
        <div className="flex-shrink-0 transition-all duration-300 ease-in-out">
          <Sidebar chatHook={chatHook} />
        </div>
        <div className="flex-1 flex flex-col w-full relative">
          {/* <Navbar breadcrumb={""} /> */}
          <ChatContainer chatHook={chatHook} />
        </div>
      </div>
    </div>
  );
};

export default Home;
