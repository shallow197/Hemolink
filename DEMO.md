# HemoLink — Scénario de démo (5 min)

Pour la présentation devant le prof / jury / CNTS.

## Avant la démo (1 fois, à faire une heure avant)

```bash
# 1) WAMP démarré (icône verte). Ensuite, à la racine du projet :
cd server
cp .env.example .env       # éditer si besoin (mot de passe MySQL vide par défaut)
npm install
npm run init-db            # crée la base + données démo + comptes
npm run dev                # API sur :4000

# Dans un autre terminal :
cd client
npm install
npm run dev                # App sur :5173
```

Ouvrir http://localhost:5173 dans Chrome.

---

## Scénario en 5 actes

### Acte 1 — Page d'accueil (45 s)

URL : `/accueil`

À montrer :
- Hero avec proposition de valeur claire
- KPIs en direct (donneurs, hôpitaux, alertes, dons)
- Trois étapes "Comment ça marche"
- Trois cartes pour les 3 personas (donneur, hôpital, CNTS)

> *"HemoLink connecte donneurs et hôpitaux en temps réel. Tous les chiffres
> sont en direct depuis la base de données — c'est une vraie application
> fonctionnelle, pas une maquette."*

### Acte 2 — Côté hôpital : déclencher une alerte (90 s)

1. Cliquer **Connexion** → choisir le compte démo *Staff CHNU Fann*
   (`fann@hemolink.sn` / `Hemolink2026!`)
2. Aller dans **Hôpitaux & stocks** : noter le badge "Mon hôpital" sur Fann,
   modifier un stock O- pour le passer sous le seuil (ex : 1)
3. Cliquer **Lancer une alerte** sur Fann :
   - Groupe : O-
   - Niveau : Critique
   - Message : "Patient en césarienne d'urgence, besoin immédiat"
   - Rayon : 25 km
   - Poches : 2
4. Confirmer → l'alerte est créée, on voit le nombre de donneurs contactés

> *"Le système a calculé en moins d'une seconde quels donneurs sont
> compatibles ABO/Rhésus, dans le rayon, disponibles et hors période d'attente
> inter-dons. Pas de spam, juste les bonnes personnes."*

### Acte 3 — Côté donneur : recevoir et accepter (60 s)

1. Se déconnecter
2. Se reconnecter avec **Aminata Diop** (`aminata@example.sn` / `Hemolink2026!`)
3. Tableau de bord donneur : bandeau rouge "Alerte en attente de votre réponse"
4. Cliquer "Voir l'alerte" → page **Mes alertes**
5. L'alerte O- de Fann apparaît avec niveau critique, distance, message
6. Cliquer **J'accepte**

> *"Le donneur n'a aucune action complexe à faire — un clic et l'hôpital sait
> qu'il vient. Si on atteint le nombre de poches nécessaires, l'alerte se
> résout automatiquement."*

### Acte 4 — Côté CNTS : pilotage stratégique (60 s)

1. Se déconnecter
2. Se reconnecter avec **CNTS Dakar** (`cnts@hemolink.sn` / `Hemolink2026!`)
3. Aller dans **Vue nationale CNTS** :
   - Stocks nationaux par groupe (avec alerte rouge sur les groupes critiques)
   - Donneurs par région (Dakar largement en tête)
   - Donneurs par groupe sanguin
   - Activité 30 jours
4. Aller dans **Donneurs** : on voit la colonne "Validation" — on peut valider
   les nouveaux comptes en attente

> *"Pour le CNTS, c'est un cockpit national : où sont les pénuries, où sont
> les donneurs, quel est le délai moyen de réponse. Tout est tracé dans la
> table audit_log pour conformité réglementaire."*

### Acte 5 — Assistant IA (45 s)

1. Cliquer **Assistant IA** dans le header
2. Poser : *"Combien de donneurs O- disponibles à Dakar ?"*
3. L'IA génère une requête SQL en lecture seule (jamais visible côté
   utilisateur), exécute, et reformule la réponse en langage naturel
4. Poser une question pédagogique : *"Quelles sont les conditions pour donner
   son sang ?"*

> *"L'assistant utilise Llama 3.3 70B via Groq. Toutes les requêtes SQL
> générées passent par un garde sécurité qui n'autorise que des SELECT sur
> les tables autorisées. Impossible de modifier les données via l'IA."*

---

## Si on te pose des questions

**"Pourquoi Cycle en V hybride ?"** → "Système médical = rigueur non
négociable du Cycle en V. Mais besoin de feedback terrain rapide = itérations
Scrum à l'intérieur de chaque phase. Cf. notre document méthodo."

**"Comment vous protégez les données ?"** → bcrypt + JWT + rate-limit anti
brute-force + Helmet + validation Zod systématique + audit log + garde SQL
en lecture seule pour l'IA + consentement RGPD obligatoire à l'inscription.

**"Et si pas d'internet sur le terrain ?"** → priorité 1 future : mode
dégradé SMS via Orange Sénégal API (déjà identifié dans le backlog).

**"C'est utilisé par le CNTS ?"** → "Pas encore, mais nous avons rencontré
M. Serigne Kote du CNTS qui a accepté d'évaluer l'application après une
demande officielle de collaboration. Notre objectif est exactement
l'adoption par le CNTS et son extension régionale."

**"Pourquoi Groq et pas OpenAI ?"** → Latence faible (latence < 1s),
gratuit pour usage faible, modèle Llama 3.3 70B comparable à GPT-4 sur le
français.
