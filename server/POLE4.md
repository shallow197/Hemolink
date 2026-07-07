# Pôle 4 — Back-End & Data : livraison

## Ce qui a été fait

### 1. BDD enrichie
- **Nouvelle table `notifications`** (7 types : `alerte_urgente`, `don_reussi`, `rappel_eligibilite`, `validation_profil`, `alerte_resolue`, `stock_critique`, `info`). Intégrée à `sql/schema.sql` + migration séparée `sql/migration_notifications.sql` pour une base existante.
- **Jeux d'essais complets** (`sql/seed.sql`) : 42 donneurs (dont 4 en attente de validation CNTS et une couverture régionale élargie), stocks pour les 15 hôpitaux, 6 alertes couvrant tous les statuts (`en_cours`, `resolue`, `expiree`, `annulee`), 15 dons dont 1 inaptitude, 13 notifications de tous les types, file SMS (envoyé/en file/échec), journal d'audit.

### 2. Backend vérifié (logs, clean code)
- Logger de requêtes HTTP (`src/middleware/logger.js`) : méthode, URL, statut coloré, durée. Désactivable avec `LOG_REQUESTS=0`.
- 404 JSON propre pour toute route `/api` inconnue.
- `scripts/verify.js` vérifie désormais les 11 tables.

### 3. Nouveaux endpoints (prérequis Pôle 5)
| Méthode | Route | Rôle | Usage Pôle 5 |
|---|---|---|---|
| GET | `/api/notifications?type=&lu=` | tous | page "Notifications" (types + icônes) |
| PATCH | `/api/notifications/:id/lu` | tous | marquer comme lue |
| POST | `/api/notifications/tout-lu` | tous | tout marquer lu |
| POST | `/api/donneurs/:id/dons` | staff | action "Enregistrer un don" sur la fiche donneur |
| DELETE | `/api/donneurs/:id` | cnts/admin | action "Supprimer" sur la fiche donneur |

Notifications créées automatiquement par les événements métier : création d'alerte (→ donneurs ciblés), validation d'un profil (→ donneur), don enregistré (→ donneur), alerte auto-résolue (→ staff), stock sous le seuil critique (→ staff).

La recherche donneur du Pôle 5 s'appuie sur l'existant : `GET /api/donneurs?search=<nom/tel/quartier>&groupe_sanguin=O-&ville=Dakar`.

### 4. Tests des endpoints
`scripts/test-api.js` : 50 tests d'intégration (GET/POST/PUT/PATCH/DELETE), zéro dépendance, démarre le serveur sur le port 4100.

## Comment lancer

```bash
cd server
npm run init-db   # réinitialise la base (schema + seed + hash bcrypt)
npm run verify    # contrôle post-installation
npm test          # 50 tests d'intégration (réinitialise la base avant)
npm run dev       # serveur sur http://localhost:4000
```

Résultat de la dernière exécution : **50 réussis · 0 échoués**.

⚠️ Base existante sans la table notifications ? Exécuter `sql/migration_notifications.sql` (ou simplement `npm run init-db`).
