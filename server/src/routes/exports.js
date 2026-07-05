// =====================================================================
// exports.js — Génération de rapports pour le CNTS et certificat donneur
// =====================================================================
//   GET /api/exports/cnts/csv         → CSV national CNTS (stocks + activité)
//   GET /api/exports/donneur/certificat/:hdId → HTML certificat imprimable
// =====================================================================

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Helper CSV : échappement RFC 4180
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvRow(arr) { return arr.map(csvCell).join(',') + '\n'; }

// =====================================================================
// GET /api/exports/cnts/csv  → rapport national CSV
// =====================================================================
router.get('/cnts/csv', requireAuth(), requireRole('cnts', 'admin'), async (_req, res) => {
  try {
    // Section 1 : Stocks par groupe (national)
    const [stocks] = await pool.query(
      `SELECT groupe_sanguin, SUM(quantite_poches) AS total, SUM(seuil_critique) AS seuil
       FROM stocks_sang GROUP BY groupe_sanguin ORDER BY groupe_sanguin`
    );

    // Section 2 : Donneurs par région
    const [parRegion] = await pool.query(
      `SELECT r.nom, COUNT(d.id) AS donneurs,
              SUM(CASE WHEN d.disponible = 1 AND d.en_attente_validation = 0 THEN 1 ELSE 0 END) AS disponibles
       FROM regions r LEFT JOIN donneurs d ON d.region_id = r.id
       GROUP BY r.id, r.nom ORDER BY donneurs DESC`
    );

    // Section 3 : Alertes 30 derniers jours
    const [alertes30j] = await pool.query(
      `SELECT DATE(date_creation) AS jour, COUNT(*) AS total,
              SUM(CASE WHEN statut = 'resolue' THEN 1 ELSE 0 END) AS resolues,
              SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) AS en_cours
       FROM alertes WHERE date_creation >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(date_creation) ORDER BY jour DESC`
    );

    // Section 4 : Hôpitaux (stocks détaillés)
    const [hopStocks] = await pool.query(
      `SELECT h.nom AS hopital, h.ville, s.groupe_sanguin, s.quantite_poches, s.seuil_critique,
              CASE WHEN s.quantite_poches < s.seuil_critique THEN 'CRITIQUE' ELSE 'OK' END AS niveau
       FROM stocks_sang s JOIN hopitaux h ON h.id = s.hopital_id
       ORDER BY h.nom, s.groupe_sanguin`
    );

    let csv = '';
    csv += `HemoLink - Rapport CNTS national\n`;
    csv += `Généré le,${new Date().toLocaleString('fr-FR')}\n`;
    csv += '\n';

    csv += `=== STOCKS NATIONAUX PAR GROUPE ===\n`;
    csv += csvRow(['Groupe', 'Poches disponibles', 'Seuil critique national']);
    stocks.forEach((s) => csv += csvRow([s.groupe_sanguin, s.total, s.seuil]));
    csv += '\n';

    csv += `=== DONNEURS PAR RÉGION ===\n`;
    csv += csvRow(['Région', 'Donneurs total', 'Disponibles validés']);
    parRegion.forEach((r) => csv += csvRow([r.nom, r.donneurs, r.disponibles]));
    csv += '\n';

    csv += `=== ACTIVITÉ 30 DERNIERS JOURS ===\n`;
    csv += csvRow(['Date', 'Alertes créées', 'Résolues', 'En cours']);
    alertes30j.forEach((a) => csv += csvRow([a.jour, a.total, a.resolues, a.en_cours]));
    csv += '\n';

    csv += `=== STOCKS DÉTAILLÉS PAR HÔPITAL ===\n`;
    csv += csvRow(['Hôpital', 'Ville', 'Groupe', 'Poches', 'Seuil', 'Niveau']);
    hopStocks.forEach((h) => csv += csvRow([h.hopital, h.ville, h.groupe_sanguin, h.quantite_poches, h.seuil_critique, h.niveau]));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="hemolink-rapport-cnts-${new Date().toISOString().slice(0, 10)}.csv"`);
    // BOM UTF-8 pour Excel qui affiche correctement les accents
    res.send('﻿' + csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur export CSV' });
  }
});

// =====================================================================
// GET /api/exports/donneur/certificat/:hdId  → HTML certificat imprimable
// Le donneur (ou le staff) génère un certificat pour un don donné.
// =====================================================================
router.get('/donneur/certificat/:hdId', requireAuth(), async (req, res) => {
  try {
    const hdId = Number(req.params.hdId);
    const [[don]] = await pool.query(
      `SELECT hd.*, h.nom AS hopital_nom, h.ville AS hopital_ville, h.adresse AS hopital_adresse,
              d.prenom, d.nom AS donneur_nom, d.date_naissance, d.user_id
       FROM historique_dons hd
       JOIN hopitaux h ON h.id = hd.hopital_id
       JOIN donneurs d ON d.id = hd.donneur_id
       WHERE hd.id = ?`,
      [hdId]
    );
    if (!don) return res.status(404).json({ error: 'Don introuvable' });

    // Sécurité : un donneur ne peut voir QUE ses propres certificats
    if (req.user.role === 'donneur' && don.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const dateFr = new Date(don.date_don).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const nowFr = new Date().toLocaleDateString('fr-FR');
    const numCert = `HL-${String(don.id).padStart(6, '0')}-${new Date(don.date_don).getFullYear()}`;

    // HTML autonome, imprimable (Ctrl+P → PDF)
    const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8" />
<title>Certificat de don n° ${numCert}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1E2761; padding: 20mm; }
  .frame { border: 3px double #990011; padding: 20mm; position: relative; min-height: 240mm; }
  .frame::before, .frame::after {
    content: '❤'; position: absolute; font-size: 30px; color: #990011;
  }
  .frame::before { top: 8mm; left: 8mm; }
  .frame::after  { bottom: 8mm; right: 8mm; transform: rotate(180deg); }
  .header { text-align: center; margin-bottom: 15mm; }
  .logo { font-family: 'Arial Black', sans-serif; color: #990011; font-size: 28pt; letter-spacing: 4px; }
  .subtitle { color: #4A4A4A; font-size: 11pt; margin-top: 3mm; font-style: italic; }
  h1 { text-align: center; font-size: 32pt; margin: 15mm 0 5mm; color: #990011; letter-spacing: 2px; }
  .sub { text-align: center; font-size: 13pt; color: #4A4A4A; margin-bottom: 20mm; }
  .body { font-size: 13pt; line-height: 1.9; text-align: justify; padding: 0 10mm; }
  .body strong { color: #990011; }
  .details { background: #FCF6F5; border-left: 6px solid #990011; padding: 10mm; margin: 15mm 0; font-size: 11pt; }
  .details table { width: 100%; }
  .details td { padding: 2mm 0; }
  .details td:first-child { font-weight: bold; color: #1E2761; width: 40%; }
  .impact { text-align: center; background: #990011; color: white; padding: 8mm; margin: 15mm 0; font-size: 15pt; font-weight: bold; }
  .impact small { display: block; font-size: 10pt; margin-top: 2mm; font-weight: normal; opacity: 0.9; }
  .footer { display: flex; justify-content: space-between; margin-top: 25mm; font-size: 10pt; color: #4A4A4A; }
  .signature { text-align: center; width: 70mm; }
  .signature .line { border-top: 1px solid #4A4A4A; padding-top: 2mm; }
  .cert-no { text-align: center; margin-top: 15mm; font-size: 9pt; color: #999; letter-spacing: 1px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
  .btn-print {
    position: fixed; top: 20px; right: 20px;
    background: #990011; color: white; padding: 12px 20px;
    border: none; border-radius: 8px; font-size: 14pt; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
</style></head><body>
<button class="btn-print no-print" onclick="window.print()">🖨 Imprimer / Enregistrer en PDF</button>
<div class="frame">
  <div class="header">
    <div class="logo">HEMOLINK</div>
    <div class="subtitle">Coordination des dons de sang d'urgence · République du Sénégal</div>
  </div>
  <h1>CERTIFICAT DE DON</h1>
  <div class="sub">DÉLIVRÉ EN RECONNAISSANCE D'UN GESTE VITAL</div>
  <div class="body">
    <p>Le Centre National de Transfusion Sanguine (CNTS) et la plateforme <strong>HemoLink</strong>
    certifient que&nbsp;:</p>
    <p style="text-align:center; font-size:20pt; margin:10mm 0; color:#1E2761;">
      <strong>${don.prenom} ${don.donneur_nom}</strong>
    </p>
    <p>a effectué un don de sang volontaire et gratuit le <strong>${dateFr}</strong>
    au sein de l'établissement <strong>${don.hopital_nom}</strong> (${don.hopital_ville}),
    contribuant ainsi à la sauvegarde de vies humaines au Sénégal.</p>
  </div>
  <div class="details">
    <table>
      <tr><td>Groupe sanguin</td><td>${don.groupe_sanguin}</td></tr>
      <tr><td>Type de prélèvement</td><td>${don.type_prelevement.replace('_', ' ')}</td></tr>
      <tr><td>Nombre de poches prélevées</td><td>${don.poches_prelevees}</td></tr>
      <tr><td>Aptitude médicale au don</td><td>${don.apte ? 'Confirmée par le CNTS' : 'Non confirmée'}</td></tr>
    </table>
  </div>
  <div class="impact">
    UN DON PEUT SAUVER JUSQU'À TROIS VIES
    <small>Plaquettes · Globules rouges · Plasma</small>
  </div>
  <div class="footer">
    <div class="signature">
      <div class="line">Le Directeur du CNTS</div>
    </div>
    <div class="signature">
      <div class="line">Cachet et signature<br>${don.hopital_nom}</div>
    </div>
  </div>
  <div class="cert-no">Certificat N° ${numCert} · Émis le ${nowFr} · Authenticité vérifiable sur hemolink.sn/verif</div>
</div>
<script>if (window.matchMedia('print').matches === false) { setTimeout(() => {}, 0); }</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur certificat' });
  }
});

export default router;
