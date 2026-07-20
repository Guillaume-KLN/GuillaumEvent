/* =========================================================
   Émission et envoi d'une facture — GuillaumEvent
   Appelée depuis Pilotage, uniquement par l'administrateur.

   ⚠️ Une facture est un document comptable : sa numérotation doit être
   continue et chronologique. Le numéro est donc attribué ICI, côté serveur,
   à partir du plus grand numéro déjà émis — jamais côté navigateur, et
   jamais réattribué. Une facture déjà émise conserve son numéro.

   Mêmes variables d'environnement que envoyer-devis.js.
   ========================================================= */

const euro = (n) => Number(n || 0).toLocaleString('fr-FR') + ' €';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jour = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—';

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

  const entetes = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json'
  };

  try {
    /* --- 1) Seul l'administrateur connecté peut émettre --- */
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

    /* --- 2) La prestation concernée --- */
    const { id, acompte_verse, adresse_client, mot } = JSON.parse(event.body || '{}');
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Prestation non précisée' }) };

    const lire = await fetch(
      `${SUPABASE_URL}/rest/v1/devis?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: entetes }
    );
    const lignes = await lire.json();
    if (!lire.ok || !lignes.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Prestation introuvable' }) };
    }
    const d = lignes[0];
    if (!d.email) return { statusCode: 400, body: JSON.stringify({ error: "Ce client n'a pas d'adresse e-mail" }) };

    /* --- 3) Le numéro : continu, chronologique, jamais réattribué --- */
    let numero = d.facture_numero;
    if (!numero) {
      const prefixe = 'FA-' + new Date().getFullYear() + '-';
      const serie = await fetch(
        `${SUPABASE_URL}/rest/v1/devis?facture_numero=like.${encodeURIComponent(prefixe + '*')}` +
        `&select=facture_numero&order=facture_numero.desc&limit=1`,
        { headers: entetes }
      );
      const dernieres = await serie.json();
      const dernier = (dernieres && dernieres[0] && dernieres[0].facture_numero) || '';
      const n = parseInt(String(dernier).slice(prefixe.length), 10);
      numero = prefixe + String((isNaN(n) ? 0 : n) + 1).padStart(3, '0');
    }

    const acompte = Number(acompte_verse) || 0;
    const total = Number(d.total) || 0;
    const solde = Math.max(0, total - acompte);
    const emiseLe = d.facture_le || new Date().toISOString();

    /* --- 4) Enregistrement --- */
    const maj = await fetch(
      `${SUPABASE_URL}/rest/v1/devis?id=eq.${encodeURIComponent(id)}&select=facture_token`,
      {
        method: 'PATCH',
        headers: { ...entetes, Prefer: 'return=representation' },
        body: JSON.stringify({
          facture_numero: numero,
          facture_le: emiseLe,
          acompte_verse: acompte,
          adresse_client: adresse_client || d.adresse_client || null
        })
      }
    );
    const majLignes = await maj.json();
    if (!maj.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Base de données : ' + (majLignes.message || maj.status) }) };
    }
    const token = majLignes && majLignes[0] && majLignes[0].facture_token;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Jeton de facture introuvable — vérifiez le SQL' }) };
    }

    const lien = (SITE_URL || 'https://guillaumevent.fr') + '/facture.html?ref=' + encodeURIComponent(token);

    /* --- 5) L'e-mail --- */
    const lignesHtml = [
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">Prestation DJ — ${esc(d.type_evenement || 'Événement')}</td>
       <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${euro(d.base)}</td></tr>`,
      ...(d.options || []).map((o) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">${esc(o.label)}</td>
         <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${euro(o.price)}</td></tr>`),
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e8dec5">Déplacement${d.ville ? ' — ' + esc(d.ville) : ''}</td>
       <td style="padding:10px 0;border-bottom:1px solid #e8dec5;text-align:right;white-space:nowrap">${d.deplacement > 0 ? euro(d.deplacement) : 'Offert'}</td></tr>`
    ].join('');

    const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f1ead9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#2b3320">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ead9;padding:28px 12px"><tr><td align="center">
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">

    <tr><td style="background:#2c3719;padding:26px 30px;text-align:center">
      <div style="font-family:Georgia,serif;font-size:24px;color:#fff;letter-spacing:.04em">GuillaumEvent</div>
      <div style="font-size:11px;letter-spacing:.2em;color:#b89233;margin-top:4px">FACTURE ${esc(numero)}</div>
    </td></tr>

    <tr><td style="padding:30px">
      <p style="margin:0 0 16px;font-size:16px">Bonjour ${esc(d.prenom || '')},</p>

      ${mot && mot.trim()
        ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.7">${esc(mot.trim()).replace(/\n/g, '<br>')}</p>`
        : `<p style="margin:0 0 18px;font-size:15px;line-height:1.7">
             Merci encore pour votre confiance — j'ai passé un très beau moment à vos côtés.
             Vous trouverez ci-dessous la facture de la prestation.
           </p>`}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f1e2;border-radius:10px;margin:0 0 20px">
        <tr><td style="padding:14px 16px;font-size:14px;line-height:1.8">
          <strong style="color:#2c3719">${esc(d.type_evenement || 'Événement')}</strong><br>
          ${d.date_evenement ? jour(d.date_evenement + 'T00:00:00') : ''}${d.ville ? ' — ' + esc(d.ville) : ''}
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
        ${lignesHtml}
        <tr><td style="padding:12px 0 0">Total de la prestation</td>
            <td style="padding:12px 0 0;text-align:right;white-space:nowrap">${euro(total)}</td></tr>
        ${acompte > 0 ? `<tr><td style="padding:6px 0;color:#7c5e1d">Acompte déjà versé</td>
            <td style="padding:6px 0;text-align:right;color:#7c5e1d;white-space:nowrap">− ${euro(acompte)}</td></tr>` : ''}
        <tr><td style="padding:14px 0 0;font-family:Georgia,serif;font-size:20px;color:#2c3719">${acompte > 0 ? 'Solde à régler' : 'À régler'}</td>
            <td style="padding:14px 0 0;text-align:right;font-family:Georgia,serif;font-size:20px;color:#2c3719;white-space:nowrap">${euro(solde)}</td></tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 22px">
        <tr><td style="background:#9c7a26;border-radius:100px">
          <a href="${lien}" style="display:inline-block;padding:14px 30px;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
            Voir et enregistrer ma facture
          </a>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f1e2;border-left:3px solid #9c7a26;border-radius:0 10px 10px 0;margin:0 0 20px">
        <tr><td style="padding:14px 18px;font-size:14px;line-height:1.75;color:#5a5f44">
          <strong style="color:#7c5e1d">Et pour la suite…</strong><br>
          Un anniversaire, un baptême, la fête d'un proche&nbsp;? En tant que
          <strong style="color:#2c3719">client fidèle</strong>, vous bénéficiez d'une
          <strong style="color:#2c3719">remise sur vos prochaines prestations</strong>.
          Écrivez-moi simplement, je m'en occupe.<br><br>
          Et si vous connaissez des futurs mariés à qui je pourrais être utile,
          parlez-leur de moi&nbsp;: c'est le plus beau des remerciements.
        </td></tr>
      </table>

      <p style="margin:0;font-size:13px;color:#5a5f44;line-height:1.7;text-align:center">
        Une question sur cette facture&nbsp;? Répondez à cet e-mail
        ou appelez-moi au 06 61 07 98 24.
      </p>
    </td></tr>

    <tr><td style="background:#f8f1e2;padding:18px 30px;text-align:center;font-size:12px;color:#5a5f44;line-height:1.7">
      GuillaumEvent — 580 chemin de la Ribière, 84170 Monteux<br>
      SIREN 919 133 447 — TVA non applicable, art. 293 B du CGI<br>
      Facture n° ${esc(numero)} — émise le ${jour(emiseLe)}
    </td></tr>

   </table>
  </td></tr></table>
</body></html>`;

    const envoi = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_EXPEDITEUR,
        to: [d.email],
        // Copie cachée à Guillaume : son archive personnelle, invisible du client
        bcc: ADMIN_EMAIL ? [ADMIN_EMAIL] : undefined,
        reply_to: ADMIN_EMAIL || undefined,
        subject: `Votre facture ${numero} — GuillaumEvent`,
        html
      })
    });
    const out = await envoi.json();
    if (!envoi.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Service d'e-mail : " + (out.message || envoi.status) }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, numero, solde, lien }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
