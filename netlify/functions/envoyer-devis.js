/* =========================================================
   Envoi d'un devis au client — GuillaumEvent
   Appelée depuis Pilotage, uniquement par l'administrateur.

   Variables d'environnement à définir dans Netlify :
     SUPABASE_URL          https://vunjyidtmmmbyfmkflvc.supabase.co
     SUPABASE_SERVICE_KEY  clé "service_role" (secrète — jamais dans le HTML)
     RESEND_API_KEY        clé du service d'envoi d'e-mails
     MAIL_EXPEDITEUR       ex. GuillaumEvent <contact@guillaumevent.fr>
     ADMIN_EMAIL           contact@guillaumevent.fr
     SITE_URL              https://guillaumevent.fr
   ========================================================= */

const euro = (n) => Number(n || 0).toLocaleString('fr-FR') + ' €';
const jour = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : 'à définir';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

    /* --- 2) Données reçues --- */
    const { id, devis: d, mot } = JSON.parse(event.body || '{}');
    if (!id || !d || !d.email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Devis incomplet' }) };
    }

    const lien = (SITE_URL || 'https://guillaumevent.fr') + '/devis-client.html?ref=';
    const acompte = Math.round((d.total || 0) * 0.20);

    /* --- 3) Enregistrement : numéro, jeton de consultation, statut --- */
    const maj = {
      numero: d.numero,
      date_evenement: d.date_evenement,
      ville: d.ville,
      distance_km: d.distance_km,
      base: d.base,
      options: d.options,
      deplacement: d.deplacement,
      remise: d.remise,
      total: d.total,
      statut: 'devis envoyé',
      envoye_le: new Date().toISOString()
    };

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/devis?id=eq.${encodeURIComponent(id)}&select=token`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(maj)
      }
    );
    const lignes = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Base de données : ' + (lignes.message || res.status) }) };
    }
    const token = lignes && lignes[0] && lignes[0].token;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Jeton de consultation introuvable — vérifiez le SQL' }) };
    }

    /* --- 4) L'e-mail --- */
    const lignesHtml = [
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">Prestation DJ — ${esc(d.type_evenement || 'Événement')}</td>
       <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${euro(d.base)}</td></tr>`,
      ...(d.options || []).map((o) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">${esc(o.label)}</td>
         <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${euro(o.price)}</td></tr>`),
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">Déplacement${d.ville ? ' — ' + esc(d.ville) : ''}</td>
       <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${d.deplacement > 0 ? euro(d.deplacement) : 'Offert'}</td></tr>`
    ].join('');

    const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#f1ead9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#2b3320">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ead9;padding:28px 12px">
   <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">

      <tr><td style="background:#2c3719;padding:26px 30px;text-align:center">
        <div style="font-family:Georgia,serif;font-size:24px;color:#fff;letter-spacing:.04em">GuillaumEvent</div>
        <div style="font-size:11px;letter-spacing:.2em;color:#b89233;margin-top:4px">DJ &amp; ANIMATION — PROVENCE</div>
      </td></tr>

      <tr><td style="padding:30px">
        <p style="margin:0 0 16px;font-size:16px">Bonjour ${esc(d.prenom || '')},</p>
        ${mot && mot.trim()
          ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.7">${esc(mot.trim()).replace(/\n/g, '<br>')}</p>`
          : `<p style="margin:0 0 18px;font-size:15px;line-height:1.7">Merci pour votre demande. Voici le devis correspondant à votre projet — j'espère qu'il vous conviendra.</p>`}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f1e2;border-radius:10px;padding:14px 16px;margin:0 0 20px">
          <tr><td style="font-size:14px;line-height:1.8">
            <strong style="color:#2c3719">${esc(d.type_evenement || 'Événement')}</strong><br>
            ${d.date_evenement ? jour(d.date_evenement + 'T00:00:00') : 'Date à définir'}${d.ville ? ' — ' + esc(d.ville) : ''}
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          ${lignesHtml}
          <tr><td style="padding:14px 0 0;font-family:Georgia,serif;font-size:20px;color:#2c3719">À régler</td>
              <td style="padding:14px 0 0;text-align:right;font-family:Georgia,serif;font-size:20px;color:#2c3719;white-space:nowrap">${euro(d.total)}</td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f1e2;border-radius:10px;margin:16px 0 24px">
          <tr><td style="padding:12px 16px;font-size:14px;color:#7c5e1d"><strong>Acompte à la réservation (20 %) : ${euro(acompte)}</strong><br>
          <span style="color:#5a5f44;font-size:13px">La date n'est réservée qu'à réception de l'acompte.</span></td></tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px">
          <tr><td style="background:#9c7a26;border-radius:100px">
            <a href="${lien}${token}" style="display:inline-block;padding:14px 30px;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
              Voir et accepter mon devis
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:13px;color:#5a5f44;line-height:1.7;text-align:center">
          Ce devis est valable 30 jours. Une question, un ajustement ?<br>
          Répondez simplement à cet e-mail ou appelez-moi au 06 61 07 98 24.
        </p>
      </td></tr>

      <tr><td style="background:#f8f1e2;padding:18px 30px;text-align:center;font-size:12px;color:#5a5f44;line-height:1.7">
        GuillaumEvent — 580 chemin de la Ribière, 84170 Monteux<br>
        SIREN 919 133 447 — TVA non applicable, art. 293 B du CGI<br>
        Devis n° ${esc(d.numero || '')}
      </td></tr>

    </table>
   </td></tr>
  </table>
</body></html>`;

    /* --- 5) Envoi --- */
    const envoi = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_EXPEDITEUR,
        to: [d.email],
        reply_to: ADMIN_EMAIL || undefined,
        subject: `Votre devis ${d.numero || ''} — GuillaumEvent`,
        html
      })
    });
    const out = await envoi.json();
    if (!envoi.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Service d'e-mail : " + (out.message || envoi.status) }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, numero: d.numero, lien: lien + token }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
