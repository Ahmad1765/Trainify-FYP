import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Play, 
  Pause, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Video,
  Volume2,
  VolumeX,
  Aperture
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { RepCounter, getRepSpec, type RepSpec } from "@/lib/repCounter";
import { confidentKeypoint, MIN_KEYPOINT_SCORE, type Keypoints } from "@/lib/poseGeometry";
import { getCoaching, getFocusJoints } from "@/lib/formFeedback";
import { getCorrections, type Correction } from "@/lib/formCorrection";
import { useCreateWorkoutSession } from "@/hooks/useWorkoutSessions";

// Sample workout data
const WORKOUTS = [
  // CHEST
  {
    id: 'push-ups',
    name: 'Push-ups',
    description: 'A classic bodyweight exercise for the chest, shoulders, and triceps.',
    instructions: [
      'Place your hands shoulder-width apart',
      'Keep your back straight and core engaged',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position',
    ],
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    recommendedReps: '10-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
  },
  {
    id: 'incline-push-ups',
    name: 'Incline Push-ups',
    description: 'Targets the upper chest and shoulders.',
    instructions: [
      'Place your hands on an elevated surface',
      'Keep your body straight',
      'Lower your chest to the surface',
      'Push back up',
    ],
    targetMuscles: ['Chest', 'Shoulders'],
    recommendedReps: '10-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/cyJgTTUu6qk',
  },
  {
    id: 'decline-push-ups',
    name: 'Decline Push-ups',
    description: 'Targets the lower chest.',
    instructions: [
      'Place your feet on an elevated surface',
      'Keep your body straight',
      'Lower your chest to the floor',
      'Push back up',
    ],
    targetMuscles: ['Chest', 'Shoulders'],
    recommendedReps: '10-15',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/0yQwY6f8ZcE',
  },
  {
    id: 'chest-dips',
    name: 'Chest Dips',
    description: 'Targets the lower chest and triceps.',
    instructions: [
      'Use parallel bars',
      'Lean forward as you dip',
      'Lower until elbows are at 90 degrees',
      'Push back up',
    ],
    targetMuscles: ['Chest', 'Triceps'],
    recommendedReps: '8-12',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As',
  },
  // BACK
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    description: 'A compound back exercise using a bar.',
    instructions: [
      'Hang from a bar with palms facing away',
      'Pull your chin above the bar',
      'Lower back down with control',
    ],
    targetMuscles: ['Back', 'Biceps'],
    recommendedReps: '5-10',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
  },
  {
    id: 'chin-ups',
    name: 'Chin-ups',
    description: 'Similar to pull-ups but with palms facing you.',
    instructions: [
      'Hang from a bar with palms facing you',
      'Pull your chin above the bar',
      'Lower back down with control',
    ],
    targetMuscles: ['Back', 'Biceps'],
    recommendedReps: '5-10',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/b-ztMQpj8yc',
  },
  {
    id: 'inverted-rows',
    name: 'Inverted Rows',
    description: 'A horizontal pulling exercise for the back.',
    instructions: [
      'Lie under a bar',
      'Pull your chest to the bar',
      'Lower back down',
    ],
    targetMuscles: ['Back', 'Biceps'],
    recommendedReps: '8-12',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/5pW6rG6A8b8',
  },
  // SHOULDERS
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    description: 'A strength exercise targeting the shoulders and triceps.',
    instructions: [
      'Stand or sit with a straight back',
      'Hold weights at shoulder height',
      'Press the weights overhead until arms are fully extended',
      'Lower back to shoulder height',
    ],
    targetMuscles: ['Shoulders', 'Triceps'],
    recommendedReps: '8-12',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/B-aVuyhvLHU',
  },
  {
    id: 'side-lateral-raise',
    name: 'Side Lateral Raise',
    description: 'Targets the lateral deltoids for shoulder width.',
    instructions: [
      'Stand with arms at your sides, holding weights',
      'Raise your arms out to the sides until shoulder height',
      'Lower back down slowly',
    ],
    targetMuscles: ['Shoulders'],
    recommendedReps: '10-15',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    description: 'Targets the front deltoids.',
    instructions: [
      'Stand with arms at your sides, holding weights',
      'Raise your arms in front to shoulder height',
      'Lower back down slowly',
    ],
    targetMuscles: ['Shoulders'],
    recommendedReps: '10-15',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/-t7fuZ0KhDA',
  },
  {
    id: 'reverse-fly',
    name: 'Reverse Fly',
    description: 'Targets the rear deltoids and upper back.',
    instructions: [
      'Bend forward at the hips',
      'Raise your arms out to the sides',
      'Squeeze your shoulder blades',
      'Lower back down',
    ],
    targetMuscles: ['Shoulders', 'Upper Back'],
    recommendedReps: '10-15',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc',
  },
  // BICEPS
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    description: 'An isolation exercise for the biceps.',
    instructions: [
      'Stand with arms at your sides, holding weights',
      'Curl the weights up toward your shoulders',
      'Keep elbows close to your torso',
      'Lower the weights back down',
    ],
    targetMuscles: ['Biceps'],
    recommendedReps: '10-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    description: 'Variation of bicep curl with neutral grip.',
    instructions: [
      'Stand with arms at your sides, holding weights',
      'Curl the weights up with palms facing each other',
      'Lower the weights back down',
    ],
    targetMuscles: ['Biceps', 'Forearms'],
    recommendedReps: '10-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
  },
  // TRICEPS
  {
    id: 'tricep-dip',
    name: 'Tricep Dip',
    description: 'Targets the triceps using bodyweight.',
    instructions: [
      'Sit on a chair or bench, hands next to hips',
      'Slide forward and lower your body by bending elbows',
      'Push back up to starting position',
    ],
    targetMuscles: ['Triceps'],
    recommendedReps: '10-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    description: 'Targets the long head of the triceps.',
    instructions: [
      'Hold a weight overhead with both hands',
      'Lower the weight behind your head',
      'Extend your arms back up',
    ],
    targetMuscles: ['Triceps'],
    recommendedReps: '10-15',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q',
  },
  // LEGS
  {
    id: 'squats',
    name: 'Squats',
    description: 'A compound exercise that strengthens the lower body and core.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep your chest up and back straight',
      'Lower your body as if sitting in a chair',
      'Push through your heels to return to standing',
    ],
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    recommendedReps: '12-15',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'A unilateral exercise that builds strength and stability in the lower body.',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg and lower your body',
      'Keep your front knee over your ankle',
      'Push back up and repeat with the other leg',
    ],
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    recommendedReps: '10-12 per leg',
    level: 'Beginner-Intermediate',
    videoUrl: 'https://www.youtube.com/embed/QE_hU8XX48I',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    description: 'A single-leg squat variation for quads and glutes.',
    instructions: [
      'Place one foot behind on a bench',
      'Lower your back knee toward the ground',
      'Push through your front heel to stand',
    ],
    targetMuscles: ['Quadriceps', 'Glutes'],
    recommendedReps: '8-12 per leg',
    level: 'Intermediate',
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    description: 'Targets the calf muscles.',
    instructions: [
      'Stand upright',
      'Push through the balls of your feet to raise your heels',
      'Lower back down',
    ],
    targetMuscles: ['Calves'],
    recommendedReps: '15-20',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
  },
  // ABS
  {
    id: 'plank',
    name: 'Plank',
    description: 'An isometric core exercise that improves stability and endurance.',
    instructions: [
      'Start in a push-up position',
      'Keep your body in a straight line from head to heels',
      'Engage your core and hold the position',
    ],
    targetMuscles: ['Core', 'Shoulders', 'Back'],
    recommendedReps: 'Hold for 30-60 seconds',
    level: 'All Levels',
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw',
  },
  {
    id: 'crunches',
    name: 'Crunches',
    description: 'Targets the upper abdominals.',
    instructions: [
      'Lie on your back with knees bent',
      'Lift your shoulders off the ground',
      'Squeeze your abs at the top',
      'Lower back down',
    ],
    targetMuscles: ['Abs'],
    recommendedReps: '15-20',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/Xyd_fa5zoEU',
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    description: 'Targets the obliques and upper abs.',
    instructions: [
      'Lie on your back',
      'Bring opposite elbow to opposite knee',
      'Alternate sides in a pedaling motion',
    ],
    targetMuscles: ['Abs', 'Obliques'],
    recommendedReps: '15-20',
    level: 'Beginner',
    videoUrl: 'https://www.youtube.com/embed/9FGilxCbdz8',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'A dynamic core and cardio exercise.',
    instructions: [
      'Start in a plank position',
      'Drive one knee toward your chest',
      'Switch legs quickly, alternating knees',
    ],
    targetMuscles: ['Core', 'Cardio'],
    recommendedReps: '20-30',
    level: 'All Levels',
    videoUrl: 'https://www.youtube.com/embed/nmwgirgXLYM',
  },
  // FULL BODY/CARDIO
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'A full-body cardio exercise that increases heart rate.',
    instructions: [
      'Stand upright with feet together and arms at your sides',
      'Jump up, spreading your feet and raising your arms overhead',
      'Return to the starting position',
    ],
    targetMuscles: ['Full Body', 'Cardio'],
    recommendedReps: '20-30',
    level: 'All Levels',
    videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtF8',
  },
];

const LiveWorkoutTracker = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState(WORKOUTS[0]);
  const [repCount, setRepCount] = useState(0);
  const [isGoodForm, setIsGoodForm] = useState<boolean | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  // Strict form: when on, a rep only counts if its form was good enough. Off by
  // default so approximate form rules never suppress legitimate reps.
  const [strictForm, setStrictForm] = useState(false);
  const strictFormRef = useRef(false);
  useEffect(() => { strictFormRef.current = strictForm; }, [strictForm]);
  const requestAnimationRef = useRef<number | null>(null);

  // Rep-counting state machine + session bookkeeping.
  const repCounterRef = useRef<{ counter: RepCounter; spec: RepSpec } | null>(null);
  const sessionStartRef = useRef<number>(0);
  const formFramesRef = useRef<{ good: number; total: number }>({ good: 0, total: 0 });
  const createSession = useCreateWorkoutSession();

  // The detection loop runs from a single captured closure, so anything it reads
  // from React state would otherwise be frozen at loop-start. Mirror the values
  // it needs into refs and keep them current.
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const isPausedRef = useRef(false);
  const selectedWorkoutRef = useRef(selectedWorkout);
  useEffect(() => { detectorRef.current = detector; }, [detector]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { selectedWorkoutRef.current = selectedWorkout; }, [selectedWorkout]);

  // Temporal debounce for the form label: only flip after several consecutive
  // frames agree, so the readout (and the sound) stop flickering on noise.
  const FORM_FLIP_FRAMES = 5;
  const stableFormRef = useRef<boolean | null>(null);
  const pendingFormRef = useRef<{ value: boolean; count: number }>({ value: false, count: 0 });
  const resetFormSmoothing = () => {
    stableFormRef.current = null;
    pendingFormRef.current = { value: false, count: 0 };
    coachRef.current = '';
  };

  // Always-on coaching line, driven by the (validated) rep signal so the user
  // always sees the tracker reacting to their movement in real time.
  const [coach, setCoach] = useState<{ text: string; tone: 'good' | 'warn' | 'info' }>({
    text: 'Position your body in the frame to begin.',
    tone: 'info',
  });
  const coachRef = useRef('');
  const setCoachThrottled = (text: string, tone: 'good' | 'warn' | 'info') => {
    if (coachRef.current !== text) {
      coachRef.current = text;
      setCoach({ text, tone });
    }
  };

  // Load TensorFlow.js and pose detector
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Prefer the GPU (WebGL) backend; fall back silently to whatever
        // tf.ready() selects (CPU/WASM) on devices without WebGL. The WebGL
        // backend ships inside the @tensorflow/tfjs union package we import.
        await tf.setBackend("webgl").catch(() => undefined);
        await tf.ready();

        // MoveNet Lightning: fast (>50 FPS), so the skeleton tracks smoothly and
        // the tracker feels responsive on any machine. enableSmoothing applies
        // MoveNet's built-in temporal filter on top of our own EMA/debounce.
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25,
        };

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );

        // Warm up: run one inference so the first real frame doesn't pay the
        // shader-compile / kernel-init cost mid-workout. A tensor input has no
        // currentTime, so pass an explicit timestamp for the smoothing filter.
        try {
          const warm = tf.zeros([256, 256, 3]) as tf.Tensor3D;
          await detector.estimatePoses(warm, undefined, performance.now());
          warm.dispose();
        } catch {
          // Warmup is best-effort; ignore failures.
        }

        setDetector(detector);
        setIsModelLoading(false);

        toast({
          title: "AI Model loaded",
          description: "Pose detection ready — start your camera.",
        });
      } catch (error) {
        console.error("Error loading models:", error);
        toast({
          title: "Error loading AI model",
          description: "There was a problem loading the pose detection model. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadModels();
    
    return () => {
      // Clean up
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, []);

  // Play feedback sounds (simplified for this example)
  const playSound = useCallback((type: 'success' | 'error') => {
    if (!isSoundEnabled) return;
    
    // In a real implementation, you would play actual sound files
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      } else {
        oscillator.frequency.value = 300;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [isSoundEnabled]);

  // When the exercise changes mid-session, rebuild the counter with the new
  // exercise's signal + thresholds (runs after selectedWorkout has updated).
  useEffect(() => {
    if (isWebcamActive) {
      const spec = getRepSpec(selectedWorkout.id);
      repCounterRef.current = spec ? { counter: new RepCounter(spec), spec } : null;
      sessionStartRef.current = Date.now();
      formFramesRef.current = { good: 0, total: 0 };
      resetFormSmoothing();
      setIsGoodForm(null);
      setRepCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkout.id]);

  // Set up a fresh rep counter + session timers for the current exercise.
  const beginSession = () => {
    const spec = getRepSpec(selectedWorkout.id);
    repCounterRef.current = spec ? { counter: new RepCounter(spec), spec } : null;
    sessionStartRef.current = Date.now();
    formFramesRef.current = { good: 0, total: 0 };
    resetFormSmoothing();
  };

  // Persist the just-finished session (if it has anything worth recording).
  const saveSession = () => {
    const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const reps = repCounterRef.current?.counter.reps ?? 0;
    const { good, total } = formFramesRef.current;
    // Skip trivial/empty sessions.
    if (durationSec < 3 || (reps === 0 && total === 0)) return;

    createSession.mutate({
      exerciseId: selectedWorkout.id,
      exerciseName: selectedWorkout.name,
      reps,
      durationSec,
      goodFormPct: total > 0 ? Math.round((good / total) * 100) : null,
    });
    toast({
      title: "Workout saved",
      description: `${selectedWorkout.name}: ${reps} rep${reps === 1 ? "" : "s"} in ${durationSec}s.`,
    });
  };

  // Start webcam and pose detection
  const startWebcam = async () => {
    try {
      // Check if webcam is available
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStream.getTracks().forEach(track => track.stop()); // Stop the stream after testing
      
      setIsWebcamActive(true);
      setShowInstructions(true);

      // Reset rep count and form status
      setRepCount(0);
      setIsGoodForm(null);

      // Begin a fresh session and rep counter for the selected exercise.
      beginSession();

      // Start the detection loop in the next frame
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      requestAnimationRef.current = requestAnimationFrame(detectPose);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setShowPermissionDialog(true);
    }
  };

  // Stop webcam and pose detection
  const stopWebcam = () => {
    // Record the session before tearing everything down.
    saveSession();

    setIsWebcamActive(false);
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    
    // Stop the webcam stream
    const videoElement = webcamRef.current?.video;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }
  };

  // Snapshot the current frame + skeleton overlay and download it as a PNG.
  // Composited mirrored so the saved image matches the on-screen (mirror) view.
  const captureSnapshot = () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4 || video.videoWidth === 0) {
      toast({
        title: "Camera not ready",
        description: "Start the camera before capturing a snapshot.",
        variant: "destructive",
      });
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Mirror the frame + overlay to match what the user sees on screen.
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0, w, h);
    ctx.restore();

    // Burn in a small caption (drawn un-mirrored, on top).
    ctx.fillStyle = "rgba(8,11,10,0.72)";
    ctx.fillRect(16, h - 74, 240, 58);
    ctx.fillStyle = "#1FDD80";
    ctx.font = "bold 34px Inter, sans-serif";
    ctx.fillText(`${repCount} reps`, 28, h - 34);
    ctx.fillStyle = "#93A29B";
    ctx.font = "500 15px Inter, sans-serif";
    ctx.fillText(selectedWorkout.name, 28, h - 54);

    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trainify-${selectedWorkout.id}-${repCount}reps-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");

    toast({ title: "Snapshot saved", description: "The image was downloaded to your device." });
  };

  // Toggle pause state. Drives isPausedRef synchronously so the loop's guard and
  // the resume-reschedule can't race the state update.
  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    if (!next && isWebcamActive) {
      if (requestAnimationRef.current) cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = requestAnimationFrame(detectPose);
    }
  };

  // Reset workout
  const resetWorkout = () => {
    setRepCount(0);
    setIsGoodForm(null);
    // Reset counter + timers. On an exercise switch selectedWorkout is still the
    // previous value here; the effect below rebuilds the spec once it updates.
    repCounterRef.current?.counter.reset();
    sessionStartRef.current = Date.now();
    formFramesRef.current = { good: 0, total: 0 };
    resetFormSmoothing();
    if (!isPausedRef.current && isWebcamActive) {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      requestAnimationRef.current = requestAnimationFrame(detectPose);
    }
  };

  // Analyze the pose and determine if the form is correct
  const analyzePose = (pose: poseDetection.Pose) => {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
      return null;
    }
    const keypoints = pose.keypoints;
    // Presence gate: don't demand the *whole* body be visible (an upper-body
    // exercise legitimately has the legs off-frame). Just require enough
    // confident keypoints to know a person is really there.
    const confidentCount = keypoints.filter((kp) => (kp.score ?? 0) >= MIN_KEYPOINT_SCORE).length;
    if (confidentCount < 4) {
      return null;
    }
    // Confidence-gated getter: an occluded/low-confidence joint reads as
    // "not seen" so a case's checks skip rather than act on noisy coordinates.
    const get = (name: string) => confidentKeypoint(keypoints as Keypoints, name);
    // Shoulder-width scale so pixel distance checks stop depending on how far
    // the user stands from the camera / the video resolution. `rel(px)` converts
    // an old constant (tuned at ~160px shoulder width) into the equivalent
    // fraction of the current shoulder width, preserving behaviour at that
    // reference framing while scaling everywhere else. Falls back to the raw
    // pixel value if shoulders aren't both visible.
    const _ls = get('left_shoulder');
    const _rs = get('right_shoulder');
    const _shoulderW = _ls && _rs ? Math.hypot(_ls.x - _rs.x, _ls.y - _rs.y) : 0;
    const rel = (px: number) => (_shoulderW > 0 ? (px / 160) * _shoulderW : px);
    // Helper to calculate angle between three points
    const angle = (a: any, b: any, c: any) => {
      if (!a || !b || !c) return null;
      const ab = { x: a.x - b.x, y: a.y - b.y };
      const cb = { x: c.x - b.x, y: c.y - b.y };
      const dot = ab.x * cb.x + ab.y * cb.y;
      const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
      const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
      if (magAB === 0 || magCB === 0) return null;
      let theta = Math.acos(dot / (magAB * magCB));
      return theta * (180 / Math.PI);
    };
    // Helper to check vertical distance (for crunches, etc)
    const verticalDist = (a: any, b: any) => a && b ? Math.abs(a.y - b.y) : null;
    // Helper to check horizontal distance (for rows, etc)
    const horizontalDist = (a: any, b: any) => a && b ? Math.abs(a.x - b.x) : null;
    switch (selectedWorkoutRef.current.id) {
      // CHEST
      case 'push-ups': {
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle) {
          return leftAngle > 60 && leftAngle < 100 && rightAngle > 60 && rightAngle < 100;
        }
        break;
      }
      case 'incline-push-ups': {
        // Similar to push-ups, but hips should be higher than shoulders
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle && leftHip && rightHip && leftShoulder && rightShoulder) {
          const hipsAboveShoulders = leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;
          return leftAngle > 60 && leftAngle < 100 && rightAngle > 60 && rightAngle < 100 && hipsAboveShoulders;
        }
        break;
      }
      case 'decline-push-ups': {
        // Similar to push-ups, but hips should be lower than shoulders
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle && leftHip && rightHip && leftShoulder && rightShoulder) {
          const hipsBelowShoulders = leftHip.y > leftShoulder.y && rightHip.y > rightShoulder.y;
          return leftAngle > 60 && leftAngle < 100 && rightAngle > 60 && rightAngle < 100 && hipsBelowShoulders;
        }
        break;
      }
      case 'chest-dips': {
        // Elbow angle < 90, torso leans forward
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle && leftShoulder && rightShoulder) {
          const torsoLean = Math.abs(leftShoulder.x - rightShoulder.x) > rel(40); // crude lean check
          return leftAngle < 100 && rightAngle < 100 && torsoLean;
        }
        break;
      }
      // BACK
      case 'pull-ups':
      case 'chin-ups': {
        // Elbows below shoulders, wrists above elbows
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        if (leftShoulder && leftElbow && leftWrist && rightShoulder && rightElbow && rightWrist) {
          const leftGood = leftWrist.y < leftElbow.y && leftElbow.y < leftShoulder.y;
          const rightGood = rightWrist.y < rightElbow.y && rightElbow.y < rightShoulder.y;
          return leftGood && rightGood;
        }
        break;
      }
      case 'inverted-rows': {
        // Shoulders and hips should be in line, elbows bent
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        const leftElbow = get('left_elbow');
        const rightElbow = get('right_elbow');
        if (leftShoulder && rightShoulder && leftHip && rightHip && leftElbow && rightElbow) {
          const bodyStraight = Math.abs(leftShoulder.y - leftHip.y) < rel(40) && Math.abs(rightShoulder.y - rightHip.y) < rel(40);
          const elbowsBent = leftElbow.y < leftShoulder.y && rightElbow.y < rightShoulder.y;
          return bodyStraight && elbowsBent;
        }
        break;
      }
      // SHOULDERS
      case 'shoulder-press': {
        // Elbow below shoulder at bottom, arms straight at top
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle) {
          return leftAngle > 150 && rightAngle > 150;
        }
        break;
      }
      case 'side-lateral-raise': {
        // Arms at shoulder height
        const leftShoulder = get('left_shoulder');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightWrist = get('right_wrist');
        if (leftShoulder && leftWrist && rightShoulder && rightWrist) {
          const leftAtHeight = Math.abs(leftWrist.y - leftShoulder.y) < rel(40);
          const rightAtHeight = Math.abs(rightWrist.y - rightShoulder.y) < rel(40);
          return leftAtHeight && rightAtHeight;
        }
        break;
      }
      case 'front-raise': {
        // Arms in front at shoulder height
        const leftShoulder = get('left_shoulder');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightWrist = get('right_wrist');
        if (leftShoulder && leftWrist && rightShoulder && rightWrist) {
          const leftFront = Math.abs(leftWrist.y - leftShoulder.y) < rel(40) && leftWrist.x > leftShoulder.x;
          const rightFront = Math.abs(rightWrist.y - rightShoulder.y) < rel(40) && rightWrist.x < rightShoulder.x;
          return leftFront && rightFront;
        }
        break;
      }
      case 'reverse-fly': {
        // Arms out to sides, torso bent (shoulders lower than hips)
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        const leftWrist = get('left_wrist');
        const rightWrist = get('right_wrist');
        if (leftShoulder && rightShoulder && leftHip && rightHip && leftWrist && rightWrist) {
          const torsoBent = leftShoulder.y > leftHip.y && rightShoulder.y > rightHip.y;
          const armsOut = Math.abs(leftWrist.y - leftShoulder.y) < rel(40) && Math.abs(rightWrist.y - rightShoulder.y) < rel(40);
          return torsoBent && armsOut;
        }
        break;
      }
      // BICEPS
      case 'bicep-curl': {
        // Elbow angle should decrease as you curl
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle) {
          return leftAngle < 70 && rightAngle < 70;
        }
        break;
      }
      case 'hammer-curl': {
        // Similar to bicep curl, but wrists neutral
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle) {
          return leftAngle < 70 && rightAngle < 70;
        }
        break;
      }
      // TRICEPS
      case 'tricep-dip': {
        // Elbow angle < 90 at bottom
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        const leftAngle = angle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = angle(rightShoulder, rightElbow, rightWrist);
        if (leftAngle && rightAngle) {
          return leftAngle < 100 && rightAngle < 100;
        }
        break;
      }
      case 'overhead-tricep-extension': {
        // Elbow above shoulder, wrist behind head
        const leftShoulder = get('left_shoulder');
        const leftElbow = get('left_elbow');
        const leftWrist = get('left_wrist');
        const rightShoulder = get('right_shoulder');
        const rightElbow = get('right_elbow');
        const rightWrist = get('right_wrist');
        if (leftShoulder && leftElbow && leftWrist && rightShoulder && rightElbow && rightWrist) {
          const leftGood = leftElbow.y < leftShoulder.y && leftWrist.y < leftElbow.y;
          const rightGood = rightElbow.y < rightShoulder.y && rightWrist.y < rightElbow.y;
          return leftGood && rightGood;
        }
        break;
      }
      // LEGS
      case 'squats': {
        const leftHip = get('left_hip');
        const leftKnee = get('left_knee');
        const leftAnkle = get('left_ankle');
        const rightHip = get('right_hip');
        const rightKnee = get('right_knee');
        const rightAnkle = get('right_ankle');
        const leftAngle = angle(leftHip, leftKnee, leftAnkle);
        const rightAngle = angle(rightHip, rightKnee, rightAnkle);
        if (leftAngle && rightAngle) {
          return leftAngle < 100 && rightAngle < 100;
        }
        break;
      }
      case 'lunges': {
        const leftHip = get('left_hip');
        const leftKnee = get('left_knee');
        const leftAnkle = get('left_ankle');
        const rightHip = get('right_hip');
        const rightKnee = get('right_knee');
        const rightAnkle = get('right_ankle');
        const leftAngle = angle(leftHip, leftKnee, leftAnkle);
        const rightAngle = angle(rightHip, rightKnee, rightAnkle);
        if (leftAngle && rightAngle) {
          return (leftAngle > 80 && leftAngle < 110) || (rightAngle > 80 && rightAngle < 110);
        }
        break;
      }
      case 'bulgarian-split-squat': {
        // One knee bent, one leg extended back
        const leftHip = get('left_hip');
        const leftKnee = get('left_knee');
        const leftAnkle = get('left_ankle');
        const rightHip = get('right_hip');
        const rightKnee = get('right_knee');
        const rightAnkle = get('right_ankle');
        if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle) {
          const leftAngle = angle(leftHip, leftKnee, leftAnkle);
          const rightAngle = angle(rightHip, rightKnee, rightAnkle);
          return (leftAngle < 100 && rightAngle > 140) || (rightAngle < 100 && leftAngle > 140);
        }
        break;
      }
      case 'calf-raise': {
        // Ankles above toes, hips and shoulders aligned
        const leftAnkle = get('left_ankle');
        const rightAnkle = get('right_ankle');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        if (leftAnkle && rightAnkle && leftHip && rightHip && leftShoulder && rightShoulder) {
          const hipsAligned = Math.abs(leftHip.y - rightHip.y) < rel(20);
          const shouldersAligned = Math.abs(leftShoulder.y - rightShoulder.y) < rel(20);
          const onToes = leftAnkle.y < leftHip.y && rightAnkle.y < rightHip.y;
          return hipsAligned && shouldersAligned && onToes;
        }
        break;
      }
      // ABS
      case 'plank': {
        // Body should be in a straight line: shoulder-hip-ankle angle ~170-180
        const leftShoulder = get('left_shoulder');
        const leftHip = get('left_hip');
        const leftAnkle = get('left_ankle');
        const rightShoulder = get('right_shoulder');
        const rightHip = get('right_hip');
        const rightAnkle = get('right_ankle');
        const leftAngle = angle(leftShoulder, leftHip, leftAnkle);
        const rightAngle = angle(rightShoulder, rightHip, rightAnkle);
        if (leftAngle && rightAngle) {
          return leftAngle > 160 && rightAngle > 160;
        }
        break;
      }
      case 'crunches': {
        // Shoulders above hips, vertical distance reduced
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        const leftHip = get('left_hip');
        const rightHip = get('right_hip');
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const avgHipY = (leftHip.y + rightHip.y) / 2;
          return avgShoulderY < avgHipY - rel(30);
        }
        break;
      }
      case 'bicycle-crunch': {
        // Elbow and opposite knee close
        const leftElbow = get('left_elbow');
        const rightKnee = get('right_knee');
        const rightElbow = get('right_elbow');
        const leftKnee = get('left_knee');
        if (leftElbow && rightKnee && rightElbow && leftKnee) {
          const leftClose = Math.abs(leftElbow.x - rightKnee.x) < rel(40) && Math.abs(leftElbow.y - rightKnee.y) < rel(40);
          const rightClose = Math.abs(rightElbow.x - leftKnee.x) < rel(40) && Math.abs(rightElbow.y - leftKnee.y) < rel(40);
          return leftClose || rightClose;
        }
        break;
      }
      case 'mountain-climbers': {
        // Knee close to chest
        const leftHip = get('left_hip');
        const leftKnee = get('left_knee');
        const rightHip = get('right_hip');
        const rightKnee = get('right_knee');
        if (leftHip && leftKnee && rightHip && rightKnee) {
          const leftClose = Math.abs(leftKnee.y - leftHip.y) < rel(60);
          const rightClose = Math.abs(rightKnee.y - rightHip.y) < rel(60);
          return leftClose || rightClose;
        }
        break;
      }
      // FULL BODY/CARDIO
      case 'jumping-jacks': {
        // Arms above head, legs apart
        const leftWrist = get('left_wrist');
        const rightWrist = get('right_wrist');
        const leftAnkle = get('left_ankle');
        const rightAnkle = get('right_ankle');
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        if (leftWrist && rightWrist && leftAnkle && rightAnkle && leftShoulder && rightShoulder) {
          const armsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
          const legsApart = Math.abs(leftAnkle.x - rightAnkle.x) > rel(150);
          return armsUp && legsApart;
        }
        break;
      }
      default:
        return null;
    }
    return null;
  };

  // Main pose detection function
  const detectPose = async () => {
    // Read live values from refs — the loop runs from one captured closure, so
    // reading React state here would use stale, loop-start values.
    const detector = detectorRef.current;
    if (!detector || !webcamRef.current || !webcamRef.current.video || !canvasRef.current || isPausedRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationRef.current = requestAnimationFrame(detectPose);
      return;
    }
    
    // Resize canvas to match video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    try {
      // Detect poses
      const poses = await detector.estimatePoses(video);
      
      // Draw the results
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        
        // Draw the skeleton if we have poses
        if (poses && poses.length > 0) {
          const pose = poses[0]; // We only care about the first detected person

          // Raw per-frame form verdict (may be null when uncertain).
          const rawForm = analyzePose(pose);

          if (rawForm !== null) {
            // Track form quality for the session's good-form percentage.
            formFramesRef.current.total += 1;
            if (rawForm) formFramesRef.current.good += 1;

            // Debounce the displayed verdict: require FORM_FLIP_FRAMES agreeing
            // frames before flipping the label + playing a sound. This is what
            // stops the good/bad flicker and the sound spam.
            if (rawForm === stableFormRef.current) {
              pendingFormRef.current.count = 0;
            } else if (pendingFormRef.current.value === rawForm) {
              pendingFormRef.current.count += 1;
              if (pendingFormRef.current.count >= FORM_FLIP_FRAMES) {
                stableFormRef.current = rawForm;
                pendingFormRef.current.count = 0;
                setIsGoodForm(rawForm);
                playSound(rawForm ? 'success' : 'error');
              }
            } else {
              pendingFormRef.current = { value: rawForm, count: 1 };
            }
          }

          // Colour the skeleton by the *stable* verdict so it doesn't strobe.
          const displayForm = stableFormRef.current;

          // Rep counting is a state machine fed by the exercise signal,
          // independent of the form flag. A rep is a full movement cycle.
          const counter = repCounterRef.current;
          const corrections = getCorrections(selectedWorkoutRef.current.id, pose.keypoints as Keypoints);
          if (counter) {
            const value = counter.spec.signal(pose.keypoints as Keypoints);
            const repped = counter.counter.update(value, performance.now(), {
              formOk: displayForm,
              requireGoodForm: strictFormRef.current,
              minGoodFrac: 0.5,
            });
            if (repped) {
              setRepCount(counter.counter.reps);
              playSound('success');
            }

            // Always-on coaching from the live signal, so the tracker visibly
            // reacts every frame. Priority: a fault correction > rep depth cue.
            if (corrections.length > 0) {
              setCoachThrottled(getCoaching(selectedWorkoutRef.current.id).cue, 'warn');
            } else if (counter.spec.isometric) {
              setCoachThrottled('Hold steady — keep your body in one straight line.', 'good');
            } else if (value === null) {
              setCoachThrottled('Make sure the working limbs are in frame.', 'info');
            } else if (value >= counter.spec.upAbove) {
              setCoachThrottled('Start position — lower into the rep.', 'info');
            } else if (value > counter.spec.downBelow) {
              setCoachThrottled('Keep going — go through the full range.', 'warn');
            } else {
              setCoachThrottled('Great depth — now return to the start.', 'good');
            }
          }

          // Draw skeleton
          drawSkeleton(ctx, pose, videoWidth, videoHeight, displayForm);

          // Show where the user is wrong and where to move — a ghost of the
          // correct limb + an arrow, derived from their own keypoints.
          drawCorrections(ctx, corrections);
        }
      }
    } catch (error) {
      console.error("Error during pose detection:", error);
    }
    
    // Continue the detection loop
    requestAnimationRef.current = requestAnimationFrame(detectPose);
  };

  // Draw the corrective skeleton. The body is drawn dim; the joints/bones that
  // matter for the current exercise are emphasized and colour-coded by form
  // (green = correct, red = fix this, white = not sure) so the user sees exactly
  // which body part to correct. Focus joints pulse to draw the eye.
  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    pose: poseDetection.Pose,
    _videoWidth: number,
    _videoHeight: number,
    formStatus: boolean | null
  ) => {
    if (!pose || !pose.keypoints) return;

    const focusColor =
      formStatus === true ? '#1FDD80' : formStatus === false ? '#F0616D' : '#EAEAEA';
    const dim = 'rgba(255,255,255,0.28)';

    const focus = new Set(getFocusJoints(selectedWorkoutRef.current.id));

    const connections = [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle'],
    ];

    const keypointMap = new Map<string, { x: number; y: number }>();
    pose.keypoints.forEach((k) => {
      if (k.name && k.score && k.score > 0.4) keypointMap.set(k.name, k);
    });

    ctx.lineCap = 'round';

    // Pass 1: dim bones (the whole body, for context).
    ctx.strokeStyle = dim;
    ctx.lineWidth = 3;
    for (const [from, to] of connections) {
      if (focus.has(from) || focus.has(to)) continue; // drawn highlighted below
      const a = keypointMap.get(from);
      const b = keypointMap.get(to);
      if (a && b) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Pass 2: highlighted bones touching a focus joint, in the form colour.
    ctx.strokeStyle = focusColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = focusColor;
    ctx.shadowBlur = 12;
    for (const [from, to] of connections) {
      if (!(focus.has(from) || focus.has(to))) continue;
      const a = keypointMap.get(from);
      const b = keypointMap.get(to);
      if (a && b) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // Dim dots for every visible joint.
    ctx.fillStyle = dim;
    pose.keypoints.forEach((k) => {
      if (k.name && k.score && k.score > 0.4 && !focus.has(k.name)) {
        ctx.beginPath();
        ctx.arc(k.x, k.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Focus joints: a pulsing ring + solid centre in the form colour. When form
    // is off these pulse red on the exact joints the user needs to correct.
    const pulse = 1 + 0.35 * Math.sin(performance.now() / 180);
    ctx.fillStyle = focusColor;
    ctx.strokeStyle = focusColor;
    focus.forEach((name) => {
      const k = keypointMap.get(name);
      if (!k) return;
      ctx.beginPath();
      ctx.arc(k.x, k.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = formStatus === false ? 0.9 : 0.5;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(k.x, k.y, 14 * pulse, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  };

  // Draw on-camera corrections: a green ghost of where the limb *should* be,
  // plus an arrow from the user's joint to the target. Derived from the user's
  // own body, so it matches their scale/orientation. Shown only when off.
  const drawCorrections = (ctx: CanvasRenderingContext2D, corrections: Correction[]) => {
    const arrow = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const ang = Math.atan2(to.y - from.y, to.x - from.x);
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      // Trim so the arrow sits between the joint dots, not buried under them.
      const trim = Math.min(12, dist * 0.25);
      const sx = from.x + Math.cos(ang) * trim;
      const sy = from.y + Math.sin(ang) * trim;
      const ex = to.x - Math.cos(ang) * trim;
      const ey = to.y - Math.sin(ang) * trim;
      const head = 18;
      const drawPath = () => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - head * Math.cos(ang - Math.PI / 7), ey - head * Math.sin(ang - Math.PI / 7));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - head * Math.cos(ang + Math.PI / 7), ey - head * Math.sin(ang + Math.PI / 7));
        ctx.stroke();
      };
      // Dark underlay for contrast against any background.
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 8;
      drawPath();
      // Bright yellow arrow on top.
      ctx.strokeStyle = '#FFD84D';
      ctx.lineWidth = 4;
      drawPath();
    };

    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(performance.now() / 250));

    for (const c of corrections) {
      // Ghost of the corrected limb (where it should be).
      ctx.strokeStyle = '#1FDD80';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(31,221,128,0.6)';
      ctx.shadowBlur = 12;
      if (c.anchor) {
        ctx.beginPath();
        ctx.moveTo(c.anchor.x, c.anchor.y);
        ctx.lineTo(c.target.x, c.target.y);
        ctx.stroke();
      }
      if (c.end) {
        ctx.beginPath();
        ctx.moveTo(c.target.x, c.target.y);
        ctx.lineTo(c.end.x, c.end.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Target marker (correct position).
      ctx.fillStyle = '#1FDD80';
      ctx.beginPath();
      ctx.arc(c.target.x, c.target.y, 7, 0, 2 * Math.PI);
      ctx.fill();

      // Current (wrong) joint — pulsing red.
      ctx.fillStyle = '#F0616D';
      ctx.beginPath();
      ctx.arc(c.current.x, c.current.y, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#F0616D';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(c.current.x, c.current.y, 14 * pulse, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Arrow: move from here -> to there.
      ctx.strokeStyle = '#FFD84D';
      ctx.lineWidth = 3;
      arrow(c.current, c.target);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-display-md">Live Workout Tracker</h1>
            <p className="text-fitness-gray mt-1">
              AI-powered form detection and rep counting
            </p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-fitness-green text-fitness-green">
                  <Info className="h-4 w-4 mr-2" />
                  How it Works
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-fitness-card-bg border-fitness-dark-gray">
                <AlertDialogHeader>
                  <AlertDialogTitle>How the Live Tracker Works</AlertDialogTitle>
                  <AlertDialogDescription className="text-fitness-gray">
                    <ul className="list-disc list-inside space-y-2 mt-2">
                      <li>
                        The tracker uses AI to analyze your movements through your webcam
                      </li>
                      <li>
                        It will highlight your body with a skeleton overlay
                      </li>
                      <li>
                        Green indicates proper form, red indicates incorrect form
                      </li>
                      <li>
                        Reps are counted automatically when performed correctly
                      </li>
                      <li>
                        All processing happens directly in your browser - your video is not stored or sent to any server
                      </li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="bg-fitness-green text-black hover:bg-fitness-green/80">
                    Got it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="outline"
              className={strictForm ? "border-fitness-green/50 text-fitness-green" : "border-fitness-dark-gray"}
              onClick={() => setStrictForm((v) => !v)}
              title="Strict form: only count reps performed with good form"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Strict form: {strictForm ? "On" : "Off"}
            </Button>

            <Button
              variant="outline"
              className="border-fitness-dark-gray"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            >
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main webcam and controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-fitness-card-bg p-4 rounded-xl">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {isWebcamActive ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      mirrored={true}
                      videoConstraints={{
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        aspectRatio: 16 / 9,
                        facingMode: "user",
                      }}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    {/* Mirror the overlay to match the mirrored feed so the
                        skeleton tracks the body instead of its reflection. */}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full -scale-x-100"
                    />

                    {/* HUD corner frame (decorative) */}
                    <div className="pointer-events-none absolute inset-3">
                      <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-fitness-green/60" />
                      <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-fitness-green/60" />
                      <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-fitness-green/60" />
                      <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-fitness-green/60" />
                    </div>

                    {/* LIVE indicator */}
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/10 bg-fitness-black/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fitness-error opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-fitness-error" />
                      </span>
                      Live
                    </div>

                    {/* Form feedback */}
                    {isGoodForm !== null && (
                      <div className={`absolute right-4 top-4 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold backdrop-blur ${
                          isGoodForm
                            ? 'border-fitness-success/40 bg-fitness-success/15 text-fitness-success'
                            : 'border-fitness-error/40 bg-fitness-error/15 text-fitness-error'
                        }`}
                      >
                        {isGoodForm ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Good Form
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Adjust Form
                          </>
                        )}
                      </div>
                    )}

                    {/* Rep counter HUD */}
                    <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-fitness-black/80 px-4 py-2.5 backdrop-blur">
                      <div className="text-4xl font-extrabold leading-none text-fitness-green tabular-nums">
                        {repCount}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-fitness-gray">
                        Reps · {selectedWorkout.name}
                      </div>
                    </div>

                    {/* Always-on coaching banner — reacts to your movement live */}
                    {!showInstructions && (
                      <div className="absolute inset-x-4 bottom-4 flex justify-center sm:left-40">
                        <div
                          className={`flex items-center gap-2 rounded-xl border bg-fitness-black/85 px-4 py-2.5 text-sm backdrop-blur ${
                            coach.tone === 'good'
                              ? 'border-fitness-success/40 text-fitness-success'
                              : coach.tone === 'warn'
                              ? 'border-fitness-error/40 text-white'
                              : 'border-white/10 text-fitness-gray'
                          }`}
                        >
                          {coach.tone === 'good' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          ) : coach.tone === 'warn' ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-fitness-error" />
                          ) : (
                            <Info className="h-4 w-4 shrink-0" />
                          )}
                          <span>{coach.text}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Instructions overlay */}
                    {showInstructions && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col p-8">
                        <h3 className="text-xl font-bold mb-4">{selectedWorkout.name}</h3>
                        <ul className="space-y-2 text-sm mb-6">
                          {selectedWorkout.instructions.map((instruction, i) => (
                            <li key={i} className="flex items-start">
                              <div className="h-5 w-5 rounded-full bg-fitness-green text-black flex items-center justify-center text-xs mr-2 mt-0.5">
                                {i+1}
                              </div>
                              {instruction}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="bg-fitness-green text-black hover:bg-fitness-green/80"
                          onClick={() => setShowInstructions(false)}
                        >
                          Start Exercise
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    {isModelLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-fitness-green mb-4"></div>
                        <p className="text-fitness-gray">Loading AI model...</p>
                      </>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 text-fitness-gray mb-4" />
                        <p className="text-fitness-gray mb-4">Ready to start your workout</p>
                        <Button 
                          className="bg-fitness-green text-black hover:bg-fitness-green/80"
                          onClick={startWebcam}
                          disabled={isModelLoading}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isWebcamActive ? (
                    <>
                      <Button 
                        onClick={stopWebcam}
                        variant="destructive"
                      >
                        Stop
                      </Button>
                      <Button 
                        onClick={togglePause}
                        variant="outline"
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={resetWorkout}
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={captureSnapshot}
                        variant="outline"
                        className="border-fitness-green/40 text-fitness-green hover:bg-fitness-green/10"
                        title="Capture snapshot"
                      >
                        <Aperture className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="bg-fitness-green text-black hover:bg-fitness-green/80"
                      onClick={startWebcam}
                      disabled={isModelLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
                
                <Select
                  value={selectedWorkout.id}
                  onValueChange={(value) => {
                    const workout = WORKOUTS.find(w => w.id === value);
                    if (workout) {
                      setSelectedWorkout(workout);
                      resetWorkout();
                      setShowInstructions(true);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-fitness-dark-gray border-fitness-dark-gray">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="bg-fitness-card-bg border-fitness-dark-gray">
                    {WORKOUTS.map((workout) => (
                      <SelectItem key={workout.id} value={workout.id}>
                        {workout.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Workout details and instructions */}
          <div className="space-y-4">
            <div className="bg-fitness-card-bg rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedWorkout.name}</h2>
                <div className="px-2 py-1 bg-fitness-green/20 text-fitness-green rounded text-xs">
                  {selectedWorkout.level}
                </div>
              </div>
              
              <p className="text-fitness-gray text-sm mb-4">
                {selectedWorkout.description}
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Target Muscles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkout.targetMuscles.map((muscle, index) => (
                      <div 
                        key={index} 
                        className="px-3 py-1 bg-fitness-dark-gray rounded-full text-xs"
                      >
                        {muscle}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Recommended</h3>
                  <div className="flex items-center text-fitness-gray">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Reps</div>
                      <div className="text-xs">{selectedWorkout.recommendedReps}</div>
                    </div>
                    <Separator orientation="vertical" className="h-8 bg-fitness-dark-gray" />
                    <div className="flex-1 pl-4">
                      <div className="text-sm font-medium">Sets</div>
                      <div className="text-xs">3-4</div>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-fitness-dark-gray" />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">How to do it right</h3>
                  <ul className="space-y-2 text-sm">
                    {selectedWorkout.instructions.map((instruction, i) => (
                      <li key={i} className="flex items-start text-fitness-gray">
                        <div className="h-5 w-5 rounded-full bg-fitness-green/20 text-fitness-green flex items-center justify-center text-xs mr-2 mt-0.5">
                          {i+1}
                        </div>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary form cue — the one thing to focus on */}
                <div className="rounded-lg border border-fitness-green/25 bg-fitness-green/10 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fitness-green" />
                    <div>
                      <h3 className="text-sm font-medium text-fitness-green">Form focus</h3>
                      <p className="mt-1 text-sm text-fitness-gray">
                        {getCoaching(selectedWorkout.id).cue}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Common mistakes to avoid */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Avoid these mistakes</h3>
                  <ul className="space-y-2 text-sm">
                    {getCoaching(selectedWorkout.id).mistakes.map((m, i) => (
                      <li key={i} className="flex items-start text-fitness-gray">
                        <XCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-fitness-error" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Tutorial Video</h3>
                  <div className="aspect-video bg-fitness-dark-gray rounded-lg overflow-hidden">
                    <iframe
                      src={selectedWorkout.videoUrl}
                      className="w-full h-full"
                      title={`${selectedWorkout.name} tutorial`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-fitness-card-bg rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-fitness-green/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-fitness-green" />
                </div>
                <div>
                  <h3 className="font-medium">Form Tips</h3>
                  <p className="text-sm text-fitness-gray mt-1">
                    Maintain proper form to prevent injuries and maximize results.
                  </p>
                </div>
              </div>
              
              <div className="flex mt-4">
                <Button 
                  variant="outline" 
                  className="border-fitness-dark-gray w-full"
                  onClick={() => setShowInstructions(true)}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Show Instructions
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Workout navigation and history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-fitness-card-bg rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Workout Navigation</h2>
            <div className="flex justify-between items-center">
              <Button variant="outline" className="border-fitness-dark-gray">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <span className="text-fitness-gray">
                Exercise {WORKOUTS.findIndex(w => w.id === selectedWorkout.id) + 1} of {WORKOUTS.length}
              </span>
              
              <Button 
                variant="outline" 
                className="border-fitness-dark-gray"
                onClick={() => {
                  const currentIndex = WORKOUTS.findIndex(w => w.id === selectedWorkout.id);
                  const nextIndex = (currentIndex + 1) % WORKOUTS.length;
                  setSelectedWorkout(WORKOUTS[nextIndex]);
                  resetWorkout();
                  setShowInstructions(true);
                }}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="bg-fitness-card-bg rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Session Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-fitness-dark-gray p-3 rounded-lg">
                <div className="text-2xl font-bold">{repCount}</div>
                <div className="text-xs text-fitness-gray">Total Reps</div>
              </div>
              <div className="bg-fitness-dark-gray p-3 rounded-lg">
                <div className="text-2xl font-bold">1</div>
                <div className="text-xs text-fitness-gray">Exercises</div>
              </div>
              <div className="bg-fitness-dark-gray p-3 rounded-lg">
                <div className="text-2xl font-bold">0:00</div>
                <div className="text-xs text-fitness-gray">Time</div>
              </div>
            </div>
            <div className="mt-4">
              <Button className="w-full bg-fitness-green hover:bg-fitness-green/80 text-black">
                Complete Workout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Webcam permission dialog */}
      <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <AlertDialogContent className="bg-fitness-card-bg border-fitness-dark-gray">
          <AlertDialogHeader>
            <AlertDialogTitle>Camera Permission Required</AlertDialogTitle>
            <AlertDialogDescription className="text-fitness-gray">
              The Live Workout Tracker needs access to your camera to analyze your workout form.
              Please allow camera access in your browser settings and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-fitness-green text-black hover:bg-fitness-green/80">
              Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default LiveWorkoutTracker;
