/* =========================================================
   Acceptation d'un devis par le client — GuillaumEvent

   Appelée quand le client clique « J'accepte ce devis ».
   Elle fait trois choses :
     1. enregistre l'acceptation (date, heure, adresse IP) — la trace
     2. envoie au client un e-mail de confirmation récapitulatif
     3. prévient Guillaume dans la foulée

   Les deux e-mails matérialisent l'accord dans deux boîtes distinctes :
   c'est ce qui donne du poids à l'acceptation en cas de contestation.

   Mêmes variables d'environnement que envoyer-devis.js.
   ========================================================= */

const euro = (n) => Number(n || 0).toLocaleString('fr-FR') + ' €';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jour = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : 'à définir';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  const {
    SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY,
    MAIL_EXPEDITEUR, ADMIN_EMAIL, SITE_URL
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuration incomplète' }) };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');
    if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Lien invalide' }) };

    const h = event.headers || {};
    const ip = (h['x-nf-client-connection-ip'] ||
                (h['x-forwarded-for'] || '').split(',')[0] || '').trim() || null;

    /* --- 1) Enregistrement de l'acceptation ---
       Le filtre "statut=neq.signé" garantit qu'un second clic ne réécrit
       pas la date : la première acceptation fait foi. */
    const url = `${SUPABASE_URL}/rest/v1/devis` +
      `?token=eq.${encodeURIComponent(token)}` +
      `&envoye_le=not.is.null` +
      `&statut=neq.${encodeURIComponent('signé')}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        statut: 'signé',
        accepte_le: new Date().toISOString(),
        accepte_ip: ip
      })
    });

    const lignes = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Enregistrement impossible' }) };
    }

    // Aucune ligne : lien inconnu, devis jamais envoyé, ou déjà accepté
    if (!lignes.length) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, deja: true }) };
    }

    const d = lignes[0];
    const acompte = Math.round((d.total || 0) * 0.20);
    const quand = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
    // Le devis reste consultable et imprimable après acceptation
    const lienDevis = (SITE_URL || 'https://guillaumevent.fr') +
                      '/devis-client.html?ref=' + encodeURIComponent(d.token || token);

    /* --- 2) Les e-mails --- */
    if (RESEND_API_KEY && MAIL_EXPEDITEUR) {
      const pied = `<tr><td style="background:#f8f1e2;padding:16px 30px;text-align:center;font-size:12px;color:#5a5f44;line-height:1.7">
          GuillaumEvent — 580 chemin de la Ribière, 84170 Monteux<br>
          SIREN 919 133 447 — TVA non applicable, art. 293 B du CGI
        </td></tr>`;

      const enTete = `<tr><td style="background:#2c3719;padding:24px 30px;text-align:center">
          <div style="font-family:Georgia,serif;font-size:22px;color:#fff;letter-spacing:.04em">GuillaumEvent</div>
        </td></tr>`;

      const cadre = (contenu) => `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f1ead9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#2b3320">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ead9;padding:26px 12px"><tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:14px;overflow:hidden">
        ${enTete}<tr><td style="padding:28px 30px">${contenu}</td></tr>${pied}
        </table></td></tr></table></body></html>`;

      const recap = `<table role="presentation" width="100%" style="background:#f8f1e2;border-radius:10px;margin:18px 0">
          <tr><td style="padding:14px 16px;font-size:14px;line-height:1.8">
            <strong style="color:#2c3719">${esc(d.type_evenement || 'Événement')}</strong> —
            ${d.date_evenement ? jour(d.date_evenement + 'T00:00:00') : 'date à définir'}
            ${d.ville ? '<br>' + esc(d.ville) : ''}
            <br>Devis n° ${esc(d.numero || '')} — <strong>${euro(d.total)}</strong>
          </td></tr></table>`;

      const envois = [
        // Au client
        {
          to: [d.email],
          subject: `Devis ${d.numero || ''} accepté — GuillaumEvent`,
          html: cadre(`
            <p style="margin:0 0 14px;font-size:16px">Bonjour ${esc(d.prenom || '')},</p>
            <p style="margin:0 0 6px;font-size:15px;line-height:1.7">
              J'ai bien reçu votre acceptation, et je vous remercie sincèrement de votre confiance.
            </p>
            ${recap}
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7">
              Votre acceptation a été enregistrée le <strong>${quand}</strong>.
              Conservez cet e-mail : il fait office de confirmation.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px">
              <tr><td style="background:#9c7a26;border-radius:100px">
                <a href="${lienDevis}" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
                  Voir et enregistrer mon devis
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 18px;font-size:13px;color:#5a5f44;line-height:1.7;text-align:center">
              Votre devis reste consultable à tout moment. Le bouton
              « Imprimer / Enregistrer en PDF » vous permet d'en garder une copie.
            </p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7">
              <strong>La suite :</strong> votre date sera définitivement bloquée à réception
              de l'acompte de <strong>${euro(acompte)}</strong>. Je reviens vers vous très vite
              avec les modalités de règlement, et nous conviendrons ensemble d'un premier
              rendez-vous de préparation.
            </p>
            <p style="margin:0;font-size:15px;line-height:1.7">
              À très bientôt,<br>Guillaume
            </p>`)
        }
      ];

      // À Guillaume
      if (ADMIN_EMAIL) {
        envois.push({
          to: [ADMIN_EMAIL],
          subject: `✓ ${d.prenom || 'Un client'} a accepté le devis ${d.numero || ''}`,
          html: cadre(`
            <p style="margin:0 0 14px;font-size:16px"><strong>Devis accepté</strong></p>
            ${recap}
            <p style="margin:0 0 8px;font-size:14px;line-height:1.8">
              <strong>${esc(d.prenom || '')}</strong><br>
              ${esc(d.email || '')}${d.telephone ? '<br>' + esc(d.telephone) : ''}
            </p>
            <p style="margin:0 0 14px;font-size:13px;color:#5a5f44;line-height:1.7">
              Accepté le ${quand}${ip ? ' — depuis l\'adresse ' + esc(ip) : ''}.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.7">
              La fiche client a été créée automatiquement. Pensez à réclamer
              l'acompte de <strong>${euro(acompte)}</strong> pour bloquer la date.
            </p>`)
        });
      }

      // Un échec d'e-mail ne doit jamais annuler l'acceptation : elle est déjà enregistrée.
      await Promise.allSettled(envois.map((e) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: MAIL_EXPEDITEUR, reply_to: ADMIN_EMAIL || undefined, ...e })
        })
      ));
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
