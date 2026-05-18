@echo off
REM =====================================================================
REM push-github.bat — Push automatique vers github.com/shallow197/Hemolink
REM =====================================================================
REM Double-clique sur ce fichier pour pousser toutes les modifications.
REM Ou ouvre cmd dans le dossier HemoLink et tape : push-github.bat
REM =====================================================================

cd /d "%~dp0"

echo ===================================================
echo HemoLink - Push vers GitHub (shallow197/Hemolink)
echo ===================================================
echo.

echo [1/4] Verification du remote git...
git remote -v
echo.

echo [2/4] Ajout de tous les changements...
git add -A
echo.

echo [3/4] Commit...
git commit -m "feat: refonte multi-roles + commentaires soutenance" -m "- DB schema repense (9 tables: users, donneurs, hopitaux, stocks, alertes, reponses, historique, audit, regions)" -m "- Seed avec 15 hopitaux reels du Senegal + 30 donneurs geolocalises" -m "- Backend: auth JWT, bcrypt, helmet, rate-limit, validation Zod, audit log" -m "- Routes enrichies: /me, /repondre, /valider, /cnts/national, /stocks editables" -m "- Frontend: multi-roles (donneur, hopital, cnts, admin) + pages publiques" -m "- Pages publiques: Landing, Login (avec quick logins), Register 2 etapes, DevenirDonneur" -m "- Espace donneur: Dashboard, MesAlertes (accept/refuse), MonProfil, MonHistorique" -m "- Espace staff: Dashboard, Donneurs (validation), Hopitaux (stocks editables), Alertes, AlerteDetail (lien WhatsApp), CntsNational" -m "- Assistant IA (Groq/Llama 3.3 70B) avec garde SQL en lecture seule" -m "- Commentaires pedagogiques bloc-par-bloc + recap soutenance dans tous les fichiers cles" -m "- DEMO.md scenario de presentation en 5 actes" -m "- README.md complet + script init-db + script verify"

if errorlevel 1 (
  echo.
  echo Aucun changement a committer, ou erreur au commit.
  pause
  exit /b 1
)
echo.

echo [4/4] Push vers GitHub...
git push origin master
if errorlevel 1 (
  echo.
  echo ERREUR au push. Verifie tes credentials GitHub.
  echo Si demande, donne ton nom d'utilisateur et un PERSONAL ACCESS TOKEN
  echo (cree sur https://github.com/settings/tokens - scope "repo")
  pause
  exit /b 1
)

echo.
echo ===================================================
echo  PUSH REUSSI !
echo  Voir le repo : https://github.com/shallow197/Hemolink
echo ===================================================
pause
