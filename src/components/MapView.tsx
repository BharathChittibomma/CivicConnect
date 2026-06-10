// Client-only map components (leaflet touches window/document at import).
import { lazy, Suspense, useEffect, useState } from "react";

export interface LatLng { lat: number; lng: number }

const Inner = lazy(() => import("./MapViewInner"));

function Fallback({ height }: { height: number }) {
  return <div className="rounded-xl border border-border bg-muted animate-pulse" style={{ height }} />;
}

export function LocationPicker(props: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const height = props.height ?? 280;
  if (!mounted) return <Fallback height={height} />;
  return (
    <Suspense fallback={<Fallback height={height} />}>
      <Inner kind="picker" {...props} height={height} />
    </Suspense>
  );
}

export function MarkersMap(props: {
  markers: { id: string; lat: number; lng: number; title: string }[];
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const height = props.height ?? 400;
  if (!mounted) return <Fallback height={height} />;
  return (
    <Suspense fallback={<Fallback height={height} />}>
      <Inner kind="markers" {...props} height={height} />
    </Suspense>
  );
}
