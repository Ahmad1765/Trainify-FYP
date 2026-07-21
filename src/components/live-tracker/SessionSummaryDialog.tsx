import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionSummaryDialogProps {
  open: boolean;
  exerciseName: string;
  reps: number;
  durationLabel: string;
  goodFormPct: number | null;
  onClose: () => void;
}

/** End-of-session recap shown on Stop. Uses the values already computed for saving. */
const SessionSummaryDialog = ({
  open,
  exerciseName,
  reps,
  durationLabel,
  goodFormPct,
  onClose,
}: SessionSummaryDialogProps) => (
  <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <AlertDialogContent className="border-fitness-dark-gray bg-fitness-card-bg">
      <AlertDialogHeader>
        <AlertDialogTitle>Session complete</AlertDialogTitle>
        <AlertDialogDescription className="text-fitness-gray">
          Nice work on {exerciseName}. Here's your recap.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums text-fitness-green">{reps}</div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Reps</div>
        </div>
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums">{durationLabel}</div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Time</div>
        </div>
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums">
            {goodFormPct === null ? "–" : `${goodFormPct}%`}
          </div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Good form</div>
        </div>
      </div>
      <AlertDialogFooter>
        <AlertDialogAction
          onClick={onClose}
          className="bg-fitness-green text-black hover:bg-fitness-green/80"
        >
          Done
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default SessionSummaryDialog;
