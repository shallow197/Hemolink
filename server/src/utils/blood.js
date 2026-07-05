/** Groupes sanguins compatibles pour transfusion de globules rouges (donneur → receveur demandé) */
const COMPAT = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
};

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function groupesCompatiblesPourReceveur(groupeReceveur) {
  return COMPAT[groupeReceveur] || [];
}

export function tousLesGroupesSanguins() {
  return [...GROUPS];
}
