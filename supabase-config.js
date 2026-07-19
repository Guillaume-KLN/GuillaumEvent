/* =========================================================================
   GuillaumEvent — Connexion à la base de données (Supabase)
   Ce fichier est partagé par le devis, le pilotage et l'espace mariés.

   ℹ️ La clé ci-dessous est "publishable" : elle est FAITE pour être publique.
      Ce sont les règles de sécurité (RLS) configurées dans Supabase qui
      protègent réellement les données. Ne jamais mettre ici la clé "secret".
   ========================================================================= */

const SUPABASE_URL = 'https://vunjyidtmmmbyfmkflvc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-1I-y13aRFpPIuI8FqxbZQ_5JVRrIp4';

// Client partagé (la librairie est chargée juste avant via le CDN).
// Si le CDN est indisponible, sb vaut null : les pages continuent de
// fonctionner (le devis bascule sur l'envoi par email, par exemple).
const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
if (!sb) console.warn('Supabase indisponible — mode dégradé.');
