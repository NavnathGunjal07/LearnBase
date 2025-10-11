import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";

const Home = () => {
 

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh">
        <Sidebar/>
        <div className="flex flex-1 flex-col">
          {/* <Navbar breadcrumb={""} /> */}
          <ChatContainer />
        </div>
      </div>
    </div>
  );
};

export default Home;
