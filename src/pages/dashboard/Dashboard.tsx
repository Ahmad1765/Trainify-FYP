import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, displayNameOf } from "@/hooks/useProfile";
import { useWorkoutSessions, useWorkoutStats } from "@/hooks/useWorkoutSessions";
import { formatDuration, relativeDay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Clock,
  Calendar,
  Activity,
  ChevronRight,
  Flame,
  Repeat,
  Video,
  Camera,
  Dumbbell,
  Calculator,
  Utensils,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";

const upcomingWorkouts = [
  { id: 1, name: "Leg Day", scheduled: "Tomorrow, 6:00 PM", duration: "40 min" },
  { id: 2, name: "Core Strength", scheduled: "Thursday, 7:30 AM", duration: "25 min" },
];

const shortcuts = [
  { to: "/workouts", label: "Tutorials", sub: "Guided videos", icon: Video },
  { to: "/live-tracker", label: "Live Tracker", sub: "AI form check", icon: Camera },
  { to: "/workout-plan", label: "Workout Plan", sub: "Build a routine", icon: Dumbbell },
  { to: "/calories", label: "Calories", sub: "Daily target", icon: Calculator },
  { to: "/diet-plan", label: "Diet Plan", sub: "Meals & macros", icon: Utensils },
];

/** Build the trailing-7-day series (oldest → newest) from the session log. */
function buildWeekSeries(sessions: { created_at: string; reps: number }[]) {
  const days: { label: string; date: string; workouts: number; reps: number }[] = [];
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    days.push({ label: dow[d.getDay()], date: key, workouts: 0, reps: 0 });
  }
  const index = new Map(days.map((d) => [d.date, d]));
  for (const s of sessions) {
    const key = new Date(s.created_at).toLocaleDateString("en-CA");
    const bucket = index.get(key);
    if (bucket) {
      bucket.workouts += 1;
      bucket.reps += s.reps;
    }
  }
  return days;
}

const ChartTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-fitness-black/95 px-3 py-2 text-xs shadow-elevation-2">
      <div className="font-medium text-white">{label}</div>
      <div className="text-fitness-green">
        {payload[0].value} {unit}
      </div>
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  series,
  dataKey,
  unit,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ElementType;
  series: any[];
  dataKey: string;
  unit: string;
}) => (
  <div className="surface surface-hover flex flex-col p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-fitness-gray">{label}</p>
        <h3 className="mt-1 text-display-sm tabular-nums">{value}</h3>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fitness-green/12 text-fitness-green ring-1 ring-fitness-green/20">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1FDD80" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#1FDD80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={<ChartTooltip unit={unit} />}
            cursor={{ stroke: "#1FDD80", strokeOpacity: 0.2 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#1FDD80"
            strokeWidth={2}
            fill={`url(#spark-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-2 text-xs text-fitness-gray">{hint}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useWorkoutSessions();
  const { stats } = useWorkoutStats();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const weekAgo = Date.now() - 7 * 86_400_000;
  const workoutsThisWeek = sessions.filter(
    (s) => new Date(s.created_at).getTime() >= weekAgo
  ).length;
  const recentWorkouts = sessions.slice(0, 3);
  const week = buildWeekSeries(sessions);
  const maxWorkouts = Math.max(1, ...week.map((d) => d.workouts));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-display-md">
              Welcome back, {displayNameOf(profile, user?.email).split(" ")[0]}
            </h1>
            <p className="mt-1 text-fitness-gray">{formattedDate}</p>
          </div>
          <Link to="/live-tracker">
            <Button size="lg">
              Start Workout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* KPI cards (real data via useWorkoutStats) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Daily Streak"
            value={`${stats.currentStreakDays} ${stats.currentStreakDays === 1 ? "Day" : "Days"}`}
            hint={`Longest streak: ${stats.longestStreakDays} ${stats.longestStreakDays === 1 ? "day" : "days"}`}
            icon={Flame}
            series={week}
            dataKey="workouts"
            unit="workouts"
          />
          <KpiCard
            label="This Week"
            value={`${workoutsThisWeek}`}
            hint="Workouts in the last 7 days"
            icon={Activity}
            series={week}
            dataKey="workouts"
            unit="workouts"
          />
          <KpiCard
            label="Total Time"
            value={formatDuration(stats.totalDurationSec)}
            hint={`${stats.totalWorkouts} sessions all-time`}
            icon={Clock}
            series={week}
            dataKey="reps"
            unit="reps"
          />
          <KpiCard
            label="Total Reps"
            value={stats.totalReps.toLocaleString()}
            hint="Counted across every session"
            icon={Repeat}
            series={week}
            dataKey="reps"
            unit="reps"
          />
        </div>

        {/* Activity chart + shortcuts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="surface p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Weekly Activity</h2>
                <p className="text-sm text-fitness-gray">Workouts logged over the last 7 days</p>
              </div>
              <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-xs text-fitness-gray">
                {workoutsThisWeek} this week
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#93A29B", fontSize: 12 }}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="workouts" />}
                    cursor={{ fill: "rgba(31,221,128,0.06)" }}
                  />
                  <Bar dataKey="workouts" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {week.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.workouts >= maxWorkouts && d.workouts > 0 ? "#1FDD80" : "#2C3A33"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface flex flex-col p-6">
            <h2 className="mb-4 text-lg font-semibold">Jump back in</h2>
            <div className="flex flex-1 flex-col gap-2">
              {shortcuts.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.03]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fitness-green/12 text-fitness-green">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-xs text-fitness-gray">{s.sub}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-fitness-gray transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent + Upcoming */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Workouts */}
          <div className="surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Workouts</h2>
              <Link
                to="/profile"
                className="flex items-center text-sm font-medium text-fitness-green hover:underline"
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentWorkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fitness-green/12 text-fitness-green">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium">No workouts logged yet</p>
                  <p className="mt-1 max-w-xs text-xs text-fitness-gray">
                    Open the Live Tracker to record your first session and it will
                    show up here.
                  </p>
                  <Link to="/live-tracker" className="mt-4">
                    <Button size="sm">Start tracking</Button>
                  </Link>
                </div>
              ) : (
                recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1]"
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-fitness-green/12 text-fitness-green">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{workout.exercise_name}</h3>
                        <p className="mt-0.5 text-xs text-fitness-gray">
                          {relativeDay(workout.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm tabular-nums">{formatDuration(workout.duration_sec)}</div>
                      <div className="text-xs text-fitness-gray tabular-nums">{workout.reps} reps</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Workouts */}
          <div className="surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Workouts</h2>
              <Link
                to="/workout-plan"
                className="flex items-center text-sm font-medium text-fitness-green hover:underline"
              >
                Plan
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                >
                  <div className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-fitness-green/12 text-fitness-green">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{workout.name}</h3>
                      <p className="mt-0.5 text-xs text-fitness-gray">{workout.scheduled}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums text-fitness-gray">{workout.duration}</div>
                    <Link to="/live-tracker">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 h-7 border-fitness-green/40 px-3 text-xs text-fitness-green hover:bg-fitness-green/10"
                      >
                        Start
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              <Link to="/workout-plan" className="block">
                <Button
                  variant="outline"
                  className="w-full border-dashed border-white/12 text-fitness-gray hover:border-fitness-green/40 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add New Workout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
