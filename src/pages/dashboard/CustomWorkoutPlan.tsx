import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Dumbbell, 
  Clock, 
  Calendar, 
  Target, 
  ChevronRight,
  Check,
  Download,
  Save,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";
import jsPDF from "jspdf";
import { useRef } from "react";

const fitnessGoals = [
  {
    id: "fat-loss",
    title: "Fat Loss",
    description: "Burn fat and improve overall body composition.",
    icon: "🔥",
  },
  {
    id: "muscle-gain",
    title: "Muscle Gain",
    description: "Build muscle mass and increase strength.",
    icon: "💪",
  },
  {
    id: "strength",
    title: "Strength",
    description: "Increase maximal strength without focusing on size.",
    icon: "🏋️",
  },
  {
    id: "general-fitness",
    title: "General Fitness",
    description: "Improve overall health and fitness level.",
    icon: "🏃",
  },
  {
    id: "endurance",
    title: "Endurance",
    description: "Improve cardiovascular health and stamina.",
    icon: "🚴",
  },
];

const equipmentOptions = [
  { id: "none", label: "No Equipment" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "resistance-bands", label: "Resistance Bands" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "pull-up-bar", label: "Pull-up Bar" },
  { id: "bench", label: "Bench" },
  { id: "full-gym", label: "Full Gym Access" },
];

// Sample generated workout plan
const sampleWorkoutPlan = {
  monday: [
    { name: "Push-ups", sets: 3, reps: "10-12", rest: "60s" },
    { name: "Squats", sets: 3, reps: "12-15", rest: "60s" },
    { name: "Plank", sets: 3, reps: "30s hold", rest: "45s" },
    { name: "Lunges", sets: 3, reps: "10 each leg", rest: "60s" },
    { name: "Mountain Climbers", sets: 3, reps: "30s", rest: "30s" },
  ],
  wednesday: [
    { name: "Pull-ups", sets: 3, reps: "Max effort", rest: "90s" },
    { name: "Dumbbell Rows", sets: 3, reps: "10-12 each side", rest: "60s" },
    { name: "Glute Bridges", sets: 3, reps: "15-20", rest: "45s" },
    { name: "Russian Twists", sets: 3, reps: "20 total", rest: "45s" },
    { name: "Jumping Jacks", sets: 3, reps: "30s", rest: "30s" },
  ],
  friday: [
    { name: "Dumbbell Press", sets: 4, reps: "10-12", rest: "60s" },
    { name: "Goblet Squats", sets: 3, reps: "12-15", rest: "60s" },
    { name: "Side Planks", sets: 3, reps: "30s each side", rest: "45s" },
    { name: "Calf Raises", sets: 3, reps: "15-20", rest: "45s" },
    { name: "Burpees", sets: 3, reps: "10-12", rest: "60s" },
  ],
};

const CustomWorkoutPlan = () => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState<number[]>([3]);
  const [timePerSession, setTimePerSession] = useState<number[]>([30]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [exerciseModal, setExerciseModal] = useState({ open: false, day: '', index: -1, mode: 'view' });
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', rest: '' });
  const [workoutSession, setWorkoutSession] = useState({ open: false, day: '', index: 0, started: false });
  const [plan, setPlan] = useState<any>(sampleWorkoutPlan);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const generateWorkoutPlan = () => {
    // In a real app, this would call an API to generate a personalized plan
    // For this example, we'll use the sample plan
    setGeneratedPlan(sampleWorkoutPlan);
    setStep(3);
  };
  
  const workoutDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const selectedDays = workoutDays.slice(0, daysPerWeek[0]);

  // Sync plan with generatedPlan
  useEffect(() => { if (generatedPlan) setPlan(generatedPlan); }, [generatedPlan]);

  // PDF Download
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Custom Workout Plan", 10, 15);
    doc.setFontSize(12);
    let y = 30;
    Object.keys(plan).forEach(day => {
      doc.text(day.charAt(0).toUpperCase() + day.slice(1), 10, y);
      y += 7;
      plan[day].forEach((ex: any) => {
        doc.text(`- ${ex.name}: ${ex.sets} sets x ${ex.reps} reps, Rest: ${ex.rest}`, 12, y);
        y += 7;
      });
      y += 3;
    });
    doc.save("workout-plan.pdf");
  };

  // Edit Exercise
  const handleEditExercise = (day: string, index: number) => {
    setExerciseForm(plan[day][index]);
    setExerciseModal({ open: true, day, index, mode: 'edit' });
  };
  const handleSaveExercise = () => {
    const updated = { ...plan };
    updated[exerciseModal.day][exerciseModal.index] = { ...exerciseForm };
    setPlan(updated);
    setExerciseModal({ open: false, day: '', index: -1, mode: 'view' });
  };

  // Add Exercise
  const handleAddExercise = (day: string) => {
    setExerciseForm({ name: '', sets: '', reps: '', rest: '' });
    setExerciseModal({ open: true, day, index: -1, mode: 'add' });
  };
  const handleSaveNewExercise = () => {
    const updated = { ...plan };
    updated[exerciseModal.day].push({ ...exerciseForm });
    setPlan(updated);
    setExerciseModal({ open: false, day: '', index: -1, mode: 'view' });
  };

  // Delete Exercise
  const handleDeleteExercise = (day: string, index: number) => {
    const updated = { ...plan };
    updated[day].splice(index, 1);
    setPlan(updated);
  };

  // View Details
  const handleViewDetails = (day: string, index: number) => {
    setExerciseForm(plan[day][index]);
    setExerciseModal({ open: true, day, index, mode: 'view' });
  };

  // Start Workout
  const handleStartWorkout = (day: string) => {
    setWorkoutSession({ open: true, day, index: 0, started: true });
  };
  const handleNextExercise = () => {
    setWorkoutSession(ws => ({ ...ws, index: ws.index + 1 }));
  };
  const handleEndWorkout = () => {
    setWorkoutSession({ open: false, day: '', index: 0, started: false });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Custom Workout Plan</h1>
            <p className="text-fitness-gray mt-1">
              Create a personalized workout plan tailored to your goals
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between relative mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-fitness-dark-gray -translate-y-1/2 z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-fitness-green text-black" : "bg-fitness-dark-gray text-white"
            }`}>
              {step > 1 ? <Check className="h-5 w-5" /> : 1}
            </div>
            <span className="text-xs mt-2">Goals & Preferences</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-fitness-green text-black" : "bg-fitness-dark-gray text-white"
            }`}>
              {step > 2 ? <Check className="h-5 w-5" /> : 2}
            </div>
            <span className="text-xs mt-2">Equipment & Level</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-fitness-green text-black" : "bg-fitness-dark-gray text-white"
            }`}>
              3
            </div>
            <span className="text-xs mt-2">Your Plan</span>
          </div>
        </div>

        {/* Step 1: Goals and Preferences */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Select Your Fitness Goal</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Choose the primary goal for your workout plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fitnessGoals.map((fitnessGoal) => (
                    <div 
                      key={fitnessGoal.id}
                      className={`p-4 rounded-xl cursor-pointer transition-colors ${
                        goal === fitnessGoal.id 
                          ? "bg-fitness-green/20 border-2 border-fitness-green" 
                          : "bg-fitness-dark-gray border-2 border-transparent hover:border-fitness-green/50"
                      }`}
                      onClick={() => setGoal(fitnessGoal.id)}
                    >
                      <div className="flex items-start">
                        <div className="text-2xl mr-3">{fitnessGoal.icon}</div>
                        <div>
                          <h3 className="font-medium">{fitnessGoal.title}</h3>
                          <p className="text-sm text-fitness-gray mt-1">
                            {fitnessGoal.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Workout Schedule</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Define how often and how long you want to work out
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-6 block">Days per week: {daysPerWeek}</Label>
                    <Slider
                      value={daysPerWeek}
                      min={1}
                      max={7}
                      step={1}
                      onValueChange={setDaysPerWeek}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-fitness-gray mt-2">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                      <span>6</span>
                      <span>7</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-6 block">Time per session: {timePerSession} minutes</Label>
                    <Slider
                      value={timePerSession}
                      min={15}
                      max={90}
                      step={5}
                      onValueChange={setTimePerSession}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-fitness-gray mt-2">
                      <span>15m</span>
                      <span>30m</span>
                      <span>45m</span>
                      <span>60m</span>
                      <span>75m</span>
                      <span>90m</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                className="bg-fitness-green hover:bg-fitness-green/80 text-black"
                onClick={() => setStep(2)}
                disabled={!goal}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Equipment & Level */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Available Equipment</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Select all equipment you have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipmentOptions.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3">
                      <Checkbox 
                        id={option.id} 
                        checked={equipment.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEquipment([...equipment, option.id]);
                          } else {
                            setEquipment(equipment.filter(id => id !== option.id));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={option.id}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Experience Level</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Select your current fitness experience level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={experienceLevel} 
                  onValueChange={setExperienceLevel}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">
                      <div className="font-medium">Beginner</div>
                      <div className="text-sm text-fitness-gray">
                        New to fitness or returning after a long break
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">
                      <div className="font-medium">Intermediate</div>
                      <div className="text-sm text-fitness-gray">
                        Consistent workout experience for 6+ months
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">
                      <div className="font-medium">Advanced</div>
                      <div className="text-sm text-fitness-gray">
                        Extensive training experience for 2+ years
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                className="border-fitness-dark-gray"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              
              <Button 
                className="bg-fitness-green hover:bg-fitness-green/80 text-black"
                onClick={generateWorkoutPlan}
                disabled={!experienceLevel || equipment.length === 0}
              >
                Generate Plan
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Plan */}
        {step === 3 && generatedPlan && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-bold">Your Custom Workout Plan</h2>
                <p className="text-fitness-gray mt-1">
                  Based on your {fitnessGoals.find(g => g.id === goal)?.title.toLowerCase()} goal, {daysPerWeek} days per week
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 space-x-2">
                <Button 
                  variant="outline" 
                  className="border-fitness-dark-gray"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Plan
                    </>
                  )}
                </Button>
                
                <Button className="bg-fitness-green hover:bg-fitness-green/80 text-black" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedDays.map((day, index) => (
                <Card key={day} className="bg-fitness-card-bg border-fitness-dark-gray">
                  <CardHeader className="pb-3">
                    <CardTitle className="capitalize">{day}</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      {plan[day]?.length || 0} exercises • Approximately {timePerSession} minutes
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {plan[day]?.map((exercise: any, i: number) => (
                      <div 
                        key={i} 
                        className="p-3 bg-fitness-dark-gray rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium cursor-pointer" onClick={() => handleViewDetails(day, i)}>{exercise.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-fitness-gray">
                              <div className="flex items-center">
                                <span className="font-medium mr-1">Sets:</span> {exercise.sets}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-1">Reps:</span> {exercise.reps}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-1">Rest:</span> {exercise.rest}
                              </div>
                            </div>
                          </div>
                          
                          {editing && (
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-fitness-gray hover:text-white hover:bg-transparent" onClick={() => handleEditExercise(day, i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-fitness-gray hover:text-white hover:bg-transparent" onClick={() => handleDeleteExercise(day, i)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {editing && (
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-fitness-dark-gray hover:border-fitness-green hover:bg-fitness-green/10"
                        onClick={() => handleAddExercise(day)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button 
                      variant="ghost" 
                      className="w-full text-fitness-green hover:bg-fitness-green/10"
                      onClick={() => handleViewDetails(day, 0)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" className="w-full mt-2" onClick={() => handleStartWorkout(day)}>
                      Start This Workout
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="bg-fitness-card-bg p-6 rounded-xl space-y-4">
              <h3 className="text-lg font-semibold">Plan Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-fitness-dark-gray p-4 rounded-lg">
                  <div className="flex items-center text-fitness-green mb-2">
                    <Target className="h-5 w-5 mr-2" />
                    <span className="font-medium">Goal</span>
                  </div>
                  <div className="text-sm">
                    {fitnessGoals.find(g => g.id === goal)?.title || "Not specified"}
                  </div>
                </div>
                <div className="bg-fitness-dark-gray p-4 rounded-lg">
                  <div className="flex items-center text-fitness-green mb-2">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-medium">Frequency</span>
                  </div>
                  <div className="text-sm">
                    {daysPerWeek} days per week
                  </div>
                </div>
                <div className="bg-fitness-dark-gray p-4 rounded-lg">
                  <div className="flex items-center text-fitness-green mb-2">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <div className="text-sm">
                    {timePerSession} minutes per session
                  </div>
                </div>
                <div className="bg-fitness-dark-gray p-4 rounded-lg">
                  <div className="flex items-center text-fitness-green mb-2">
                    <Dumbbell className="h-5 w-5 mr-2" />
                    <span className="font-medium">Level</span>
                  </div>
                  <div className="text-sm capitalize">
                    {experienceLevel || "Not specified"}
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  className="border-fitness-dark-gray"
                  onClick={() => setStep(1)}
                >
                  Create New Plan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Modal */}
      {exerciseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-fitness-card-bg rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-fitness-gray hover:text-fitness-green text-2xl" onClick={() => setExerciseModal({ open: false, day: '', index: -1, mode: 'view' })} aria-label="Close">&times;</button>
            <h3 className="text-lg font-bold mb-4">{exerciseModal.mode === 'add' ? 'Add Exercise' : exerciseModal.mode === 'edit' ? 'Edit Exercise' : 'Exercise Details'}</h3>
            <div className="space-y-4">
              <Input placeholder="Exercise Name" value={exerciseForm.name} onChange={e => setExerciseForm({ ...exerciseForm, name: e.target.value })} disabled={exerciseModal.mode === 'view'} />
              <Input placeholder="Sets" value={exerciseForm.sets} onChange={e => setExerciseForm({ ...exerciseForm, sets: e.target.value })} disabled={exerciseModal.mode === 'view'} />
              <Input placeholder="Reps" value={exerciseForm.reps} onChange={e => setExerciseForm({ ...exerciseForm, reps: e.target.value })} disabled={exerciseModal.mode === 'view'} />
              <Input placeholder="Rest" value={exerciseForm.rest} onChange={e => setExerciseForm({ ...exerciseForm, rest: e.target.value })} disabled={exerciseModal.mode === 'view'} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {exerciseModal.mode === 'edit' && <Button className="bg-fitness-green text-black" onClick={handleSaveExercise}>Save</Button>}
              {exerciseModal.mode === 'add' && <Button className="bg-fitness-green text-black" onClick={handleSaveNewExercise}>Add</Button>}
              <Button variant="outline" className="border-fitness-dark-gray" onClick={() => setExerciseModal({ open: false, day: '', index: -1, mode: 'view' })}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Session Modal */}
      {workoutSession.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-fitness-card-bg rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-fitness-gray hover:text-fitness-green text-2xl" onClick={handleEndWorkout} aria-label="Close">&times;</button>
            <h3 className="text-lg font-bold mb-4">Workout Session - {workoutSession.day.charAt(0).toUpperCase() + workoutSession.day.slice(1)}</h3>
            {plan[workoutSession.day] && plan[workoutSession.day][workoutSession.index] ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">{plan[workoutSession.day][workoutSession.index].name}</div>
                <div>Sets: {plan[workoutSession.day][workoutSession.index].sets}</div>
                <div>Reps: {plan[workoutSession.day][workoutSession.index].reps}</div>
                <div>Rest: {plan[workoutSession.day][workoutSession.index].rest}</div>
                <Button className="bg-fitness-green text-black w-full mt-4" onClick={handleNextExercise} disabled={workoutSession.index >= plan[workoutSession.day].length - 1}>Next Exercise</Button>
              </div>
            ) : (
              <div className="text-center">Workout Complete!</div>
            )}
            <Button variant="outline" className="w-full mt-4 border-fitness-dark-gray" onClick={handleEndWorkout}>End Workout</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomWorkoutPlan;
