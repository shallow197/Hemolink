# HemoLink — Soutenance

## Partie 1 — Les acteurs et leurs fonctionnalités

HemoLink est conçu autour de **4 acteurs humains** + **1 acteur intelligent**.
Chacun a son espace dédié, ses droits, ses outils.

---

### 1) Le DONNEUR (citoyen sénégalais inscrit volontairement)

**Qui ?** Toute personne de 18 à 65 ans, ≥ 50 kg, en bonne santé.
**Comment il entre dans le système ?** Auto-inscription en ligne avec consentement RGPD.

**Ce qu'il peut faire :**
- **S'inscrire** en 2 étapes (identité + médical + géolocalisation GPS)
- **Voir son tableau de bord** : statut d'éligibilité, prochaine date de don, nombre de vies sauvées
- **Recevoir des alertes ciblées** par groupe sanguin compatible + rayon géographique
- **Accepter ou refuser une alerte en un clic** (depuis son téléphone)
- **Voir son historique complet** de dons (traçabilité totale)
- **Éditer son profil** : disponibilité, coordonnées, géolocalisation
- **Contacter l'hôpital par WhatsApp** depuis la fiche alerte (lien pré-rempli)
- **Discuter avec l'assistant IA** pour ses questions médicales

---

### 2) Le STAFF HÔPITAL (médecin, infirmier, agent transfusion)

**Qui ?** Le personnel d'un hôpital partenaire (CHNU Fann, Hôpital Principal, Dalal Jamm, etc.).
**Compte créé par ?** Le CNTS lors de l'intégration de l'établissement.

**Ce qu'il peut faire :**
- **Consulter le tableau de bord de SON hôpital** (stocks, alertes actives, statistiques)
- **Éditer ses stocks de sang en temps réel** (8 groupes sanguins, seuil critique configurable)
- **Déclencher une alerte d'urgence** en 30 secondes (groupe, rayon, niveau d'urgence, message)
- **Suivre les réponses** des donneurs en temps réel (qui a accepté, qui a refusé)
- **Contacter directement** les donneurs acceptants via WhatsApp pré-rempli
- **Clôturer manuellement** une alerte (résolue, annulée, expirée)
- **Consulter la liste des donneurs** validés par le CNTS
- **Voir la carte** : hôpitaux, donneurs disponibles, alertes en cours

---

### 3) Le CNTS (Centre National de Transfusion Sanguine)

**Qui ?** L'autorité nationale de coordination du don de sang au Sénégal.
**Rôle ?** Pilotage stratégique, validation, supervision.

**Ce qu'il peut faire (en plus du staff hôpital) :**
- **Vue nationale agrégée** : stocks par groupe au niveau Sénégal entier
- **Cartographie des donneurs par région** (14 régions du Sénégal)
- **Statistiques 30 jours** : activité, taux de résolution, délai moyen de réponse
- **Validation des nouveaux comptes donneurs** (contrôle qualité)
- **Accès à toutes les alertes** de tous les hôpitaux (vue transversale)
- **Identification des pénuries** par groupe et par région
- **Audit log** : qui a fait quoi quand (conformité réglementaire)

---

### 4) L'ADMIN (équipe technique HemoLink)

**Qui ?** Les développeurs / mainteneurs du système.
**Droits ?** Tous les droits + maintenance technique.

**Ce qu'il peut faire :**
- Toutes les actions du CNTS
- Gestion des comptes utilisateurs
- Accès au journal d'audit complet
- Désactivation de comptes
- Maintenance de la base de données

---

### 5) L'ASSISTANT IA (Llama 3.3 70B via Groq)

**Qui ?** Modèle de langage intégré, accessible depuis n'importe quel espace connecté.
**Rôle ?** Faciliter l'accès à l'information sans formation technique.

**Ce qu'il peut faire :**
- **Répondre à des questions en langage naturel** sur les données ("combien de O- disponibles à Dakar ?")
- **Reformuler les chiffres** en phrases compréhensibles pour le staff médical
- **Conseiller sur l'éligibilité** d'un donneur
- **Expliquer les règles métier** (délais inter-dons, groupes rares, etc.)
- **Génère du SQL en lecture seule** (sécurisé par notre garde sqlGuard)

---

## Partie 2 — Script de présentation (6 personnes × 1 minute)

> **Format :** 6 intervenants, 1 minute chacun, soit **6 minutes pile**.
> Chaque bloc fait ~140-150 mots (rythme normal en français).
> Les **[indications scéniques]** ne sont PAS prononcées.
> Le **mot en gras** est à appuyer fortement.

---

### 🎤 INTERVENANT 1 — Le hook + le problème (1 min)

[Commencer **debout, calme, regard balayant le jury**. Pause de 2 secondes avant de parler.]

> *"21 heures. Hôpital Principal de Dakar. Une jeune femme arrive en hémorragie post-partum. Elle a besoin de **trois poches de sang O-, maintenant**. Mais le stock est vide. Le médecin saisit son téléphone… et commence à appeler ses contacts WhatsApp un par un.*
>
> *Cette scène, elle se joue chaque semaine au Sénégal. Et trop souvent, elle finit mal."*
>
> [Pause. Changer de ton, plus posé.]
>
> *"Nous sommes le groupe HemoLink. Notre projet part d'un constat simple : au Sénégal, quand un hôpital est en rupture de sang, la recherche de donneurs se fait au téléphone, sur WhatsApp, sur Facebook. **C'est lent, c'est désorganisé, et chaque minute peut coûter une vie.***
>
> *Lors de notre visite au CNTS de Dakar, M. Serigne Kote nous l'a confirmé : aujourd'hui, il n'existe **aucun système automatisé** pour mobiliser rapidement les donneurs compatibles.*
>
> *Notre réponse, c'est HemoLink."*

[Geste de la main vers l'écran. Le suivant prend la parole.]

---

### 🎤 INTERVENANT 2 — La solution et les acteurs (1 min)

[Pointer brièvement l'écran ou un slide synthèse.]

> *"HemoLink, c'est **une plateforme web qui connecte trois acteurs en temps réel** : les donneurs, les hôpitaux, et le CNTS.*
>
> *Le **donneur** s'inscrit en ligne, déclare son groupe sanguin et sa géolocalisation. Il reçoit des alertes UNIQUEMENT pour les urgences proches de chez lui et compatibles avec son groupe. Il accepte ou refuse en un clic.*
>
> *L'**hôpital**, lui, gère ses stocks en temps réel. Quand il est en rupture, il déclenche une alerte : il choisit le groupe, le rayon, le niveau d'urgence. En moins d'une seconde, HemoLink identifie **tous les donneurs compatibles et disponibles** dans la zone, et leur envoie la notification.*
>
> *Le **CNTS** a une vue d'ensemble : stocks nationaux, donneurs par région, activité en temps réel. C'est leur cockpit de pilotage stratégique.*
>
> *Tout est sécurisé, tout est tracé, tout est **conforme aux exigences médicales**. Et c'est mon collègue qui va vous expliquer comment on a conçu ça."*

[Faire un pas de côté.]

---

### 🎤 INTERVENANT 3 — La conception (1 min)

[Afficher les diagrammes MCD/MLD ou cas d'utilisation.]

> *"Pour concevoir HemoLink, on a suivi une démarche **Cycle en V hybride** : la rigueur d'un système médical, avec l'agilité d'itérations Scrum à l'intérieur.*
>
> *Voici notre **MCD** : neuf entités structurées autour d'une logique simple. Au centre, les **alertes** lient un hôpital à des donneurs via la table 'réponses', qui est notre table de notification. Chaque donneur a son historique, chaque action est tracée dans un journal d'audit — exigence forte du CNTS pour la conformité.*
>
> *Côté **cas d'utilisation**, on identifie quatre rôles : donneur, staff hôpital, CNTS et admin. Chaque acteur a ses propres parcours :*
> - *Le donneur s'inscrit, reçoit des alertes, répond.*
> - *L'hôpital gère ses stocks, déclenche des alertes, suit les réponses.*
> - *Le CNTS valide les comptes, supervise l'activité nationale.*
>
> *Le MLD respecte la troisième forme normale, avec des index sur les colonnes de recherche fréquente — groupe sanguin, géolocalisation, disponibilité. **Tout est prêt pour passer à l'échelle nationale.***
>
> *Maintenant, place à la démo."*

[Tourner vers le présentateur suivant et lui laisser l'écran.]

---

### 🎤 INTERVENANT 4 — Démo : parcours hôpital + donneur (1 min)

[Naviguer sur l'écran. Garder les yeux entre l'écran et le jury.]

> *"Je me connecte en tant que staff du CHNU Fann.*
>
> [Cliquer "Hôpitaux & stocks".]
>
> *Voici les stocks de Fann. Je vois immédiatement que mon stock **O-** est en rouge — sous le seuil critique. Je clique 'Lancer une alerte'.*
>
> [Remplir le formulaire.]
>
> *Je choisis : groupe O-, niveau critique, rayon 25 km, 3 poches. Je valide.*
>
> *En **moins d'une seconde**, HemoLink a fait trois choses : créé l'alerte, calculé les donneurs compatibles avec O- — donc O- uniquement, car O- n'accepte que O- — et notifié tous ceux qui sont à moins de 25 km de Fann.*
>
> [Se déconnecter, se reconnecter en tant qu'Aminata.]
>
> *Maintenant je suis Aminata Diop, donneuse O-. Je me connecte.*
>
> [Bandeau rouge visible.]
>
> *Bandeau rouge immédiat. Je vois l'alerte de Fann, la distance — 2,4 km — le message du médecin. **Je clique 'J'accepte'.***
>
> *Côté Fann, le compteur 'donneurs acceptés' passe à 1 en temps réel. **Mission accomplie en 30 secondes.**"*

[Tourner vers le présentateur suivant.]

---

### 🎤 INTERVENANT 5 — Démo : Vue CNTS + Assistant IA (1 min)

> *"Je me connecte maintenant en tant que CNTS.*
>
> [Cliquer 'Vue nationale CNTS'.]
>
> *Voici notre **vue stratégique nationale**. En un coup d'œil : les stocks agrégés du Sénégal entier, les groupes critiques en rouge, la répartition des donneurs sur les 14 régions, l'activité des 30 derniers jours. **Pour le CNTS, c'est un véritable cockpit décisionnel.***
>
> *Mais on a voulu aller plus loin. On a intégré un **assistant IA** basé sur Llama 3.3.*
>
> [Ouvrir la sidebar IA.]
>
> *Je tape : "Combien de donneurs O- disponibles à Dakar ?"*
>
> *L'IA génère une requête SQL en lecture seule — sécurisée par notre garde maison qui n'autorise QUE les SELECT — exécute, et reformule la réponse en français naturel. **Pas de jargon, pas de tableaux bruts, juste une phrase.***
>
> *Le médecin n'a plus besoin de connaître SQL ni de cliquer dans 5 menus. Il pose sa question, il a sa réponse. **Voilà notre vision : la donnée médicale accessible à tous.***"

[Pause forte. Se tourner vers le dernier intervenant.]

---

### 🎤 INTERVENANT 6 — Roadmap + conclusion percutante (1 min)

[Reprendre une posture droite, regard sur le jury.]

> *"Ce qu'on vous a montré est **fonctionnel aujourd'hui**. Mais HemoLink, c'est aussi une vision.*
>
> *Trois chantiers majeurs sont en cours :*
>
> ***Un**, l'**intelligence prédictive**. Au-delà du chat, on va entraîner un modèle qui anticipe les ruptures de stock 7 jours à l'avance, recommande les meilleurs donneurs à mobiliser, et optimise les campagnes de don. Le système ne réagira plus aux urgences, **il les préviendra**.*
>
> ***Deux**, la **géolocalisation temps réel**. Avec l'accord du donneur, sa position actuelle remplacera son adresse fixe — un médecin disponible à 500 mètres d'un hôpital sera contacté en priorité, même s'il habite à 30 km.*
>
> ***Trois**, la **plateforme en wolof**. Pour qu'aucun citoyen sénégalais ne soit exclu par la langue. Parce que sauver des vies, ça parle toutes les langues.*
>
> [Pause. Ton solennel.]
>
> *Notre objectif final : que le CNTS adopte HemoLink, et que d'autres pays d'Afrique de l'Ouest s'en inspirent.*
>
> ***Au Sénégal, chaque minute peut sauver trois vies. Nous, on a décidé de ne plus en perdre une seule.***
>
> *Merci."*

[Sourire. Trois secondes de silence. Applaudissements.]

---

## Partie 3 — Conseils pour rendre la présentation NEKH

### Avant la présentation
- **Répétez 3 fois minimum** chacun votre minute, **chronomètre en main**. Si vous dépassez de 10s, raccourcissez.
- Préparez un **ordre clair** : qui parle après qui, dans quel ordre vous vous tenez devant le jury.
- Sur les slides, **minimum de texte, maximum de visuel** (capture d'écran HemoLink, MCD, diagrammes).

### Pendant la présentation
- **Regardez le jury**, pas l'écran ni vos notes.
- **Une pause de 1-2 secondes** entre chaque intervenant — laisse le jury respirer.
- **Pointez l'écran** quand vous montrez une fonctionnalité — guidez le regard du jury.
- **Soyez incarné** : utilisez "je" pendant la démo ("je me connecte", "je vois", "je clique").
- **Évitez les "euh"** : si vous bloquez, faites une pause silencieuse.

### Les transitions qui font pro
- Intervenant 1 → 2 : *"Notre réponse, c'est HemoLink."* → l'intervenant 2 prend la parole sans transition.
- Intervenant 2 → 3 : *"…c'est mon collègue qui va vous expliquer comment on a conçu ça."*
- Intervenant 3 → 4 : *"Maintenant, place à la démo."*
- Intervenant 4 → 5 : *"Mission accomplie en 30 secondes."* → l'intervenant 5 enchaîne.
- Intervenant 5 → 6 : *"Voilà notre vision : la donnée médicale accessible à tous."*

### Questions probables du jury — réponses prêtes

**Q : "Pourquoi un Cycle en V hybride et pas du Scrum pur ?"**
> *Système médical = rigueur non négociable. Le Cycle en V garantit la traçabilité demandée par le CNTS. Mais on a besoin de feedback terrain rapide, donc on fait des itérations Scrum de 2 semaines à l'intérieur de chaque phase. C'est le meilleur des deux mondes.*

**Q : "Et la sécurité des données médicales ?"**
> *Trois lignes de défense : (1) JWT + bcrypt + rate-limit anti brute-force, (2) validation Zod sur toutes les entrées, (3) audit log complet de toutes les actions sensibles. L'IA elle-même est encadrée par un garde SQL qui n'autorise que les SELECT.*

**Q : "Comment vous gérez les zones sans internet ?"**
> *C'est dans notre roadmap : mode dégradé SMS via Orange Sénégal API. Pour la v1, on cible les zones urbaines couvertes.*

**Q : "Est-ce que le CNTS va vraiment utiliser ça ?"**
> *On a rencontré M. Serigne Kote, qui a accepté d'évaluer l'application après dépôt d'une demande officielle de collaboration. C'est notre prochaine étape concrète.*

**Q : "Combien de temps pour développer ?"**
> *3 mois pour le MVP en pair-programming, avec une équipe de 6. Le code est ouvert, modulaire, et documenté bloc par bloc.*

**Q : "Pourquoi Groq et pas OpenAI ?"**
> *Latence inférieure à 1 seconde, gratuit pour usage modéré, et Llama 3.3 70B est comparable à GPT-4 sur le français. Sur un système d'urgence, la latence compte.*

---

## Partie 4 — Mémo "qui dit quoi" (à imprimer)

| Ordre | Nom de l'intervenant | Thème             | Phrase d'accroche                                                            | Phrase de fin                                              |
|-------|----------------------|-------------------|------------------------------------------------------------------------------|------------------------------------------------------------|
| 1     | ___________________  | Hook + problème   | *"21 heures. Hôpital Principal de Dakar…"*                                  | *"Notre réponse, c'est HemoLink."*                          |
| 2     | ___________________  | Solution + acteurs| *"HemoLink, c'est une plateforme web qui connecte trois acteurs…"*           | *"…c'est mon collègue qui va vous expliquer la conception."*|
| 3     | ___________________  | Conception MCD/MLD| *"Pour concevoir HemoLink, on a suivi une démarche Cycle en V hybride…"*    | *"Maintenant, place à la démo."*                            |
| 4     | ___________________  | Démo hôpital+donneur| *"Je me connecte en tant que staff du CHNU Fann…"*                         | *"Mission accomplie en 30 secondes."*                       |
| 5     | ___________________  | Démo CNTS + IA    | *"Je me connecte maintenant en tant que CNTS…"*                              | *"La donnée médicale accessible à tous."*                   |
| 6     | ___________________  | Roadmap + conclu  | *"Ce qu'on vous a montré est fonctionnel aujourd'hui…"*                     | *"Au Sénégal, chaque minute peut sauver trois vies…"*       |

---

## Partie 5 — Slides recommandées (1 slide par intervenant + bonus)

1. **Slide 1 (Intervenant 1)** : titre HemoLink + photo dakaroise (hôpital ou ambulance) + chiffre choc ("X% de pénuries de sang au Sénégal")
2. **Slide 2 (Intervenant 2)** : schéma simple "Donneur ↔ Hôpital ↔ CNTS" avec icônes
3. **Slide 3 (Intervenant 3)** : MCD + cas d'utilisation côte à côte
4. **Slide 4 (Intervenant 4)** : capture d'écran "lancer alerte" + capture "mes alertes" donneur
5. **Slide 5 (Intervenant 5)** : capture vue nationale CNTS + capture chat IA
6. **Slide 6 (Intervenant 6)** : trois icônes (prédiction, géoloc, wolof) + tagline "Chaque minute compte"
7. **Slide bonus 'Merci'** : noms des 6 membres + lien GitHub + contact

---

**Bonne chance. Vous allez assurer. HemoLink mérite d'être adopté — votre job ce jour-là, c'est juste de le faire voir au jury.**
