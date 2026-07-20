
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingPage = () => (
  <div className="min-h-screen bg-fitness-background flex flex-col items-center justify-center text-center p-8">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
        <span className="text-fitness-green">TRAIN</span>
        <span className="text-white">ify</span>
      </h1>
      <p className="text-fitness-gray text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto">
        Your AI-powered fitness companion for personalized workouts, real-time form tracking, and custom nutrition plans.
      </p>
      <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
        <Link to="/register">
          <Button className="w-full md:w-auto bg-fitness-green hover:bg-fitness-green/80 text-black font-semibold py-3 px-6 rounded-full">
            Get Started
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" className="w-full md:w-auto border-fitness-dark-gray text-white hover:bg-fitness-dark-gray py-3 px-6 rounded-full">
            Login
          </Button>
        </Link>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-fitness-card-bg p-6 rounded-xl hover-scale">
          <div className="bg-fitness-dark-gray w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-fitness-green text-xl font-bold">1</span>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">AI Form Tracking</h3>
          <p className="text-fitness-gray">Real-time exercise form assessment with instant feedback</p>
        </div>
        <div className="bg-fitness-card-bg p-6 rounded-xl hover-scale">
          <div className="bg-fitness-dark-gray w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-fitness-green text-xl font-bold">2</span>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Custom Workouts</h3>
          <p className="text-fitness-gray">Personalized workout plans based on your goals and equipment</p>
        </div>
        <div className="bg-fitness-card-bg p-6 rounded-xl hover-scale">
          <div className="bg-fitness-dark-gray w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-fitness-green text-xl font-bold">3</span>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Nutrition Plans</h3>
          <p className="text-fitness-gray">Tailored diet recommendations to complement your fitness journey</p>
        </div>
      </div>
    </div>
  </div>
);

export default LandingPage;
