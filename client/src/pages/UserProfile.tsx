import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle,
  Trophy,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export default function UserProfile() {
  const [match, params] = useRoute("/profile/:userId");
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  if (!match) return null;

  const userId = parseInt(params?.userId || "0");
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading } = trpc.users.getProfile.useQuery({
    userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          </div>
        </div>
      </div>
    );
  }

  const trustScoreColor =
    (profile.trustScore || 50) >= 75
      ? "text-green-600"
      : (profile.trustScore || 50) >= 50
      ? "text-blue-600"
      : "text-orange-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name || `User #${userId}`}
              </h1>
              {profile.bio && (
                <p className="text-gray-600">{profile.bio}</p>
              )}
            </div>
            {isOwnProfile && (
              <Button onClick={() => navigate(`/profile/${userId}/edit`)}>
                Edit Profile
              </Button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Reports</p>
              <p className="text-2xl font-bold text-blue-600">
                {profile.totalReports || 0}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Verified Reports</p>
              <p className="text-2xl font-bold text-green-600">
                {profile.verifiedReports || 0}
              </p>
            </div>

            <div className={`${
              (profile.trustScore || 50) >= 75
                ? "bg-green-50"
                : (profile.trustScore || 50) >= 50
                ? "bg-blue-50"
                : "bg-orange-50"
            } p-4 rounded-lg`}>
              <p className="text-sm text-gray-600 mb-1">Trust Score</p>
              <p className={`text-2xl font-bold ${trustScoreColor}`}>
                {profile.trustScore || 50}/100
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-sm font-bold text-purple-600">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Trust Score Explanation */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Community Trust</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Your trust score reflects your contributions to the community and the quality of your reports.
            </p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Verified reports increase your trust score</li>
              <li>Rejected reports may decrease it</li>
              <li>Active participation and helpful comments build trust</li>
              <li>Higher trust scores get priority review</li>
            </ul>
          </div>
        </Card>

        {/* Badges */}
        {(profile.verifiedReports || 0) > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Achievements</h2>
            <div className="flex flex-wrap gap-3">
              {(profile.verifiedReports || 0) >= 1 && (
                <Badge className="bg-blue-100 text-blue-800 px-3 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  First Report Verified
                </Badge>
              )}
              {(profile.verifiedReports || 0) >= 5 && (
                <Badge className="bg-green-100 text-green-800 px-3 py-2">
                  <Trophy className="w-4 h-4 mr-2" />
                  5 Verified Reports
                </Badge>
              )}
              {(profile.verifiedReports || 0) >= 10 && (
                <Badge className="bg-purple-100 text-purple-800 px-3 py-2">
                  <Trophy className="w-4 h-4 mr-2" />
                  10 Verified Reports
                </Badge>
              )}
              {(profile.trustScore || 50) >= 80 && (
                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-2">
                  <Trophy className="w-4 h-4 mr-2" />
                  Trusted Community Member
                </Badge>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
