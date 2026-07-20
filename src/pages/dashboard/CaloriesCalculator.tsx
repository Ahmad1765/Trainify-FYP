import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { computeCalories } from "@/lib/calories";
import {
  useCalorieEntries,
  useCreateCalorieEntry,
  useDeleteCalorieEntry,
} from "@/hooks/useCalories";
import type { CalorieEntryView } from "@/services/calories.service";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Save, FileText, AlertCircle, Activity, Circle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CaloriesCalculator = () => {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    weight: "",
    height: "",
    activityLevel: "moderate",
    goal: "maintain",
  });
  
  const [calculationResult, setCalculationResult] = useState<{
    bmr: number;
    tdee: number;
    target: number;
  } | null>(null);
  
  const [nutritionModal, setNutritionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");

  // Persisted in Supabase. The two tabs (Saved / History) render the same
  // append-only log; legacy localStorage entries are imported once by the hook.
  const { data: entries = [] } = useCalorieEntries();
  const savedCalculations = entries;
  const history = entries;
  const createEntry = useCreateCalorieEntry();
  const deleteEntry = useDeleteCalorieEntry();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    // Math lives in a pure, unit-tested module now (src/lib/calories.ts).
    const result = computeCalories({
      age: parseInt(formData.age),
      gender: formData.gender,
      weightKg: parseFloat(formData.weight),
      heightCm: parseFloat(formData.height),
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    });
    if (!result) return; // invalid inputs
    setCalculationResult(result);
  };

  // Save Result — persists to Supabase
  const handleSaveResult = async () => {
    if (!calculationResult) return;
    try {
      await createEntry.mutateAsync({
        age: parseInt(formData.age),
        gender: formData.gender,
        weightKg: parseFloat(formData.weight),
        heightCm: parseFloat(formData.height),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        bmr: calculationResult.bmr,
        tdee: calculationResult.tdee,
        target: calculationResult.target,
      });
      toast({ title: "Results Saved", description: "Your calculation has been saved." });
    } catch (error) {
      toast({
        title: "Could not save",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Both tabs render the same log, so a delete from either removes the DB row.
  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
    } catch (error) {
      toast({
        title: "Could not delete",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load Saved
  const handleLoadSaved = (entry: CalorieEntryView) => {
    setFormData({
      age: String(entry.age),
      gender: entry.gender,
      weight: String(entry.weight),
      height: String(entry.height),
      activityLevel: entry.activityLevel,
      goal: entry.goal,
    });
    setCalculationResult({
      bmr: entry.bmr,
      tdee: entry.tdee,
      target: entry.target,
    });
    setActiveTab("calculator");
    toast({ title: "Calculation Loaded", description: "Loaded into calculator." });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-display-md">Calories Calculator</h1>
            <p className="text-fitness-gray mt-1">
              Calculate your daily calorie needs based on your stats and goals
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="calculator" className="space-y-6">
          <TabsList className="bg-fitness-card-bg">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="saved">Saved Calculations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculator Form */}
              <div className="space-y-6">
                <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                  <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      Enter your information for an accurate calculation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCalculate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            placeholder="Years"
                            className="bg-fitness-dark-gray border-fitness-dark-gray"
                            value={formData.age}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <RadioGroup
                            value={formData.gender}
                            onValueChange={(value) => setFormData({...formData, gender: value})}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female">Female</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight</Label>
                          <div className="relative">
                            <Input
                              id="weight"
                              name="weight"
                              type="number"
                              placeholder="0.0"
                              className="bg-fitness-dark-gray border-fitness-dark-gray pr-12"
                              value={formData.weight}
                              onChange={handleInputChange}
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fitness-gray text-sm">
                              kg
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="height">Height</Label>
                          <div className="relative">
                            <Input
                              id="height"
                              name="height"
                              type="number"
                              placeholder="0.0"
                              className="bg-fitness-dark-gray border-fitness-dark-gray pr-12"
                              value={formData.height}
                              onChange={handleInputChange}
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fitness-gray text-sm">
                              cm
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Activity Level</Label>
                        <RadioGroup
                          value={formData.activityLevel}
                          onValueChange={(value) => setFormData({...formData, activityLevel: value})}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sedentary" id="sedentary" />
                            <Label htmlFor="sedentary" className="text-sm">Sedentary (little or no exercise)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="light" />
                            <Label htmlFor="light" className="text-sm">Light (exercise 1-3 days/week)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="moderate" id="moderate" />
                            <Label htmlFor="moderate" className="text-sm">Moderate (exercise 3-5 days/week)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="active" id="active" />
                            <Label htmlFor="active" className="text-sm">Active (exercise 6-7 days/week)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="veryActive" id="veryActive" />
                            <Label htmlFor="veryActive" className="text-sm">Very Active (physical job or 2x training)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Goal</Label>
                        <RadioGroup
                          value={formData.goal}
                          onValueChange={(value) => setFormData({...formData, goal: value})}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lose" id="lose" />
                            <Label htmlFor="lose" className="text-sm">Lose Weight</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="maintain" id="maintain" />
                            <Label htmlFor="maintain" className="text-sm">Maintain Weight</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="gain" id="gain" />
                            <Label htmlFor="gain" className="text-sm">Gain Muscle Mass</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-fitness-green hover:bg-fitness-green/80 text-black"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Calories
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              {/* Results Section */}
              <div className="space-y-6">
                {calculationResult ? (
                  <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                    <CardHeader>
                      <CardTitle>Your Results</CardTitle>
                      <CardDescription className="text-fitness-gray">
                        Here are your calculated calorie needs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 bg-fitness-dark-gray rounded-xl">
                        <div className="text-center">
                          <h2 className="text-4xl font-bold text-fitness-green mb-2">
                            {calculationResult.target}
                          </h2>
                          <p className="text-sm text-fitness-gray">
                            Recommended Daily Calories for your Goal
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="bg-fitness-dark-gray" />
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                              <Activity className="h-4 w-4 text-fitness-green" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Basal Metabolic Rate (BMR)</p>
                              <p className="text-xs text-fitness-gray">Calories needed at complete rest</p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">{calculationResult.bmr}</div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                              <Circle className="h-4 w-4 text-fitness-green" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Daily Energy Expenditure</p>
                              <p className="text-xs text-fitness-gray">Calories burned with your activity level</p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">{calculationResult.tdee}</div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                              <AlertCircle className="h-4 w-4 text-fitness-green" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Calorie Adjustment for Goal</p>
                              <p className="text-xs text-fitness-gray">
                                {formData.goal === "lose" 
                                  ? "500 calorie deficit for weight loss" 
                                  : formData.goal === "gain" 
                                    ? "500 calorie surplus for muscle gain" 
                                    : "No adjustment (maintenance)"}
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">
                            {formData.goal === "lose" 
                              ? "-500" 
                              : formData.goal === "gain" 
                                ? "+500" 
                                : "0"}
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="bg-fitness-dark-gray" />
                      
                      <div className="flex justify-between">
                        <Button variant="outline" className="border-fitness-dark-gray" onClick={() => setNutritionModal(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Nutrition Plan
                        </Button>
                        
                        <Button className="bg-fitness-green hover:bg-fitness-green/80 text-black" onClick={handleSaveResult}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Result
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-fitness-card-bg border-fitness-dark-gray h-full flex items-center justify-center">
                    <CardContent className="pt-6 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-fitness-dark-gray flex items-center justify-center mb-4">
                        <Calculator className="h-6 w-6 text-fitness-gray" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Calculation Yet</h3>
                      <p className="text-sm text-fitness-gray max-w-xs mx-auto">
                        Enter your information in the form and click "Calculate Calories" to see your results.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                  <CardHeader>
                    <CardTitle>Calorie Breakdown</CardTitle>
                    <CardDescription className="text-fitness-gray">
                      Recommended macronutrient distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {calculationResult ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                            <div className="text-xs text-fitness-gray mb-1">Protein</div>
                            <div className="text-xl font-bold">30%</div>
                            <div className="text-sm">{Math.round(calculationResult.target * 0.3 / 4)} g</div>
                          </div>
                          
                          <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                            <div className="text-xs text-fitness-gray mb-1">Carbs</div>
                            <div className="text-xl font-bold">40%</div>
                            <div className="text-sm">{Math.round(calculationResult.target * 0.4 / 4)} g</div>
                          </div>
                          
                          <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                            <div className="text-xs text-fitness-gray mb-1">Fats</div>
                            <div className="text-xl font-bold">30%</div>
                            <div className="text-sm">{Math.round(calculationResult.target * 0.3 / 9)} g</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-fitness-gray italic">
                          <p>Note: This is a general recommendation. Adjust based on your specific needs and preferences.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-fitness-gray py-4">
                        <p>Calculate your calories to see macronutrient breakdown</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            {savedCalculations.length === 0 ? (
              <div className="bg-fitness-card-bg p-6 rounded-xl text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-fitness-dark-gray flex items-center justify-center mb-4">
                  <Save className="h-6 w-6 text-fitness-gray" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Saved Calculations</h3>
                <p className="text-sm text-fitness-gray max-w-xs mx-auto">
                  Calculate your calories and save the results to view them here later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedCalculations.map((entry, idx) => (
                  <Card key={idx} className="bg-fitness-card-bg border-fitness-dark-gray">
                    <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                      <div>
                        <div className="font-bold text-fitness-green text-lg">{entry.target} kcal</div>
                        <div className="text-xs text-fitness-gray">{entry.date && new Date(entry.date).toLocaleString()}</div>
                        <div className="text-xs text-fitness-gray">{entry.gender}, {entry.age}y, {entry.weight}kg, {entry.height}cm, {entry.activityLevel}, {entry.goal}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-fitness-dark-gray" onClick={() => handleLoadSaved(entry)}>Load</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="bg-fitness-card-bg p-6 rounded-xl text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-fitness-dark-gray flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-fitness-gray" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Calculation History</h3>
                <p className="text-sm text-fitness-gray max-w-xs mx-auto">
                  Your previous calculations will appear here after you perform calculations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, idx) => (
                  <Card key={idx} className="bg-fitness-card-bg border-fitness-dark-gray">
                    <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                      <div>
                        <div className="font-bold text-fitness-green text-lg">{entry.target} kcal</div>
                        <div className="text-xs text-fitness-gray">{entry.date && new Date(entry.date).toLocaleString()}</div>
                        <div className="text-xs text-fitness-gray">{entry.gender}, {entry.age}y, {entry.weight}kg, {entry.height}cm, {entry.activityLevel}, {entry.goal}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-fitness-dark-gray" onClick={() => handleLoadSaved(entry)}>Load</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {nutritionModal && calculationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-fitness-card-bg rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-fitness-gray hover:text-fitness-green text-2xl" onClick={() => setNutritionModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-lg font-bold mb-4">Your Nutrition Plan</h3>
            <div className="space-y-4">
              <div className="text-center text-2xl font-bold text-fitness-green">{calculationResult.target} kcal/day</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Protein</div>
                  <div className="text-xl font-bold">30%</div>
                  <div className="text-sm">{Math.round(calculationResult.target * 0.3 / 4)} g</div>
                </div>
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Carbs</div>
                  <div className="text-xl font-bold">40%</div>
                  <div className="text-sm">{Math.round(calculationResult.target * 0.4 / 4)} g</div>
                </div>
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Fats</div>
                  <div className="text-xl font-bold">30%</div>
                  <div className="text-sm">{Math.round(calculationResult.target * 0.3 / 9)} g</div>
                </div>
              </div>
              <div className="text-sm text-fitness-gray italic text-center">
                <p>Eat a variety of whole foods, lean proteins, complex carbs, and healthy fats. Adjust as needed for your goals and preferences.</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" className="border-fitness-dark-gray" onClick={() => setNutritionModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CaloriesCalculator;
