
import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Calendar, Activity, ChevronRight, Trophy, Video, Camera, Dumbbell, Calculator, Utensils } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock data
const workoutHistory = [
  { id: 1, name: "Full Body Workout", date: "Today", duration: "45 min", calories: 320 },
  { id: 2, name: "Upper Body Strength", date: "Yesterday", duration: "30 min", calories: 250 },
  { id: 3, name: "HIIT Cardio", date: "2 days ago", duration: "20 min", calories: 210 },
];

const upcomingWorkouts = [
  { id: 1, name: "Leg Day", scheduled: "Tomorrow, 6:00 PM", duration: "40 min" },
  { id: 2, name: "Core Strength", scheduled: "Thursday, 7:30 AM", duration: "25 min" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">
 Welcome back, {user?.displayName?.split(' ')[0] || user?.email || "Guest"}

</h1>

            <p className="text-fitness-gray mt-1">{formattedDate}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/live-tracker">
              <Button className="bg-fitness-green hover:bg-fitness-green/80 text-black">
                Start Workout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-fitness-card-bg p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-fitness-gray text-sm">Daily Streak</p>
                <h3 className="text-2xl font-bold mt-1">7 Days</h3>
              </div>
              <div className="bg-fitness-green/20 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-fitness-green" />
              </div>
            </div>
            <p className="text-xs text-fitness-gray mt-3">3 days until next achievement</p>
            <Progress value={70} className="h-1.5 mt-1 bg-fitness-dark-gray" />
          </div>
          
          <div className="bg-fitness-card-bg p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-fitness-gray text-sm">This Week</p>
                <h3 className="text-2xl font-bold mt-1">4 Workouts</h3>
              </div>
              <div className="bg-fitness-green/20 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-fitness-green" />
              </div>
            </div>
            <p className="text-xs text-fitness-gray mt-3">2 more to reach your goal</p>
            <Progress value={65} className="h-1.5 mt-1 bg-fitness-dark-gray" />
          </div>
          
          <div className="bg-fitness-card-bg p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-fitness-gray text-sm">Total Time</p>
                <h3 className="text-2xl font-bold mt-1">3h 45m</h3>
              </div>
              <div className="bg-fitness-green/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-fitness-green" />
              </div>
            </div>
            <p className="text-xs text-fitness-gray mt-3">This week</p>
            <Progress value={75} className="h-1.5 mt-1 bg-fitness-dark-gray" />
          </div>
          
          <div className="bg-fitness-card-bg p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-fitness-gray text-sm">Calories Burned</p>
                <h3 className="text-2xl font-bold mt-1">2,340</h3>
              </div>
              <div className="bg-fitness-green/20 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-fitness-green" />
              </div>
            </div>
            <p className="text-xs text-fitness-gray mt-3">This week</p>
            <Progress value={60} className="h-1.5 mt-1 bg-fitness-dark-gray" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link to="/workouts" className="bg-fitness-card-bg p-6 rounded-xl hover:bg-fitness-dark-gray transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-fitness-green/20 flex items-center justify-center mb-3">
                <Video className="h-6 w-6 text-fitness-green" />
              </div>
              <h3 className="font-medium">Workout Tutorials</h3>
              <p className="text-xs text-fitness-gray mt-1">Access 100+ videos</p>
            </div>
          </Link>
          
          <Link to="/live-tracker" className="bg-fitness-card-bg p-6 rounded-xl hover:bg-fitness-dark-gray transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-fitness-green/20 flex items-center justify-center mb-3">
                <Camera className="h-6 w-6 text-fitness-green" />
              </div>
              <h3 className="font-medium">Live Tracker</h3>
              <p className="text-xs text-fitness-gray mt-1">AI-powered form tracking</p>
            </div>
          </Link>
          
          <Link to="/workout-plan" className="bg-fitness-card-bg p-6 rounded-xl hover:bg-fitness-dark-gray transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-fitness-green/20 flex items-center justify-center mb-3">
                <Dumbbell className="h-6 w-6 text-fitness-green" />
              </div>
              <h3 className="font-medium">Custom Workouts</h3>
              <p className="text-xs text-fitness-gray mt-1">Personalized plans</p>
            </div>
          </Link>
          
          <Link to="/calories" className="bg-fitness-card-bg p-6 rounded-xl hover:bg-fitness-dark-gray transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-fitness-green/20 flex items-center justify-center mb-3">
                <Calculator className="h-6 w-6 text-fitness-green" />
              </div>
              <h3 className="font-medium">Calorie Counter</h3>
              <p className="text-xs text-fitness-gray mt-1">Track your nutrition</p>
            </div>
          </Link>
          
          <Link to="/diet-plan" className="bg-fitness-card-bg p-6 rounded-xl hover:bg-fitness-dark-gray transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-fitness-green/20 flex items-center justify-center mb-3">
                <Utensils className="h-6 w-6 text-fitness-green" />
              </div>
              <h3 className="font-medium">Diet Plan</h3>
              <p className="text-xs text-fitness-gray mt-1">Customized nutrition</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <div className="bg-fitness-card-bg rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Workouts</h2>
              <Link to="/workouts" className="text-fitness-green text-sm flex items-center hover:underline">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {workoutHistory.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 bg-fitness-dark-gray rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                      <Activity className="h-5 w-5 text-fitness-green" />
                    </div>
                    <div>
                      <h3 className="font-medium">{workout.name}</h3>
                      <p className="text-xs text-fitness-gray mt-0.5">{workout.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{workout.duration}</div>
                    <div className="text-xs text-fitness-gray">{workout.calories} cal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Workouts */}
          <div className="bg-fitness-card-bg rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Upcoming Workouts</h2>
              <Link to="/workout-plan" className="text-fitness-green text-sm flex items-center hover:underline">
                Plan
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 bg-fitness-dark-gray rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                      <Calendar className="h-5 w-5 text-fitness-green" />
                    </div>
                    <div>
                      <h3 className="font-medium">{workout.name}</h3>
                      <p className="text-xs text-fitness-gray mt-0.5">{workout.scheduled}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{workout.duration}</div>
                    <Link to="/live-tracker">
                      <Button variant="outline" size="sm" className="mt-1 text-xs border-fitness-green text-fitness-green hover:bg-fitness-green/10">
                        Start
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 text-center">
                <Link to="/workout-plan">
                  <Button variant="outline" className="w-full border-fitness-dark-gray hover:bg-fitness-dark-gray">
                    Add New Workout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
