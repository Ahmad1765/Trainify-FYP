import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { RepCounter, getRepSpec, type RepSpec } from "@/lib/repCounter";
import { confidentKeypoint, MIN_KEYPOINT_SCORE, type Keypoints } from "@/lib/poseGeometry";
import { KeypointSmoother } from "@/lib/poseSmoothing";
import { getCoaching, getFocusJoints } from "@/lib/formFeedback";
import { getCorrections, assessForm, type Correction } from "@/lib/formCorrection";
import { useCreateWorkoutSession } from "@/hooks/useWorkoutSessions";
import { WORKOUTS, type Workout } from "@/lib/workouts";
import SetupScreen from "@/components/live-tracker/SetupScreen";
import ImmersiveStage from "@/components/live-tracker/ImmersiveStage";
import SessionSummaryDialog from "@/components/live-tracker/SessionSummaryDialog";
import { romProgress } from "@/lib/rangeOfMotion";

const LiveWorkoutTracker = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  // On phones the frame is displayed portrait (a standing body barely fits a
  // 16:9 strip), so request a portrait stream to match; desktops keep 16:9.
  // If the camera ignores the request, the overlay canvas is object-cover too,
  // so the skeleton still crops-to-cover in lockstep with the video (aligned).
  const videoConstraints = useMemo(
    () =>
      isMobile
        ? { width: { ideal: 720 }, height: { ideal: 960 }, facingMode: "user" as const }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: 16 / 9, facingMode: "user" as const },
    [isMobile]
  );
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState(WORKOUTS[0]);
  const [repCount, setRepCount] = useState(0);
  // Accumulated active workout time in seconds. Ticks only while the webcam is
  // running and the session isn't paused, so pauses don't inflate the total.
  const [elapsedSec, setElapsedSec] = useState(0);
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

  // Drive the session timer. Run a 1s interval only while actively working out
  // (camera on, not paused, past the instructions overlay) so the displayed
  // time reflects real training time and freezes on pause.
  useEffect(() => {
    const running = isWebcamActive && !isPaused && !showInstructions;
    if (!running) return;
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isWebcamActive, isPaused, showInstructions]);

  // Format seconds as m:ss (e.g. 75 -> "1:15").
  const formatElapsed = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const requestAnimationRef = useRef<number | null>(null);

  // Speed-adaptive smoother for the drawn skeleton + geometry, so the overlay
  // stops shimmering on MoveNet's per-frame keypoint jitter. Reset on start /
  // reset / exercise switch so it never lerps from stale positions.
  const smootherRef = useRef(new KeypointSmoother());

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

  // Range-of-motion progress (0–1) for the coaching meter — a read-only view of
  // the same rep signal the counter consumes. Throttled like the coach line.
  const [rom, setRom] = useState<number | null>(null);
  const romRef = useRef<number | null>(null);
  const setRomThrottled = (v: number | null) => {
    // Only re-render on a visible change to avoid churn every frame.
    const prev = romRef.current;
    if (prev === null || v === null ? prev !== v : Math.abs(prev - v) > 0.02) {
      romRef.current = v;
      setRom(v);
    }
  };

  // Details slide-in panel (Train stage) + end-of-session summary dialog.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [summary, setSummary] = useState<
    { open: boolean; reps: number; durationLabel: string; goodFormPct: number | null; exerciseName: string }
  >({ open: false, reps: 0, durationLabel: "0:00", goodFormPct: null, exerciseName: "" });

  // Load TensorFlow.js and pose detector
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Prefer the GPU (WebGL) backend; fall back silently to whatever
        // tf.ready() selects (CPU/WASM) on devices without WebGL. The WebGL
        // backend ships inside the @tensorflow/tfjs union package we import.
        await tf.setBackend("webgl").catch(() => undefined);
        await tf.ready();

        // MoveNet Lightning: fast (>50 FPS), so the tracker feels responsive on
        // any machine. enableSmoothing applies MoveNet's built-in temporal
        // filter; we additionally run a speed-adaptive One-Euro filter
        // (KeypointSmoother) on the keypoints, which is what actually steadies
        // the drawn skeleton, plus the rep-signal EMA and the form debounce.
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
      setRomThrottled(null);
      smootherRef.current.reset();
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
    smootherRef.current.reset();
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
    // Snapshot recap values before state resets, then persist.
    const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const reps = repCounterRef.current?.counter.reps ?? 0;
    const { good, total } = formFramesRef.current;
    saveSession();
    setSummary({
      open: true,
      reps,
      durationLabel: formatElapsed(durationSec),
      goodFormPct: total > 0 ? Math.round((good / total) * 100) : null,
      exerciseName: selectedWorkout.name,
    });
    setDetailsOpen(false);

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
    setElapsedSec(0);
    setIsGoodForm(null);
    // Reset counter + timers. On an exercise switch selectedWorkout is still the
    // previous value here; the effect below rebuilds the spec once it updates.
    repCounterRef.current?.counter.reset();
    sessionStartRef.current = Date.now();
    formFramesRef.current = { good: 0, total: 0 };
    resetFormSmoothing();
    setRomThrottled(null);
    smootherRef.current.reset();
    if (!isPausedRef.current && isWebcamActive) {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      requestAnimationRef.current = requestAnimationFrame(detectPose);
    }
  };

  // Main pose detection function
  const detectPose = async () => {
    // Read live values from refs — the loop runs from one captured closure, so
    // reading React state here would use stale, loop-start values.
    const detector = detectorRef.current;

    // Paused: stop the loop entirely; togglePause reschedules it on resume.
    if (isPausedRef.current) return;

    // Refs can be momentarily null while the webcam element is (re)mounting.
    // Retry next frame instead of returning without rescheduling — the latter
    // would silently kill the detection loop and freeze the tracker.
    if (!detector || !webcamRef.current?.video || !canvasRef.current) {
      requestAnimationRef.current = requestAnimationFrame(detectPose);
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
          // Smooth the raw keypoints once, then feed the smoothed set to the
          // overlay AND the geometry — the skeleton stops shimmering and the form
          // arrows/verdict get steadier too.
          const keypoints = smootherRef.current.smooth(pose.keypoints as Keypoints, performance.now());

          // Form + corrections share ONE source of truth: the live fault
          // detector. The badge/skeleton verdict is derived from actual,
          // position-independent faults (hip sag, elbow flare, knee cave…), not
          // from whether the body is at peak contraction — so it no longer flips
          // red at the top/bottom of an otherwise-correct rep.
          const corrections = getCorrections(selectedWorkoutRef.current.id, keypoints);
          const rawForm = assessForm(selectedWorkoutRef.current.id, keypoints, corrections);

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
          if (counter) {
            const value = counter.spec.signal(keypoints);
            setRomThrottled(romProgress(value, counter.spec));
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

          // Draw skeleton from the smoothed keypoints so the overlay is steady.
          drawSkeleton(ctx, keypoints, displayForm);

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
    keypoints: Keypoints,
    formStatus: boolean | null
  ) => {
    if (!keypoints || keypoints.length === 0) return;

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
    keypoints.forEach((k) => {
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
    keypoints.forEach((k) => {
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
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-display-md">Live Workout Tracker</h1>
            <p className="mt-1 text-fitness-gray">AI-powered form detection and rep counting</p>
          </div>
          {!isWebcamActive && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className={strictForm ? "border-fitness-green/50 text-fitness-green" : "border-fitness-dark-gray"}
                onClick={() => setStrictForm((v) => !v)}
                title="Strict form: only count reps performed with good form"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Strict form: {strictForm ? "On" : "Off"}
              </Button>
              <Button
                variant="outline"
                className="border-fitness-dark-gray"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {isWebcamActive ? (
          <ImmersiveStage
            webcamRef={webcamRef}
            canvasRef={canvasRef}
            videoConstraints={videoConstraints}
            workout={selectedWorkout}
            showInstructions={showInstructions}
            onStartExercise={() => setShowInstructions(false)}
            detailsOpen={detailsOpen}
            onOpenDetails={() => setDetailsOpen(true)}
            onCloseDetails={() => setDetailsOpen(false)}
            repCount={repCount}
            elapsedLabel={formatElapsed(elapsedSec)}
            isGoodForm={isGoodForm}
            coachText={coach.text}
            coachTone={coach.tone}
            romProgress={rom}
            isPaused={isPaused}
            isSoundEnabled={isSoundEnabled}
            onPause={togglePause}
            onReset={resetWorkout}
            onCapture={captureSnapshot}
            onToggleSound={() => setIsSoundEnabled((v) => !v)}
            onExit={stopWebcam}
          />
        ) : (
          <SetupScreen
            selectedWorkout={selectedWorkout}
            onSelectWorkout={(id) => {
              const w = WORKOUTS.find((x) => x.id === id);
              if (w) {
                setSelectedWorkout(w);
                resetWorkout();
                setShowInstructions(true);
              }
            }}
            onStart={startWebcam}
            isModelLoading={isModelLoading}
          />
        )}
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

      <SessionSummaryDialog
        open={summary.open}
        exerciseName={summary.exerciseName}
        reps={summary.reps}
        durationLabel={summary.durationLabel}
        goodFormPct={summary.goodFormPct}
        onClose={() => setSummary((s) => ({ ...s, open: false }))}
      />
    </DashboardLayout>
  );
};

export default LiveWorkoutTracker;
