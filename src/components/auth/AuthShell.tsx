import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Dumbbell, Utensils } from "lucide-react";

const highlights = [
  { icon: Camera, text: "Real-time AI form tracking" },
  { icon: Dumbbell, text: "Personalized workout plans" },
  { icon: Utensils, text: "Custom nutrition & macros" },
];

/**
 * Split-screen shell for the auth screens: a branded panel on the left,
 * the form (children) on the right. Purely presentational — the pages keep
 * their own state, handlers, and input contracts.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="grid min-h-[100dvh] bg-fitness-background lg:grid-cols-2">
    {/* Brand panel */}
    <aside className="relative hidden overflow-hidden lg:flex">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-fitness-green/15 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-fitness-green/8 blur-[100px]" />
      <img
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80"
        alt="Athlete training"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-fitness-black via-fitness-background/70 to-transparent" />

      <div className="relative z-10 flex flex-col justify-between p-12">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          <span className="text-fitness-green">TRAIN</span>
          <span className="text-white">ify</span>
        </Link>

        <div>
          <h2 className="max-w-sm text-display-sm leading-tight text-white">
            The gym in your pocket, minus the guesswork.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-fitness-gray">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fitness-green/12 text-fitness-green ring-1 ring-fitness-green/20">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-fitness-gray">
          Everything runs on the camera you already own.
        </p>
      </div>
    </aside>

    {/* Form panel */}
    <main className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center text-sm text-fitness-gray transition-colors hover:text-fitness-green"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-8 lg:hidden">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            <span className="text-fitness-green">TRAIN</span>
            <span className="text-white">ify</span>
          </Link>
        </div>

        <h1 className="text-display-sm">{title}</h1>
        <p className="mt-2 text-fitness-gray">{subtitle}</p>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  </div>
);

export default AuthShell;
