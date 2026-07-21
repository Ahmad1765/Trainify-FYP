export type WorkoutCategory =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Abs'
  | 'Cardio';

export interface Workout {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  recommendedReps: string;
  level: string;
  videoUrl: string;
  category: WorkoutCategory;
}

/** Display order for the Setup category rail. */
export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Abs',
  'Cardio',
];

export const WORKOUTS: Workout[] = [
  // CHEST
  { id: 'push-ups', name: 'Push-ups', description: 'A classic bodyweight exercise for the chest, shoulders, and triceps.', instructions: ['Place your hands shoulder-width apart', 'Keep your back straight and core engaged', 'Lower your body until your chest nearly touches the floor', 'Push back up to the starting position'], targetMuscles: ['Chest', 'Shoulders', 'Triceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4', category: 'Chest' },
  { id: 'incline-push-ups', name: 'Incline Push-ups', description: 'Targets the upper chest and shoulders.', instructions: ['Place your hands on an elevated surface', 'Keep your body straight', 'Lower your chest to the surface', 'Push back up'], targetMuscles: ['Chest', 'Shoulders'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/cyJgTTUu6qk', category: 'Chest' },
  { id: 'decline-push-ups', name: 'Decline Push-ups', description: 'Targets the lower chest.', instructions: ['Place your feet on an elevated surface', 'Keep your body straight', 'Lower your chest to the floor', 'Push back up'], targetMuscles: ['Chest', 'Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/0yQwY6f8ZcE', category: 'Chest' },
  { id: 'chest-dips', name: 'Chest Dips', description: 'Targets the lower chest and triceps.', instructions: ['Use parallel bars', 'Lean forward as you dip', 'Lower until elbows are at 90 degrees', 'Push back up'], targetMuscles: ['Chest', 'Triceps'], recommendedReps: '8-12', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As', category: 'Chest' },
  // BACK
  { id: 'pull-ups', name: 'Pull-ups', description: 'A compound back exercise using a bar.', instructions: ['Hang from a bar with palms facing away', 'Pull your chin above the bar', 'Lower back down with control'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '5-10', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g', category: 'Back' },
  { id: 'chin-ups', name: 'Chin-ups', description: 'Similar to pull-ups but with palms facing you.', instructions: ['Hang from a bar with palms facing you', 'Pull your chin above the bar', 'Lower back down with control'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '5-10', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/b-ztMQpj8yc', category: 'Back' },
  { id: 'inverted-rows', name: 'Inverted Rows', description: 'A horizontal pulling exercise for the back.', instructions: ['Lie under a bar', 'Pull your chest to the bar', 'Lower back down'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '8-12', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/5pW6rG6A8b8', category: 'Back' },
  // SHOULDERS
  { id: 'shoulder-press', name: 'Shoulder Press', description: 'A strength exercise targeting the shoulders and triceps.', instructions: ['Stand or sit with a straight back', 'Hold weights at shoulder height', 'Press the weights overhead until arms are fully extended', 'Lower back to shoulder height'], targetMuscles: ['Shoulders', 'Triceps'], recommendedReps: '8-12', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/B-aVuyhvLHU', category: 'Shoulders' },
  { id: 'side-lateral-raise', name: 'Side Lateral Raise', description: 'Targets the lateral deltoids for shoulder width.', instructions: ['Stand with arms at your sides, holding weights', 'Raise your arms out to the sides until shoulder height', 'Lower back down slowly'], targetMuscles: ['Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo', category: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', description: 'Targets the front deltoids.', instructions: ['Stand with arms at your sides, holding weights', 'Raise your arms in front to shoulder height', 'Lower back down slowly'], targetMuscles: ['Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/-t7fuZ0KhDA', category: 'Shoulders' },
  { id: 'reverse-fly', name: 'Reverse Fly', description: 'Targets the rear deltoids and upper back.', instructions: ['Bend forward at the hips', 'Raise your arms out to the sides', 'Squeeze your shoulder blades', 'Lower back down'], targetMuscles: ['Shoulders', 'Upper Back'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc', category: 'Shoulders' },
  // BICEPS
  { id: 'bicep-curl', name: 'Bicep Curl', description: 'An isolation exercise for the biceps.', instructions: ['Stand with arms at your sides, holding weights', 'Curl the weights up toward your shoulders', 'Keep elbows close to your torso', 'Lower the weights back down'], targetMuscles: ['Biceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo', category: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', description: 'Variation of bicep curl with neutral grip.', instructions: ['Stand with arms at your sides, holding weights', 'Curl the weights up with palms facing each other', 'Lower the weights back down'], targetMuscles: ['Biceps', 'Forearms'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4', category: 'Biceps' },
  // TRICEPS
  { id: 'tricep-dip', name: 'Tricep Dip', description: 'Targets the triceps using bodyweight.', instructions: ['Sit on a chair or bench, hands next to hips', 'Slide forward and lower your body by bending elbows', 'Push back up to starting position'], targetMuscles: ['Triceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM', category: 'Triceps' },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', description: 'Targets the long head of the triceps.', instructions: ['Hold a weight overhead with both hands', 'Lower the weight behind your head', 'Extend your arms back up'], targetMuscles: ['Triceps'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q', category: 'Triceps' },
  // LEGS
  { id: 'squats', name: 'Squats', description: 'A compound exercise that strengthens the lower body and core.', instructions: ['Stand with feet shoulder-width apart', 'Keep your chest up and back straight', 'Lower your body as if sitting in a chair', 'Push through your heels to return to standing'], targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], recommendedReps: '12-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U', category: 'Legs' },
  { id: 'lunges', name: 'Lunges', description: 'A unilateral exercise that builds strength and stability in the lower body.', instructions: ['Stand tall with feet hip-width apart', 'Step forward with one leg and lower your body', 'Keep your front knee over your ankle', 'Push back up and repeat with the other leg'], targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'], recommendedReps: '10-12 per leg', level: 'Beginner-Intermediate', videoUrl: 'https://www.youtube.com/embed/QE_hU8XX48I', category: 'Legs' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', description: 'A single-leg squat variation for quads and glutes.', instructions: ['Place one foot behind on a bench', 'Lower your back knee toward the ground', 'Push through your front heel to stand'], targetMuscles: ['Quadriceps', 'Glutes'], recommendedReps: '8-12 per leg', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE', category: 'Legs' },
  { id: 'calf-raise', name: 'Calf Raise', description: 'Targets the calf muscles.', instructions: ['Stand upright', 'Push through the balls of your feet to raise your heels', 'Lower back down'], targetMuscles: ['Calves'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc', category: 'Legs' },
  // ABS
  { id: 'plank', name: 'Plank', description: 'An isometric core exercise that improves stability and endurance.', instructions: ['Start in a push-up position', 'Keep your body in a straight line from head to heels', 'Engage your core and hold the position'], targetMuscles: ['Core', 'Shoulders', 'Back'], recommendedReps: 'Hold for 30-60 seconds', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw', category: 'Abs' },
  { id: 'crunches', name: 'Crunches', description: 'Targets the upper abdominals.', instructions: ['Lie on your back with knees bent', 'Lift your shoulders off the ground', 'Squeeze your abs at the top', 'Lower back down'], targetMuscles: ['Abs'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/Xyd_fa5zoEU', category: 'Abs' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', description: 'Targets the obliques and upper abs.', instructions: ['Lie on your back', 'Bring opposite elbow to opposite knee', 'Alternate sides in a pedaling motion'], targetMuscles: ['Abs', 'Obliques'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/9FGilxCbdz8', category: 'Abs' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', description: 'A dynamic core and cardio exercise.', instructions: ['Start in a plank position', 'Drive one knee toward your chest', 'Switch legs quickly, alternating knees'], targetMuscles: ['Core', 'Cardio'], recommendedReps: '20-30', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/nmwgirgXLYM', category: 'Abs' },
  // FULL BODY/CARDIO
  { id: 'jumping-jacks', name: 'Jumping Jacks', description: 'A full-body cardio exercise that increases heart rate.', instructions: ['Stand upright with feet together and arms at your sides', 'Jump up, spreading your feet and raising your arms overhead', 'Return to the starting position'], targetMuscles: ['Full Body', 'Cardio'], recommendedReps: '20-30', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtF8', category: 'Cardio' },
];

export function getWorkoutsByCategory(category: WorkoutCategory): Workout[] {
  return WORKOUTS.filter((w) => w.category === category);
}
