import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code, Users, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import logo from "@/assets/learnbaselogo.png";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-default)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border-default)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--fg-muted)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      {/* Navigation */}
      <nav className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src={logo} alt="LearnBase Logo" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-[var(--fg-default)]">
                LearnBase
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="text-[var(--fg-default)] hover:bg-[var(--bg-input)] border-[var(--border-default)]"
                >
                  Auth
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--fg-default)] sm:text-5xl md:text-6xl">
          <span className="block">Master Programming with</span>
          <span className="block text-[var(--accent)]">LearnBase</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-[var(--fg-muted)] sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          An interactive learning platform to help you master programming
          concepts through hands-on practice and real-world projects.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
            >
              Get Started
              <Rocket className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="text-[var(--fg-default)] border-[var(--border-default)] hover:bg-[var(--bg-input)]"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div id="how-it-works" className="py-16 bg-[var(--bg-elevated)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[var(--fg-default)] sm:text-4xl">
              How LearnBase Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-[var(--fg-muted)] mx-auto">
              Start your programming journey with our simple and effective
              learning approach
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[var(--bg-input)] text-[var(--accent)]">
                  <img
                    src={logo}
                    alt="LearnBase Logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <h3 className="mt-6 text-lg font-medium text-[var(--fg-default)]">
                  Learn Concepts
                </h3>
                <p className="mt-2 text-base text-[var(--fg-muted)]">
                  Access comprehensive lessons and tutorials on various
                  programming topics.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[var(--bg-input)] text-[var(--accent)]">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-[var(--fg-default)]">
                  Practice Coding
                </h3>
                <p className="mt-2 text-base text-[var(--fg-muted)]">
                  Write and test code directly in your browser with our
                  interactive editor.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[var(--bg-input)] text-[var(--accent)]">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-[var(--fg-default)]">
                  Join Community
                </h3>
                <p className="mt-2 text-base text-[var(--fg-muted)]">
                  Connect with other learners, share knowledge, and grow
                  together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[var(--accent)]">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start your coding journey?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-200">
            Join thousands of learners who have already discovered the power of
            LearnBase.
          </p>
          <Link
            to="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-[var(--accent)] bg-white hover:bg-gray-50 sm:w-auto"
          >
            Get Started for Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-[var(--fg-muted)]">
            &copy; {new Date().getFullYear()} LearnBase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
