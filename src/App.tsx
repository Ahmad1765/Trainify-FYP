import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFound from "./pages/NotFound";

// Protected pages
import Dashboard from "./pages/dashboard/Dashboard";
import WorkoutTutorials from "./pages/dashboard/WorkoutTutorials";
import LiveWorkoutTracker from "./pages/dashboard/LiveWorkoutTracker";
import CustomWorkoutPlan from "./pages/dashboard/CustomWorkoutPlan";
import CaloriesCalculator from "./pages/dashboard/CaloriesCalculator";
import CustomDietPlan from "./pages/dashboard/CustomDietPlan";
import Profile from "./pages/dashboard/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/workouts" element={<ProtectedRoute><WorkoutTutorials /></ProtectedRoute>} />
            <Route path="/live-tracker" element={<ProtectedRoute><LiveWorkoutTracker /></ProtectedRoute>} />
            <Route path="/workout-plan" element={<ProtectedRoute><CustomWorkoutPlan /></ProtectedRoute>} />
            <Route path="/calories" element={<ProtectedRoute><CaloriesCalculator /></ProtectedRoute>} />
            <Route path="/diet-plan" element={<ProtectedRoute><CustomDietPlan /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
