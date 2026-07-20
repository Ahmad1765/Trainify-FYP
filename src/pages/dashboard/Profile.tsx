
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/use-toast";
import { useProfile, useUpdateProfile, useUploadAvatar, displayNameOf } from "@/hooks/useProfile";
import { useWorkoutSessions, useWorkoutStats } from "@/hooks/useWorkoutSessions";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Upload, 
  Bell, 
  Shield, 
  Clock, 
  Calendar, 
  Award,
  Dumbbell,
  Activity,
  BarChart,
  BarChart2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

const Profile = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: sessions = [] } = useWorkoutSessions();
  const { stats: workoutStats } = useWorkoutStats();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: user?.email || "",
    bio: "",
    height: "",
    weight: "",
    age: "",
  });

  // The profile arrives asynchronously, so seed the form once it lands (and
  // again if it changes) rather than only at first render.
  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name: profile.display_name ?? "",
      email: user?.email ?? "",
      bio: profile.bio ?? "",
      height: profile.height_cm != null ? String(profile.height_cm) : "",
      weight: profile.weight_kg != null ? String(profile.weight_kg) : "",
      age: profile.age != null ? String(profile.age) : "",
    });
  }, [profile, user?.email]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        display_name: profileForm.name.trim() || null,
        bio: profileForm.bio.trim() || null,
        height_cm: profileForm.height ? Number(profileForm.height) : null,
        weight_kg: profileForm.weight ? Number(profileForm.weight) : null,
        age: profileForm.age ? Number(profileForm.age) : null,
      });
      setIsEditing(false);
      toast({ title: "Profile saved", description: "Your changes have been saved." });
    } catch (error) {
      toast({
        title: "Could not save profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast({ title: "Photo updated" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      e.target.value = ""; // allow re-picking the same file
    }
  };
  
  // Real statistics, aggregated from the workout_sessions log.
  const stats = {
    workoutsCompleted: workoutStats.totalWorkouts,
    totalWorkoutTime: formatDuration(workoutStats.totalDurationSec),
    currentStreak: workoutStats.currentStreakDays,
    longestStreak: workoutStats.longestStreakDays,
    totalReps: workoutStats.totalReps,
  };

  // Real workout history from the session log.
  const workoutHistory = sessions.map((s) => ({
    date: s.created_at,
    name: s.exercise_name,
    duration: formatDuration(s.duration_sec),
    reps: s.reps,
    form: s.good_form_pct != null ? `${s.good_form_pct}%` : "—",
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-fitness-gray mt-1">
              Manage your account settings and view your progress
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-fitness-card-bg">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="history">Workout History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader className="pb-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="h-32 w-32 rounded-full border-4 border-fitness-green object-cover"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-fitness-dark-gray flex items-center justify-center border-4 border-fitness-green">
                          <User size={64} className="text-fitness-gray" />
                        </div>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        size="icon"
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadAvatar.isPending}
                        aria-label="Upload profile photo"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-fitness-green text-black hover:bg-fitness-green/80"
                      >
                        <Upload size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <CardTitle>{displayNameOf(profile, user?.email)}</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      {user?.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">About Me</h3>
                    <p className="text-sm text-fitness-gray">
                      {profileForm.bio}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-fitness-gray">Height</div>
                      <div className="font-medium">{profileForm.height} cm</div>
                    </div>
                    <div>
                      <div className="text-xs text-fitness-gray">Weight</div>
                      <div className="font-medium">{profileForm.weight} kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-fitness-gray">Age</div>
                      <div className="font-medium">{profileForm.age}</div>
                    </div>
                  </div>
                  
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Current Goal</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Lose Weight</span>
                      <span className="text-xs text-fitness-gray">65% Complete</span>
                    </div>
                    <Progress value={65} className="h-1.5 bg-fitness-black" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Edit Profile Form */}
              <div className="md:col-span-2">
                <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      {isEditing 
                        ? "Update your profile details" 
                        : "View and manage your personal information"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="flex">
                            <div className="bg-fitness-dark-gray border border-r-0 border-fitness-dark-gray rounded-l-md px-3 flex items-center">
                              <User className="h-4 w-4 text-fitness-gray" />
                            </div>
                            <Input
                              id="name"
                              name="name"
                              value={profileForm.name}
                              onChange={handleProfileChange}
                              className="bg-fitness-dark-gray border-fitness-dark-gray rounded-l-none"
                              readOnly={!isEditing}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="flex">
                            <div className="bg-fitness-dark-gray border border-r-0 border-fitness-dark-gray rounded-l-md px-3 flex items-center">
                              <Mail className="h-4 w-4 text-fitness-gray" />
                            </div>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={profileForm.email}
                              onChange={handleProfileChange}
                              className="bg-fitness-dark-gray border-fitness-dark-gray rounded-l-none"
                              readOnly={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          name="bio"
                          rows={3}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          className="w-full bg-fitness-dark-gray border-fitness-dark-gray rounded-md p-3 resize-none"
                          readOnly={!isEditing}
                        />
                      </div>
                      
                      <Separator className="bg-fitness-dark-gray" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            name="height"
                            type="number"
                            value={profileForm.height}
                            onChange={handleProfileChange}
                            className="bg-fitness-dark-gray border-fitness-dark-gray"
                            readOnly={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            name="weight"
                            type="number"
                            value={profileForm.weight}
                            onChange={handleProfileChange}
                            className="bg-fitness-dark-gray border-fitness-dark-gray"
                            readOnly={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            value={profileForm.age}
                            onChange={handleProfileChange}
                            className="bg-fitness-dark-gray border-fitness-dark-gray"
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="border-fitness-dark-gray"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-fitness-green hover:bg-fitness-green/80 text-black"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
                
                {/* Fitness Goals & Achievements */}
                <Card className="bg-fitness-card-bg border-fitness-dark-gray mt-6">
                  <CardHeader>
                    <CardTitle>Fitness Goals & Achievements</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      Track your progress and see what you've accomplished
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Current Goals</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                                <Activity className="h-4 w-4 text-fitness-green" />
                              </div>
                              <div>
                                <div className="font-medium">Lose 5kg</div>
                                <div className="text-xs text-fitness-gray">Target: 70kg</div>
                              </div>
                            </div>
                            <div className="text-sm text-fitness-gray">65%</div>
                          </div>
                          <Progress value={65} className="h-1.5 bg-fitness-black" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                                <Dumbbell className="h-4 w-4 text-fitness-green" />
                              </div>
                              <div>
                                <div className="font-medium">Complete 30 workouts</div>
                                <div className="text-xs text-fitness-gray">Current: 24/30</div>
                              </div>
                            </div>
                            <div className="text-sm text-fitness-gray">80%</div>
                          </div>
                          <Progress value={80} className="h-1.5 bg-fitness-black" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                                <Calendar className="h-4 w-4 text-fitness-green" />
                              </div>
                              <div>
                                <div className="font-medium">21-Day Streak</div>
                                <div className="text-xs text-fitness-gray">Current: 5 days</div>
                              </div>
                            </div>
                            <div className="text-sm text-fitness-gray">24%</div>
                          </div>
                          <Progress value={24} className="h-1.5 bg-fitness-black" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-fitness-dark-gray" />
                    
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium">Recent Achievements</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-fitness-green hover:text-fitness-green/80 hover:bg-transparent"
                        >
                          View All
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-fitness-dark-gray p-3 rounded-lg text-center">
                          <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mx-auto mb-2">
                            <Award className="h-5 w-5 text-fitness-green" />
                          </div>
                          <div className="font-medium text-sm">First Milestone</div>
                          <div className="text-xs text-fitness-gray mt-1">Completed 10 workouts</div>
                        </div>
                        
                        <div className="bg-fitness-dark-gray p-3 rounded-lg text-center">
                          <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mx-auto mb-2">
                            <Activity className="h-5 w-5 text-fitness-green" />
                          </div>
                          <div className="font-medium text-sm">Calorie Crusher</div>
                          <div className="text-xs text-fitness-gray mt-1">Burned 5000+ calories</div>
                        </div>
                        
                        <div className="bg-fitness-dark-gray p-3 rounded-lg text-center">
                          <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mx-auto mb-2">
                            <Clock className="h-5 w-5 text-fitness-green" />
                          </div>
                          <div className="font-medium text-sm">Consistency King</div>
                          <div className="text-xs text-fitness-gray mt-1">7-day streak achieved</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Workout Stats */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader>
                  <CardTitle>Workout Statistics</CardTitle>
                  <CardDescription className="text-fitness-gray">
                    Summary of your fitness activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.workoutsCompleted}</div>
                      <div className="text-xs text-fitness-gray mt-1">Workouts Completed</div>
                    </div>
                    
                    <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.totalWorkoutTime}</div>
                      <div className="text-xs text-fitness-gray mt-1">Total Workout Time</div>
                    </div>
                    
                    <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.currentStreak}</div>
                      <div className="text-xs text-fitness-gray mt-1">Current Streak</div>
                    </div>
                    
                    <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.longestStreak}</div>
                      <div className="text-xs text-fitness-gray mt-1">Longest Streak</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">Total Reps</div>
                      <div className="text-sm font-medium">{stats.totalReps.toLocaleString()}</div>
                    </div>
                    <Progress value={Math.min(100, stats.totalReps / 5)} className="h-1.5 bg-fitness-black" />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">Workout Frequency</div>
                      <div className="text-sm font-medium">4.8/week</div>
                    </div>
                    <Progress value={85} className="h-1.5 bg-fitness-black" />
                  </div>
                </CardContent>
              </Card>

              {/* Workout Distribution */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader>
                  <CardTitle>Workout Distribution</CardTitle>
                  <CardDescription className="text-fitness-gray">
                    Types of workouts you've been focusing on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center h-48">
                    <div className="w-full h-full flex items-center justify-center">
                      <BarChart2 className="h-32 w-32 text-fitness-gray" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-fitness-green mr-2"></div>
                        <div className="text-sm">Strength Training</div>
                      </div>
                      <div className="text-sm">45%</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                        <div className="text-sm">Cardio</div>
                      </div>
                      <div className="text-sm">30%</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                        <div className="text-sm">HIIT</div>
                      </div>
                      <div className="text-sm">15%</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                        <div className="text-sm">Flexibility</div>
                      </div>
                      <div className="text-sm">10%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription className="text-fitness-gray">
                    Your workout frequency over the week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <div className="w-full h-full flex items-center justify-center">
                      <BarChart className="h-32 w-32 text-fitness-gray" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 mt-4">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center">
                        <div className={`h-16 rounded-lg ${
                          i === 1 || i === 3 || i === 4 
                            ? "bg-fitness-green" 
                            : "bg-fitness-dark-gray"
                        }`}></div>
                        <div className="text-xs mt-1">{day}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Track your key metrics over the past 3 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="w-full h-full flex items-center justify-center">
                    <Activity className="h-32 w-32 text-fitness-gray" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <div className="text-xs text-fitness-gray mb-1">Weight Change</div>
                    <div className="flex items-center">
                      <div className="text-xl font-bold">-3.5 kg</div>
                      <div className="ml-2 text-xs text-green-500">-4.7%</div>
                    </div>
                  </div>
                  
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <div className="text-xs text-fitness-gray mb-1">Strength Increase</div>
                    <div className="flex items-center">
                      <div className="text-xl font-bold">+15%</div>
                      <div className="ml-2 text-xs text-green-500">↑</div>
                    </div>
                  </div>
                  
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <div className="text-xs text-fitness-gray mb-1">Workout Consistency</div>
                    <div className="flex items-center">
                      <div className="text-xl font-bold">85%</div>
                      <div className="ml-2 text-xs text-green-500">+12%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Recent Workout History</CardTitle>
                <CardDescription className="text-fitness-gray">
                  View your past workouts and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutHistory.map((workout, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-fitness-dark-gray rounded-lg flex flex-col md:flex-row justify-between"
                    >
                      <div className="mb-3 md:mb-0">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                            <Activity className="h-5 w-5 text-fitness-green" />
                          </div>
                          <div>
                            <h3 className="font-medium">{workout.name}</h3>
                            <p className="text-xs text-fitness-gray">
                              {new Date(workout.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-fitness-gray">Duration</div>
                          <div className="font-medium">{workout.duration}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-fitness-gray">Reps</div>
                          <div className="font-medium">{workout.reps}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-fitness-gray">Form</div>
                          <div className="font-medium">{workout.form}</div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-3 md:mt-0 md:self-center text-fitness-green hover:text-fitness-green/80 hover:bg-transparent"
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline" className="border-fitness-dark-gray">
                    Load More History
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader>
                  <CardTitle>Workout Calendar</CardTitle>
                  <CardDescription className="text-fitness-gray">
                    Your workout schedule and history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64">
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-32 w-32 text-fitness-gray" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader>
                  <CardTitle>Most Used Workouts</CardTitle>
                  <CardDescription className="text-fitness-gray">
                    Your favorite exercise routines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                          <Dumbbell className="h-4 w-4 text-fitness-green" />
                        </div>
                        <div>
                          <div className="font-medium">Full Body Workout</div>
                          <div className="text-xs text-fitness-gray">8 exercises</div>
                        </div>
                      </div>
                      <div className="text-sm">7 times</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                          <Dumbbell className="h-4 w-4 text-fitness-green" />
                        </div>
                        <div>
                          <div className="font-medium">Upper Body Focus</div>
                          <div className="text-xs text-fitness-gray">6 exercises</div>
                        </div>
                      </div>
                      <div className="text-sm">5 times</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                          <Dumbbell className="h-4 w-4 text-fitness-green" />
                        </div>
                        <div>
                          <div className="font-medium">HIIT Cardio</div>
                          <div className="text-xs text-fitness-gray">5 exercises</div>
                        </div>
                      </div>
                      <div className="text-sm">4 times</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                          <Dumbbell className="h-4 w-4 text-fitness-green" />
                        </div>
                        <div>
                          <div className="font-medium">Core Workout</div>
                          <div className="text-xs text-fitness-gray">6 exercises</div>
                        </div>
                      </div>
                      <div className="text-sm">3 times</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="flex">
                    <div className="bg-fitness-dark-gray border border-r-0 border-fitness-dark-gray rounded-l-md px-3 flex items-center">
                      <Lock className="h-4 w-4 text-fitness-gray" />
                    </div>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-fitness-dark-gray border-fitness-dark-gray rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="flex">
                    <div className="bg-fitness-dark-gray border border-r-0 border-fitness-dark-gray rounded-l-md px-3 flex items-center">
                      <Lock className="h-4 w-4 text-fitness-gray" />
                    </div>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-fitness-dark-gray border-fitness-dark-gray rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="flex">
                    <div className="bg-fitness-dark-gray border border-r-0 border-fitness-dark-gray rounded-l-md px-3 flex items-center">
                      <Lock className="h-4 w-4 text-fitness-gray" />
                    </div>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-fitness-dark-gray border-fitness-dark-gray rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-fitness-green hover:bg-fitness-green/80 text-black">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Bell className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Workout Reminders</p>
                        <p className="text-sm text-fitness-gray">Receive notifications for scheduled workouts</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Bell className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Achievement Alerts</p>
                        <p className="text-sm text-fitness-gray">Get notified when you earn new achievements</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Bell className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Weekly Stats</p>
                        <p className="text-sm text-fitness-gray">Receive a weekly summary of your progress</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Bell className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Tips & Articles</p>
                        <p className="text-sm text-fitness-gray">Get fitness tips and related content</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Manage your privacy and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Shield className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Data Analytics</p>
                        <p className="text-sm text-fitness-gray">Allow anonymous usage data collection to improve the app</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Shield className="h-5 w-5 text-fitness-gray" />
                      <div>
                        <p className="font-medium">Profile Visibility</p>
                        <p className="text-sm text-fitness-gray">Make your profile visible to other users</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
                
                <Separator className="bg-fitness-dark-gray" />
                
                <div className="pt-2">
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
