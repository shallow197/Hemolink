// =====================================================================
// geo.js — Calculs géographiques
// =====================================================================
// HemoLink doit savoir si un donneur est "à proximité" d'un hôpital.
// Comme les coordonnées sont en latitude/longitude (sphère terrestre),
// on utilise la formule de Haversine — distance la plus courte sur la
// surface d'une sphère (à vol d'oiseau).
// =====================================================================

// --- Rayon moyen de la Terre, en kilomètres -----------------------------
const R = 6371;

// --- Formule de Haversine ------------------------------------------------
/**
 * Distance à vol d'oiseau entre deux points GPS, en kilomètres.
 * Utilisé dans hopitaux.js : "envoyer une alerte aux donneurs à moins de 25 km".
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  // Conversion degrés → radians (Math.sin/cos travaillent en radians)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  // Formule de Haversine : a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  // c = angle correspondant entre les deux points (arc de cercle)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance finale = rayon Terre × angle
  return R * c;
}

// --- Centre approximatif du Sénégal (pour centrer la carte Leaflet) -----
export const SENEGAL_CENTER = { lat: 14.4974, lng: -14.4524 };

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// On a besoin de calculer la distance entre un donneur et un hôpital pour
// décider s'il faut le contacter. On ne peut pas utiliser une simple
// soustraction de coordonnées : la Terre est ronde, donc 1 degré de
// longitude ne fait pas la même distance à l'équateur qu'à Dakar.
// La formule de Haversine prend en compte la courbure et donne la
// distance "à vol d'oiseau" en km. C'est précis pour des rayons de
// 10-100 km comme dans notre cas.
// =====================================================================
