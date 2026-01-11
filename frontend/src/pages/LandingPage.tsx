import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  Brain,
  Code2,
  Zap,
  Coffee,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import logo from "@/assets/learnbaselogo.png";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // Redirect to home if user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Dark Node Toggle Logic
  useEffect(() => {
    // Check initial state
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-default)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border-default)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--fg-muted)] text-sm font-medium tracking-wide">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)] transition-colors duration-500 selection:bg-[var(--accent)] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[var(--bg-default)]/80 border-b border-[var(--border-default)] transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LearnBase" className="h-8 w-8 opacity-90" />
            <span className="text-xl font-bold tracking-tight text-[var(--fg-default)]">
              LearnBase
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-input)] transition-colors text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <Link to="/auth">
              <Button
                variant="ghost"
                className="font-medium text-[var(--fg-muted)] hover:text-[var(--fg-default)] hover:bg-[var(--bg-input)]"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-[var(--fg-default)] text-[var(--bg-default)] hover:opacity-90 transition-opacity rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-input)] text-[var(--accent)] text-xs font-medium tracking-wide mb-8 animate-fade-in">
            <Sparkles className="w-3 h-3" />
            <span>Redefining how we learn code</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            The art of code, <br />
            <span className="text-[var(--fg-muted)] font-serif italic font-normal">
              without the chaos.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--fg-muted)] max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Master programming at your own rhythm.{" "}
            <br className="hidden md:block" />
            No bootcamps. No deadlines. Just you and the craft.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 rounded-full px-8 h-14 text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-105 hover:shadow-orange-500/30"
              >
                Begin the Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Why Rushed Learning Fails */}
        <section className="bg-[var(--bg-elevated)] py-24 mb-24 border-y border-[var(--border-default)]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Why we struggle to learn.
            </h2>
            <p className="text-lg text-[var(--fg-muted)] leading-loose">
              The modern world demands speed. We rush to build, skipping the
              understanding. We copy-paste, hoping it works. But true mastery
              needs{" "}
              <span className="text-[var(--accent)] font-medium">silence</span>,{" "}
              <span className="text-[var(--accent)] font-medium">patience</span>
              , and{" "}
              <span className="text-[var(--accent)] font-medium">depth</span>.
              <br />
              <br />
              When you learn without pressure, you don't just memorize syntax.
              <br />
              You internalize the logic.
            </p>
          </div>
        </section>

        {/* What is Vibe Learning */}
        <section className="max-w-5xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                This is Vibe Learning.
              </h2>
              <p className="text-lg text-[var(--fg-muted)] mb-6 leading-relaxed">
                It's coding with intention. It's understanding the "why" before
                the "how". It's an environment where your curiosity leads the
                way, not a curriculum.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Deep Mental Models</h4>
                    <p className="text-sm text-[var(--fg-muted)]">
                      Visualize how code actually works.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Flow State Focus</h4>
                    <p className="text-sm text-[var(--fg-muted)]">
                      Distraction-free interface designed for clarity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/10 to-purple-500/10 rounded-full blur-3xl opacity-50" />
              <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl p-8 shadow-2xl skew-y-1">
                <pre className="text-sm font-mono text-[var(--fg-muted)] overflow-hidden">
                  <code>
                    <span className="text-purple-500">const</span>{" "}
                    <span className="text-blue-500">mastery</span> ={" "}
                    <span className="text-yellow-600">async</span> () ={">"}{" "}
                    {"{"} <br />
                    &nbsp;&nbsp;<span className="text-purple-500">
                      while
                    </span>{" "}
                    (alive) {"{"} <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="text-purple-500">await</span>{" "}
                    <span className="text-blue-500">understand</span>(concept);{" "}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="text-purple-500">await</span>{" "}
                    <span className="text-blue-500">practice</span>(deeply);{" "}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="text-gray-400">
                      // No rush, just flow.
                    </span>{" "}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="text-blue-500">grow</span>(); <br />
                    &nbsp;&nbsp;{"}"} <br />
                    {"}"}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 6-Step Flow */}
        <section className="bg-[var(--bg-elevated)] py-24 mb-24 border-y border-[var(--border-default)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                The Natural Flow of Learning
              </h2>
              <p className="text-[var(--fg-muted)]">
                How we guide you from confusion to clarity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "The Why",
                  desc: "Context before code. Why does this exist?",
                },
                {
                  step: "02",
                  title: "Mental Model",
                  desc: "Visualizing the concept in your mind.",
                },
                {
                  step: "03",
                  title: "The Core Idea",
                  desc: "Breaking it down to first principles.",
                },
                {
                  step: "04",
                  title: "Minimal Code",
                  desc: "Writing the simplest possible implementation.",
                },
                {
                  step: "05",
                  title: "Epiphany",
                  desc: "That 'Aha!' moment when it clicks.",
                },
                {
                  step: "06",
                  title: "Silent Rules",
                  desc: "Best practices and industry standards.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-8 rounded-2xl bg-[var(--bg-default)] border border-[var(--border-default)] hover:border-[var(--accent)] hover:shadow-lg hover:shadow-orange-500/5 transition-all group"
                >
                  <span className="text-4xl font-bold text-[var(--bg-input)] group-hover:text-[var(--accent)] transition-colors mb-4 block">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-[var(--fg-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="max-w-4xl mx-auto px-6 mb-32 text-center">
          <h2 className="text-3xl font-bold mb-12">Who is this for?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-4">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-400">
                For the Craftsmen
              </h3>
              <p className="text-green-700/80 dark:text-green-300/70">
                Those who want to understand code deeply. Who care about
                quality, legibility, and the art of software.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 opacity-75 grayscale hover:grayscale-0 transition-all">
              <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-red-800 dark:text-red-400">
                Not for Rushers
              </h3>
              <p className="text-red-700/80 dark:text-red-300/70">
                If you're looking for "Become a Senior Dev in 2 Weeks" or quick
                copy-paste hacks, this isn't for you.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-20 px-6">
          <Heart className="w-12 h-12 text-[var(--accent)] mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold mb-6">Ready to find your flow?</h2>
          <p className="text-xl text-[var(--fg-muted)] mb-10 max-w-xl mx-auto">
            Join a community of thoughtful developers building the future, one
            concept at a time.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-[var(--fg-default)] text-[var(--bg-default)] hover:opacity-90 rounded-full px-10 h-16 text-lg font-medium"
            >
              Enter the Studio
            </Button>
          </Link>
        </section>
      </main>

      <footer className="py-12 text-center border-t border-[var(--border-default)]">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Code2 className="w-5 h-5" />
          <span className="font-medium">LearnBase</span>
        </div>
        <p className="text-[var(--fg-muted)] text-sm">
          &copy; {new Date().getFullYear()} LearnBase. Crafted with intention.
        </p>
      </footer>
    </div>
  );
}
