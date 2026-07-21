
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, displayNameOf } from "@/hooks/useProfile";
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
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Previously fire-and-forget: the toast and redirect ran before signOut
  // resolved, so a failed logout still claimed success.
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="flex h-[100dvh] overflow-hidden bg-fitness-background">
      {/* Mobile menu button */}
      <button
        className="fixed left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] z-50 rounded-lg border border-white/10 bg-fitness-card-bg/90 p-2 text-white backdrop-blur transition-colors hover:border-fitness-green/40 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] transform flex-col border-r border-white/[0.06] bg-sidebar pt-safe pb-safe pl-safe transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="px-6 py-7">
          <Link to="/dashboard" className="text-2xl font-extrabold tracking-tight">
            <span className="text-fitness-green">TRAIN</span>
            <span className="text-white">ify</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-fitness-gray/70">
            Menu
          </p>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group relative flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-fitness-green/12 text-white"
                    : "text-fitness-gray hover:bg-white/[0.04] hover:text-white"
                )}
                onClick={closeSidebar}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-fitness-green" />
                )}
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    active ? "text-fitness-green" : "text-fitness-gray group-hover:text-white"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-fitness-green object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fitness-dark-gray ring-1 ring-white/10">
                <User size={18} className="text-fitness-gray" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {displayNameOf(profile, user?.email)}
              </p>
              <button
                onClick={handleLogout}
                className="mt-0.5 flex items-center text-xs text-fitness-gray transition-colors hover:text-fitness-green"
              >
                <LogOut size={12} className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      {/* Mobile: top padding clears the safe-area inset plus the floating menu
          button so content never hides under the status bar / notch. Desktop
          resets to a uniform pad since the sidebar is static there. */}
      <main className="flex-1 overflow-y-auto bg-fitness-background px-5 py-6 pt-[calc(env(safe-area-inset-top)_+_4rem)] md:p-8 md:pt-8">
        <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
