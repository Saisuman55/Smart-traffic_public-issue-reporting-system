import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  MessageSquare,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  verified: { color: "bg-blue-100 text-blue-800", label: "Verified" },
  in_progress: { color: "bg-purple-100 text-purple-800", label: "In Progress" },
  resolved: { color: "bg-green-100 text-green-800", label: "Resolved" },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
};

export default function IssueDetail() {
  const [match, params] = useRoute("/issue/:id");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");

  if (!match) return null;

  const issueId = parseInt(params?.id || "0");

  const { data: issue, isLoading: issueLoading } = trpc.issues.getById.useQuery({
    id: issueId,
  });

  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } =
    trpc.comments.list.useQuery({ issueId });

  const { data: reporter } = trpc.users.getProfile.useQuery(
    { userId: issue?.reporterId || 0 },
    { enabled: !!issue?.reporterId }
  );

  const { data: hasUpvoted = false } = trpc.upvotes.hasUpvoted.useQuery(
    { issueId },
    { enabled: isAuthenticated }
  );

  const upvoteMutation = trpc.upvotes.toggle.useMutation({
    onSuccess: () => {
      toast.success("Vote recorded!");
    },
  });

  const commentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      toast.success("Comment posted!");
      refetchComments();
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted!");
      refetchComments();
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleUpvote = () => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    upvoteMutation.mutate({ issueId });
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    commentMutation.mutate({
      issueId,
      content: commentText,
    });
  };

  if (issueLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Issue not found</h1>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.pending;

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
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="p-6 mb-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Image */}
                {issue.imageUrl && (
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full rounded-lg mb-6 max-h-96 object-cover"
                  />
                )}

                {/* Description */}
                <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                  {issue.description}
                </p>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <MapPin className="w-4 h-4" />
                      {issue.address || "Location set"}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-gray-900 font-medium capitalize">
                      {issue.category.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mb-6">
                <Button
                  variant={hasUpvoted ? "default" : "outline"}
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Upvote ({issue.upvoteCount})
                </Button>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Comments ({comments.length})
              </h2>

              {/* Comment Form */}
              {isAuthenticated && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts or additional details..."
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="outline"
                      onClick={() => setCommentText("")}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleComment}
                      disabled={commentMutation.isPending || !commentText.trim()}
                    >
                      {commentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Comment"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">User #{comment.authorId}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                          {(isAuthenticated && (user?.id === comment.authorId || user?.role === 'admin')) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate({ commentId: comment.id, issueId })}
                              className="text-xs text-red-600 hover:text-red-800"
                              disabled={deleteCommentMutation.isPending}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Reporter Card */}
            {reporter && (
              <Card className="p-6 mb-6 sticky top-20">
                <h3 className="font-semibold text-gray-900 mb-4">Reported By</h3>
                <div className="space-y-3">
                  <p className="font-medium text-gray-900">
                    {reporter.name || `User #${reporter.id}`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trust Score</span>
                    <Badge className={reporter.trustScore >= 75 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {reporter.trustScore}/100
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{reporter.totalReports} total reports</p>
                    <p>{reporter.verifiedReports} verified</p>
                  </div>
                  <button
                    onClick={() => navigate(`/profile/${reporter.id}`)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Profile
                  </button>
                </div>
              </Card>
            )}

            <Card className="p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Issue Information</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Reported</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Upvotes</p>
                  <p className="text-gray-900 font-medium">{issue.upvoteCount}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="text-gray-900 font-medium">{issue.commentCount}</p>
                </div>

                {issue.rejectionReason && (
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-sm font-medium text-red-900 mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-red-700">{issue.rejectionReason}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
