import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";

const Home = () => {
 

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh px-4">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4">
          {/* <Navbar breadcrumb={""} /> */}
          <ChatContainer />
        </div>
      </div>
    </div>
  );
};

export default Home;
