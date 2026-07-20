import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/contexts/AuthContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, user } = useAuth();

  // Bounce an already-signed-in visitor straight to the dashboard. Reads the
  // shared context instead of subscribing to its own auth listener.
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthClass = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ][passwordStrength - 1] || "";

  const strengthText = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ][passwordStrength - 1] || "";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({
        title: "Terms and conditions",
        description: "Please agree to our terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: "Weak password",
        description: "Please choose a stronger password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // display_name is passed through to the on_auth_user_created trigger,
      // which seeds the profiles row — no follow-up profile write needed.
      const { needsEmailConfirmation } = await signUp(email, password, name);

      if (needsEmailConfirmation) {
        // "Confirm email" is on, so there is no session yet. Sending the user
        // to /dashboard here would just bounce them back to /login.
        toast({
          title: "Confirm your email",
          description: `We sent a confirmation link to ${email}. Click it to finish signing up.`,
        });
        navigate("/login");
        return;
      }

      toast({
        title: "Account created",
        description: `Welcome to Trainify, ${name}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Redirects away to Google; nothing below this line runs on success.
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Google Sign-In failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fitness-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-fitness-card-bg rounded-2xl shadow-xl">
        <div className="mb-6">
          <Link to="/" className="text-fitness-gray hover:text-fitness-green flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            Join <span className="text-fitness-green">TRAIN</span>ify
          </h2>
          <p className="text-fitness-gray mt-2">Start your fitness journey today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              className="bg-fitness-dark-gray border-fitness-dark-gray text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="bg-fitness-dark-gray border-fitness-dark-gray text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="bg-fitness-dark-gray border-fitness-dark-gray text-white pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fitness-gray"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-fitness-gray mb-1">
                  <div>Password strength:</div>
                  <div className="font-medium" style={{ color: strengthClass }}>{strengthText}</div>
                </div>
                <div className="h-1 w-full bg-fitness-dark-gray rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strengthClass} transition-all duration-300`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-fitness-gray">
                  {[
                    { label: "Uppercase", regex: /[A-Z]/ },
                    { label: "Lowercase", regex: /[a-z]/ },
                    { label: "Number", regex: /\d/ },
                    { label: "Special character", regex: /[^A-Za-z0-9]/ },
                  ].map(({ label, regex }) => (
                    <div key={label} className="flex items-center">
                      <span className={`mr-1 ${regex.test(password) ? "text-fitness-green" : ""}`}>
                        {regex.test(password) ? <Check size={12} /> : "•"}
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-sm text-fitness-gray cursor-pointer">
              I agree to the{" "}
              <a href="#" className="text-fitness-green hover:underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-fitness-green hover:underline">Privacy Policy</a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-fitness-green hover:bg-fitness-green/80 text-black font-semibold py-6"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="my-4 text-center text-fitness-gray">or</div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 font-semibold py-6"
        >
          <FcGoogle size={20} />
          Continue with Google
        </Button>

        <div className="mt-6 text-center">
          <p className="text-fitness-gray">
            Already have an account?{" "}
            <Link to="/login" className="text-fitness-green hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
