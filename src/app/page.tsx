import TaskDashboard from "@/components/TaskDashboard";
import AiChat from "@/components/AiChat";

const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <TaskDashboard />
        <AiChat />
      </div>
    </main>
  );
};

export default HomePage;