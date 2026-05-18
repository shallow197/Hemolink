// =====================================================================
// MapSenegal.jsx — Carte interactive du Sénégal (Leaflet)
// =====================================================================
// Affiche trois couches superposées :
//   • Hôpitaux (cercles bleus)
//   • Alertes en cours (markers rouges clignotants)
//   • Donneurs disponibles (cercles verts, en gras si compatibles
//     avec une alerte active)
// =====================================================================

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Centre et zoom par défaut (centre approximatif du Sénégal) ---
const center = [14.5, -15.5];
const zoom = 7;

// --- Petit hack technique : invalider la taille de la carte au montage --
// Leaflet calcule mal la taille quand la carte est dans un onglet caché
// ou un layout flex. invalidateSize() force le recalcul après 200ms.
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function MapSenegal({ carte }) {
  // --- Icône personnalisée pour les alertes (clignote via CSS) ---
  // useMemo : on ne recrée l'icône qu'une seule fois (perf)
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

  // Set des donneurs compatibles avec une alerte active (lookup O(1))
  const compatSet = new Set(carte?.donneurs_compatibles_ids || []);

  // Skeleton de chargement pendant que les données arrivent du serveur
  if (!carte) {
    return <div className="h-[380px] w-full animate-pulse rounded-xl bg-zinc-800" />;
  }

  return (
    <MapContainer center={center} zoom={zoom} className="h-[380px] w-full rounded-xl z-0" scrollWheelZoom>
      <ResizeFix />

      {/* --- COUCHE 1 : fond de carte OpenStreetMap (gratuit, open data) --- */}
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* --- COUCHE 2 : hôpitaux (cercles bleus avec popup) --- */}
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

      {/* --- COUCHE 3 : alertes actives (markers rouges clignotants) --- */}
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

      {/* --- COUCHE 4 : donneurs (cercles verts) --- */}
      {/* On filtre : pas de coordonnées, pas validé ou indisponible → on saute. */}
      {/* Les donneurs compatibles avec une alerte sont affichés plus gros et plus foncés. */}
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

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// On utilise Leaflet (bibliothèque open-source légère) avec OpenStreetMap
// comme fond de carte — pas de coût d'API contrairement à Google Maps.
// Cette carte est l'élément le plus IMPACTANT visuellement : on voit
// d'un coup d'œil la répartition des hôpitaux, des donneurs disponibles
// et des alertes en cours. Les donneurs compatibles avec une alerte
// active sont mis en évidence (plus gros, vert plus foncé) — c'est
// l'algorithme du backend qui calcule cette liste (table COMPAT + rayon
// Haversine) et la transmet via /api/dashboard/carte. Pour la démo, on
// peut cliquer sur les markers : popup avec le détail.
// =====================================================================
