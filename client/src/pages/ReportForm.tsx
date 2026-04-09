import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { uploadFileToS3 } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
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

const STEPS = [
  { id: 1, title: "Photo", icon: Upload },
  { id: 2, title: "Category", icon: FileText },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Details", icon: FileText },
  { id: 5, title: "Review", icon: CheckCircle },
];

export default function ReportForm() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const createIssue = trpc.issues.create.useMutation({
    onSuccess: () => {
      toast.success("Issue reported successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to report issue");
    },
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast.success("Location captured!");
        },
        () => {
          toast.error("Location access denied or unavailable");
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);

      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to S3
      try {
        setUploadProgress(0);
        const url = await uploadFileToS3(file, setUploadProgress);
        setImageUrl(url);
        setUploadProgress(0);
        toast.success("Image uploaded successfully!");
      } catch (error) {
        toast.error("Failed to upload image");
        setImageUrl("");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !latitude || !longitude) {
      toast.error("Please fill in all required fields");
      return;
    }

    createIssue.mutate({
      title,
      description,
      category: category as any,
      latitude,
      longitude,
      address,
      landmark,
      imageUrl,
    });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!imageUrl && !isUploading && !imageUrl.startsWith("data:");
      case 2:
        return !!category;
      case 3:
        return !!latitude && !!longitude;
      case 4:
        return !!title && !!description;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Report an Issue</h1>

          {/* Steps */}
          <div className="flex justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{s.title}</span>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute h-0.5 w-1/5 mt-5 ml-12 ${
                        isCompleted ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          {/* Step 1: Photo */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upload Photo Evidence</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {imageUrl ? (
                  <div>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded mb-4"
                    />
                    {isUploading && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("photo-input")?.click()}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Click to upload or drag and drop
                    </p>
                    <Button onClick={() => document.getElementById("photo-input")?.click()}>
                      Choose Photo
                    </Button>
                  </div>
                )}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Issue Category</h2>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      category === cat.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Set Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 28.7041"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., 77.1025"
                  />
                </div>
                <Button onClick={handleGetLocation} variant="outline" className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Current Location
                </Button>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (optional)
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., Main Street, Downtown"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Describe the Issue</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief title of the issue"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of the issue"
                    rows={6}
                    maxLength={5000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark (optional)
                  </label>
                  <Input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g., Near City Hall"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review Your Report</h2>
              <div className="space-y-4">
                {imageUrl && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Photo</h3>
                    <img src={imageUrl} alt="Preview" className="max-h-48 rounded" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-700">Category</h3>
                  <p className="text-gray-600">
                    {CATEGORIES.find((c) => c.value === category)?.label}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Location</h3>
                  <p className="text-gray-600">
                    {latitude}, {longitude}
                    {address && ` - ${address}`}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Title</h3>
                  <p className="text-gray-600">{title}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Description</h3>
                  <p className="text-gray-600">{description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Previous
            </Button>
            <div className="flex-1" />
            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createIssue.isPending}
              >
                {createIssue.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
