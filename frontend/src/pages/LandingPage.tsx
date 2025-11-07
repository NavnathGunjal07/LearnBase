import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, Users, Rocket } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-white">LearnBase</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" className="text-gray-200 hover:bg-gray-800 hover:text-white border-gray-700">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span className="block">Master Programming with</span>
          <span className="block text-indigo-400">LearnBase</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          An interactive learning platform to help you master programming concepts through hands-on practice and real-world projects.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Get Started
              <Rocket className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="#how-it-works">
            <Button size="lg" variant="outline" className="text-gray-200 border-gray-600 hover:bg-gray-800 hover:text-white">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div id="how-it-works" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              How LearnBase Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-400 mx-auto">
              Start your programming journey with our simple and effective learning approach
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-900/50 text-indigo-400">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-white">Learn Concepts</h3>
                <p className="mt-2 text-base text-gray-400">
                  Access comprehensive lessons and tutorials on various programming topics.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-900/50 text-indigo-400">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-white">Practice Coding</h3>
                <p className="mt-2 text-base text-gray-400">
                  Write and test code directly in your browser with our interactive editor.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-900/50 text-indigo-400">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-white">Join Community</h3>
                <p className="mt-2 text-base text-gray-400">
                  Connect with other learners, share knowledge, and grow together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start your coding journey?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Join thousands of learners who have already discovered the power of LearnBase.
          </p>
          <Link to="/register" className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 sm:w-auto">
            Get Started for Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} LearnBase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
