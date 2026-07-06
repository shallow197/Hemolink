# Pousser sur GitHub (shallow197/Hemolink)

## Option 1 — Le script automatique (le plus simple)

Double-clique sur **`push-github.bat`** à la racine du projet.

Le script va :
1. Vérifier la connexion au remote GitHub
2. Ajouter tous les changements (`git add -A`)
3. Faire un commit avec un message détaillé
4. Pousser sur la branche `master`

Si Git te demande tes identifiants :
- **Username** : `shallow197`
- **Password** : ton **Personal Access Token** (PAS le mot de passe GitHub)
  - À créer sur https://github.com/settings/tokens
  - Cocher le scope `repo` (lecture+écriture sur les repos)

## Option 2 — Commandes manuelles dans cmd

```bash
cd C:\wamp64\www\HemoLink

# 1. Voir l'état
git status

# 2. Ajouter tous les changements
git add -A

# 3. Commit
git commit -m "feat: refonte multi-roles + commentaires soutenance"

# 4. Push
git push origin master
```

## Vérification

Une fois poussé, ouvre https://github.com/shallow197/Hemolink — tu dois voir
le commit récent en haut de la liste, avec tous les fichiers modifiés.

## Si tu as une erreur "permission denied"

Crée un Personal Access Token :
1. Va sur https://github.com/settings/tokens
2. Clique "Generate new token" → "Generate new token (classic)"
3. Donne un nom (ex : "HemoLink dev")
4. Coche le scope **`repo`** (entier)
5. Clique "Generate token" et **copie le token** (tu ne le reverras plus)
6. Quand Git te demande le password, colle ce token

Astuce : pour mémoriser le token, lance une fois :
```bash
git config --global credential.helper store
```
Puis push : le token sera sauvegardé en clair dans `~/.git-credentials`.
