# DJ G&V — Site one-page

Site vitrine premium pour DJ professionnel (mariages & événements, Vaucluse / PACA).
Site **statique pur** : HTML / CSS / JS, sans framework ni build.

## 📁 Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : Accueil, Partenaires, Photos, Contact |
| `style.css` | Thème provençal (or / olive / crème / anthracite), responsive, animations |
| `script.js` | Scroll reveal (Intersection Observer), parallaxe, header, nav mobile, lightbox |
| `merci.html` | Page de confirmation après envoi du formulaire |
| `netlify.toml` | Configuration Netlify (publication, en-têtes, redirection) |

## 🚀 Mise en ligne sur Netlify

### Option A — Glisser-déposer (le plus simple)
1. Allez sur [app.netlify.com/drop](https://app.netlify.com/drop).
2. Glissez **tout le dossier** `dj-gv-site` dans la zone.
3. C'est en ligne ✦ Netlify vous donne une URL `*.netlify.app`.

### Option B — Via Git (recommandé pour les mises à jour)
1. Poussez ce dossier dans un dépôt GitHub / GitLab.
2. Sur Netlify : **Add new site → Import an existing project**.
3. Sélectionnez le dépôt. Laissez la commande de build **vide** et le dossier de publication sur `.` (déjà défini dans `netlify.toml`).
4. **Deploy**.

## 📨 Formulaire de contact (Netlify Forms)

Le formulaire est déjà configuré : `data-netlify="true"`, champ caché `form-name`,
honeypot anti-spam (`bot-field`) et redirection vers `merci.html` après envoi.

Après le **premier déploiement** :
- Les soumissions apparaissent dans **Netlify → votre site → Forms**.
- Pour recevoir un e-mail à chaque demande : **Forms → Settings → Form notifications → Add notification → Email**.

> ℹ️ Netlify détecte automatiquement le formulaire dans le HTML au déploiement.
> Aucune action de code supplémentaire n'est nécessaire.

## ✍️ Personnalisation rapide

- **Coordonnées** : téléphone, e-mail et liens réseaux/mariage.net → dans `index.html`, section `#contact`.
- **Couleurs** : variables CSS en haut de `style.css` (`:root`).
- **Photos** : remplacez les blocs `.gallery__item` (placeholders) par vos `<img>`.
- **Logos partenaires** : remplacez le texte des blocs `.partner` par vos `<img>`.

## ♿ Qualité

Sémantique HTML, labels de formulaire, navigation clavier (menu + lightbox),
focus visibles, contrastes soignés, `prefers-reduced-motion` respecté,
animations performantes (Intersection Observer + `requestAnimationFrame`).
