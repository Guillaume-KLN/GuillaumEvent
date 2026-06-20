# 🛠️ Mise en place du mini-admin (gestion des photos)

Ce guide installe une page **`/admin`** où tu te connectes et tu **glisses tes photos** depuis ton navigateur. Le site se met à jour tout seul.

À faire **une seule fois** (~20-30 min). Ensuite, ajouter des photos prend 30 secondes.

> 💡 Tu remplaces partout `TON-UTILISATEUR`, `TON-SITE`, etc. par tes vraies valeurs.

---

## Étape 1 — Compte GitHub
1. Va sur [github.com](https://github.com) → **Sign up** (gratuit) si tu n'as pas de compte.
2. Note ton **nom d'utilisateur** (ex. `guillaume13`).

## Étape 2 — Mettre le site sur GitHub
1. Sur GitHub : bouton **+** (en haut à droite) → **New repository**.
2. Nom du dépôt : `dj-gv-site` → laisse **Public** (ou Private) → **Create repository**.
3. Sur la page du dépôt vide : lien **« uploading an existing file »**.
4. **Glisse tout le contenu** du dossier `dj-gv-site` (pas le dossier lui-même, son **contenu** : `index.html`, `style.css`, les dossiers `assets`, `admin`, `data`, `netlify`, etc.).
5. **Commit changes** (bouton vert).

## Étape 3 — Relier Netlify à GitHub
1. Sur [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → **GitHub**.
2. Autorise Netlify, choisis le dépôt `dj-gv-site`.
3. Laisse les réglages par défaut (le fichier `netlify.toml` fait le reste) → **Deploy**.
4. Quand c'est en ligne, **note l'adresse** du site, par ex. `https://dj-gv-site-abc123.netlify.app`.
   C'est ton **`TON-SITE`** pour la suite.

## Étape 4 — Créer l'application GitHub (authentification)
1. GitHub → ta photo (haut droite) → **Settings** → tout en bas à gauche **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Remplis :
   - **Application name** : `DJ G&V Admin`
   - **Homepage URL** : `https://TON-SITE.netlify.app`
   - **Authorization callback URL** : `https://TON-SITE.netlify.app/.netlify/functions/callback`
3. **Register application**.
4. Copie le **Client ID**. Clique **Generate a new client secret** et copie le **Client secret** (visible une seule fois).

## Étape 5 — Donner les clés à Netlify
1. Netlify → ton site → **Site configuration** → **Environment variables** → **Add a variable**.
2. Ajoute ces deux variables :
   - `GITHUB_CLIENT_ID` = (le Client ID copié)
   - `GITHUB_CLIENT_SECRET` = (le Client secret copié)
3. Onglet **Deploys** → **Trigger deploy** → **Deploy site** (pour prendre en compte les variables).

## Étape 6 — Renseigner la config de l'admin
Dans le fichier **`admin/config.yml`**, remplace :
- `repo: TON-UTILISATEUR/dj-gv-site` → ton dépôt réel (ex. `guillaume13/dj-gv-site`)
- `base_url: https://TON-SITE.netlify.app` → l'adresse réelle de ton site

> Tu peux éditer ce fichier directement sur GitHub (ouvre `admin/config.yml` → icône crayon → modifie → **Commit**). Netlify redéploiera tout seul.

---

## ✅ C'est prêt — utilisation au quotidien
1. Va sur **`https://TON-SITE.netlify.app/admin/`**
2. **Login with GitHub** → autorise (la 1re fois).
3. Section **Galerie photos** → **Photos** → **Add Photo** → choisis ton image, une légende, une taille.
4. **Publish**. ⏱️ En ~1 minute, la photo apparaît sur le site (Netlify redéploie automatiquement).

Pour **supprimer / réordonner** : reviens dans la liste, glisse les éléments ou supprime-les, puis **Publish**.

---

## ❓ En cas de souci
- **« Login » tourne en boucle / erreur** : vérifie que les 2 variables d'environnement sont bien sur Netlify et que l'**Authorization callback URL** de l'app GitHub finit bien par `/.netlify/functions/callback`.
- **Les photos n'apparaissent pas** : attends 1-2 min (redéploiement), puis `Ctrl`+`F5`.
- **Tu préfères que je le fasse avec toi** : envoie-moi ton nom d'utilisateur GitHub + l'URL Netlify, je te guide en direct.
