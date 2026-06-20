// Étape 2 : GitHub renvoie un "code", on l'échange contre un token,
// puis on le transmet à Decap CMS (fenêtre parente) via postMessage.
exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return { statusCode: 400, body: "Paramètres OAuth manquants." };
  }

  let result;
  try {
    const resp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await resp.json();
    if (data.access_token) {
      result = { status: "success", content: { token: data.access_token, provider: "github" } };
    } else {
      result = { status: "error", content: { error: data.error || "Échec de l'authentification" } };
    }
  } catch (e) {
    result = { status: "error", content: { error: String(e) } };
  }

  // Handshake attendu par Decap CMS
  const page = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:${result.status}:${JSON.stringify(result.content)}',
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script>
<p>Connexion en cours… vous pouvez fermer cette fenêtre.</p>
</body></html>`;

  return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: page };
};
