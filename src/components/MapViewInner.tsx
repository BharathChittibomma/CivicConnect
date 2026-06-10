import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = icon;

interface LatLng { lat: number; lng: number }

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({ click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}
function Recenter({ pos }: { pos: LatLng | null }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 15)); }, [pos, map]);
  return null;
}

type Props =
  | { kind: "picker"; value: LatLng | null; onChange: (v: LatLng) => void; height: number }
  | { kind: "markers"; markers: { id: string; lat: number; lng: number; title: string }[]; height: number };

export default function MapViewInner(props: Props) {
  if (props.kind === "picker") {
    const center: [number, number] = props.value ? [props.value.lat, props.value.lng] : [20.5937, 78.9629];
    return (
      <div className="overflow-hidden rounded-xl border border-border" style={{ height: props.height }}>
        <MapContainer center={center} zoom={props.value ? 15 : 4} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onChange={props.onChange} />
          {props.value && <Marker position={[props.value.lat, props.value.lng]} />}
          <Recenter pos={props.value} />
        </MapContainer>
      </div>
    );
  }
  const first = props.markers[0];
  const center: [number, number] = first ? [first.lat, first.lng] : [20.5937, 78.9629];
  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height: props.height }}>
      <MapContainer center={center} zoom={first ? 12 : 4} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {props.markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} title={m.title} />
        ))}
      </MapContainer>
    </div>
  );
}
