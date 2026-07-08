# Partie IA — Intelligence prédictive : livraison (Lots 2, 3, 4)

L'assistant conversationnel (chat Groq/Llama) existait déjà. Cette livraison ajoute
la partie **prédictive et explicable** annoncée dans la présentation — sans LLM,
donc gratuite, rapide, et démontrable même hors-ligne.

## Lot 2 — Prévisions de rupture de stock

`GET /api/ai/previsions` (staff hôpital : son hôpital · cnts/admin : national, filtres `?hopital_id=` et `?niveau=critique|rupture|surveille|ok`)

Méthode (déterministe, chaque prévision embarque ses variables) :
1. Demande observée = poches demandées via les alertes des 90 derniers jours → moyenne/jour
2. Plancher de rotation = seuil_critique / 30 (le seuil ≈ 1 mois de réserve)
3. Conso estimée = max(des deux) → **autonomie (jours) = stock / conso** → date de rupture estimée
4. Niveaux : `rupture` (0 j) · `critique` (≤ 7 j) · `surveille` (≤ 14 j) · `ok`

Logique dans `src/utils/previsions.js`, réutilisée par le Lot 4.

## Lot 3 — Recommandation des donneurs à mobiliser

`GET /api/alertes/:id/recommandations` (staff, cloisonné par hôpital)

Score explicable sur 100 pour chaque donneur ciblé par l'alerte :

| Critère | Poids | Source |
|---|---|---|
| Éligibilité CNTS aujourd'hui | 30 % | `utils/eligibility.js` (âge, poids, délai inter-dons) |
| Fiabilité historique | 30 % | réponses aux alertes passées (accepté=1, sans réponse=0.25, refusé=0) |
| Proximité | 25 % | 1 − distance/rayon (Haversine déjà stockée) |
| Expérience | 15 % | nombre de dons (plafonné à 10) |

Les donneurs « pas encore répondu » sont en tête (ce sont eux qu'on relance),
et `details_score` justifie chaque classement — pas de boîte noire.

## Lot 4 — Notifications intelligentes automatiques

Deux règles **idempotentes** (rejouables sans doublon) dans `src/utils/autoNotifs.js` :
- **Rappel d'éligibilité** : donneur dont le délai inter-dons (90 j H / 120 j F) est écoulé
  → notification `rappel_eligibilite`, une seule par cycle (un nouveau don réinitialise).
- **Stock critique prédictif** : rupture prévue sous 7 jours (Lot 2)
  → notification `stock_critique` au staff de l'hôpital, pas de doublon tant que non lue.

Déclenchement :
- `POST /api/ai/generer-notifications` (cnts/admin, audité)
- `npm run notifs-auto` — cron-compatible : `0 8 * * * cd server && node scripts/auto-notifs.js`

## Tests

11 tests ajoutés à `scripts/test-api.js` (prévisions, cloisonnement, tri, scoring,
idempotence, rôles). **Total : 61 réussis · 0 échoué** (`npm test`).

## Idées d'intégration front (Pôle 5)

- Dashboard staff : bandeau « ⚠ N stocks en rupture prévue sous 7 j » via `resume` de `/api/ai/previsions`.
- Page détail alerte : onglet « Qui mobiliser ? » listant les recommandations avec le score.
- La cloche affiche déjà les notifications générées (aucun travail supplémentaire).
