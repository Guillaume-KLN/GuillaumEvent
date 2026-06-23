# GuillaumEvent — Site one-page

Site vitrine premium pour **GuillaumEvent** — DJ professionnel pour mariages & événements, Vaucluse / PACA.
« Votre événement sur mesure en Provence ».

Site **statique pur** : HTML / CSS / JS, sans framework ni build.

## 📁 Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : Accueil, Partenaires, Photos, Contact (+ options, témoignages, FAQ) |
| `style.css` | Thème provençal (crème / vert bouteille / or), responsive, animations |
| `script.js` | Scroll reveal, parallaxe, particules, nav mobile, lightbox, galerie masonry, contenus dynamiques |
| `merci.html` | Page de confirmation après envoi du formulaire |
| `netlify.toml` | Configuration Netlify (publication, en-têtes, fonctions) |
| `admin/` | Interface d'administration (Decap CMS) |
| `data/` | Contenus gérés par l'admin : `gallery.json`, `site.json`, `partners.json` |
| `netlify/functions/` | Authentification GitHub de l'admin (`auth.js`, `callback.js`) |
| `assets/` | Logos, favicon, photos uploadées (`assets/photos/`) |

## 🚀 Déploiement (déjà en place)

- Hébergé sur **Netlify**, déploiement **automatique** depuis le dépôt GitHub **guillaume-KLN/GuillaumEvent** (branche `main`).
- En ligne sur **https://guillaumevent.fr** (domaine OVH, DNS Netlify, HTTPS automatique).
- Aucun build : Netlify publie la racine du dépôt (`publish = "."`).

➡️ **Pour mettre à jour** : on modifie les fichiers, on les renvoie sur GitHub (Add file → Upload files), Netlify redéploie tout seul en ~1 min.

## ✍️ Gérer le contenu soi-même

Via l'admin **https://guillaumevent.fr/admin/** (login GitHub) :
- **Galerie photos**, **Visuels du site** (portrait + matériel), **Partenaires** (par catégorie).
- Voir `SETUP-ADMIN.md` pour le détail.

## 🎨 Personnalisation rapide

- **Couleurs** : variables CSS en haut de `style.css` (`:root`).
- **Coordonnées / réseaux** : section `#contact` de `index.html`.
- **Logos** : `assets/logo-principal.png` (hero), `logo-emblem.png` (pied de page), `logo-icon.png` (en-tête/favicon).

## ♿ Qualité

Sémantique HTML, labels de formulaire, navigation clavier, focus visibles, contrastes soignés,
`prefers-reduced-motion` respecté, animations performantes (Intersection Observer + `requestAnimationFrame`).
