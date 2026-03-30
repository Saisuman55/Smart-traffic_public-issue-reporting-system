import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { IssueReport } from '../types';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({
  issues,
  userLocation,
}: {
  issues: IssueReport[];
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);
    if (userLocation) bounds.extend(userLocation);
    issues.forEach((issue) => bounds.extend([issue.latitude, issue.longitude]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [issues, userLocation, map]);

  return null;
}

export default function DashboardMap({
  center,
  filteredIssues,
  userLocation,
  youAreHereLabel,
}: {
  center: [number, number];
  filteredIssues: IssueReport[];
  userLocation: [number, number] | null;
  youAreHereLabel: string;
}) {
  return (
    <div
      className="h-[420px] lg:h-[560px] rounded-2xl overflow-hidden relative"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full z-0">
        <ChangeView issues={filteredIssues} userLocation={userLocation} />
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <p className="font-bold text-xs" style={{ color: '#00FF88' }}>
                {youAreHereLabel}
              </p>
            </Popup>
          </Marker>
        )}
        {filteredIssues.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
            <Popup>
              <div className="p-2 max-w-[200px]">
                <img src={issue.imageUrl} className="w-full aspect-video object-cover rounded-lg mb-2" alt="Issue" />
                <p className="text-xs font-semibold text-zinc-100 line-clamp-2 mb-1">{issue.description}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{issue.status}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
