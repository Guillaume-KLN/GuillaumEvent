/* =========================================================================
   GuillaumEvent — GÉNÉRATEUR DE VISUELS RÉSEAUX SOCIAUX
   Injecté dans l'onglet « Visuels réseaux » de pilotage.html.
   Autonome : styles + contenus + export PNG. Aucune dépendance à charger
   d'avance (html2canvas est récupéré au premier téléchargement seulement).

   POUR AJOUTER UN VISUEL : ajouter une entrée dans GROUPES (tout en bas
   de la section « CONTENUS »), en réutilisant un des gabarits de TPL.
   ========================================================================= */
(function () {
  'use strict';

  var LOGO = 'assets/logo-icon.png?v=3';   // même origine → export PNG autorisé
  var H2C  = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  /* Téléphones et tablettes : le téléchargement direct y est bloqué, on passe
     par un aperçu plein écran (appui long → enregistrer). Les iPad récents se
     déclarent comme des Mac, d'où le test sur le nombre de points tactiles. */
  var MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || ''));

  /* =======================================================================
     1) STYLES
     ======================================================================= */
  var CSS = `
  .vz-intro { color: var(--color-text-dim); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem; }
  .vz-intro b { color: var(--color-text); }
  .vz-group { margin: 2rem 0 1rem; padding-top: 1.25rem; border-top: 1px solid var(--line-soft); }
  .vz-group:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
  .vz-group h3 { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; }
  .vz-group p { color: var(--color-text-dim); font-size: 0.85rem; margin-top: 0.15rem; }

  .vz-item { margin-bottom: 1.75rem; }
  .vz-bar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
  .vz-name { font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; }
  .vz-size { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim); }
  .vz-dl { margin-left: auto; }
  .vz-stage { overflow: hidden; border-radius: var(--radius); border: 1px solid var(--line-soft); box-shadow: var(--shadow-card); }
  .vz-scale { transform-origin: top left; }

  /* -- Atelier « visuel sur mesure » -- */
  .vz-atelier { margin-bottom: 1.75rem; }
  .vz-atelier > summary { cursor: pointer; font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600;
                          padding: 0.85rem 1.1rem; background: var(--color-surface); border: 1px solid var(--line-soft);
                          border-radius: var(--radius); box-shadow: var(--shadow-card); list-style: none; }
  .vz-atelier > summary::-webkit-details-marker { display: none; }
  .vz-atelier > summary::before { content: '＋ '; color: var(--color-primary); font-family: var(--font-sans); }
  .vz-atelier[open] > summary::before { content: '－ '; }
  .vz-atelier > summary small { display: block; font-family: var(--font-sans); font-size: 0.8rem; font-weight: 400;
                                color: var(--color-text-dim); margin-top: 0.15rem; }
  .vz-atelier__body { border: 1px solid var(--line-soft); border-top: none; border-radius: 0 0 var(--radius) var(--radius);
                      padding: 1.25rem; background: var(--color-surface); }
  .vz-atelier .field textarea { width: 100%; font: inherit; font-size: 0.95rem; padding: 0.6rem 0.75rem; resize: vertical;
                                border: 1px solid var(--line); border-radius: 10px; background: var(--ge-white); color: var(--color-text); }
  .vz-atelier .field select { width: 100%; font: inherit; font-size: 0.95rem; padding: 0.6rem 0.75rem;
                              border: 1px solid var(--line); border-radius: 10px; background: var(--ge-white); color: var(--color-text); }
  .vz-atelier .field.off { display: none; }
  .vz-hint { font-size: 0.78rem; color: var(--color-text-dim); margin-top: 0.25rem; }
  .vz-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-top: 1rem; }

  /* -- Aperçu plein écran (téléphone) -- */
  .vz-modal { position: fixed; inset: 0; z-index: 200; background: rgba(30,36,22,.97); display: none;
              flex-direction: column; align-items: center; justify-content: center; padding: 1rem; }
  .vz-modal.on { display: flex; }
  .vz-modal img { max-width: 100%; max-height: 74vh; border-radius: 10px; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
  .vz-modal p { color: #f1ead9; text-align: center; font-size: 0.95rem; line-height: 1.6; margin: 1rem 0 0.25rem; max-width: 420px; }
  .vz-modal small { color: #b6bda2; font-size: 0.8rem; }
  .vz-modal .btn { margin-top: 1rem; }

  /* =====================================================================
     LES VISUELS (dimensions réelles : 1080 px de large)
     ===================================================================== */
  .v { position: relative; overflow: hidden; background: var(--ge-cream); color: var(--ge-ink); font-family: var(--font-sans); }
  .v .aura { position: absolute; border-radius: 50%; }
  .v .a1 { width: 900px; height: 900px; top: -320px; left: -260px; background: radial-gradient(circle, rgba(156,122,38,.20), rgba(156,122,38,0) 68%); }
  .v .a2 { width: 820px; height: 820px; bottom: -300px; right: -240px; background: radial-gradient(circle, rgba(72,89,44,.22), rgba(72,89,44,0) 68%); }
  .v .frame { position: absolute; inset: 26px; border: 1px solid rgba(156,122,38,.42); border-radius: 6px; }
  .v .dust { position: absolute; background: var(--ge-gold-soft); border-radius: 50%; opacity: .45; }
  .v .inner { position: relative; height: 100%; display: flex; flex-direction: column; }

  .v .eyebrow2 { font-size: 15px; letter-spacing: .34em; text-transform: uppercase; color: var(--ge-gold); font-weight: 500; }
  .v .title { font-family: var(--font-serif); font-weight: 600; line-height: 1.04; color: var(--ge-ink); }
  .v .script { font-family: var(--font-script); color: var(--ge-gold); line-height: 1.25; }
  .v .body { color: var(--ge-ink-soft); line-height: 1.65; }
  .v .rule { width: 64px; height: 2px; background: var(--ge-gold); opacity: .75; }
  .v .rule--c { margin-left: auto; margin-right: auto; }

  .v .tag { display: inline-block; font-size: 14px; letter-spacing: .2em; text-transform: uppercase; color: var(--ge-gold-deep);
            border: 1px solid rgba(156,122,38,.5); border-radius: 999px; padding: 9px 22px; }
  .v .numtag { font-family: var(--font-serif); font-weight: 600; color: var(--ge-gold); opacity: .5; line-height: 1; }

  .v .ico { border: 1px solid rgba(156,122,38,.45); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--ge-gold); }
  .v .ico svg { width: 52%; height: 52%; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }

  .v .pts { list-style: none; display: grid; gap: 16px; padding: 0; margin: 0; }
  .v .pts li { display: flex; align-items: flex-start; gap: 14px; line-height: 1.45; }
  .v .pts .dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--ge-gold); margin-top: 9px; }
  .v .pts b { font-family: var(--font-serif); font-weight: 600; display: block; margin-bottom: 2px; }

  .v .pill2 { display: inline-flex; align-items: center; background: linear-gradient(180deg, var(--ge-gold-soft), var(--ge-gold-deep));
              color: #fffdf7; border-radius: 999px; font-weight: 500; letter-spacing: .05em; }
  .v .pill2--ghost { background: none; border: 1px solid rgba(156,122,38,.55); color: var(--ge-gold-deep); }

  .v .brandline { display: flex; align-items: center; gap: 12px; }
  .v .brandline img { display: block; }
  .v .brandline .nm { font-family: var(--font-serif); font-weight: 600; color: var(--ge-green); }
  .v .brandline .sub { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--ge-ink-soft); }
  .v .coords { font-size: 19px; letter-spacing: .1em; color: var(--ge-ink-soft); line-height: 1.9; }

  /* -- Maquette téléphone -- */
  .v .phone { background: var(--ge-green-deep); border-radius: 46px; padding: 12px; box-shadow: 0 30px 60px rgba(44,55,25,.32); flex: none; }
  .v .screen { width: 100%; height: 100%; background: var(--ge-cream); border-radius: 35px; overflow: hidden; position: relative; padding: 16px 16px 0; }
  .v .notch { width: 78px; height: 6px; border-radius: 99px; background: rgba(44,55,25,.22); margin: 0 auto 12px; }
  .v .mk-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .v .mk-brand { display: flex; align-items: center; gap: 7px; font-family: var(--font-serif); font-weight: 600; font-size: 14px; }
  .v .mk-brand img { height: 20px; display: block; }
  .v .mk-chip { width: 26px; height: 26px; border-radius: 50%; background: var(--ge-cream-light); border: 1px solid rgba(72,89,44,.3); }
  .v .mk-eyebrow { font-size: 9px; letter-spacing: .26em; text-transform: uppercase; color: var(--ge-gold); text-align: center; }
  .v .mk-couple { font-family: var(--font-script); font-size: 34px; color: var(--ge-gold); text-align: center; line-height: 1.2; margin-top: 4px; }
  .v .mk-date { font-size: 11px; color: var(--ge-ink-soft); text-align: center; margin-top: 2px; }
  .v .mk-cd { display: flex; gap: 7px; justify-content: center; margin: 16px 0 4px; }
  .v .mk-cd .u { background: var(--ge-cream-light); border: 1px solid rgba(44,55,25,.15); border-radius: 13px; padding: 9px 4px 6px; width: 60px;
                 text-align: center; box-shadow: 0 4px 14px rgba(44,55,25,.07); }
  .v .mk-cd .n { font-family: var(--font-serif); font-size: 23px; font-weight: 600; line-height: 1; }
  .v .mk-cd .l { font-size: 7px; letter-spacing: .16em; text-transform: uppercase; color: var(--ge-ink-soft); margin-top: 5px; }
  .v .mk-lieu { text-align: center; font-size: 10px; color: var(--ge-ink-soft); margin-top: 10px; }
  .v .mk-card { background: var(--ge-cream-light); border: 1px solid rgba(44,55,25,.15); border-radius: 15px; padding: 13px; margin-top: 15px;
                box-shadow: 0 4px 14px rgba(44,55,25,.07); }
  .v .mk-card .t { font-family: var(--font-serif); font-size: 15px; font-weight: 600; }
  .v .mk-card .s { font-size: 10px; color: var(--ge-ink-soft); margin: 2px 0 10px; }
  .v .mk-track { height: 6px; background: var(--ge-cream-deep); border-radius: 99px; overflow: hidden; }
  .v .mk-track i { display: block; height: 100%; width: 72%; background: linear-gradient(90deg, var(--ge-gold), var(--ge-green)); border-radius: 99px; }
  .v .mk-steps { margin-top: 11px; display: grid; gap: 8px; }
  .v .mk-step { display: flex; align-items: center; gap: 9px; font-size: 11px; }
  .v .mk-step .ck { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid rgba(72,89,44,.34); flex: none; }
  .v .mk-step.done .ck { background: var(--ge-green); border-color: var(--ge-green); }
  .v .mk-step.done span { color: var(--ge-ink-soft); }
  .v .mk-h { font-family: var(--font-serif); font-size: 19px; font-weight: 600; }
  .v .mk-sub { font-size: 10px; color: var(--ge-ink-soft); margin: 2px 0 13px; line-height: 1.5; }
  .v .mk-tl { display: flex; gap: 9px; margin-bottom: 9px; }
  .v .mk-tl .hh { flex: none; width: 46px; font-family: var(--font-serif); font-weight: 600; font-size: 13px; padding-top: 9px; }
  .v .mk-tl .c { flex: 1; background: var(--ge-cream-light); border: 1px solid rgba(44,55,25,.15); border-left: 3px solid var(--ge-green);
                 border-radius: 12px; padding: 8px 10px; box-shadow: 0 4px 12px rgba(44,55,25,.06); }
  .v .mk-tl .m { font-family: var(--font-serif); font-weight: 600; font-size: 13px; }
  .v .mk-tl .z { font-size: 10px; color: var(--ge-ink-soft); margin-top: 1px; }
  .v .mk-seg { display: flex; background: var(--ge-cream-deep); border-radius: 11px; padding: 3px; margin-bottom: 12px; }
  .v .mk-seg span { flex: 1; text-align: center; font-size: 10px; font-weight: 500; padding: 6px 0; border-radius: 9px; color: var(--ge-ink-soft); }
  .v .mk-seg span.on { background: var(--ge-cream-light); color: var(--ge-ink); box-shadow: 0 2px 6px rgba(44,55,25,.09); }
  .v .mk-song { display: flex; align-items: center; gap: 8px; background: var(--ge-cream-light); border: 1px solid rgba(44,55,25,.15);
                border-radius: 11px; padding: 8px 10px; margin-bottom: 6px; }
  .v .mk-song .i { font-family: var(--font-serif); font-size: 12px; color: var(--ge-gold); width: 12px; flex: none; }
  .v .mk-song .t { font-size: 11px; flex: 1; }
  .v .mk-song.ban { background: rgba(163,64,47,.05); border-color: rgba(163,64,47,.2); }
  .v .mk-song.ban .i { color: #a3402f; }
  .v .mk-nav { position: absolute; left: 0; right: 0; bottom: 0; display: flex; background: var(--ge-cream-deep);
               border-top: 1px solid rgba(72,89,44,.28); padding: 9px 6px 12px; }
  .v .mk-nav i { flex: 1; text-align: center; font-size: 8px; letter-spacing: .1em; text-transform: uppercase; font-style: normal; color: var(--ge-ink-soft); }
  .v .mk-nav i.on { color: var(--ge-gold); font-weight: 600; }
  .v .mk-nav i b { display: block; width: 16px; height: 16px; border-radius: 5px; border: 1.6px solid currentColor; margin: 0 auto 4px; }
  `;

  /* =======================================================================
     2) BRIQUES RÉUTILISABLES
     ======================================================================= */
  var I = {
    coeur:    '<path d="M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3 1.2 6 4 3-2.8 4-4 6-4 3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21z"/>',
    disque:   '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    mallette: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    etincelle:'<path d="M12 2l1.7 4.8L18.5 8.5l-4.8 1.7L12 15l-1.7-4.8L5.5 8.5l4.8-1.7z"/><path d="M5 15l.9 2.3L8.2 18l-2.3.9L5 21l-.9-2.1L1.8 18l2.3-.7z"/>',
    micro:    '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4M8 21h8"/>',
    enceinte: '<rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="7" r="1.6"/>',
    devis:    '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>'
  };
  function ico(n, s) { return '<div class="ico" style="width:' + s + 'px;height:' + s + 'px"><svg viewBox="0 0 24 24">' + I[n] + '</svg></div>'; }
  /* Texte saisi par l'utilisateur → HTML sûr (les retours à la ligne deviennent des <br>) */
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/\r?\n/g, '<br>');
  }
  function brand(h, sub) {
    return '<div class="brandline"><img src="' + LOGO + '" style="height:' + h + 'px" alt="" />' +
      '<div><div class="nm" style="font-size:' + Math.round(h * 0.46) + 'px">GuillaumEvent</div>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div></div>';
  }
  function chrome() {
    return '<div class="aura a1"></div><div class="aura a2"></div><div class="frame"></div>' +
      '<div class="dust" style="width:5px;height:5px;top:180px;right:230px"></div>' +
      '<div class="dust" style="width:3px;height:3px;top:300px;right:180px;opacity:.3"></div>';
  }
  function pads(v) {
    if (v.h >= 1900) return { x: 100, y: 150 };
    if (v.h >= 1300) return { x: 96, y: 122 };
    return { x: 88, y: 104 };
  }
  /* Coquille : bloc principal centré verticalement, pied de page ancré en bas */
  function shell(v, main, foot, centre) {
    var p = pads(v);
    return '<div class="inner" style="justify-content:center;padding:' + p.y + 'px ' + p.x + 'px' +
      (centre ? ';align-items:center;text-align:center' : '') + '">' +
      '<div style="width:100%">' + main + '</div>' +
      (foot ? '<div style="position:absolute;left:' + p.x + 'px;right:' + p.x + 'px;bottom:' + p.y + 'px;' +
        'display:flex;align-items:center;gap:26px' + (centre ? ';justify-content:center' : '') + '">' + foot + '</div>' : '') +
      '</div>';
  }
  function cta(t) { return '<div class="pill2" style="font-size:21px;padding:16px 34px;margin-left:auto">' + t + '</div>'; }

  /* -- Écrans de la maquette téléphone -- */
  var ECRAN = {
    accueil: function (grand, sansNav) {
      var w = grand ? 68 : 60, fs = grand ? 26 : 23;
      return '<div class="mk-bar"><span class="mk-brand"><img src="' + LOGO + '" alt="" />GuillaumEvent</span><span class="mk-chip"></span></div>' +
        '<div class="mk-eyebrow">Votre espace mariage</div>' +
        '<div class="mk-couple"' + (grand ? ' style="font-size:38px"' : '') + '>Camille &amp; Antoine</div>' +
        '<div class="mk-date">samedi 12 septembre 2026</div>' +
        '<div class="mk-cd">' +
          '<div class="u" style="width:' + w + 'px"><div class="n" style="font-size:' + fs + 'px">124</div><div class="l">Jours</div></div>' +
          '<div class="u" style="width:' + w + 'px"><div class="n" style="font-size:' + fs + 'px">07</div><div class="l">Heures</div></div>' +
          '<div class="u" style="width:' + w + 'px"><div class="n" style="font-size:' + fs + 'px">42</div><div class="l">Min</div></div>' +
        '</div>' +
        '<div class="mk-lieu">Domaine de la Roseraie · Vaucluse</div>' +
        (sansNav ? '' :
          '<div class="mk-card">' +
            '<div class="t">Préparons votre soirée</div>' +
            '<div class="s">3 étapes sur 4 complétées</div>' +
            '<div class="mk-track"><i></i></div>' +
            '<div class="mk-steps">' +
              '<div class="mk-step done"><span class="ck"></span><span>Le déroulé de la soirée</span></div>' +
              '<div class="mk-step done"><span class="ck"></span><span>Votre playlist</span></div>' +
              '<div class="mk-step"><span class="ck"></span><span>Le brief technique</span></div>' +
            '</div>' +
          '</div>' +
          nav(0));
    },
    deroule: function () {
      var l = [['18:30', 'Cocktail', 'Jazz &amp; bossa · volume doux'],
               ['20:00', 'Entrée des mariés', 'Signed, Sealed, Delivered'],
               ['22:30', 'Première danse', 'La Vie en rose — Louis Armstrong'],
               ['23:00', 'Ouverture de bal', 'Medley années 80'],
               ['01:30', 'Gâteau &amp; étincelles', 'Instrumental épique']];
      return '<div class="mk-bar"><span class="mk-brand"><img src="' + LOGO + '" alt="" />GuillaumEvent</span><span class="mk-chip"></span></div>' +
        '<div class="mk-h">Le déroulé</div>' +
        '<div class="mk-sub">Votre soirée, minute par minute. Renseignez les horaires : les moments se rangent tout seuls.</div>' +
        l.map(function (x) {
          return '<div class="mk-tl"><div class="hh">' + x[0] + '</div><div class="c"><div class="m">' + x[1] + '</div><div class="z">' + x[2] + '</div></div></div>';
        }).join('') + nav(1);
    },
    playlist: function () {
      var ok = ['September — Earth, Wind &amp; Fire', 'Dernière danse — Indila', "Don't Stop Me Now — Queen",
                'Alors on danse — Stromae', 'Voyage voyage — Desireless'];
      var no = ['Les Lacs du Connemara', 'La Danse des canards'];
      return '<div class="mk-bar"><span class="mk-brand"><img src="' + LOGO + '" alt="" />GuillaumEvent</span><span class="mk-chip"></span></div>' +
        '<div class="mk-h">La playlist</div>' +
        '<div class="mk-sub">Ce que vous voulez entendre… et ce que vous ne voulez surtout pas.</div>' +
        '<div class="mk-seg"><span class="on">À jouer</span><span>À éviter</span></div>' +
        ok.map(function (t, i) { return '<div class="mk-song"><span class="i">' + (i + 1) + '</span><span class="t">' + t + '</span></div>'; }).join('') +
        no.map(function (t) { return '<div class="mk-song ban"><span class="i">✕</span><span class="t">' + t + '</span></div>'; }).join('') +
        nav(2);
    }
  };
  function nav(actif) {
    return '<div class="mk-nav">' + ['Accueil', 'Déroulé', 'Playlist', 'Brief'].map(function (t, i) {
      return '<i' + (i === actif ? ' class="on"' : '') + '><b></b>' + t + '</i>';
    }).join('') + '</div>';
  }
  function phone(w, h, contenu, style) {
    return '<div class="phone" style="width:' + w + 'px;height:' + h + 'px;' + (style || '') + '">' +
      '<div class="screen"><div class="notch"></div>' + contenu + '</div></div>';
  }

  /* =======================================================================
     3) GABARITS
     ======================================================================= */
  var TPL = {
    /* -- Tout centré : couvertures, appels à l'action -- */
    centre: function (c, v) {
      var main =
        (c.icone ? '<div style="display:flex;justify-content:center">' + ico(c.icone, c.taille || 130) + '</div><div style="height:38px"></div>' : '') +
        (c.eyebrow ? '<div class="eyebrow2">' + c.eyebrow + '</div>' : '') +
        '<h2 class="title" style="font-size:' + (c.titreTaille || 72) + 'px;margin-top:18px">' + c.titre + '</h2>' +
        (c.script ? '<div class="script" style="font-size:48px;margin-top:8px">' + c.script + '</div>' : '') +
        '<div class="rule rule--c" style="margin:30px auto"></div>' +
        '<p class="body" style="font-size:24px;max-width:660px;margin:0 auto">' + c.texte + '</p>' +
        (c.pill ? '<div class="pill2' + (c.pillPlein ? '' : ' pill2--ghost') + '" style="font-size:' + (c.pillPlein ? 26 : 20) +
          'px;padding:' + (c.pillPlein ? '22px 52px' : '14px 34px') + ';margin-top:40px' +
          (c.pillPlein ? '' : ';letter-spacing:.16em;text-transform:uppercase') + '">' + c.pill + '</div>' : '') +
        (c.coords ? '<div style="margin-top:34px"><div class="coords">06 61 07 98 24 &nbsp;·&nbsp; contact@guillaumevent.fr &nbsp;·&nbsp; @guillaumevent</div></div>' : '');
      return shell(v, main, brand(54, 'DJ mariage · Provence'), true);
    },

    /* -- Fiche : icône + titre + texte + points -- */
    fiche: function (c, v) {
      var pts = '';
      if (c.points) pts = '<ul class="pts" style="font-size:22px;margin-top:34px">' + c.points.map(function (p) {
        return '<li><span class="dot"></span><span>' + p + '</span></li>'; }).join('') + '</ul>';
      if (c.pointsRiches) pts = '<ul class="pts" style="font-size:20px;margin-top:34px">' + c.pointsRiches.map(function (p) {
        return '<li><span class="dot"></span><span><b style="font-size:25px">' + p[0] + '</b><span class="body" style="font-size:20px">' + p[1] + '</span></span></li>'; }).join('') + '</ul>';
      var main =
        '<div style="display:flex;align-items:center;gap:28px">' + (c.icone ? ico(c.icone, 108) : '') +
          (c.num ? '<div class="numtag" style="font-size:76px">' + c.num + '</div>' : '') +
          (c.eyebrow ? '<div class="eyebrow2">' + c.eyebrow + '</div>' : '') + '</div>' +
        '<h2 class="title" style="font-size:' + (c.titreTaille || 66) + 'px;margin-top:30px">' + c.titre + '</h2>' +
        '<div class="rule" style="margin:26px 0"></div>' +
        '<p class="body" style="font-size:23px;max-width:820px">' + c.texte + '</p>' + pts;
      return shell(v, main, brand(52) + (c.cta ? cta(c.cta) : ''));
    },

    /* -- Option signature (format carré) -- */
    option: function (c, v) {
      var main =
        '<div style="display:flex;align-items:center;gap:26px">' + (c.icone ? ico(c.icone, 96) : '') +
          (c.tag ? '<div class="tag">' + c.tag + '</div>' : '') + '</div>' +
        '<h2 class="title" style="font-size:62px;margin-top:28px">' + c.titre + '</h2>' +
        '<div class="rule" style="margin:22px 0"></div>' +
        '<p class="body" style="font-size:22px">' + c.texte + '</p>' +
        '<ul class="pts" style="font-size:21px;margin-top:28px">' + c.points.map(function (p) {
          return '<li><span class="dot"></span><span>' + p + '</span></li>'; }).join('') + '</ul>';
      return shell(v, main, brand(50, 'guillaumevent.fr'));
    },

    /* -- Conseil : gros numéro + chute mise en exergue -- */
    conseil: function (c, v) {
      var main =
        '<div class="eyebrow2">Erreur n°' + c.num.replace(/^0/, '') + '</div>' +
        '<div class="numtag" style="font-size:150px;margin-top:6px">' + c.num + '</div>' +
        '<h2 class="title" style="font-size:' + (c.titreTaille || 64) + 'px;margin-top:14px">' + c.titre + '</h2>' +
        '<div class="rule" style="margin:28px 0"></div>' +
        '<p class="body" style="font-size:26px">' + c.texte + '</p>' +
        '<div style="margin-top:32px;border-left:3px solid var(--ge-gold);padding:6px 0 6px 26px">' +
          '<p class="title" style="font-size:30px;line-height:1.35;font-weight:500">' + c.chute + '</p></div>';
      return shell(v, main, brand(50, 'guillaumevent.fr'));
    },

    /* -- Étapes numérotées -- */
    etapes: function (c, v) {
      var main =
        '<div class="eyebrow2">' + c.eyebrow + '</div>' +
        '<h2 class="title" style="font-size:56px;margin-top:18px">' + c.titre + '</h2>' +
        '<div class="rule" style="margin:28px 0 44px"></div>' +
        c.etapes.map(function (e, i) {
          return '<div style="display:flex;gap:26px;margin-bottom:38px;align-items:flex-start">' +
            '<div class="numtag" style="font-size:58px;width:92px;flex:none">0' + (i + 1) + '</div>' +
            '<div><div class="title" style="font-size:34px">' + e[0] + '</div>' +
            '<p class="body" style="font-size:21px;margin-top:6px">' + e[1] + '</p></div></div>'; }).join('');
      return shell(v, main, brand(52) + cta(c.cta));
    },

    /* -- Carte de contact -- */
    contact: function (c, v) {
      var main =
        '<img src="' + LOGO + '" style="height:150px" alt="" />' +
        '<h2 class="title" style="font-size:' + (c.titreTaille || 70) + 'px;margin-top:40px">' + c.titre + '</h2>' +
        '<div class="script" style="font-size:50px;margin-top:2px">' + c.script + '</div>' +
        '<p class="body" style="font-size:24px;max-width:660px;margin:26px auto 0">' + c.texte + '</p>' +
        '<div class="pill2" style="font-size:28px;padding:24px 58px;margin-top:42px">' + c.pill + '</div>' +
        '<div class="rule rule--c" style="margin:48px auto 26px"></div>' +
        '<div class="coords" style="font-size:22px">06 61 07 98 24<br>contact@guillaumevent.fr<br>@guillaumevent</div>';
      return shell(v, main,
        '<div style="font-size:15px;letter-spacing:.28em;text-transform:uppercase;color:var(--ge-ink-soft)">DJ mariage · Vaucluse &amp; Provence</div>', true);
    },

    /* -- Espace Mariés : texte à gauche, téléphone à droite -- */
    emSplit: function (c, v) {
      return '<div class="inner" style="flex-direction:row;align-items:center;padding:0 0 0 78px;gap:44px">' +
        '<div style="flex:1;max-width:520px">' +
          '<div class="eyebrow2">' + c.eyebrow + '</div>' +
          '<h2 class="title" style="font-size:74px;margin-top:16px">' + c.titre + '</h2>' +
          '<div class="script" style="font-size:44px;margin-top:6px">' + c.script + '</div>' +
          '<div class="rule" style="margin:26px 0"></div>' +
          '<p class="body" style="font-size:21px">' + c.texte + '</p>' +
          '<ul class="pts" style="gap:13px;margin-top:28px;font-size:20px">' + c.points.map(function (p) {
            return '<li><span class="dot"></span><span>' + p + '</span></li>'; }).join('') + '</ul>' +
          '<div style="margin-top:44px">' + brand(56, 'DJ mariage · Provence') + '</div>' +
        '</div>' +
        phone(352, 730, ECRAN.accueil(false), 'margin-bottom:-90px') +
      '</div>';
    },

    /* -- Espace Mariés : story verticale -- */
    emStory: function (c, v) {
      return '<div class="inner" style="align-items:center;text-align:center;padding:130px 90px 110px">' +
        '<div style="display:flex;justify-content:center">' + brand(66) + '</div>' +
        '<div class="eyebrow2" style="margin-top:64px">' + c.eyebrow + '</div>' +
        '<h2 class="title" style="font-size:96px;margin-top:18px">' + c.titre + '</h2>' +
        '<div class="script" style="font-size:58px;margin-top:8px">' + c.script + '</div>' +
        '<p class="body" style="font-size:26px;max-width:700px;margin:26px auto 0">' + c.texte + '</p>' +
        '<div style="display:flex;justify-content:center;margin-top:56px">' + phone(400, 800, ECRAN.accueil(true)) + '</div>' +
        '<div style="margin-top:auto">' +
          '<div class="pill2" style="font-size:26px;padding:22px 52px">' + c.pill + '</div>' +
          '<div class="body" style="font-size:20px;margin-top:22px;letter-spacing:.14em;text-transform:uppercase">@guillaumevent · 06 61 07 98 24</div>' +
        '</div></div>';
    },

    /* -- Espace Mariés : couverture avec téléphone tronqué en bas -- */
    emCover: function (c, v) {
      return '<div class="inner" style="align-items:center;text-align:center;padding:110px 90px 0">' +
        '<div style="display:flex;justify-content:center">' + brand(58) + '</div>' +
        '<div class="eyebrow2" style="margin-top:48px">' + c.eyebrow + '</div>' +
        '<h2 class="title" style="font-size:88px;margin-top:16px">' + c.titre + '</h2>' +
        '<div class="script" style="font-size:52px;margin-top:6px">' + c.script + '</div>' +
        '<p class="body" style="font-size:24px;max-width:640px;margin:22px auto 0">' + c.texte + '</p>' +
        '<div class="pill2 pill2--ghost" style="font-size:20px;padding:14px 34px;margin-top:34px;letter-spacing:.16em;text-transform:uppercase">' + c.pill + '</div>' +
        '<div style="display:flex;justify-content:center;margin-top:44px">' +
          phone(360, 520, ECRAN.accueil(false, true), 'border-bottom-left-radius:0;border-bottom-right-radius:0;padding-bottom:0') +
        '</div></div>';
    },

    /* -- Espace Mariés : fonctionnalité (texte + téléphone), inversable -- */
    emFeature: function (c, v) {
      var txt =
        '<div style="flex:1;max-width:440px">' +
          '<div class="numtag" style="font-size:84px">' + c.num + '</div>' +
          '<h2 class="title" style="font-size:62px;margin-top:6px">' + c.titre + '</h2>' +
          '<div class="rule" style="margin:24px 0"></div>' +
          '<p class="body" style="font-size:22px">' + c.texte + '</p>' +
          '<p class="body" style="font-size:22px;margin-top:18px">' + c.texte2 + '</p>' +
          '<div style="margin-top:52px">' + brand(48) + '</div>' +
        '</div>';
      var tel = phone(372, 900, ECRAN[c.ecran](), 'margin-bottom:-120px');
      return '<div class="inner" style="flex-direction:row;align-items:center;gap:36px;padding:' +
        (c.inverse ? '0 80px 0 80px' : '0 0 0 80px') + '">' +
        (c.inverse ? tel + txt : txt + tel) + '</div>';
    },

    /* -- Espace Mariés : compte à rebours en grand -- */
    emCountdown: function (c, v) {
      var u = function (n, l) {
        return '<div class="u" style="width:190px;padding:34px 10px 24px;border-radius:26px;background:var(--ge-cream-light);' +
          'border:1px solid rgba(44,55,25,.15);text-align:center;box-shadow:0 4px 14px rgba(44,55,25,.07)">' +
          '<div style="font-family:var(--font-serif);font-size:76px;font-weight:600;line-height:1">' + n + '</div>' +
          '<div style="font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--ge-ink-soft);margin-top:14px">' + l + '</div></div>';
      };
      return '<div class="inner" style="align-items:center;justify-content:center;text-align:center;padding:0 100px">' +
        '<div class="numtag" style="font-size:84px">' + c.num + '</div>' +
        '<h2 class="title" style="font-size:64px;margin-top:6px">' + c.titre + '</h2>' +
        '<div class="script" style="font-size:46px;margin-top:4px">' + c.script + '</div>' +
        '<div style="display:flex;gap:20px;margin-top:52px">' + u('124', 'Jours') + u('07', 'Heures') + u('42', 'Min') + '</div>' +
        '<p class="body" style="font-size:24px;max-width:680px;margin-top:48px">' + c.texte + '</p>' +
        '<div class="mk-card" style="width:520px;margin-top:36px;text-align:left;border-radius:22px;padding:26px">' +
          '<div class="t" style="font-size:24px">Préparons votre soirée</div>' +
          '<div class="s" style="font-size:15px;margin:4px 0 16px">3 étapes sur 4 complétées</div>' +
          '<div class="mk-track" style="height:10px"><i></i></div></div>' +
        '<div style="margin-top:58px;display:flex;justify-content:center">' + brand(48) + '</div></div>';
    }
  };

  /* =======================================================================
     4) CONTENUS — c'est ici qu'on ajoute ou modifie des visuels
     ======================================================================= */
  var GROUPES = [

  { titre: 'Espace Mariés — annonce', note: "Le post et la story pour annoncer la nouveauté.", visuels: [
    { nom: 'Annonce — Post carré', fichier: 'espace-maries-post-carre', w: 1080, h: 1080, tpl: 'emSplit', c: {
        eyebrow: 'Nouveau', titre: "L'Espace Mariés", script: 'votre soirée, dans votre poche',
        texte: "Un espace privé, rien que pour vous deux : le déroulé de la soirée, votre playlist et le compte à rebours jusqu'au grand jour.",
        points: ['Le déroulé, minute par minute', 'Votre playlist… et vos interdits', 'Accessible partout, comme une appli'] } },
    { nom: 'Annonce — Story', fichier: 'espace-maries-story', w: 1080, h: 1920, tpl: 'emStory', c: {
        eyebrow: 'Nouveau', titre: "L'Espace Mariés", script: 'votre soirée, dans votre poche',
        texte: "Déroulé, playlist, compte à rebours : tout votre mariage réuni dans un espace privé, offert à chacun de nos couples.",
        pill: 'Réservez votre date sur guillaumevent.fr' } }
  ]},

  { titre: 'Espace Mariés — carrousel', note: '5 slides à publier ensemble, dans l\'ordre.', visuels: [
    { nom: 'Slide 1/5 — Couverture', fichier: 'em-carrousel-1-couverture', w: 1080, h: 1350, tpl: 'emCover', c: {
        eyebrow: 'Nouveau', titre: "L'Espace Mariés", script: 'offert à chacun de nos couples',
        texte: 'Votre mariage se prépare à quatre mains — et désormais, au même endroit.',
        pill: 'Faites défiler →' } },
    { nom: 'Slide 2/5 — Le déroulé', fichier: 'em-carrousel-2-deroule', w: 1080, h: 1350, tpl: 'emFeature', c: {
        num: '01', titre: 'Le déroulé', ecran: 'deroule',
        texte: "Entrée des mariés, première danse, gâteau, dernier morceau… Chaque moment de votre soirée, minute par minute.",
        texte2: 'Vous le remplissez quand vous voulez, nous le voyons en direct.' } },
    { nom: 'Slide 3/5 — La playlist', fichier: 'em-carrousel-3-playlist', w: 1080, h: 1350, tpl: 'emFeature', c: {
        num: '02', titre: 'La playlist', ecran: 'playlist', inverse: true,
        texte: "Vos incontournables d'un côté, vos interdits de l'autre. Une soirée qui vous ressemble vraiment.",
        texte2: "Le reste ? C'est notre métier : nous lisons la piste et ajustons toute la nuit." } },
    { nom: 'Slide 4/5 — Compte à rebours', fichier: 'em-carrousel-4-compte-a-rebours', w: 1080, h: 1350, tpl: 'emCountdown', c: {
        num: '03', titre: 'Le compte à rebours', script: 'plus que quelques nuits',
        texte: "Et une barre de progression qui vous dit exactement où vous en êtes : déroulé, playlist, brief. Aucun détail oublié." } },
    { nom: 'Slide 5/5 — On en parle ?', fichier: 'em-carrousel-5-contact', w: 1080, h: 1350, tpl: 'contact', c: {
        titre: 'On en parle&nbsp;?', script: 'votre date est peut-être encore libre',
        texte: "L'Espace Mariés est offert à chaque couple qui nous confie sa soirée. Devis gratuit sous 48 h.",
        pill: 'guillaumevent.fr' } }
  ]},

  { titre: 'Carrousel « Vos prestations »', note: '4 slides à publier ensemble.', visuels: [
    { nom: 'Slide 1/4 — Couverture', fichier: 'prestations-1-couverture', w: 1080, h: 1350, tpl: 'centre', c: {
        eyebrow: 'GuillaumEvent', titre: 'Trois univers,<br>une même exigence', script: 'faire danser, avec élégance',
        texte: "Mariages, soirées privées, événements d'entreprise. Un même soin du détail, du premier morceau au dernier.",
        pill: 'Faites défiler →', icone: 'disque', taille: 150 } },
    { nom: 'Slide 2/4 — Mariages', fichier: 'prestations-2-mariages', w: 1080, h: 1350, tpl: 'fiche', c: {
        num: '01', icone: 'coeur', titre: 'Mariages',
        texte: "Cérémonie, cocktail, dîner et soirée dansante. Une trame musicale cohérente du premier au dernier instant, en parfaite harmonie avec votre lieu et vos prestataires.",
        points: ['Un déroulé calé avec vous, moment par moment', 'Une playlist construite à votre image', 'Coordination avec vos autres prestataires'] } },
    { nom: 'Slide 3/4 — Soirées privées', fichier: 'prestations-3-soirees-privees', w: 1080, h: 1350, tpl: 'fiche', c: {
        num: '02', icone: 'disque', titre: 'Soirées privées',
        texte: "Anniversaires, fiançailles, fêtes de famille ou réceptions intimistes : une énergie élégante et un répertoire pointu, adaptés à vos invités et à l'esprit du moment.",
        points: ['Format modulable, de 20 à 300 invités', 'Répertoire adapté à toutes les générations', 'Installation discrète, adaptée au lieu'] } },
    { nom: 'Slide 4/4 — Entreprise', fichier: 'prestations-4-entreprise', w: 1080, h: 1350, tpl: 'fiche', c: {
        num: '03', icone: 'mallette', titre: "Événements d'entreprise",
        texte: "Soirées de gala, lancements, séminaires et cocktails professionnels. Une prestation sobre et raffinée qui valorise votre image et fédère vos équipes.",
        points: ['Sonorisation des prises de parole et micros HF', 'Ambiance calibrée selon les temps forts', 'Prestataire déclaré, facturation entreprise'],
        cta: 'guillaumevent.fr' } }
  ]},

  { titre: 'Options signature', note: 'Deux posts carrés — vos vrais différenciateurs.', visuels: [
    { nom: 'Étincelles Froides', fichier: 'option-etincelles-froides', w: 1080, h: 1080, tpl: 'option', c: {
        tag: 'Exclusivité GuillaumEvent', icone: 'etincelle', titre: 'Étincelles Froides',
        texte: "Des fontaines à étincelles froides pour sublimer vos moments forts : entrée des mariés, ouverture de bal ou découpe du gâteau. Un effet spectaculaire et photogénique.",
        points: ['Sans flamme, sans fumée ni odeur', 'Sécurisé en intérieur comme en extérieur', 'Déclenchement synchronisé avec la musique'] } },
    { nom: "Livre d'or audio", fichier: 'option-livre-dor-audio', w: 1080, h: 1080, tpl: 'option', c: {
        tag: 'Exclusivité GuillaumEvent', icone: 'micro', titre: "Livre d'or audio",
        texte: "Un combiné téléphonique rétro dans lequel vos invités laissent un message vocal. Bien plus émouvant qu'un livre d'or papier — un souvenir à réécouter pour toujours.",
        points: ['Des messages spontanés et sincères', "Un combiné élégant qui s'intègre à votre déco", 'Tous les enregistrements remis après le mariage'] } }
  ]},

  { titre: 'Le matériel', note: 'Rassure les couples exigeants sur la qualité technique.', visuels: [
    { nom: 'Son &amp; lumières', fichier: 'materiel-son-et-lumieres', w: 1080, h: 1350, tpl: 'fiche', c: {
        eyebrow: 'Équipement', icone: 'enceinte', titreTaille: 56,
        titre: 'Un son qui enveloppe,<br>une lumière qui sublime',
        texte: "Du matériel professionnel haut de gamme, dimensionné pour votre lieu, et un pilotage lumière soigné pour habiller l'espace avec goût.",
        pointsRiches: [
          ['Sonorisation premium', 'Enceintes et caissons calibrés par espace, restitution claire et puissante, sans saturation.'],
          ['Lumières &amp; têtes mobiles DMX', 'Jeux de lumière programmés en DMX, synchronisés à la musique.'],
          ['Installation &amp; discrétion', 'Mise en place soignée et invisible, micros HF pour vos discours.']
        ] } }
  ]},

  { titre: 'Devis gratuit sous 48 h', note: 'À republier régulièrement — en post et en story.', visuels: [
    { nom: 'Devis — Post carré', fichier: 'devis-post-carre', w: 1080, h: 1080, tpl: 'centre', c: {
        eyebrow: 'Devis gratuit', titre: 'Votre devis<br>en 2 minutes', script: 'sans engagement',
        texte: "Composez votre formule en ligne — prestation, options, durée — et recevez votre devis personnalisé sous 48 h.",
        pill: 'guillaumevent.fr', pillPlein: true, icone: 'devis', taille: 112 } },
    { nom: 'Devis — Story', fichier: 'devis-story', w: 1080, h: 1920, tpl: 'centre', c: {
        eyebrow: 'Devis gratuit', titre: 'Votre devis<br>en 2 minutes', script: 'sans engagement',
        texte: "Composez votre formule en ligne — prestation, options, durée — et recevez votre devis personnalisé sous 48 h. Sans engagement, sans mauvaise surprise.",
        pill: 'guillaumevent.fr', pillPlein: true, icone: 'devis', taille: 170, coords: true } }
  ]},

  { titre: 'Comment ça se passe', note: 'Rassure les couples qui hésitent à faire le premier pas.', visuels: [
    { nom: 'Les 3 étapes', fichier: 'comment-ca-se-passe', w: 1080, h: 1350, tpl: 'etapes', c: {
        eyebrow: 'Comment ça se passe', titre: 'De votre premier message<br>à la dernière danse',
        etapes: [
          ['On se rencontre', "Un appel ou un café. Vous nous racontez votre projet, nous vous disons franchement ce qui marche."],
          ['On prépare ensemble', 'Votre Espace Mariés : déroulé, playlist, moments clés. Vous avancez à votre rythme.'],
          ['On fait danser', "Le jour J, tout est entre nos mains. Vous n'avez plus qu'à profiter."]
        ], cta: 'guillaumevent.fr' } }
  ]},

  { titre: 'Carrousel « 5 erreurs playlist »', note: '7 slides. Attire des couples qui ne vous connaissent pas encore.', visuels: [
    { nom: 'Slide 1/7 — Couverture', fichier: 'conseils-1-couverture', w: 1080, h: 1350, tpl: 'centre', c: {
        eyebrow: 'Conseils de DJ', titreTaille: 64,
        titre: '5 erreurs à éviter<br>pour la playlist<br>de votre mariage', script: 'vu et revu en soirée',
        texte: 'Après des centaines de mariages, ce sont toujours les mêmes qui vident la piste.',
        pill: 'Faites défiler →' } },
    { nom: 'Slide 2/7 — Erreur 1', fichier: 'conseils-2-erreur-1', w: 1080, h: 1350, tpl: 'conseil', c: {
        num: '01', titre: 'Vouloir tout contrôler',
        texte: "Une playlist de 200 titres imposée minute par minute, c'est la meilleure façon de vider la piste.",
        chute: 'Donnez le cap et vos incontournables. Laissez le DJ lire la salle et ajuster.' } },
    { nom: 'Slide 3/7 — Erreur 2', fichier: 'conseils-3-erreur-2', w: 1080, h: 1350, tpl: 'conseil', c: {
        num: '02', titre: 'Oublier la liste rouge',
        texte: 'Ce que vous ne voulez surtout pas entendre compte autant que le reste.',
        chute: 'Un seul morceau mal placé peut plomber une ambiance. Dites-le avant, pas pendant.' } },
    { nom: 'Slide 4/7 — Erreur 3', fichier: 'conseils-4-erreur-3', w: 1080, h: 1350, tpl: 'conseil', c: {
        num: '03', titre: "Ne penser qu'à vous deux",
        texte: 'Vos invités ont entre 7 et 77 ans. Une playlist 100 % à votre goût laissera les trois quarts de la salle assis.',
        chute: 'Prévoyez des respirations pour chaque génération. Tout le monde doit avoir son moment.' } },
    { nom: 'Slide 5/7 — Erreur 4', fichier: 'conseils-5-erreur-4', w: 1080, h: 1350, tpl: 'conseil', c: {
        num: '04', titre: 'Négliger le cocktail et le dîner',
        texte: 'Ce sont souvent quatre heures de musique — bien avant la première danse.',
        chute: "C'est là que l'ambiance se construit. Une soirée réussie ne commence pas à minuit." } },
    { nom: 'Slide 6/7 — Erreur 5', fichier: 'conseils-6-erreur-5', w: 1080, h: 1350, tpl: 'conseil', c: {
        num: '05', titre: 'Choisir sa première danse trop tard',
        texte: "Version, durée, montage, transition vers l'ouverture de bal : tout se prépare.",
        chute: 'Calez votre morceau au moins un mois avant. Vous danserez beaucoup plus sereinement.' } },
    { nom: 'Slide 7/7 — On en parle ?', fichier: 'conseils-7-contact', w: 1080, h: 1350, tpl: 'contact', c: {
        titre: 'On en parle&nbsp;?', script: 'votre date est peut-être encore libre',
        texte: "Devis gratuit sous 48 h, sans engagement. Et l'Espace Mariés offert à chaque couple qui nous confie sa soirée.",
        pill: 'guillaumevent.fr' } }
  ]}
  ];

  /* =======================================================================
     5) ATELIER — composer un visuel à la demande
     ======================================================================= */

  /* Quels champs sert chaque gabarit (les autres sont masqués) */
  var CHAMPS = {
    centre:  ['icone', 'eyebrow', 'titre', 'script', 'texte', 'pill'],
    fiche:   ['icone', 'num', 'eyebrow', 'titre', 'texte', 'points', 'pill'],
    option:  ['icone', 'eyebrow', 'titre', 'texte', 'points'],
    conseil: ['num', 'titre', 'texte', 'chute'],
    contact: ['titre', 'script', 'texte', 'pill']
  };
  var GABARITS = [
    ['centre',  'Titre centré — annonce, couverture, offre'],
    ['fiche',   'Fiche — titre, texte et liste de points'],
    ['option',  'Option / nouveauté — avec badge'],
    ['conseil', 'Conseil — gros numéro et phrase à retenir'],
    ['contact', 'Contact — logo, accroche et coordonnées']
  ];
  var FORMATS = [
    ['1080x1350', 'Post portrait 1080 × 1350 (recommandé)'],
    ['1080x1080', 'Post carré 1080 × 1080'],
    ['1080x1920', 'Story / Reels 1080 × 1920']
  ];
  var ICONES = [['', 'Aucune'], ['coeur', 'Cœur'], ['disque', 'Disque'], ['mallette', 'Mallette'],
                ['etincelle', 'Étincelles'], ['micro', 'Micro'], ['enceinte', 'Enceinte'], ['devis', 'Document']];

  function opts(list, defaut) {
    return list.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === defaut ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');
  }
  function champ(id, label, ctrl, aide) {
    return '<div class="field" data-champ="' + id + '"><label for="vzc-' + id + '">' + label + '</label>' + ctrl +
      (aide ? '<div class="vz-hint">' + aide + '</div>' : '') + '</div>';
  }
  var ATELIER_HTML =
    '<details class="vz-atelier">' +
      '<summary>Créer un visuel sur mesure<small>Vos textes, votre charte — le visuel se fabrique tout seul.</small></summary>' +
      '<div class="vz-atelier__body">' +
        '<div class="form-grid">' +
          champ('gabarit', 'Modèle', '<select id="vzc-gabarit">' + opts(GABARITS, 'centre') + '</select>') +
          champ('format', 'Format', '<select id="vzc-format">' + opts(FORMATS, '1080x1350') + '</select>') +
        '</div>' +
        '<div class="form-grid">' +
          champ('icone', 'Icône', '<select id="vzc-icone">' + opts(ICONES, '') + '</select>') +
          champ('num', 'Numéro', '<input id="vzc-num" placeholder="01" maxlength="3" />') +
        '</div>' +
        champ('eyebrow', 'Sur-titre', '<input id="vzc-eyebrow" placeholder="Nouveau" />',
              'La petite ligne en majuscules dorées, au-dessus du titre.') +
        champ('titre', 'Titre', '<textarea id="vzc-titre" rows="2" placeholder="Votre grand titre"></textarea>',
              'Appuyez sur Entrée pour passer à la ligne.') +
        champ('script', 'Ligne manuscrite', '<input id="vzc-script" placeholder="une accroche en écriture fine" />') +
        champ('texte', 'Texte', '<textarea id="vzc-texte" rows="3" placeholder="Deux ou trois phrases suffisent."></textarea>') +
        champ('points', 'Liste à puces', '<textarea id="vzc-points" rows="3" placeholder="Un point par ligne"></textarea>',
              'Une ligne = une puce dorée.') +
        champ('chute', 'Phrase à retenir', '<input id="vzc-chute" placeholder="La leçon, mise en avant en bas du visuel" />') +
        champ('pill', 'Pastille / bouton', '<input id="vzc-pill" placeholder="guillaumevent.fr" />') +
        '<div class="vz-actions">' +
          '<button class="btn btn--gold btn--small" id="vzc-dl" data-t="vzCustom" data-n="visuel-sur-mesure">' +
            (MOBILE ? 'Enregistrer ce visuel' : 'Télécharger ce visuel') + '</button>' +
          '<button class="btn btn--ghost btn--small" type="button" id="vzc-raz">Tout effacer</button>' +
          '<span class="vz-hint" id="vzc-etat" style="margin:0"></span>' +
        '</div>' +
        '<div class="vz-stage" style="margin-top:1rem"><div class="vz-scale" data-w="1080">' +
          '<div class="v" id="vzCustom" style="width:1080px;height:1350px"></div>' +
        '</div></div>' +
      '</div>' +
    '</details>';

  /* Reconstruit l'aperçu à partir du formulaire */
  function composer(fit) {
    var val = function (id) { return (document.getElementById('vzc-' + id).value || '').trim(); };
    var gab = val('gabarit');
    var dim = val('format').split('x');
    var v = { w: +dim[0], h: +dim[1] };
    var utiles = CHAMPS[gab];

    /* On n'envoie au gabarit que les champs qu'il sait utiliser */
    var c = {};
    if (utiles.indexOf('icone')   > -1 && val('icone'))   c.icone = val('icone');
    if (utiles.indexOf('num')     > -1 && val('num'))     c.num = esc(val('num'));
    if (utiles.indexOf('eyebrow') > -1 && val('eyebrow')) { c.eyebrow = esc(val('eyebrow')); c.tag = esc(val('eyebrow')); }
    if (utiles.indexOf('script')  > -1 && val('script'))  c.script = esc(val('script'));
    if (utiles.indexOf('chute')   > -1)                   c.chute = esc(val('chute'));
    if (utiles.indexOf('pill')    > -1 && val('pill'))    { c.pill = esc(val('pill')); c.pillPlein = true; }
    c.titre = esc(val('titre') || 'Votre titre');
    c.texte = esc(val('texte'));
    if (utiles.indexOf('points') > -1) {
      c.points = val('points').split(/\r?\n/).map(function (l) { return esc(l.trim()); }).filter(Boolean);
      if (!c.points.length) delete c.points;
    }
    /* Un titre long doit rétrécir pour ne pas déborder */
    var brut = val('titre') || 'Votre titre';
    var plusLongMot = brut.split(/\s+/).reduce(function (m, w) { return Math.max(m, w.length); }, 0);
    var lignes = brut.split(/\r?\n/).length;
    if (gab === 'centre' || gab === 'contact') {
      c.titreTaille = brut.length > 60 || lignes > 2 ? 54 : (brut.length > 32 ? 62 : 72);
    } else {
      c.titreTaille = brut.length > 44 ? 48 : (brut.length > 26 ? 56 : 66);
    }
    if (plusLongMot > 16) c.titreTaille = Math.min(c.titreTaille, 46);

    var el = document.getElementById('vzCustom');
    el.style.width = v.w + 'px';
    el.style.height = v.h + 'px';
    el.parentElement.dataset.w = v.w;
    el.innerHTML = chrome() + TPL[gab](c, v);

    /* Affiche uniquement les champs servant au gabarit choisi */
    document.querySelectorAll('.vz-atelier [data-champ]').forEach(function (f) {
      var n = f.dataset.champ;
      if (n === 'gabarit' || n === 'format') return;
      f.classList.toggle('off', utiles.indexOf(n) === -1);
    });
    if (fit) fit();
  }

  /* =======================================================================
     6) CONSTRUCTION DU PANNEAU
     ======================================================================= */
  function init() {
    var panel = document.getElementById('p-visuels');
    if (!panel || panel.dataset.pret) return;
    panel.dataset.pret = '1';

    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var html = '<h2 class="h3" style="margin-bottom:0.4rem">Visuels réseaux sociaux</h2>' +
      '<p class="vz-intro">' + (MOBILE
        ? 'Touchez <b>Enregistrer</b> sous un visuel : il s\'affiche en grand, puis un <b>appui long sur l\'image</b> permet de l\'ajouter à vos photos.'
        : 'Cliquez sur <b>Télécharger</b> : le visuel part en PNG dans vos téléchargements, prêt à publier.') +
      '<br>Les carrousels se publient <b>en une seule fois</b>, dans l\'ordre des slides.</p>' +
      (MOBILE ? '' : '<button class="btn btn--gold" id="vzAll" style="margin-bottom:1.5rem">Tout télécharger</button>') +
      ATELIER_HTML;

    var n = 0, total = 0;
    GROUPES.forEach(function (g) {
      html += '<div class="vz-group"><h3>' + g.titre + '</h3><p>' + g.note + '</p></div>';
      g.visuels.forEach(function (v) {
        n++; total++;
        var id = 'vz' + n;
        html += '<div class="vz-item">' +
          '<div class="vz-bar">' +
            '<span class="vz-name">' + n + ' · ' + v.nom + '</span>' +
            '<span class="vz-size">' + v.w + ' × ' + v.h + '</span>' +
            '<button class="btn btn--ghost btn--small vz-dl" data-t="' + id + '" data-n="' + v.fichier + '">' +
              (MOBILE ? 'Enregistrer' : 'Télécharger') + '</button>' +
          '</div>' +
          '<div class="vz-stage"><div class="vz-scale" data-w="' + v.w + '">' +
            '<div class="v" id="' + id + '" style="width:' + v.w + 'px;height:' + v.h + 'px">' +
              chrome() + TPL[v.tpl](v.c, v) +
            '</div></div></div></div>';
      });
    });

    html += '<div class="vz-group" style="margin-bottom:0">' +
      '<h3>Besoin d\'aller plus loin&nbsp;?</h3>' +
      '<p>Pour confier un visuel à un graphiste ou à un imprimeur, transmettez-lui la ' +
      '<a href="marque.html" target="_blank" rel="noopener" style="color:var(--color-primary);border-bottom:1px solid currentColor">charte de marque ↗</a> ' +
      '— elle contient les logos, les couleurs et les règles d\'usage.</p></div>';

    panel.innerHTML = html;

    var all = document.getElementById('vzAll');
    if (all) all.textContent = 'Tout télécharger (' + total + ' visuels)';

    /* Aperçu mis à l'échelle */
    function fit() {
      panel.querySelectorAll('.vz-stage').forEach(function (stage) {
        var sc = stage.querySelector('.vz-scale'), v = sc.firstElementChild;
        var k = Math.min(1, stage.clientWidth / parseFloat(sc.dataset.w));
        sc.style.transform = 'scale(' + k + ')';
        stage.style.height = (v.offsetHeight * k) + 'px';
      });
    }
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    setTimeout(fit, 60); fit();

    /* Le panneau est masqué au chargement (connexion + onglet inactif) : les
       aperçus mesureraient une largeur de 0. On recalcule à chaque ouverture. */
    document.querySelectorAll('.tab[data-p="visuels"]').forEach(function (t) {
      t.addEventListener('click', function () { setTimeout(fit, 0); });
    });
    window.__vzFit = fit;

    /* Aperçu plein écran (mobile) */
    var modal = document.createElement('div');
    modal.className = 'vz-modal';
    modal.innerHTML = '<img alt="" /><p>Appui long sur l\'image, puis <b>« Ajouter aux photos »</b>' +
      ' <small>(ou « Télécharger l\'image » sur Android)</small></p>' +
      '<button class="btn btn--gold" type="button">Fermer</button>';
    document.body.appendChild(modal);
    modal.querySelector('button').addEventListener('click', function () { modal.classList.remove('on'); });

    /* Chargement de html2canvas au premier besoin */
    var chargement = null;
    function h2c() {
      if (window.html2canvas) return Promise.resolve(window.html2canvas);
      if (chargement) return chargement;
      chargement = new Promise(function (ok, ko) {
        var s = document.createElement('script');
        s.src = H2C;
        s.onload = function () { ok(window.html2canvas); };
        s.onerror = function () { ko(new Error('html2canvas indisponible')); };
        document.head.appendChild(s);
      });
      return chargement;
    }

    function rendu(id) {
      return h2c().then(function (lib) {
        var el = document.getElementById(id), sc = el.parentElement;
        var avant = sc.style.transform;
        sc.style.transform = 'none';                     // capture à taille réelle
        var pret = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        return pret.then(function () {
          return lib(el, { scale: 1, backgroundColor: '#f1ead9', logging: false, useCORS: true });
        }).then(function (canvas) {
          sc.style.transform = avant;
          return canvas;
        }, function (e) { sc.style.transform = avant; throw e; });
      });
    }

    function sortie(canvas, nom) {
      var url = canvas.toDataURL('image/png');
      if (MOBILE) {
        modal.querySelector('img').src = url;
        modal.classList.add('on');
      } else {
        var a = document.createElement('a');
        a.download = 'guillaumevent-' + nom + '.png';
        a.href = url;
        a.click();
      }
    }

    panel.querySelectorAll('.vz-dl').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.textContent;
        b.textContent = 'Création…'; b.disabled = true;
        rendu(b.dataset.t).then(function (c) {
          sortie(c, b.dataset.n);
          b.textContent = '✓ Fait';
        }).catch(function (e) {
          console.error(e); b.textContent = 'Erreur';
        }).then(function () {
          setTimeout(function () { b.textContent = txt; b.disabled = false; }, 1800);
        });
      });
    });

    /* ---- Atelier « visuel sur mesure » ---- */
    var minuteur = null;
    function rafraichir() { clearTimeout(minuteur); minuteur = setTimeout(function () { composer(fit); }, 180); }
    panel.querySelectorAll('.vz-atelier input, .vz-atelier textarea, .vz-atelier select').forEach(function (ch) {
      ch.addEventListener('input', rafraichir);
      ch.addEventListener('change', rafraichir);
    });
    panel.querySelector('.vz-atelier').addEventListener('toggle', function () { composer(fit); });
    document.getElementById('vzc-raz').addEventListener('click', function () {
      panel.querySelectorAll('.vz-atelier input, .vz-atelier textarea').forEach(function (ch) { ch.value = ''; });
      composer(fit);
    });
    var dlc = document.getElementById('vzc-dl'), etat = document.getElementById('vzc-etat');
    dlc.addEventListener('click', function () {
      var txt = dlc.textContent;
      dlc.textContent = 'Création…'; dlc.disabled = true; etat.textContent = '';
      var nom = (document.getElementById('vzc-titre').value || 'visuel-sur-mesure')
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'visuel-sur-mesure';
      rendu('vzCustom').then(function (c) {
        sortie(c, nom);
        etat.textContent = MOBILE ? '' : 'Enregistré sous « guillaumevent-' + nom + '.png »';
      }).catch(function (e) {
        console.error(e); etat.textContent = 'Échec de la création du visuel.';
      }).then(function () {
        dlc.textContent = txt; dlc.disabled = false;
      });
    });
    composer(fit);

    if (all) {
      all.addEventListener('click', function () {
        var list = Array.prototype.slice.call(panel.querySelectorAll('.vz-dl'));
        all.disabled = true;
        var i = 0;
        (function suivant() {
          if (i >= list.length) {
            all.textContent = '✓ Tous les visuels sont dans vos téléchargements';
            all.disabled = false;
            return;
          }
          all.textContent = 'Création ' + (i + 1) + ' / ' + list.length + '…';
          rendu(list[i].dataset.t).then(function (c) {
            sortie(c, list[i].dataset.n);
          }).catch(function (e) { console.error(e); }).then(function () {
            i++; setTimeout(suivant, 700);
          });
        })();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
