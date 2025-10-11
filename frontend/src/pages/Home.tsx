import ChatContainer from "../components/Chat/ChatContainer";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useLearning } from "../hooks/useLearning";

const Home = () => {
  const learning = useLearning();

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh">
        <Sidebar
          collapsedInitially={false}
          topics={learning.state.topics}
          topicProgressMap={learning.topicProgressMap}
          selection={learning.state.selection}
          onSelectTopic={learning.selectTopic}
          onSelectSubtopic={learning.selectSubtopic}
          onAddTopic={learning.addTopic}
          loading={learning.loading}
        />
        <div className="flex flex-1 flex-col">
          <Navbar breadcrumb={learning.breadcrumb} />
          <ChatContainer />
        </div>
      </div>
    </div>
  );
};

export default Home;
