/**
 * Éligibilité au don de sang — règles CNTS Sénégal
 * - Délai inter-dons : 3 mois pour les hommes, 4 mois pour les femmes
 * - Âge : 18 à 65 ans
 * - Poids minimum : 50 kg
 *
 * Référence : visite CNTS Dakar (M. Serigne Kote).
 */

const DAYS_PER_MONTH = 30;

export function delaisInterDonsJours(sexe) {
  if (sexe === 'femme') return 4 * DAYS_PER_MONTH;
  return 3 * DAYS_PER_MONTH; // homme ou autre
}

export function ageEnAnnees(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/**
 * Renvoie { eligible, raisons[], prochaineDateDon }
 */
export function calculerEligibilite(donneur) {
  const raisons = [];
  let prochaineDateDon = null;

  if (!donneur) {
    return { eligible: false, raisons: ['Donneur introuvable'], prochaineDateDon: null };
  }

  const age = ageEnAnnees(donneur.date_naissance);
  if (age != null) {
    if (age < 18) raisons.push(`Âge insuffisant (${age} ans, minimum 18)`);
    if (age > 65) raisons.push(`Âge supérieur à la limite (${age} ans, maximum 65)`);
  }

  if (donneur.poids_kg != null && Number(donneur.poids_kg) < 50) {
    raisons.push(`Poids insuffisant (${donneur.poids_kg} kg, minimum 50 kg)`);
  }

  if (donneur.derniere_date_don) {
    const delai = delaisInterDonsJours(donneur.sexe);
    const last = new Date(donneur.derniere_date_don);
    const next = new Date(last);
    next.setDate(next.getDate() + delai);
    prochaineDateDon = next.toISOString().slice(0, 10);
    if (next > new Date()) {
      raisons.push(`Délai inter-dons non respecté (prochaine date : ${prochaineDateDon})`);
    }
  }

  if (donneur.en_attente_validation) {
    raisons.push('Compte en attente de validation par le CNTS');
  }

  if (!donneur.disponible) {
    raisons.push("Donneur marqué comme indisponible");
  }

  return {
    eligible: raisons.length === 0,
    raisons,
    prochaineDateDon,
    age,
  };
}
