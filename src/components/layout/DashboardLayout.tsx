
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Video,
  Camera,
  Dumbbell,
  Calculator,
  Utensils,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/workouts", label: "Workout Tutorials", icon: Video },
    { path: "/live-tracker", label: "Live Workout Tracker", icon: Camera },
    { path: "/workout-plan", label: "Custom Workout Plan", icon: Dumbbell },
    { path: "/calories", label: "Calories Calculator", icon: Calculator },
    { path: "/diet-plan", label: "Custom Diet Plan", icon: Utensils },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-fitness-background overflow-hidden">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden text-white bg-fitness-dark-gray p-2 rounded-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 transform md:relative md:translate-x-0 z-40 w-64 bg-fitness-black border-r border-fitness-dark-gray transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6">
            <Link to="/dashboard" className="text-2xl font-bold">
              <span className="text-fitness-green">TRAIN</span>
              <span className="text-white">ify</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-fitness-green text-black"
                    : "text-gray-300 hover:bg-fitness-dark-gray hover:text-white"
                )}
                onClick={closeSidebar}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-fitness-dark-gray">
            <div className="flex items-center">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border-2 border-fitness-green object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-fitness-dark-gray flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-fitness-green flex items-center mt-1 hover:underline"
                >
                  <LogOut size={12} className="mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-fitness-background p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
