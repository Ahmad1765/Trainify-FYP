import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-fitness-background px-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fitness-green/10 blur-[120px]" />

      <div className="relative text-center">
        <div className="text-[8rem] font-extrabold leading-none tracking-tighter text-gradient md:text-[11rem]">
          404
        </div>
        <h1 className="mt-2 text-display-sm">This page took a rest day</h1>
        <p className="mx-auto mt-3 max-w-md text-fitness-gray">
          We couldn't find <span className="text-white">{location.pathname}</span>.
          It may have moved, or the link was mistyped.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
