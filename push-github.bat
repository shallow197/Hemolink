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
git commit -m "feat: RGPD + CGU + certificats + CSV + SMS + landing OMS" ^
  -m "== Conformite Loi 2008-12 (Senegal) + RGPD ==" ^
  -m "- CGU/Politique de confidentialite completes (HemoLink-CGU.docx + page publique /cgu)" ^
  -m "- 3 routes RGPD backend: GET /me/export (JSON portabilite), POST /me/anonymiser (option B), DELETE /me (droit oubli)" ^
  -m "- Page 'Mes droits' donneur avec 3 boutons + modale confirmation (taper nom en MAJ)" ^
  -m "- Register mis a jour: consentement explicite avec lien vers CGU" ^
  -m "- Footer PublicLayout: lien CGU" ^
  -m "== Certificat de don PDF ==" ^
  -m "- Route GET /api/exports/donneur/certificat/:hdId (HTML autonome imprimable, N° unique HL-XXXXXX-YYYY)" ^
  -m "- Bouton 'Telecharger' sur chaque ligne de MonHistorique" ^
  -m "== Export CSV rapports CNTS ==" ^
  -m "- Route GET /api/exports/cnts/csv (CSV multi-sections avec BOM UTF-8 pour Excel)" ^
  -m "- Bouton 'Exporter en CSV/Excel' sur la vue nationale CNTS" ^
  -m "== Simulation SMS (canal secondaire) ==" ^
  -m "- Table notifications_sms + migration_sms.sql" ^
  -m "- Auto-generation des SMS lors du declenchement d'une alerte (160 char, style ALERTE HemoLink)" ^
  -m "- 3 endpoints: GET /queue, POST /:id/envoyer, POST /envoyer-tout" ^
  -m "- Nouvelle page CNTS /staff/sms avec 4 KPIs cliquables + tableau + envoi batch" ^
  -m "- Menu 'File SMS' ajoute au CNTS" ^
  -m "== Landing amelioree ==" ^
  -m "- Section 'Le contexte senegalais' avec 4 FactCard (chiffres OMS/CNTS)" ^
  -m "- Section 'Notre ecosysteme' avec 4 PartnerCard (CNTS, ESP/UCAD, Ministere, OMS)" ^
  -m "- Encart 'Lettre d'intention CNTS en cours d'obtention' (M. Serigne Kote)" ^
  -m "== Docs et outils ==" ^
  -m "- HemoLink-Presentation.docx: script 6x1min avec accroche revisee + SMS dans roadmap" ^
  -m "- HemoLink-Soutenance.pptx: 12 slides pretes a projeter" ^
  -m "- HemoLink-CGU.docx: document juridique conforme"

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
