import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Loader2, ArrowLeft } from "lucide-react";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { data: topContributors = [], isLoading } = trpc.users.getLeaderboard.useQuery();

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-gray-600 font-semibold">{position}</span>;
    }
  };

  const getTrustBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Community Leaderboard
          </h1>
          <p className="text-gray-600 mt-2">
            Celebrating our most active and trusted civic contributors
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : topContributors.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No contributors yet. Be the first to report an issue!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {topContributors.map((user: any, index: number) => (
              <Card
                key={user.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                    {getMedalIcon(index + 1)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name || `User #${user.id}`}
                    </h3>
                    {user.bio && (
                      <p className="text-sm text-gray-600">{user.bio}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {user.totalReports || 0}
                      </p>
                      <p className="text-xs text-gray-600">Reports</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {user.verifiedReports || 0}
                      </p>
                      <p className="text-xs text-gray-600">Verified</p>
                    </div>

                    <div className="text-center">
                      <Badge className={getTrustBadgeColor(user.trustScore || 50)}>
                        {user.trustScore || 50}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">Trust</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
