import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const center = [14.5, -15.5];
const zoom = 7;

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function MapSenegal({ carte }) {
  const alertIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html:
          '<div class="hemolink-alert-marker" style="width:18px;height:18px;border-radius:9999px;background:#ef4444;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  const compatSet = new Set(carte?.donneurs_compatibles_ids || []);

  if (!carte) {
    return <div className="h-[380px] w-full animate-pulse rounded-xl bg-zinc-800" />;
  }

  return (
    <MapContainer center={center} zoom={zoom} className="h-[380px] w-full rounded-xl z-0" scrollWheelZoom>
      <ResizeFix />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {carte.hopitaux?.map((h) => (
        <CircleMarker
          key={`h-${h.id}`}
          center={[Number(h.latitude), Number(h.longitude)]}
          radius={8}
          pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.35, weight: 2 }}
        >
          <Popup>
            <strong>{h.nom}</strong>
            <br />
            {h.ville}
          </Popup>
        </CircleMarker>
      ))}
      {carte.alertes_actives?.map((a) => (
        <Marker key={`a-${a.id}`} position={[Number(a.hop_lat), Number(a.hop_lng)]} icon={alertIcon}>
          <Popup>
            <strong>Alerte #{a.id}</strong>
            <br />
            {a.hopital_nom}
            <br />
            Groupe : {a.groupe_sanguin} — {a.niveau_urgence}
          </Popup>
        </Marker>
      ))}
      {carte.donneurs?.map((d) => {
        if (!d.latitude || !d.longitude) return null;
        const ok = d.disponible && !d.en_attente_validation;
        if (!ok) return null;
        const isCompat = compatSet.has(d.id);
        return (
          <CircleMarker
            key={`d-${d.id}`}
            center={[Number(d.latitude), Number(d.longitude)]}
            radius={isCompat ? 7 : 5}
            pathOptions={{
              color: isCompat ? '#15803d' : '#22c55e',
              fillColor: isCompat ? '#22c55e' : '#86efac',
              fillOpacity: 0.85,
              weight: isCompat ? 2 : 1,
            }}
          >
            <Popup>
              {d.prenom} {d.nom}
              <br />
              {d.groupe_sanguin} — {d.ville}
              {isCompat ? <span className="block font-medium text-emerald-300">Compatible (alerte active)</span> : null}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
