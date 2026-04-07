import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MapPin, FileText, Users, TrendingUp, CheckCircle, MessageSquare } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">The Civic Authority</h1>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={() => navigate("/profile/" + user?.id)}>
                  Profile
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/login")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Report Local Issues, Drive Civic Change
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empower your community by reporting road damage, traffic hazards, sanitation problems, and other civic issues. Track resolutions in real-time with transparent admin oversight.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/report")}>
              Report an Issue
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
              View Reports
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Why Use The Civic Authority?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <FileText className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Easy Reporting</h4>
              <p className="text-gray-600">
                Submit issues in just 5 steps with photo evidence, precise location, and detailed descriptions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <MapPin className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Location Precision</h4>
              <p className="text-gray-600">
                Pin exact issue locations on interactive maps with GPS support and reverse geocoding.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Transparent Tracking</h4>
              <p className="text-gray-600">
                Monitor issue status from submission through verification, progress, and resolution.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <Users className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Community Power</h4>
              <p className="text-gray-600">
                Upvote important issues and comment to provide additional context and support.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Analytics</h4>
              <p className="text-gray-600">
                View civic metrics, category breakdowns, and resolution trends for your community.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Engagement</h4>
              <p className="text-gray-600">
                Participate in discussions, build community trust, and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of citizens working together to improve our communities.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/report")}
          >
            Report Your First Issue
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 The Civic Authority. Empowering communities through transparent civic engagement.</p>
        </div>
      </footer>
    </div>
  );
}
