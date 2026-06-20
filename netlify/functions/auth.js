// Étape 1 de l'authentification : redirige vers GitHub pour autorisation.
// Variables d'environnement à définir sur Netlify : GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
exports.handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return { statusCode: 500, body: "GITHUB_CLIENT_ID manquant (variables d'environnement Netlify)." };
  }
  const host = event.headers.host;
  const redirectUri = `https://${host}/.netlify/functions/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state: Math.random().toString(36).slice(2),
    allow_signup: "false",
  });
  return {
    statusCode: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params.toString()}` },
    body: "",
  };
};
