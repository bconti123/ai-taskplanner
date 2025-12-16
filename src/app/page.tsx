import TaskDashboard from "@/components/TaskDashboard";

const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <TaskDashboard />
      </div>
    </main>
  );
};

export default HomePage;