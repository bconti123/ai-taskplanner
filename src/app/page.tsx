import TaskDashboard from "@/components/TaskDashboard";
import AiBox from "@/components/AiBox";

const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <TaskDashboard />
        <AiBox />
      </div>
    </main>
  );
};

export default HomePage;