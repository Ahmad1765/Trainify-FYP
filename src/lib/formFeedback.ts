/**
 * Human-readable coaching for each exercise: the single most important
 * correction cue (shown live when form drifts) and the common mistakes to
 * avoid (shown as a reference guide). This is display-only text — it never
 * feeds the detector or the rep counter, so it can't affect counting.
 *
 * Keys match the WORKOUTS ids in LiveWorkoutTracker.
 */

export interface ExerciseCoaching {
  /** The primary correction to show when form is off. */
  cue: string;
  /** Common mistakes to avoid, shown in the reference panel. */
  mistakes: string[];
}

const COACHING: Record<string, ExerciseCoaching> = {
  'push-ups': {
    cue: 'Lower until your elbows reach ~90°, and keep your body in one straight line.',
    mistakes: ['Sagging or piking the hips', 'Flaring elbows out wide', 'Only doing half the range'],
  },
  'incline-push-ups': {
    cue: 'Keep hips in line with your shoulders and lower your chest to the surface.',
    mistakes: ['Dropping the hips', 'Short range of motion', 'Head jutting forward'],
  },
  'decline-push-ups': {
    cue: 'Keep your core tight and body straight; lower your chest under control.',
    mistakes: ['Hips sagging', 'Elbows flaring past 45°', 'Rushing the descent'],
  },
  'chest-dips': {
    cue: 'Lean your torso forward and lower until your elbows reach ~90°.',
    mistakes: ['Staying too upright', 'Shrugging the shoulders', 'Shallow dips'],
  },
  'pull-ups': {
    cue: 'Pull until your chin clears the bar, then lower all the way to full arm extension.',
    mistakes: ['Kipping/swinging', 'Not reaching full extension', 'Stopping short of the bar'],
  },
  'chin-ups': {
    cue: 'Drive your elbows down, chin over the bar, then control the way down.',
    mistakes: ['Half reps', 'Swinging for momentum', 'Rounding the shoulders'],
  },
  'inverted-rows': {
    cue: 'Keep your body straight and pull your chest to the bar, squeezing your back.',
    mistakes: ['Hips dropping', 'Not touching the bar', 'Using neck instead of back'],
  },
  'shoulder-press': {
    cue: 'Press straight overhead to nearly full extension without arching your back.',
    mistakes: ['Arching the lower back', 'Pressing forward, not up', 'Short lockout'],
  },
  'side-lateral-raise': {
    cue: 'Raise your arms out to the sides up to shoulder height — no higher.',
    mistakes: ['Swinging with momentum', 'Shrugging the traps', 'Going above shoulder height'],
  },
  'front-raise': {
    cue: 'Lift your arms straight in front to shoulder height, then lower slowly.',
    mistakes: ['Using body swing', 'Raising too high', 'Dropping the weight fast'],
  },
  'reverse-fly': {
    cue: 'Hinge forward, raise your arms out to the sides, and squeeze your shoulder blades.',
    mistakes: ['Standing too upright', 'Using momentum', 'Bending the elbows too much'],
  },
  'bicep-curl': {
    cue: 'Keep your elbows pinned to your sides and curl all the way up, then fully extend.',
    mistakes: ['Elbows drifting forward', 'Swinging the torso', 'Half reps'],
  },
  'hammer-curl': {
    cue: 'Palms facing in, elbows fixed — curl up fully and lower with control.',
    mistakes: ['Rocking for momentum', 'Elbows flaring out', 'Partial range'],
  },
  'tricep-dip': {
    cue: 'Keep your back close to the bench and lower until your elbows reach ~90°.',
    mistakes: ['Shallow dips', 'Shoulders rolling forward', 'Flaring elbows out'],
  },
  'overhead-tricep-extension': {
    cue: 'Keep your elbows high and close; lower behind your head, then extend fully.',
    mistakes: ['Elbows flaring wide', 'Short range', 'Arching the back'],
  },
  squats: {
    cue: 'Sit back and down until your thighs are near parallel; keep knees over your toes.',
    mistakes: ['Knees caving inward', 'Heels lifting', 'Not reaching depth'],
  },
  lunges: {
    cue: 'Lower until both knees are ~90°, front knee stacked over the ankle.',
    mistakes: ['Front knee past the toes', 'Short steps', 'Leaning too far forward'],
  },
  'bulgarian-split-squat': {
    cue: 'Drop your back knee toward the floor; keep the front shin near vertical.',
    mistakes: ['Front knee caving in', 'Too shallow', 'Leaning the torso forward'],
  },
  'calf-raise': {
    cue: 'Rise up onto the balls of your feet as high as you can, then lower slowly.',
    mistakes: ['Bouncing at the bottom', 'Short range', 'Rolling the ankles out'],
  },
  plank: {
    cue: 'Hold a straight line from head to heels — squeeze your core and glutes.',
    mistakes: ['Hips sagging or piking', 'Head dropping', 'Holding your breath'],
  },
  crunches: {
    cue: 'Curl your shoulders toward your hips using your abs, not your neck.',
    mistakes: ['Pulling on the neck', 'Using momentum', 'Lifting the whole back'],
  },
  'bicycle-crunch': {
    cue: 'Bring opposite elbow to knee and fully extend the other leg each rep.',
    mistakes: ['Yanking the neck', 'Going too fast', 'Not rotating the torso'],
  },
  'mountain-climbers': {
    cue: 'Keep your hips low and level while driving each knee toward your chest.',
    mistakes: ['Hips bouncing up', 'Short knee drive', 'Hands drifting back'],
  },
  'jumping-jacks': {
    cue: 'Raise your arms fully overhead as your feet jump out wide, in rhythm.',
    mistakes: ['Half arm raises', 'Feet barely moving', 'Landing on straight legs'],
  },
};

const FALLBACK: ExerciseCoaching = {
  cue: 'Match the reference: move through the full range with slow, controlled reps.',
  mistakes: ['Using momentum instead of control', 'Cutting the range short', 'Losing a neutral spine'],
};

export function getCoaching(exerciseId: string): ExerciseCoaching {
  return COACHING[exerciseId] ?? FALLBACK;
}

/**
 * The keypoints that matter most for each exercise. The live overlay highlights
 * these joints (and the bones touching them) so the user sees exactly which
 * body part to focus on — they pulse red when form is off, green when correct.
 */
export const FOCUS_JOINTS: Record<string, string[]> = {
  'push-ups': ['left_elbow', 'right_elbow'],
  'incline-push-ups': ['left_elbow', 'right_elbow'],
  'decline-push-ups': ['left_elbow', 'right_elbow'],
  'chest-dips': ['left_elbow', 'right_elbow'],
  'tricep-dip': ['left_elbow', 'right_elbow'],
  'pull-ups': ['left_elbow', 'right_elbow'],
  'chin-ups': ['left_elbow', 'right_elbow'],
  'inverted-rows': ['left_elbow', 'right_elbow'],
  'shoulder-press': ['left_elbow', 'right_elbow'],
  'overhead-tricep-extension': ['left_elbow', 'right_elbow'],
  'bicep-curl': ['left_elbow', 'right_elbow'],
  'hammer-curl': ['left_elbow', 'right_elbow'],
  'side-lateral-raise': ['left_wrist', 'right_wrist'],
  'front-raise': ['left_wrist', 'right_wrist'],
  'reverse-fly': ['left_wrist', 'right_wrist'],
  squats: ['left_knee', 'right_knee'],
  lunges: ['left_knee', 'right_knee'],
  'bulgarian-split-squat': ['left_knee', 'right_knee'],
  'calf-raise': ['left_ankle', 'right_ankle'],
  plank: ['left_hip', 'right_hip'],
  crunches: ['left_hip', 'right_hip'],
  'bicycle-crunch': ['left_hip', 'right_hip'],
  'mountain-climbers': ['left_knee', 'right_knee'],
  'jumping-jacks': ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle'],
};

export function getFocusJoints(exerciseId: string): string[] {
  return FOCUS_JOINTS[exerciseId] ?? [];
}
