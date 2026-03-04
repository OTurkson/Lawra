import { useState } from "react";
import { Link } from "react-router-dom";
import signupHero from "@/assets/signup-hero.jpg";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={signupHero}
          alt="Woman using phone"
          className="w-full h-full object-cover"
        />
        {/* Logo overlay */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-10 bg-primary-foreground rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-full" />
            </div>
            <span className="text-primary-foreground text-3xl font-display">lawra</span>
          </div>
          <p className="text-primary-foreground text-sm mt-1 opacity-80">Now, you can lend a hand</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center bg-card px-8 lg:px-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-light text-foreground mb-1">Signup</h1>
          <p className="text-muted-foreground text-sm mb-10">Sign up to continue our application</p>

          <div className="space-y-6">
            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary"
                />
                <span className="text-muted-foreground text-sm">Remember Me</span>
              </label>
              <a href="#" className="text-primary text-sm font-semibold hover:underline">Forgot Password?</a>
            </div>

            <Link
              to="/dashboard"
              className="block w-full text-center py-4 rounded-full signup-btn-gradient text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity mt-8"
            >
              Sign Up
            </Link>

            <p className="text-center text-muted-foreground text-sm">
              Already having an account?{" "}
              <Link to="/dashboard" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
