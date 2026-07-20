import { useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Save,
  Download,
  Coffee,
  Utensils,
  UtensilsCrossed,
  Apple,
  Calculator,
  Check,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import jsPDF from "jspdf";

// Sample meal data
const mealPlans = {
  weightLoss: {
    breakfast: [
      {
        name: "Greek Yogurt Bowl",
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 12,
        ingredients: ["Greek yogurt", "Mixed berries", "Granola", "Honey"],
        image: "https://images.unsplash.com/photo-1519996409144-56c88a9bd76e?w=300&h=200&fit=crop",
      },
      {
        name: "Vegetable Omelette",
        calories: 320,
        protein: 22,
        carbs: 10,
        fat: 20,
        ingredients: ["Eggs", "Bell peppers", "Spinach", "Onions", "Feta cheese"],
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=300&h=200&fit=crop",
      },
    ],
    lunch: [
      {
        name: "Grilled Chicken Salad",
        calories: 420,
        protein: 35,
        carbs: 20,
        fat: 18,
        ingredients: ["Chicken breast", "Mixed greens", "Cucumber", "Tomatoes", "Olive oil"],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
      },
      {
        name: "Turkey Wrap",
        calories: 380,
        protein: 30,
        carbs: 35,
        fat: 12,
        ingredients: ["Turkey slices", "Whole wheat wrap", "Hummus", "Lettuce", "Tomato"],
        image: "https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=300&h=200&fit=crop",
      },
    ],
    dinner: [
      {
        name: "Baked Salmon with Vegetables",
        calories: 450,
        protein: 38,
        carbs: 18,
        fat: 22,
        ingredients: ["Salmon fillet", "Broccoli", "Carrots", "Lemon", "Garlic"],
        image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&h=200&fit=crop",
      },
      {
        name: "Quinoa Bowl with Tofu",
        calories: 420,
        protein: 24,
        carbs: 50,
        fat: 15,
        ingredients: ["Quinoa", "Tofu", "Bell peppers", "Avocado", "Soy sauce"],
        image: "https://images.unsplash.com/photo-1530598252592-38ebe2c5bfc5?w=300&h=200&fit=crop",
      },
    ],
    snacks: [
      {
        name: "Apple with Almond Butter",
        calories: 200,
        protein: 6,
        carbs: 25,
        fat: 10,
        ingredients: ["Apple", "Almond butter"],
        image: "https://images.unsplash.com/photo-1581400151177-5993ad935461?w=300&h=200&fit=crop",
      },
      {
        name: "Protein Shake",
        calories: 180,
        protein: 25,
        carbs: 8,
        fat: 4,
        ingredients: ["Protein powder", "Almond milk", "Banana"],
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&h=200&fit=crop",
      },
    ],
  },
  muscleBuild: {
    breakfast: [
      {
        name: "Protein Pancakes",
        calories: 520,
        protein: 35,
        carbs: 60,
        fat: 15,
        ingredients: ["Protein powder", "Rolled oats", "Banana", "Eggs", "Maple syrup"],
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=300&h=200&fit=crop",
      },
    ],
    lunch: [
      {
        name: "Chicken Rice Bowl",
        calories: 650,
        protein: 45,
        carbs: 70,
        fat: 15,
        ingredients: ["Chicken breast", "Brown rice", "Broccoli", "Sweet potatoes", "Olive oil"],
        image: "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=300&h=200&fit=crop",
      },
    ],
    dinner: [
      {
        name: "Steak with Roasted Vegetables",
        calories: 680,
        protein: 50,
        carbs: 30,
        fat: 35,
        ingredients: ["Sirloin steak", "Potatoes", "Asparagus", "Red onion", "Butter"],
        image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=300&h=200&fit=crop",
      },
    ],
    snacks: [
      {
        name: "Cottage Cheese with Berries",
        calories: 220,
        protein: 25,
        carbs: 15,
        fat: 5,
        ingredients: ["Cottage cheese", "Mixed berries", "Honey"],
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop",
      },
      {
        name: "Trail Mix",
        calories: 320,
        protein: 10,
        carbs: 25,
        fat: 20,
        ingredients: ["Almonds", "Walnuts", "Dark chocolate", "Dried cranberries"],
        image: "https://images.unsplash.com/photo-1571407509209-73d3e4a45892?w=300&h=200&fit=crop",
      },
    ],
  },
  maintenance: {
    breakfast: [
      {
        name: "Avocado Toast with Eggs",
        calories: 420,
        protein: 20,
        carbs: 35,
        fat: 22,
        ingredients: ["Whole grain bread", "Avocado", "Eggs", "Cherry tomatoes", "Microgreens"],
        image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=300&h=200&fit=crop",
      },
      {
        name: "Overnight Oats",
        calories: 380,
        protein: 15,
        carbs: 45,
        fat: 18,
        ingredients: ["Rolled oats", "Almond milk", "Chia seeds", "Honey", "Mixed berries"],
        image: "https://images.unsplash.com/photo-1517093602195-b40af9261bdb?w=300&h=200&fit=crop",
      },
    ],
    lunch: [
      {
        name: "Mediterranean Bowl",
        calories: 480,
        protein: 25,
        carbs: 45,
        fat: 24,
        ingredients: ["Quinoa", "Grilled chicken", "Cucumber", "Feta cheese", "Olives", "Hummus"],
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop",
      },
      {
        name: "Tuna Salad Wrap",
        calories: 450,
        protein: 28,
        carbs: 40,
        fat: 20,
        ingredients: ["Whole wheat wrap", "Tuna", "Greek yogurt", "Celery", "Red onion", "Lettuce"],
        image: "https://images.unsplash.com/photo-1603046891741-c2a97a5a1b2c?w=300&h=200&fit=crop",
      },
    ],
    dinner: [
      {
        name: "Baked Chicken with Sweet Potato",
        calories: 520,
        protein: 35,
        carbs: 45,
        fat: 22,
        ingredients: ["Chicken breast", "Sweet potato", "Broccoli", "Olive oil", "Herbs"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
      },
      {
        name: "Vegetable Stir Fry with Tofu",
        calories: 480,
        protein: 22,
        carbs: 50,
        fat: 20,
        ingredients: ["Tofu", "Brown rice", "Bell peppers", "Broccoli", "Soy sauce", "Ginger"],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
      },
    ],
    snacks: [
      {
        name: "Greek Yogurt with Granola",
        calories: 220,
        protein: 15,
        carbs: 25,
        fat: 8,
        ingredients: ["Greek yogurt", "Granola", "Honey", "Cinnamon"],
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop",
      },
      {
        name: "Mixed Nuts and Dried Fruit",
        calories: 280,
        protein: 8,
        carbs: 30,
        fat: 16,
        ingredients: ["Almonds", "Walnuts", "Dried cranberries", "Dark chocolate chips"],
        image: "https://images.unsplash.com/photo-1571407509209-73d3e4a45892?w=300&h=200&fit=crop",
      },
    ],
  },
};

const dietaryRestrictions = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
  { value: "low-carb", label: "Low-Carb" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
];

const CustomDietPlan = () => {
  const [step, setStep] = useState(1);
  const [calorieGoal, setCalorieGoal] = useState("");
  const [dietPurpose, setDietPurpose] = useState("weight-loss");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  const handleRestrictionChange = (value: string) => {
    setRestrictions(
      restrictions.includes(value)
        ? restrictions.filter((item) => item !== value)
        : [...restrictions, value]
    );
  };
  
  const generateDietPlan = () => {
    // In a real app, this would call an API to generate a personalized diet plan
    // For this example, we'll use the sample meal plans
    if (dietPurpose === "weight-loss") {
      setSelectedPlan(mealPlans.weightLoss);
    } else if (dietPurpose === "muscle-build") {
      setSelectedPlan(mealPlans.muscleBuild);
    } else if (dietPurpose === "maintenance") {
      setSelectedPlan(mealPlans.maintenance);
    }
    setStep(3);
  };
  
  // Helper function to calculate total calories for the daily plan
  const calculateTotalCalories = (plan: any) => {
    if (!plan) return 0;
    
    let total = 0;
    for (const mealType in plan) {
      plan[mealType].forEach((meal: any) => {
        total += meal.calories;
      });
    }
    return total;
  };
  
  // Helper to count total meals in the plan
  const countTotalMeals = (plan: any) => {
    if (!plan) return 0;
    
    let count = 0;
    for (const mealType in plan) {
      count += plan[mealType].length;
    }
    return count;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Custom Diet Plan", 10, 15);
    doc.setFontSize(12);
    
    // Add diet plan details
    let y = 30;
    doc.text(`Goal: ${dietPurpose === "weight-loss" ? "Weight Loss" : dietPurpose === "muscle-build" ? "Muscle Building" : "Maintenance"}`, 10, y);
    y += 10;
    doc.text(`Target Calories: ${calorieGoal} per day`, 10, y);
    y += 10;
    
    // Add dietary restrictions
    if (restrictions.length > 0) {
      doc.text("Dietary Restrictions:", 10, y);
      y += 7;
      restrictions.forEach(restriction => {
        const label = dietaryRestrictions.find(r => r.value === restriction)?.label;
        doc.text(`- ${label}`, 12, y);
        y += 7;
      });
      y += 5;
    }
    
    // Add meal plan
    doc.text("Meal Plan:", 10, y);
    y += 10;
    
    Object.keys(selectedPlan).forEach(mealType => {
      doc.text(mealType.charAt(0).toUpperCase() + mealType.slice(1) + ":", 10, y);
      y += 7;
      
      selectedPlan[mealType].forEach((meal: any) => {
        doc.text(`- ${meal.name}`, 12, y);
        y += 7;
        doc.text(`  Calories: ${meal.calories} | Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g`, 12, y);
        y += 7;
        doc.text(`  Ingredients: ${meal.ingredients.join(", ")}`, 12, y);
        y += 10;
      });
    });
    
    doc.save("diet-plan.pdf");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Custom Diet Plan</h1>
            <p className="text-fitness-gray mt-1">
              Get a personalized nutrition plan tailored to your goals
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
            <span className="text-xs mt-2">Calorie Goal</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-fitness-green text-black" : "bg-fitness-dark-gray text-white"
            }`}>
              {step > 2 ? <Check className="h-5 w-5" /> : 2}
            </div>
            <span className="text-xs mt-2">Preferences</span>
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

        {/* Step 1: Calorie Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Set Your Daily Calorie Goal</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Enter your daily calorie target or calculate it if you don't know
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calorieGoal">Daily Calorie Target</Label>
                    <div className="flex mt-1.5">
                      <Input
                        id="calorieGoal"
                        type="number"
                        placeholder="e.g. 2000"
                        className="bg-fitness-dark-gray border-fitness-dark-gray rounded-r-none"
                        value={calorieGoal}
                        onChange={(e) => setCalorieGoal(e.target.value)}
                      />
                      <Button className="bg-fitness-green text-black hover:bg-fitness-green/80 rounded-l-none">
                        Set Goal
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-fitness-dark-gray" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-fitness-card-bg px-2 text-fitness-gray">
                        Or
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-fitness-dark-gray p-4 rounded-lg">
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center mr-3">
                        <Calculator className="h-5 w-5 text-fitness-green" />
                      </div>
                      <div>
                        <h3 className="font-medium">Need to calculate your calories?</h3>
                        <p className="text-sm text-fitness-gray mt-0.5">
                          Use our calorie calculator to get an accurate number
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-fitness-green text-fitness-green hover:bg-fitness-green/10"
                      onClick={() => window.location.href = "/calories"}
                    >
                      Open Calorie Calculator
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-fitness-green hover:bg-fitness-green/80 text-black"
                  onClick={() => setStep(2)}
                  disabled={!calorieGoal}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <div className="bg-fitness-dark-gray p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-fitness-green mr-3 flex-shrink-0" />
                <p className="text-sm text-fitness-gray">
                  For this demo, you can enter any number and proceed. In a complete application, this would be linked to your calorie calculator results.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Diet Preferences */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Diet Purpose</CardTitle>
                <CardDescription className="text-fitness-gray">
                  What's your primary goal for this diet plan?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={dietPurpose}
                  onValueChange={setDietPurpose}
                  className="space-y-4"
                >
                  <div className={`p-4 rounded-xl cursor-pointer border-2 transition-colors ${
                    dietPurpose === "weight-loss" 
                      ? "border-fitness-green bg-fitness-green/10" 
                      : "border-fitness-dark-gray bg-fitness-dark-gray hover:border-fitness-green/50"
                  }`}>
                    <RadioGroupItem 
                      value="weight-loss" 
                      id="weight-loss" 
                      className="sr-only"
                    />
                    <Label 
                      htmlFor="weight-loss" 
                      className="flex items-start cursor-pointer"
                    >
                      <div className="text-2xl mr-3">🔥</div>
                      <div>
                        <h3 className="font-medium">Weight Loss</h3>
                        <p className="text-sm text-fitness-gray mt-1">
                          Focus on lower-calorie, nutrient-dense meals to support fat loss while maintaining energy levels.
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`p-4 rounded-xl cursor-pointer border-2 transition-colors ${
                    dietPurpose === "muscle-build" 
                      ? "border-fitness-green bg-fitness-green/10" 
                      : "border-fitness-dark-gray bg-fitness-dark-gray hover:border-fitness-green/50"
                  }`}>
                    <RadioGroupItem 
                      value="muscle-build" 
                      id="muscle-build" 
                      className="sr-only"
                    />
                    <Label 
                      htmlFor="muscle-build" 
                      className="flex items-start cursor-pointer"
                    >
                      <div className="text-2xl mr-3">💪</div>
                      <div>
                        <h3 className="font-medium">Muscle Building</h3>
                        <p className="text-sm text-fitness-gray mt-1">
                          Higher protein and calorie meals to support muscle growth and recovery.
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`p-4 rounded-xl cursor-pointer border-2 transition-colors ${
                    dietPurpose === "maintenance" 
                      ? "border-fitness-green bg-fitness-green/10" 
                      : "border-fitness-dark-gray bg-fitness-dark-gray hover:border-fitness-green/50"
                  }`}>
                    <RadioGroupItem 
                      value="maintenance" 
                      id="maintenance" 
                      className="sr-only"
                    />
                    <Label 
                      htmlFor="maintenance" 
                      className="flex items-start cursor-pointer"
                    >
                      <div className="text-2xl mr-3">⚖️</div>
                      <div>
                        <h3 className="font-medium">Maintenance</h3>
                        <p className="text-sm text-fitness-gray mt-1">
                          Balanced meals to maintain your current weight and support overall health.
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Dietary Restrictions</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Select any dietary restrictions or preferences you have
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {dietaryRestrictions.map((restriction) => (
                    <div key={restriction.value} className="flex items-start space-x-3">
                      <Checkbox 
                        id={restriction.value} 
                        checked={restrictions.includes(restriction.value)}
                        onCheckedChange={() => handleRestrictionChange(restriction.value)}
                      />
                      <Label 
                        htmlFor={restriction.value}
                        className="text-sm cursor-pointer"
                      >
                        {restriction.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-fitness-card-bg border-fitness-dark-gray">
              <CardHeader>
                <CardTitle>Food Preferences</CardTitle>
                <CardDescription className="text-fitness-gray">
                  Select foods you want to include or exclude
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="include" className="mb-2 block">Foods to Include (optional)</Label>
                  <div className="flex">
                    <Input
                      id="include"
                      placeholder="e.g. chicken, broccoli, rice"
                      className="bg-fitness-dark-gray border-fitness-dark-gray rounded-r-none"
                    />
                    <Button 
                      variant="outline" 
                      className="border-fitness-dark-gray rounded-l-none"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="exclude" className="mb-2 block">Foods to Exclude (optional)</Label>
                  <div className="flex">
                    <Input
                      id="exclude"
                      placeholder="e.g. peanuts, shellfish"
                      className="bg-fitness-dark-gray border-fitness-dark-gray rounded-r-none"
                    />
                    <Button 
                      variant="outline" 
                      className="border-fitness-dark-gray rounded-l-none"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="border-fitness-dark-gray"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                
                <Button 
                  className="bg-fitness-green hover:bg-fitness-green/80 text-black"
                  onClick={generateDietPlan}
                >
                  Generate Diet Plan
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Step 3: Generated Plan */}
        {step === 3 && selectedPlan && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-bold">Your Custom Diet Plan</h2>
                <p className="text-fitness-gray mt-1">
                  Based on your {dietPurpose === "weight-loss" ? "weight loss" : dietPurpose === "muscle-build" ? "muscle building" : "maintenance"} goal with {calorieGoal} calorie target
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 space-x-2">
                <Button 
                  variant="outline" 
                  className="border-fitness-dark-gray"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
                
                <Button 
                  className="bg-fitness-green hover:bg-fitness-green/80 text-black"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Breakfast */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Coffee className="h-5 w-5 mr-2" />
                      Breakfast
                    </CardTitle>
                    <Badge className="bg-fitness-green text-black">
                      {selectedPlan.breakfast.length} meals
                    </Badge>
                  </div>
                  <CardDescription className="text-fitness-gray">
                    Morning meals to start your day
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {selectedPlan.breakfast.map((meal: any, i: number) => (
                    <div 
                      key={i} 
                      className="rounded-lg overflow-hidden bg-fitness-dark-gray"
                    >
                      <div className="aspect-video w-full relative">
                        <img 
                          src={meal.image} 
                          alt={meal.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-fitness-black/70 text-white">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium">{meal.name}</h4>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-fitness-gray">
                          <div>
                            <div className="font-medium text-white">Protein</div>
                            <div>{meal.protein}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Carbs</div>
                            <div>{meal.carbs}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Fat</div>
                            <div>{meal.fat}g</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Ingredients:</div>
                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.map((ingredient: string, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs border-fitness-dark-gray bg-fitness-black/30"
                              >
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-fitness-dark-gray hover:border-fitness-green hover:bg-fitness-green/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Option
                  </Button>
                </CardContent>
              </Card>
              
              {/* Lunch */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Utensils className="h-5 w-5 mr-2" />
                      Lunch
                    </CardTitle>
                    <Badge className="bg-fitness-green text-black">
                      {selectedPlan.lunch.length} meals
                    </Badge>
                  </div>
                  <CardDescription className="text-fitness-gray">
                    Midday meals for sustained energy
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {selectedPlan.lunch.map((meal: any, i: number) => (
                    <div 
                      key={i} 
                      className="rounded-lg overflow-hidden bg-fitness-dark-gray"
                    >
                      <div className="aspect-video w-full relative">
                        <img 
                          src={meal.image} 
                          alt={meal.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-fitness-black/70 text-white">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium">{meal.name}</h4>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-fitness-gray">
                          <div>
                            <div className="font-medium text-white">Protein</div>
                            <div>{meal.protein}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Carbs</div>
                            <div>{meal.carbs}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Fat</div>
                            <div>{meal.fat}g</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Ingredients:</div>
                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.map((ingredient: string, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs border-fitness-dark-gray bg-fitness-black/30"
                              >
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-fitness-dark-gray hover:border-fitness-green hover:bg-fitness-green/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Option
                  </Button>
                </CardContent>
              </Card>
              
              {/* Dinner */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <UtensilsCrossed className="h-5 w-5 mr-2" />
                      Dinner
                    </CardTitle>
                    <Badge className="bg-fitness-green text-black">
                      {selectedPlan.dinner.length} meals
                    </Badge>
                  </div>
                  <CardDescription className="text-fitness-gray">
                    Evening meals for recovery
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {selectedPlan.dinner.map((meal: any, i: number) => (
                    <div 
                      key={i} 
                      className="rounded-lg overflow-hidden bg-fitness-dark-gray"
                    >
                      <div className="aspect-video w-full relative">
                        <img 
                          src={meal.image} 
                          alt={meal.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-fitness-black/70 text-white">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium">{meal.name}</h4>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-fitness-gray">
                          <div>
                            <div className="font-medium text-white">Protein</div>
                            <div>{meal.protein}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Carbs</div>
                            <div>{meal.carbs}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Fat</div>
                            <div>{meal.fat}g</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Ingredients:</div>
                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.map((ingredient: string, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs border-fitness-dark-gray bg-fitness-black/30"
                              >
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-fitness-dark-gray hover:border-fitness-green hover:bg-fitness-green/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Option
                  </Button>
                </CardContent>
              </Card>
              
              {/* Snacks */}
              <Card className="bg-fitness-card-bg border-fitness-dark-gray">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Apple className="h-5 w-5 mr-2" />
                      Snacks
                    </CardTitle>
                    <Badge className="bg-fitness-green text-black">
                      {selectedPlan.snacks.length} options
                    </Badge>
                  </div>
                  <CardDescription className="text-fitness-gray">
                    Between meal options
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {selectedPlan.snacks.map((meal: any, i: number) => (
                    <div 
                      key={i} 
                      className="rounded-lg overflow-hidden bg-fitness-dark-gray"
                    >
                      <div className="aspect-video w-full relative">
                        <img 
                          src={meal.image} 
                          alt={meal.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-fitness-black/70 text-white">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium">{meal.name}</h4>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-fitness-gray">
                          <div>
                            <div className="font-medium text-white">Protein</div>
                            <div>{meal.protein}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Carbs</div>
                            <div>{meal.carbs}g</div>
                          </div>
                          <div>
                            <div className="font-medium text-white">Fat</div>
                            <div>{meal.fat}g</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Ingredients:</div>
                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.map((ingredient: string, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs border-fitness-dark-gray bg-fitness-black/30"
                              >
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-fitness-dark-gray hover:border-fitness-green hover:bg-fitness-green/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Option
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="bg-fitness-card-bg p-6 rounded-xl space-y-6">
              <h3 className="text-lg font-semibold">Diet Plan Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Total Calories</div>
                  <div className="text-2xl font-bold">{calculateTotalCalories(selectedPlan)}</div>
                  <div className="text-sm text-fitness-green">Daily</div>
                </div>
                
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Meal Options</div>
                  <div className="text-2xl font-bold">{countTotalMeals(selectedPlan)}</div>
                  <div className="text-sm text-fitness-green">To Choose From</div>
                </div>
                
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Diet Type</div>
                  <div className="text-xl font-bold">
                    {dietPurpose === "weight-loss" ? "Weight Loss" : dietPurpose === "muscle-build" ? "Muscle Building" : "Maintenance"}
                  </div>
                </div>
                
                <div className="bg-fitness-dark-gray p-4 rounded-lg text-center">
                  <div className="text-xs text-fitness-gray mb-1">Target Calories</div>
                  <div className="text-2xl font-bold">{calorieGoal}</div>
                  <div className="text-sm text-fitness-green">Per Day</div>
                </div>
              </div>
              
              <Separator className="bg-fitness-dark-gray" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="space-y-2 mb-4 md:mb-0">
                  <h4 className="font-medium">Diet Restrictions & Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {restrictions.length > 0 ? (
                      restrictions.map((restriction) => (
                        <Badge 
                          key={restriction} 
                          className="bg-fitness-dark-gray text-white border-fitness-dark-gray"
                        >
                          {dietaryRestrictions.find(r => r.value === restriction)?.label}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-fitness-gray">No restrictions selected</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomDietPlan;
