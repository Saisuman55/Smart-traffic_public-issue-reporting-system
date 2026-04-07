import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BarChart3,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(
    undefined,
    { enabled: isAdmin }
  );
  const { data: categoryBreakdown, isLoading: categoryLoading } =
    trpc.admin.getCategoryBreakdown.useQuery(undefined, { enabled: isAdmin });
  const { data: topContributors, isLoading: contributorsLoading } =
    trpc.admin.getTopContributors.useQuery({ limit: 10 }, { enabled: isAdmin });

  const { data: issues = [] } = trpc.issues.list.useQuery(
    { status: "pending", limit: 50 },
    { enabled: isAdmin }
  );

  const updateStatusMutation = trpc.issues.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Issue status updated!");
    },
    onError: () => {
      toast.error("Failed to update issue status");
    },
  });

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const handleStatusChange = (
    issueId: number,
    newStatus: string,
    rejectionReason?: string
  ) => {
    updateStatusMutation.mutate({
      issueId,
      status: newStatus as any,
      rejectionReason,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="moderation">Moderation Queue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Issues</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Verified</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.verified || 0}</p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-gray-600 mb-2">In Progress</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.inProgress || 0}</p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.resolved || 0}</p>
                </Card>
              </div>
            )}

            {/* Top Contributors */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Top Contributors</h2>
              {contributorsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="space-y-3">
                  {topContributors?.map((contributor: any, idx: number) => (
                    <div
                      key={contributor.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          #{idx + 1} {contributor.name || `User #${contributor.id}`}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-600">
                          {contributor.verifiedReports} verified
                        </span>
                        <Badge>{contributor.trustScore}/100</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <h2 className="text-lg font-semibold">Pending Issues ({issues.length})</h2>

            {issues.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">No pending issues to review!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {issues.map((issue: any) => (
                  <Card key={issue.id} className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {issue.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{issue.description}</p>
                      {issue.imageUrl && (
                        <img
                          src={issue.imageUrl}
                          alt={issue.title}
                          className="max-h-48 rounded mb-3"
                        />
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium capitalize">
                          {issue.category.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{issue.address || "Set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Upvotes</p>
                        <p className="font-medium">{issue.upvoteCount}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleStatusChange(issue.id, "verified")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(issue.id, "in_progress")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Start Progress
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) {
                            handleStatusChange(issue.id, "rejected", reason);
                          }
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-lg font-semibold">Category Breakdown</h2>

            {categoryLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Card className="p-6">
                <div className="space-y-3">
                  {categoryBreakdown?.map((cat: any) => {
                    const total = stats?.total || 1;
                    const percentage = ((cat.count / total) * 100).toFixed(1);

                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium capitalize">
                            {cat.category.replace("_", " ")}
                          </span>
                          <span className="text-gray-600">
                            {cat.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
