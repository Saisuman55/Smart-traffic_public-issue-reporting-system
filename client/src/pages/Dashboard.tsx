import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  MessageSquare,
  ThumbsUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  { value: "road_damage", label: "Road Damage" },
  { value: "traffic_hazard", label: "Traffic Hazard" },
  { value: "sanitation", label: "Sanitation" },
  { value: "water", label: "Water" },
  { value: "electrical", label: "Electrical" },
  { value: "other", label: "Other" },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  verified: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  in_progress: { color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="w-4 h-4" /> },
  resolved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4" /> },
};

function IssueCard({ issue }: { issue: any }) {
  const [, navigate] = useLocation();
  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.pending;

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/issue/${issue.id}`)}
    >
      <div className="flex gap-4">
        {issue.imageUrl && (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-20 h-20 rounded object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{issue.title}</h3>
            <Badge className={statusConfig.color}>
              {statusConfig.icon}
              <span className="ml-1 capitalize">{issue.status.replace("_", " ")}</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{issue.description}</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {issue.address || "Location set"}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              {issue.upvoteCount}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {issue.commentCount}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(0);

  const { data: issues = [], isLoading } = trpc.issues.list.useQuery({
    category: category || undefined,
    status: status || undefined,
    search: search || undefined,
    limit: 20,
    offset: page * 20,
  }, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Issue Feed</h1>
            <Button onClick={() => navigate("/report")}>
              Report New Issue
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="md:col-span-2"
            />

            <Select value={category} onValueChange={(val) => {
              setCategory(val);
              setPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(val) => {
              setStatus(val);
              setPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or be the first to report an issue!</p>
            <Button onClick={() => navigate("/report")}>
              Report an Issue
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {issues.map((issue: any) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={issues.length < 20}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
