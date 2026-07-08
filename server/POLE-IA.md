# Partie IA — Intelligence prédictive : livraison (Lots 2, 3, 4)

Le chat Groq/Llama (`/api/ai/chat`) est cloisonné : le pipeline SQL (lecture seule, garde sqlGuard)
est réservé au staff ; donneurs et invités ont un mode information pure (modalités du don,
éligibilité, compatibilités) sans aucun accès à la base — barrière dans le prompt ET dans le code. Cette livraison
ajoute la partie **prédictive** promise dans le pitch : 100 % déterministe et explicable
(pas de boîte noire), 0 dépendance, 0 coût API, fonctionne hors-ligne — et chaque réponse
JSON embarque un champ `methode` qui explique le calcul (argument clé en soutenance).

## Lot 2 — Prévisions de rupture de stock (`src/utils/previsions.js`)

`GET /api/ai/previsions` — staff : son hôpital (cloisonnement JWT) · cnts/admin : national.
Filtres `?hopital_id=` et `?niveau=rupture|critique|surveille|ok`. Réponse : `resume`
agrégé + lignes triées par urgence.

**Formule** : conso/jour = max(poches demandées via alertes sur 90 j ÷ 90 ; seuil_critique ÷ 30 ;
0,05) → autonomie = stock ÷ conso → `date_rupture_estimee`. Niveaux : `rupture` 0 j ·
`critique` ≤ 7 j · `surveille` ≤ 14 j. Chaque ligne expose ses entrées (`demande_90j`,
`conso_estimee_par_jour`) : le staff peut refaire le calcul à la main.

## Lot 3 — Recommandation des donneurs (`/api/alertes/:id/recommandations`)

Score /100 pour chaque donneur ciblé, staff uniquement, cloisonné par hôpital :

| Critère | Poids | Source | Barème |
|---|---|---|---|
| Éligibilité CNTS aujourd'hui | 30 % | `eligibility.js` | 1 ou 0 + raisons (âge, poids, délai 90 j H/120 j F) |
| Fiabilité historique | 30 % | `reponses_alertes` passées | accepté=1 · sans réponse=0,25 · refusé=0 · défaut 0,5 |
| Proximité | 25 % | Haversine stockée | 1 − distance/rayon |
| Expérience | 15 % | `nombre_dons` | plafonné à 10 dons |

Tri : « pas encore répondu » d'abord (eux seuls sont relançables), puis score décroissant.
`details_score` justifie chaque rang — affichable tel quel dans l'UI du Pôle 5.

## Lot 4 — Notifications automatiques (`src/utils/autoNotifs.js`)

Deux règles **idempotentes** (prouvé par test : 2ᵉ passage = 0 création) :
- `rappel_eligibilite` → donneur redevenu éligible ; dédup par cycle via `NOT EXISTS`
  sur la date d'éligibilité (un nouveau don réarme le rappel).
- `stock_critique` prédictif → staff de l'hôpital si rupture ≤ 7 j (réutilise le Lot 2) ;
  dédup tant que la notification précédente n'est pas lue (titre normalisé = clé).

Déclencheurs : `POST /api/ai/generer-notifications` (cnts/admin, tracé dans `audit_log`)
ou `npm run notifs-auto` (cron : `0 8 * * * cd server && node scripts/auto-notifs.js`).

## Qualité

- **61/61 tests verts** (`npm test`) dont 11 nouveaux : cloisonnement par rôle (403),
  tri, filtres, champs de prédiction, idempotence, réception effective des notifications.
- Sécurité inchangée : JWT + `requireRole`, aucune écriture hors notifications auditées.
- Sous le rate-limit `/api/ai` existant (20 req/min/IP).

## Intégration front (Pôle 5)

Dashboard staff : bandeau « ⚠ N ruptures prévues sous 7 j » via `resume`. Détail alerte :
onglet « Qui mobiliser ? » (score + raisons). Cloche/page Notifications : déjà alimentées
par le Lot 4, zéro travail front supplémentaire.
