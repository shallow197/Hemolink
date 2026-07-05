// =====================================================================
// Cgu.jsx — Page publique des Conditions Générales d'Utilisation
// =====================================================================
// Conforme à la Loi 2008-12 du Sénégal + RGPD.
// Liée depuis Register, Mes droits, et le footer.
// =====================================================================

import { Link } from 'react-router-dom';

export default function Cgu() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-blood">Conformité juridique</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Conditions Générales d'Utilisation & Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-gray-500 italic">
          Version 1.0 — Conformes à la Loi n° 2008-12 du 25 janvier 2008 (Sénégal) et au RGPD
        </p>
      </header>

      <section className="rounded-2xl border-2 border-blood bg-red-50/30 p-6">
        <h2 className="text-lg font-bold text-blood">L'essentiel à retenir</h2>
        <p className="mt-2 text-sm text-gray-800">
          <strong>Vous gardez le contrôle total de vos données médicales.</strong> À tout moment, vous pouvez consulter,
          modifier, exporter ou supprimer vos données. Vous pouvez également demander l'anonymisation de votre profil
          tout en conservant l'utilité statistique de vos dons passés pour le système de santé sénégalais.
        </p>
      </section>

      <Section titre="1. Définitions">
        <Item terme="Plateforme">le service HemoLink dans son ensemble (site web, application mobile, API).</Item>
        <Item terme="Donneur">toute personne physique majeure inscrite avec son consentement libre et éclairé.</Item>
        <Item terme="Hôpital">tout établissement de santé partenaire validé par le CNTS.</Item>
        <Item terme="CNTS">le Centre National de Transfusion Sanguine de Dakar.</Item>
        <Item terme="Données personnelles">toute information identifiant ou permettant d'identifier une personne physique.</Item>
      </Section>

      <Section titre="2. Objet de la Plateforme">
        <p>HemoLink met en relation, en temps réel, les donneurs de sang volontaires avec les hôpitaux sénégalais en situation d'urgence transfusionnelle.</p>
      </Section>

      <Section titre="3. Inscription et compte">
        <p><strong>3.1 Conditions :</strong> être âgé de 18 à 65 ans, résider au Sénégal, peser au moins 50 kg.
          La validation finale de l'éligibilité médicale est effectuée par le CNTS lors d'un entretien préalable au premier don.</p>
        <p className="mt-2"><strong>3.2 Confidentialité :</strong> le donneur s'engage à conserver son mot de passe confidentiel.</p>
        <p className="mt-2"><strong>3.3 Véracité :</strong> les informations fournies doivent être exactes et à jour.</p>
      </Section>

      <Section titre="4. Vos droits sur vos données" hl>
        <p>Conformément à la <strong>Loi 2008-12</strong> et au <strong>RGPD</strong>, vous disposez à tout moment des droits suivants :</p>
        <ul className="mt-3 space-y-2 list-disc pl-6">
          <li><strong>Droit d'accès</strong> — consulter toutes vos données depuis votre espace personnel.</li>
          <li><strong>Droit de rectification</strong> — corriger vos informations.</li>
          <li><strong>Droit à la portabilité</strong> — télécharger vos données au format JSON.</li>
          <li><strong>Droit d'opposition</strong> — cesser de recevoir des alertes à tout moment.</li>
          <li><strong>Droit à l'effacement</strong> — supprimer définitivement votre compte (voir Article 5).</li>
        </ul>
      </Section>

      <Section titre="5. Que deviennent vos données si vous quittez HemoLink ?" hl important>
        <p className="text-base font-semibold text-gray-900">C'est <span className="text-blood">vous</span> qui choisissez. Trois options vous sont proposées :</p>

        <Option color="red" titre="Option A — Suppression totale (droit à l'oubli)">
          <p>Votre compte et toutes vos données sont effacés définitivement. Vous disparaissez de la base.</p>
          <p className="mt-1 text-xs italic text-gray-600">Inconvénient : perte de la traçabilité médicale de vos anciens dons.</p>
        </Option>

        <Option color="emerald" titre="Option B — Anonymisation (recommandée)">
          <p>Votre identité (nom, téléphone, géolocalisation) est effacée irrémédiablement. Vos données médicales sont conservées <strong>sans aucun lien avec votre identité</strong>, pour les statistiques nationales.</p>
          <p className="mt-1 text-xs italic text-emerald-700">Avantage : oubli total au niveau identitaire + contribution anonyme à la santé publique.</p>
        </Option>

        <Option color="amber" titre="Option C — Désactivation simple (réversible)">
          <p>Votre compte est désactivé : plus d'alertes, plus de connexion. Vos données sont conservées intactes en attente d'une éventuelle réactivation.</p>
        </Option>

        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <strong>Délai d'exécution :</strong> 30 jours maximum (Loi 2008-12 art. 27).
          Exercez vos droits depuis <Link to="/mon-espace/droits" className="font-semibold text-blood">votre espace « Mes droits »</Link>
          ou par email à <a href="mailto:dpo@hemolink.sn" className="font-semibold text-blood">dpo@hemolink.sn</a>.
        </p>
      </Section>

      <Section titre="6. Nature des données collectées">
        <p><strong>Identification :</strong> nom, prénom, sexe, date de naissance, téléphone, email, ville, quartier, coordonnées GPS.</p>
        <p className="mt-1"><strong>Médicales :</strong> groupe sanguin, poids, date du dernier don, historique des dons.</p>
        <p className="mt-1"><strong>Connexion :</strong> IP, date/heure de connexion, actions effectuées (audit log).</p>
      </Section>

      <Section titre="7. Finalités du traitement">
        <p>Vos données sont exclusivement utilisées pour : gestion du compte, mise en relation avec les hôpitaux, calcul d'éligibilité, traçabilité médicale, statistiques nationales anonymisées.</p>
        <p className="mt-2 font-semibold text-blood">HemoLink ne procède à AUCUNE exploitation commerciale de vos données. Aucune vente, location ou cession à des tiers.</p>
      </Section>

      <Section titre="8. Destinataires des données">
        <ul className="space-y-2 list-disc pl-6">
          <li><strong>Vous-même</strong> — accès complet.</li>
          <li><strong>Staff hôpital</strong> — uniquement pour les alertes : prénom, nom, téléphone, groupe, distance.</li>
          <li><strong>CNTS</strong> — données agrégées + nominatives pour validation.</li>
          <li><strong>Équipe technique</strong> — maintenance uniquement, accès tracé.</li>
          <li><strong>Autorités légales</strong> — sur réquisition judiciaire valide.</li>
        </ul>
      </Section>

      <Section titre="9. Durée de conservation">
        <p><strong>Compte actif :</strong> tant que vous l'utilisez.</p>
        <p><strong>Compte inactif (24 mois) :</strong> notification puis suppression après 6 mois supplémentaires.</p>
        <p><strong>Historique de dons :</strong> 30 ans (exigence sanitaire).</p>
        <p><strong>Audit log :</strong> 5 ans.</p>
        <p><strong>Données anonymisées :</strong> indéfiniment, sans lien identitaire.</p>
      </Section>

      <Section titre="10. Sécurité">
        <ul className="space-y-1 list-disc pl-6">
          <li>Mots de passe chiffrés avec bcrypt (10 rounds)</li>
          <li>Authentification JWT signée (12h)</li>
          <li>Anti-brute force + Helmet</li>
          <li>Validation systématique des entrées</li>
          <li>Garde SQL en lecture seule pour l'IA</li>
          <li>Journal d'audit horodaté</li>
        </ul>
      </Section>

      <Section titre="11. Comment exercer vos droits">
        <p><strong>11.1</strong> Depuis votre <Link to="/mon-espace/droits" className="font-semibold text-blood">espace personnel → Mes droits</Link> (3 boutons : Exporter, Anonymiser, Supprimer).</p>
        <p className="mt-1"><strong>11.2</strong> Par email : <a href="mailto:dpo@hemolink.sn" className="font-semibold text-blood">dpo@hemolink.sn</a> (joindre une pièce d'identité).</p>
        <p className="mt-1"><strong>11.3</strong> Recours auprès de la <strong>Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal — www.cdp.sn</p>
      </Section>

      <Section titre="12-15. Engagements, responsabilités, droit applicable">
        <p>Le donneur s'engage à répondre aux alertes (acceptation/refus), mettre à jour ses informations, ne pas créer plusieurs comptes.</p>
        <p className="mt-2">HemoLink n'est pas un service médical d'urgence : l'acte transfusionnel relève de la responsabilité exclusive des établissements de santé et du CNTS.</p>
        <p className="mt-2">Droit sénégalais applicable. Juridiction de Dakar.</p>
      </Section>

      <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-700">
          <strong>Contact DPO :</strong> <a href="mailto:dpo@hemolink.sn" className="font-semibold text-blood">dpo@hemolink.sn</a>
        </p>
        <p className="mt-1 text-xs text-gray-500">Version 1.0 — Mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        <Link to="/register" className="mt-4 inline-block rounded-xl bg-blood px-6 py-2.5 text-sm font-semibold text-white hover:bg-blood-dark">
          ← Retour à l'inscription
        </Link>
      </div>
    </div>
  );
}

function Section({ titre, children, hl, important }) {
  return (
    <section className={`rounded-2xl ${hl ? 'border-2 border-blood bg-red-50/20' : 'border border-gray-200 bg-white'} ${important ? 'shadow-lg' : 'shadow-sm'} p-6`}>
      <h2 className={`text-xl font-bold ${hl ? 'text-blood' : 'text-gray-900'}`}>{titre}</h2>
      <div className="mt-3 space-y-1 text-sm text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

function Item({ terme, children }) {
  return <p>« <strong>{terme}</strong> » : {children}</p>;
}

function Option({ titre, color, children }) {
  const c = {
    red:     'border-red-300 bg-red-50',
    emerald: 'border-emerald-300 bg-emerald-50',
    amber:   'border-amber-300 bg-amber-50',
  }[color];
  const t = {
    red:     'text-red-800',
    emerald: 'text-emerald-800',
    amber:   'text-amber-800',
  }[color];
  return (
    <div className={`mt-3 rounded-xl border-2 ${c} p-4`}>
      <h4 className={`font-bold ${t}`}>{titre}</h4>
      <div className="mt-1 text-sm text-gray-700">{children}</div>
    </div>
  );
}
