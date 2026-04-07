import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  address: string;
  onLocationChange: (lat: string, lng: string, addr: string) => void;
}

export default function LocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = () => {
      const defaultLat = latitude ? parseFloat(latitude) : 28.7041;
      const defaultLng = longitude ? parseFloat(longitude) : 77.1025;

      const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: defaultLat, lng: defaultLng },
        mapTypeControl: true,
        fullscreenControl: true,
      });

      // Create marker
      const markerInstance = new (window as any).google.maps.Marker({
        position: { lat: defaultLat, lng: defaultLng },
        map: mapInstance,
        draggable: true,
        title: "Issue Location",
      });

      // Update on marker drag
      markerInstance.addListener("dragend", async () => {
        const pos = markerInstance.getPosition();
        const lat = pos.lat().toString();
        const lng = pos.lng().toString();

        // Reverse geocode
        const addr = await reverseGeocode(lat, lng);
        onLocationChange(lat, lng, addr);
      });

      // Update on map click
      mapInstance.addListener("click", async (event: any) => {
        const lat = event.latLng.lat().toString();
        const lng = event.latLng.lng().toString();

        markerInstance.setPosition({ lat: parseFloat(lat), lng: parseFloat(lng) });

        // Reverse geocode
        const addr = await reverseGeocode(lat, lng);
        onLocationChange(lat, lng, addr);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    };

    // Load Google Maps script if not already loaded
    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKey&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [mapRef, latitude, longitude]);

  const reverseGeocode = async (lat: string, lng: string): Promise<string> => {
    try {
      // In a real app, use Google Geocoding API
      // For now, return a placeholder
      return `${lat}, ${lng}`;
    } catch (error) {
      console.error("Geocoding error:", error);
      return `${lat}, ${lng}`;
    }
  };

  const handleGetLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();
          const addr = await reverseGeocode(lat, lng);

          onLocationChange(lat, lng, addr);

          if (map && marker) {
            map.setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
            marker.setPosition({ lat: parseFloat(lat), lng: parseFloat(lng) });
          }

          toast.success("Location captured!");
          setIsLoading(false);
        },
        () => {
          toast.error("Could not get your location");
          setIsLoading(false);
        }
      );
    } else {
      toast.error("Geolocation not supported");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: "400px" }}
      />

      <Button
        onClick={handleGetLocation}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Use My Current Location
          </>
        )}
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude
          </label>
          <Input
            type="number"
            step="0.00000001"
            value={latitude}
            onChange={(e) => onLocationChange(e.target.value, longitude, address)}
            placeholder="e.g., 28.7041"
            readOnly
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
            onChange={(e) => onLocationChange(latitude, e.target.value, address)}
            placeholder="e.g., 77.1025"
            readOnly
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <Input
          value={address}
          onChange={(e) => onLocationChange(latitude, longitude, e.target.value)}
          placeholder="e.g., Main Street, Downtown"
        />
      </div>
    </div>
  );
}
