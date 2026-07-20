/* =========================================================
   Envoi des accès à l'espace mariés — GuillaumEvent
   Appelée depuis Pilotage, uniquement par l'administrateur.

   Reprend le message que Guillaume copiait à la main, mis en page
   aux couleurs de la marque. Enregistre la date d'envoi.

   Mêmes variables d'environnement que envoyer-devis.js.
   ========================================================= */

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jour = (d) => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  const {
    SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY,
    MAIL_EXPEDITEUR, ADMIN_EMAIL, SITE_URL
  } = process.env;

  const manquantes = Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, MAIL_EXPEDITEUR })
    .filter(([, v]) => !v).map(([k]) => k);
  if (manquantes.length) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuration incomplète : ' + manquantes.join(', ') }) };
  }

  try {
    /* --- 1) Seul l'administrateur connecté peut envoyer --- */
    const jeton = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!jeton) return { statusCode: 401, body: JSON.stringify({ error: 'Non connecté' }) };

    const who = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + jeton, apikey: SUPABASE_SERVICE_KEY }
    });
    const user = await who.json();
    if (!who.ok || !user.email) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Session expirée — reconnectez-vous' }) };
    }
    if (ADMIN_EMAIL && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Accès refusé' }) };
    }

    /* --- 2) Le mariage concerné --- */
    const { id } = JSON.parse(event.body || '{}');
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Mariage non précisé' }) };

    const lire = await fetch(
      `${SUPABASE_URL}/rest/v1/mariages?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY } }
    );
    const lignes = await lire.json();
    if (!lire.ok || !lignes.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Mariage introuvable' }) };
    }
    const w = lignes[0];

    /* Le champ « contact » accepte un téléphone ou un e-mail : on n'envoie
       que si c'est bien une adresse. */
    const contact = String(w.contact || '').trim();
    const destinataire = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : null;
    if (!destinataire) {
      return { statusCode: 400, body: JSON.stringify({
        error: "Ce mariage n'a pas d'adresse e-mail. Renseignez-la dans le champ « Téléphone / e-mail »."
      }) };
    }

    const site = SITE_URL || 'https://guillaumevent.fr';
    const lien = site + '/espace-maries.html';
    const dateTxt = jour(w.date_evenement);

    /* --- 3) L'e-mail --- */
    const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f1ead9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#2b3320">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ead9;padding:28px 12px"><tr><td align="center">
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:14px;overflow:hidden">

    <tr><td style="background:#2c3719;padding:26px 30px;text-align:center">
      <div style="font-family:Georgia,serif;font-size:24px;color:#fff;letter-spacing:.04em">GuillaumEvent</div>
      <div style="font-size:11px;letter-spacing:.2em;color:#b89233;margin-top:4px">VOTRE ESPACE MARIÉS</div>
    </td></tr>

    <tr><td style="padding:30px">
      <p style="margin:0 0 16px;font-size:16px">Bonjour ${esc(w.couple || '')},</p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7">
        J'ai le plaisir de vous ouvrir votre espace mariés personnel${dateTxt ? ', pour votre mariage du <strong>' + dateTxt + '</strong>' : ''}.
      </p>

      <p style="margin:0 0 20px;font-size:15px;line-height:1.7">
        Vous y retrouverez le déroulé de votre soirée, votre playlist collaborative
        et votre brief — modifiables à tout moment, et que je consulte de mon côté
        en direct.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f1e2;border-radius:10px;margin:0 0 22px">
        <tr><td style="padding:16px 18px;font-size:15px;line-height:2">
          <span style="font-size:11px;letter-spacing:.14em;color:#7c5e1d">VOS IDENTIFIANTS</span><br>
          Code mariage : <strong style="font-family:monospace;font-size:16px">${esc(w.code)}</strong><br>
          Mot de passe : <strong style="font-family:monospace;font-size:16px">${esc(w.mot_de_passe)}</strong>
        </td></tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px">
        <tr><td style="background:#9c7a26;border-radius:100px">
          <a href="${lien}" style="display:inline-block;padding:14px 30px;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
            Ouvrir mon espace mariés
          </a>
        </td></tr>
      </table>

      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#5a5f44;background:#f8f1e2;border-radius:10px;padding:12px 16px">
        <strong style="color:#2c3719">Astuce :</strong> depuis votre téléphone, ajoutez la page
        à votre écran d'accueil. Vous y accéderez comme à une application, sans avoir
        à ressaisir vos identifiants.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.7">
        Je reste à votre entière disposition pour toute question.<br><br>
        Musicalement,<br>Guillaume
      </p>
    </td></tr>

    <tr><td style="background:#f8f1e2;padding:18px 30px;text-align:center;font-size:12px;color:#5a5f44;line-height:1.7">
      <strong style="color:#2c3719">GuillaumEvent</strong> — Votre événement sur mesure en Provence<br>
      06 61 07 98 24 — ${esc(ADMIN_EMAIL || 'contact@guillaumevent.fr')}
    </td></tr>

   </table>
  </td></tr></table>
</body></html>`;

    const envoi = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_EXPEDITEUR,
        to: [destinataire],
        reply_to: ADMIN_EMAIL || undefined,
        subject: 'Votre espace mariés est ouvert — GuillaumEvent',
        html
      })
    });
    const out = await envoi.json();
    if (!envoi.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Service d'e-mail : " + (out.message || envoi.status) }) };
    }

    /* --- 4) On garde la trace de l'envoi --- */
    await fetch(`${SUPABASE_URL}/rest/v1/mariages?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acces_envoye_le: new Date().toISOString() })
    }).catch(() => {});   // l'e-mail est parti : un échec ici ne doit rien annuler

    return { statusCode: 200, body: JSON.stringify({ ok: true, destinataire }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
