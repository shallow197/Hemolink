// =====================================================================
// eligibility.js — Règles d'éligibilité au don de sang
// =====================================================================
// Ces règles viennent DIRECTEMENT de notre visite terrain au CNTS de Dakar
// (rencontre avec M. Serigne Kote). Elles déterminent si un donneur peut
// faire un don aujourd'hui ou non.
//
// Règles CNTS Sénégal :
//   • Délai inter-dons : 3 mois (hommes), 4 mois (femmes)
//   • Âge : 18 à 65 ans
//   • Poids minimum : 50 kg
// =====================================================================

const DAYS_PER_MONTH = 30; // approximation suffisante pour le délai inter-dons

// --- Calcul du délai inter-dons selon le sexe ----------------------------
// Les femmes ont un délai plus long car le don entraîne plus de fatigue
// (cycle menstruel = perte de fer supplémentaire). Règle CNTS officielle.
export function delaisInterDonsJours(sexe) {
  if (sexe === 'femme') return 4 * DAYS_PER_MONTH; // 120 jours
  return 3 * DAYS_PER_MONTH;                       // 90 jours (hommes / autres)
}

// --- Calcul de l'âge en années pleines -----------------------------------
// Tient compte du mois et du jour pour ne pas se tromper de 1 an.
export function ageEnAnnees(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  // Si l'anniversaire n'est pas encore passé cette année, on retire 1
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// --- Évaluation complète de l'éligibilité d'un donneur -------------------
/**
 * Vérifie un donneur sur TOUS les critères et renvoie :
 *   { eligible, raisons[], prochaineDateDon, age }
 * Si "raisons" est vide, le donneur peut donner aujourd'hui.
 * Utilisé dans /api/donneurs/me pour afficher le statut au donneur.
 */
export function calculerEligibilite(donneur) {
  const raisons = [];
  let prochaineDateDon = null;

  if (!donneur) {
    return { eligible: false, raisons: ['Donneur introuvable'], prochaineDateDon: null };
  }

  // 1) Critère âge ----------------------------------------------------
  const age = ageEnAnnees(donneur.date_naissance);
  if (age != null) {
    if (age < 18) raisons.push(`Âge insuffisant (${age} ans, minimum 18)`);
    if (age > 65) raisons.push(`Âge supérieur à la limite (${age} ans, maximum 65)`);
  }

  // 2) Critère poids --------------------------------------------------
  if (donneur.poids_kg != null && Number(donneur.poids_kg) < 50) {
    raisons.push(`Poids insuffisant (${donneur.poids_kg} kg, minimum 50 kg)`);
  }

  // 3) Critère délai inter-dons (le plus subtil) ---------------------
  // On calcule "dernière date de don + délai légal" et on compare à aujourd'hui.
  if (donneur.derniere_date_don) {
    const delai = delaisInterDonsJours(donneur.sexe);
    const last = new Date(donneur.derniere_date_don);
    const next = new Date(last);
    next.setDate(next.getDate() + delai);
    prochaineDateDon = next.toISOString().slice(0, 10); // format YYYY-MM-DD
    if (next > new Date()) {
      raisons.push(`Délai inter-dons non respecté (prochaine date : ${prochaineDateDon})`);
    }
  }

  // 4) Critère validation administrative (CNTS) ----------------------
  if (donneur.en_attente_validation) {
    raisons.push('Compte en attente de validation par le CNTS');
  }

  // 5) Critère disponibilité déclarée par le donneur -----------------
  if (!donneur.disponible) {
    raisons.push("Donneur marqué comme indisponible");
  }

  return {
    eligible: raisons.length === 0, // éligible si AUCUNE raison de refus
    raisons,
    prochaineDateDon,
    age,
  };
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// Toutes les règles ici viennent directement de notre visite au CNTS de
// Dakar. On a appris que le délai entre deux dons n'est PAS le même pour
// les hommes (3 mois) et les femmes (4 mois) — un détail qu'on n'aurait
// jamais trouvé en lisant la doc en ligne. Cette fonction est utilisée
// dans l'espace donneur : quand Aminata se connecte, elle voit "Vous êtes
// éligible" ou "Vous pouvez redonner à partir du 12 juin" avec la raison
// exacte. C'est ce qui rend l'app conforme aux pratiques médicales réelles.
// =====================================================================
