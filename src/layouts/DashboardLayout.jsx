import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/TopBar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 overflow-hidden">
      <Sidebar />

      <div className="flex flex-col md:ml-64 min-h-screen">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

