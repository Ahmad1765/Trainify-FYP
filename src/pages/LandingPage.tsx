import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Dumbbell,
  Utensils,
  ArrowRight,
  Activity,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI form tracking",
    body: "Your webcam becomes a coach. A pose model checks your form in real time and counts every rep automatically — no wearables, nothing leaves your browser.",
    tag: "Live",
  },
  {
    icon: Dumbbell,
    title: "Plans built around you",
    body: "Answer a few questions about your goal, schedule, and equipment. Get a structured, editable weekly plan you can follow and export to PDF.",
    tag: "Personalized",
  },
  {
    icon: Utensils,
    title: "Nutrition that fits",
    body: "Dial in your calorie target, then get a full day of meals with macros and ingredients matched to weight loss, muscle, or maintenance.",
    tag: "Macros",
  },
];

const stats = [
  { value: "26", label: "Exercises tracked live" },
  { value: "3-step", label: "Plan builder" },
  { value: "100%", label: "On-device vision" },
  { value: "0", label: "Wearables needed" },
];

const Wordmark = ({ className = "" }: { className?: string }) => (
  <span className={className}>
    <span className="text-fitness-green">TRAIN</span>
    <span className="text-white">ify</span>
  </span>
);

const LandingPage = () => (
  <div className="min-h-[100dvh] bg-fitness-background text-foreground">
    {/* Ambient background */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-fitness-green/10 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-fitness-green/5 blur-[100px]" />
    </div>

    <div className="relative">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" className="text-fitness-gray hover:text-white">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-fitness-gray">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fitness-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-fitness-green" />
              </span>
              Real-time form detection, right in the browser
            </div>

            <h1 className="mt-6 text-display-lg md:text-display-xl">
              Train smarter with a
              <br />
              coach that <span className="text-gradient">actually watches</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fitness-gray">
              TRAINify pairs on-device AI vision with personalized workout and
              nutrition plans. Count reps, fix your form, and follow a plan built
              around your goals — no extra hardware.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  I already have an account
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-fitness-gray">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-fitness-green" />
                Video never leaves your device
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-fitness-green" />
                No wearables
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="animate-scale-in">
            <div className="surface relative overflow-hidden p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-fitness-black">
                <img
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=80"
                  alt="Athlete performing a bodyweight workout"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-fitness-black via-fitness-black/30 to-transparent" />

                {/* Faux HUD overlay */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-fitness-green/30 bg-fitness-black/70 px-3 py-1.5 text-xs font-medium text-fitness-green backdrop-blur">
                  <Activity className="h-3.5 w-3.5" />
                  Good form
                </div>
                <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-fitness-black/80 px-4 py-3 backdrop-blur">
                  <div className="text-3xl font-extrabold text-fitness-green tabular-nums">12</div>
                  <div className="text-[11px] uppercase tracking-wider text-fitness-gray">
                    reps · squats
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-fitness-black/80 px-3 py-1.5 text-xs text-white backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-fitness-green text-fitness-green" />
                  92% clean reps
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-fitness-background/60 px-6 py-6 text-center">
              <div className="text-display-sm text-white tabular-nums">{s.value}</div>
              <div className="mt-1 text-sm text-fitness-gray">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-display-md">Everything you need to keep going</h2>
          <p className="mt-4 text-lg text-fitness-gray">
            Three tools that work together — so training, planning, and eating
            stop living in separate apps.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="surface surface-hover group flex flex-col p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fitness-green/12 text-fitness-green ring-1 ring-fitness-green/20 transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-fitness-gray">
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fitness-gray">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="surface relative overflow-hidden px-8 py-14 text-center md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-70" style={{ ['--x' as string]: '50%', ['--y' as string]: '0%' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-display-md">
              Your first tracked rep is one click away
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-fitness-gray">
              Create an account and start with the live tracker — it works with
              the camera you already have.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/register">
                <Button size="lg">
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            <Wordmark />
          </Link>
          <p className="text-sm text-fitness-gray">
            © {new Date().getFullYear()} TRAINify. Built for people who show up.
          </p>
          <div className="flex items-center gap-6 text-sm text-fitness-gray">
            <a href="#" className="transition-colors hover:text-white">Privacy</a>
            <a href="#" className="transition-colors hover:text-white">Terms</a>
            <Link to="/login" className="transition-colors hover:text-white">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  </div>
);

export default LandingPage;
