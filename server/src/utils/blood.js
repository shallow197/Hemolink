// =====================================================================
// blood.js — Règles de compatibilité ABO/Rhésus
// =====================================================================
// Quand un hôpital cherche du sang pour un patient d'un groupe donné,
// quels groupes de donneurs peuvent répondre ? Réponse ici.
// =====================================================================

// --- Table de compatibilité (transfusion de globules rouges) -------------
// Lecture : pour un RECEVEUR de groupe X (clé), on peut accepter
//           du sang venant des DONNEURS listés en valeur.
// Règle médicale : un receveur Rh+ accepte Rh+ et Rh-, un receveur Rh- n'accepte que Rh-.
// O- est donneur universel (compatible avec tous les receveurs).
// AB+ est receveur universel (compatible avec tous les donneurs).
const COMPAT = {
  'O-':  ['O-'],
  'O+':  ['O+', 'O-'],
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // receveur universel
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
};

// --- Liste de référence des 8 groupes sanguins ---------------------------
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// --- API exposée ---------------------------------------------------------
/**
 * Renvoie les groupes de donneurs compatibles avec un receveur donné.
 * Utilisé dans hopitaux.js pour cibler les bons donneurs lors d'une alerte.
 */
export function groupesCompatiblesPourReceveur(groupeReceveur) {
  return COMPAT[groupeReceveur] || [];
}

/** Renvoie une copie de la liste des 8 groupes (utilisé pour les UI). */
export function tousLesGroupesSanguins() {
  return [...GROUPS];
}

// =====================================================================
// EXPLICATION :
// ---------------------------------------------------------------------
// Ce fichier encode UNE règle médicale fondamentale : qui peut donner du
// sang à qui. Sans cette logique, on enverrait des alertes à des donneurs
// incompatibles — médicalement dangereux et inefficace. Grâce à cette table,
// quand un hôpital cherche par exemple du O- (urgence vitale, groupe rare),
// HemoLink ne contacte QUE les donneurs O-. Et inversement quand l'hôpital
// cherche du AB+ (receveur universel), HemoLink peut mobiliser n'importe
// quel donneur. C'est le cœur de l'intelligence du ciblage.
// =====================================================================
