import React, { useEffect, useMemo, useState } from "react";


/**
* Mini‑app NPS avec campagnes, redirections conditionnelles, tableau de bord,
* export CSV et envoi optionnel vers un webhook (ex. Apps Script → Google Sheets).
*
* ✅ Une seule page React, sans backend (persistance locale via localStorage)
* ✅ Liens de sondage par campagne (ex.: #/survey/<campaignId>?email=...&utm=...)
* ✅ Redirections: 9–10 → Promoteur·rice (ex.: Google Reviews), 7–8 → Passif·ve,
* 0–6 → Détracteur·rice
* ✅ Tableau de bord: calcul NPS, filtres, export CSV, gestion des campagnes
* ✅ Webhook optionnel par campagne pour pousser les réponses (POST JSON)
*
* Déploiement recommandé: Vercel / Netlify (build static). Aucun serveur requis.
*/


/*********************************
* Utilitaires
*********************************/
const uid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);
const ls = {
get(key, fallback) {
try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
},
set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};


const STORAGE_KEYS = {
campaigns: "nps_campaigns_v1",
responses: "nps_responses_v1",
};


function useLocalArray(key, initial = []) {
const [arr, setArr] = useState(() => ls.get(key, initial));
useEffect(() => { ls.set(key, arr); }, [key, arr]);
return [arr, setArr];
}


function hashRoute() {
const h = window.location.hash.replace(/^#\/?/, ""); // e.g. "survey/abc?email=x"
const [path, qs = ""] = h.split("?");
const params = Object.fromEntries(new URLSearchParams(qs));
return { path: path || "", params };
}


function setRoute(path) { window.location.hash = path.startsWith("#") ? path : `#/${path.replace(/^\//, "")}`; }


function classNames(...xs) { return xs.filter(Boolean).join(" "); }


function toCSV(rows) {
if (!rows.length) return "";
const headers = Object.keys(rows[0]);
const esc = (s) => (`${s ?? ""}`).replaceAll('"', '""');
const lines = [headers.join(",")].concat(rows.map(r => headers.map(h => `"${esc(r[h])}"`).join(",")));
return lines.join("\n");
}
function App() {
  // ...
}

export default App;
