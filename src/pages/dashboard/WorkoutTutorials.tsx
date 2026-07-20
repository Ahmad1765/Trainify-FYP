import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Clock, 
  Dumbbell, 
  Play,
  Star,
  BarChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock workout tutorial data
const workoutTutorials = [
  {
    id: 1,
    title: "Home Chest Workout (No Equipment)",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/Io1h6tqF0Wc",
    duration: "25 min",
    level: "Beginner",
    category: "Chest",
    trainer: "Chris Heria",
    rating: 4.6,
    equipment: "None",
    featured: true,
  },
  {
    id: 2,
    title: "Complete Home Leg Workout Without Equipment",
    thumbnail: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/2tM1LFFxeKg",
    duration: "30 min",
    level: "Beginner",
    category: "Legs",
    trainer: "David Lewis",
    rating: 4.8,
    equipment: "None",
    featured: false,
  },
  {
    id: 3,
    title: "Total Body Strength Burnout (No Weight)",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/UItWltVZZmE",
    duration: "35 min",
    level: "Intermediate",
    category: "Full Body",
    trainer: "Chris Heria",
    rating: 4.7,
    equipment: "None",
    featured: true,
  },
  {
    id: 4,
    title: "Perfect Home Shoulder Workout",
    thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/qEwKCR5JCog",
    duration: "28 min",
    level: "Intermediate",
    category: "Shoulders",
    trainer: "Jane Smith",
    rating: 4.5,
    equipment: "Dumbbells",
    featured: false,
  },
  {
    id: 5,
    title: "HIIT Cardio Workout at Home",
    thumbnail: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/ml6cT4AZdqI",
    duration: "20 min",
    level: "All Levels",
    category: "Cardio",
    trainer: "David Lewis",
    rating: 4.9,
    equipment: "None",
    featured: true,
  },
  {
    id: 6,
    title: "Dumbbell Upper Body Blast",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/0JfYxMRsUCQ",
    duration: "40 min",
    level: "Advanced",
    category: "Upper Body",
    trainer: "Jane Smith",
    rating: 4.7,
    equipment: "Dumbbells",
    featured: false,
  },
];

// Filter categories
const categories = ["All", "Chest", "Back", "Legs", "Arms", "Shoulders", "Core", "Full Body", "Cardio"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const equipment = ["All", "None", "Dumbbells", "Resistance Bands", "Kettlebell"];
const duration = ["All", "Under 15 min", "15-30 min", "30-45 min", "Over 45 min"];

const WorkoutTutorials = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");
  const [videoModal, setVideoModal] = useState<{ open: boolean; videoUrl: string | null }>({ open: false, videoUrl: null });

  // Helper to filter by duration
  const durationFilter = (workout: any) => {
    if (selectedDuration === "All") return true;
    const mins = parseInt(workout.duration);
    if (selectedDuration === "Under 15 min") return mins < 15;
    if (selectedDuration === "15-30 min") return mins >= 15 && mins <= 30;
    if (selectedDuration === "30-45 min") return mins > 30 && mins <= 45;
    if (selectedDuration === "Over 45 min") return mins > 45;
    return true;
  };

  // Filter workouts based on all filters
  const filteredWorkouts = workoutTutorials.filter(workout => {
    const matchesSearch = workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || workout.category === activeCategory;
    const matchesEquipment = selectedEquipment === "All" || workout.equipment === selectedEquipment;
    const matchesLevel = selectedLevel === "All" || workout.level === selectedLevel;
    const matchesDuration = durationFilter(workout);
    return matchesSearch && matchesCategory && matchesEquipment && matchesLevel && matchesDuration;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Workout Tutorials</h1>
            <p className="text-fitness-gray mt-1">
              Learn proper form and follow along with expert trainers
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fitness-gray h-4 w-4" />
            <Input
              type="text"
              placeholder="Search workouts, trainers, or muscles..."
              className="pl-10 bg-fitness-card-bg border-fitness-dark-gray"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            className="border-fitness-dark-gray"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-fitness-card-bg p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {equipment.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={`rounded-full py-1.5 px-3 cursor-pointer border-fitness-dark-gray hover:border-fitness-green ${
                      selectedEquipment === item ? "bg-fitness-green/20 text-fitness-green border-fitness-green" : ""
                    }`}
                    onClick={() => setSelectedEquipment(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Level</h3>
              <div className="flex flex-wrap gap-2">
                {levels.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={`rounded-full py-1.5 px-3 cursor-pointer border-fitness-dark-gray hover:border-fitness-green ${
                      selectedLevel === item ? "bg-fitness-green/20 text-fitness-green border-fitness-green" : ""
                    }`}
                    onClick={() => setSelectedLevel(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Duration</h3>
              <div className="flex flex-wrap gap-2">
                {duration.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={`rounded-full py-1.5 px-3 cursor-pointer border-fitness-dark-gray hover:border-fitness-green ${
                      selectedDuration === item ? "bg-fitness-green/20 text-fitness-green border-fitness-green" : ""
                    }`}
                    onClick={() => setSelectedDuration(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                className="mr-2 border-fitness-dark-gray"
                onClick={() => {
                  setSelectedEquipment("All");
                  setSelectedLevel("All");
                  setSelectedDuration("All");
                }}
              >
                Reset
              </Button>
              <Button className="bg-fitness-green text-black hover:bg-fitness-green/80" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className={`rounded-full py-1.5 px-4 cursor-pointer ${
                  activeCategory === category
                    ? "bg-fitness-green text-black border-fitness-green"
                    : "border-fitness-dark-gray hover:border-fitness-green"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Featured Workouts */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Workouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts
              .filter((workout) => workout.featured)
              .map((workout) => (
                <div 
                  key={workout.id} 
                  className="bg-fitness-card-bg rounded-xl overflow-hidden hover-scale"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={workout.thumbnail} 
                      alt={workout.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-fitness-green text-black">Featured</Badge>
                        <Badge variant="outline" className="border-white/30 text-white">
                          {workout.level}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold">{workout.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {workout.duration}
                        </div>
                        <div className="flex items-center text-sm">
                          <Dumbbell className="h-4 w-4 mr-1" />
                          {workout.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-0 right-0 m-4">
                      <Button 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-fitness-green text-black hover:bg-fitness-green/80"
                        onClick={() => setVideoModal({ open: true, videoUrl: workout.videoUrl })}
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-fitness-gray">
                        By {workout.trainer}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="text-sm">{workout.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* All Workouts */}
        <div>
          <Separator className="my-8 bg-fitness-dark-gray" />
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Workouts</h2>
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="text-fitness-green">
                <BarChart className="h-4 w-4 mr-2" />
                Sort by
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <div 
                key={workout.id} 
                className="bg-fitness-card-bg rounded-xl overflow-hidden hover-scale"
              >
                <div className="relative aspect-video">
                  <img 
                    src={workout.thumbnail} 
                    alt={workout.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {workout.featured && (
                        <Badge className="bg-fitness-green text-black">Featured</Badge>
                      )}
                      <Badge variant="outline" className="border-white/30 text-white">
                        {workout.level}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold">{workout.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {workout.duration}
                      </div>
                      <div className="flex items-center text-sm">
                        <Dumbbell className="h-4 w-4 mr-1" />
                        {workout.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-0 right-0 m-4">
                    <Button 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-fitness-green text-black hover:bg-fitness-green/80"
                      onClick={() => setVideoModal({ open: true, videoUrl: workout.videoUrl })}
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-fitness-gray">
                      By {workout.trainer}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm">{workout.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {videoModal.open && videoModal.videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-fitness-card-bg rounded-xl shadow-lg p-4 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-fitness-gray hover:text-fitness-green text-2xl"
              onClick={() => setVideoModal({ open: false, videoUrl: null })}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={videoModal.videoUrl}
                className="w-full h-full rounded-lg"
                title="Workout Tutorial Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutTutorials;
