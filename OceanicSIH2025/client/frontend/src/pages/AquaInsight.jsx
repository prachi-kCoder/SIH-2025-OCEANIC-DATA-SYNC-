import IndobisDashboard from "../Ai-Model/IndobisDashboard";

export default function AquaInsights() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      {/* Centered Box */}
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">
          🌊 Aqua Insights – Model Dashboard
        </h2>

        {/* Dashboard inside box */}
        <IndobisDashboard />
      </div>
    </div>
  );
}

