# HemoLink

> Système intelligent de coordination des dons de sang d'urgence au Sénégal.
> Projet PPP — DIC1 / DGI / ESP / UCAD — Année académique 2025-2026.

HemoLink met en relation **donneurs**, **hôpitaux** et **CNTS** en temps réel
quand une urgence transfusionnelle se déclare. L'application calcule la
compatibilité ABO/Rhésus, géolocalise les donneurs disponibles dans un rayon
défini, et déclenche une alerte ciblée — pas de spam, juste les bonnes
personnes.

## Architecture

```
FRONTEND (Navigateur)              BACKEND (Node.js)             DONNÉES
────────────────────              ───────────────────             ────────
React 18 + Vite                   Express 4                       MySQL 8 / MariaDB
Tailwind CSS                      JWT + bcrypt                     (via WAMP)
React Router 6                    Helmet + Rate limit
Leaflet (carte)                   Zod (validation)                IA
Context API (auth)                Audit log                       Groq API (Llama 3.3 70B)
```

## Fonctionnalités principales

### Pour les donneurs
- Inscription en ligne avec consentement RGPD et géolocalisation
- Tableau de bord personnel (éligibilité, prochain don, historique)
- Réception d'alertes ciblées (groupe sanguin compatible + rayon)
- Réponse en un clic (j'accepte / pas cette fois)
- Lien WhatsApp pré-rempli avec l'hôpital

### Pour les hôpitaux
- Gestion en temps réel des stocks par groupe sanguin
- Édition des seuils critiques
- Déclenchement d'alertes urgentes (critique / urgent / normal)
- Suivi en direct des réponses des donneurs
- Auto-résolution dès que la cible de poches est atteinte

### Pour le CNTS (vue nationale)
- Stocks agrégés au niveau national par groupe sanguin
- Cartographie des donneurs par région
- Statistiques d'activité (alertes 30 jours, délai moyen de réponse)
- Validation des nouveaux comptes donneurs

### Assistant IA (Groq / Llama 3.3 70B)
- Questions en langage naturel sur les données
- Pédagogie sur l'éligibilité, les délais inter-dons, les groupes rares
- Réponses contextualisées au rôle de l'utilisateur

## Prérequis

- **Node.js 18+** (le serveur utilise `node --watch`)
- **WAMP / XAMPP / MAMP** ou MySQL 8 / MariaDB 10.4+ installé localement
- (Optionnel) Une **clé API Groq** pour l'assistant IA — https://console.groq.com

## Installation pas à pas

### 1) Cloner et installer les dépendances

```bash
# À la racine du projet
cd server && npm install
cd ../client && npm install
```

### 2) Configurer le backend

```bash
cd server
cp .env.example .env
```

Éditer `server/.env` :

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=      # vide par défaut sur WAMP
MYSQL_DATABASE=hemolink

JWT_SECRET=change-moi-en-production
GROQ_API_KEY=        # optionnel, pour l'assistant IA
```

### 3) Initialiser la base de données

S'assurer que MySQL tourne (icône WAMP verte). Puis :

```bash
cd server
npm run init-db
```

Ce script :
1. Crée la base `hemolink` (si absente)
2. Applique `sql/schema.sql` (tables, contraintes, index)
3. Applique `sql/seed.sql` (régions, hôpitaux, donneurs, alertes de démo)
4. Régénère les hash bcrypt des comptes de démo

### 4) Démarrer les serveurs

Dans deux terminaux séparés :

```bash
# Terminal 1 — Backend
cd server
npm run dev          # API sur http://localhost:4000

# Terminal 2 — Frontend
cd client
npm run dev          # App sur http://localhost:5173
```

Le frontend proxifie `/api/*` vers le backend automatiquement (cf. `vite.config.js`).

## Comptes de démonstration

> Mot de passe pour tous : **`Hemolink2026!`**

| Rôle    | Email                    | Description                                   |
|---------|--------------------------|-----------------------------------------------|
| Admin   | admin@hemolink.sn        | Accès complet                                 |
| CNTS    | cnts@hemolink.sn         | Vue nationale, validation des comptes         |
| Hôpital | fann@hemolink.sn         | Staff CHNU Fann                                |
| Hôpital | principal@hemolink.sn    | Staff Hôpital Principal                        |
| Hôpital | daljamm@hemolink.sn      | Staff Hôpital Dalal Jamm                       |
| Donneur | aminata@example.sn       | Aminata Diop, O- (groupe rare), Mermoz Dakar  |
| Donneur | cheikh@example.sn        | Cheikh Ndiaye, A+, Sacré-Cœur Dakar           |
| Donneur | fatou@example.sn         | Fatou Fall, B+, Yoff Dakar                     |

## Démo guidée (3 minutes)

1. **Page d'accueil** (`/accueil`) : KPIs en direct + présentation.
2. **Espace hôpital** : se connecter avec `fann@hemolink.sn`, ouvrir
   *Hôpitaux & stocks*, modifier un stock pour le passer sous le seuil, puis
   *Lancer une alerte* en O- urgent rayon 25 km.
3. **Espace donneur** : se déconnecter, se reconnecter avec
   `aminata@example.sn`, voir l'alerte arriver dans *Mes alertes* et cliquer
   *J'accepte*.
4. **Vue CNTS** : se reconnecter avec `cnts@hemolink.sn`, ouvrir *Vue
   nationale CNTS* pour visualiser stocks agrégés, donneurs par région, et
   activité 30 jours.
5. **Assistant IA** : depuis n'importe quelle page connectée, cliquer
   *Assistant IA* et demander par exemple « combien de donneurs O- disponibles
   à Dakar ? ».

## Démarche méthodologique

HemoLink suit un **Cycle en V hybride** :
- macro-structure du Cycle en V (rigueur médicale, traçabilité)
- itérations Scrum de 2 semaines à l'intérieur de chaque phase

Voir `docs/methodologie/` pour le détail (cf. document "Cycle en V hybride").

## Sécurité

- Mots de passe hachés avec bcrypt (10 rounds)
- Authentification stateless par JWT (Authorization Bearer)
- Rate-limit anti brute-force sur `/api/auth/*` et `/api/ai`
- Validation Zod systématique des entrées
- Helmet pour les headers HTTP
- Audit log de toutes les actions sensibles (table `audit_log`)
- Garde SQL en lecture seule pour l'IA (uniquement SELECT autorisés)

## Structure du projet

```
HemoLink/
├── server/                 Backend Express
│   ├── src/
│   │   ├── index.js        Point d'entrée
│   │   ├── db/pool.js      Pool MySQL
│   │   ├── middleware/     Auth JWT, validation Zod
│   │   ├── routes/         auth, donneurs, hopitaux, alertes, dashboard, ai
│   │   └── utils/          Compatibilité sang, géo, éligibilité, audit
│   ├── sql/
│   │   ├── schema.sql      Tables + contraintes + index
│   │   └── seed.sql        Données démo
│   └── scripts/
│       └── init-db.js      Initialise la base + comptes démo
└── client/                 Frontend React/Vite
    └── src/
        ├── App.jsx         Routes
        ├── api.js          Client HTTP + token
        ├── contexts/       AuthContext
        ├── layout/         PublicLayout, AppLayout
        ├── components/     ProtectedRoute, AiSidebar, MapSenegal
        └── pages/
            ├── public/     Landing, Login, Register, DevenirDonneur
            ├── donneur/    Dashboard, MesAlertes, MonProfil, MonHistorique
            └── staff/      Dashboard, Donneurs, Hopitaux, Alertes, CntsNational
```

## Crédits

Projet réalisé dans le cadre du Projet Personnel et Professionnel (PPP) sous
la direction du Dr Mangoné FALL (ESP/UCAD). En collaboration avec le Centre
National de Transfusion Sanguine de Dakar — contact M. Serigne Kote.
