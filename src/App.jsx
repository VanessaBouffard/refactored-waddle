import React, { useEffect, useMemo, useState } from "react";

const uid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);
const ls = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

const STORAGE_KEYS = { campaigns: "nps_campaigns_v1", responses: "nps_responses_v1" };

function useLocalArray(key, initial = []) {
  const [arr, setArr] = useState(() => ls.get(key, initial));
  useEffect(() => { ls.set(key, arr); }, [key, arr]);
  return [arr, setArr];
}

function hashRoute() {
  const h = window.location.hash.replace(/^#\/?/, "");
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

const DEFAULT_CAMPAIGN = () => ({
  id: uid(),
  name: "Sondage NPS – Clients",
  audience: "clients",
  brandName: "Succès Scolaire",
  accentHex: "#2563eb",
  thankYou: "Merci pour ton avis!",
  promoterUrl: "https://g.page/r/EXEMPLE-avis-google",
  passiveUrl: "https://example.com/formulaire-amelioration",
  detractorUrl: "https://example.com/formulaire-resolution",
  webhookUrl: "",
  isActive: true,
});

function Card({ className, children }) { return <div className={classNames("rounded-2xl shadow p-5 bg-white border", className)}>{children}</div>; }
function Label({ children }) { return <label className="block text-sm font-medium mb-1">{children}</label>; }
function Input({ className, ...props }) { return <input className={classNames("w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring", className)} {...props} />; }
function Textarea({ className, ...props }) { return <textarea className={classNames("w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring", className)} {...props} />; }
function Button({ children, className, ...props }) { return <button className={classNames("rounded-2xl px-4 py-2 shadow text-sm font-medium", className)} {...props}>{children}</button>; }
function Toggle({ checked, onChange, label }){ return (<div className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} /><span className="text-sm">{label}</span></div>); }

function Dashboard({ campaigns, setCampaigns, responses }) {
  const [filterId, setFilterId] = useState("");
  const filtered = useMemo(() => responses.filter(r => !filterId || r.campaignId === filterId), [responses, filterId]);
  const npsStats = useMemo(() => {
    const total = filtered.length;
    const promoters = filtered.filter(r => r.score >= 9).length;
    const passives = filtered.filter(r => r.score >= 7 && r.score <= 8).length;
    const detractors = filtered.filter(r => r.score <= 6).length;
    const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
    return { total, promoters, passives, detractors, nps };
  }, [filtered]);
  function addCampaign(){ setCampaigns(prev => [DEFAULT_CAMPAIGN(), ...prev]); }
  function updateCampaign(id, patch){ setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function removeCampaign(id){ if(confirm("Supprimer cette campagne ?")) setCampaigns(prev => prev.filter(c => c.id !== id)); }
  function exportCSV(){
    const rows = filtered.map(r => ({
      id: r.id, tsISO: r.tsISO, campaignId: r.campaignId, score: r.score,
      comment: r.comment || "", email: r.email || "",
      brand: (campaigns.find(c=>c.id===r.campaignId)?.brandName)||"",
      audience: (campaigns.find(c=>c.id===r.campaignId)?.audience)||"",
      meta: JSON.stringify(r.meta||{}), routeParams: JSON.stringify(r.routeParams||{}),
    }));
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `nps_responses_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tableau de bord NPS</h1>
        <div className="flex gap-2">
          <Button className="bg-black text-white" onClick={addCampaign}>+ Nouvelle campagne</Button>
          <Button className="bg-gray-100" onClick={exportCSV}>Exporter CSV</Button>
        </div>
      </header>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card><div className="text-sm text-gray-500">Total réponses</div><div className="text-2xl font-bold">{npsStats.total}</div></Card>
        <Card><div className="text-sm text-gray-500">Promoteur·rice·s (9–10)</div><div className="text-2xl font-bold">{npsStats.promoters}</div></Card>
        <Card><div className="text-sm text-gray-500">Passif·ve·s (7–8)</div><div className="text-2xl font-bold">{npsStats.passives}</div></Card>
        <Card><div className="text-sm text-gray-500">Détracteur·rice·s (0–6)</div><div className="text-2xl font-bold">{npsStats.detractors}</div></Card>
      </div>
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Label>Filtrer par campagne</Label>
          <select className="border rounded-xl px-3 py-2" value={filterId} onChange={e=>setFilterId(e.target.value)}>
            <option value="">Toutes</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="ml-auto text-lg font-semibold">NPS: {npsStats.nps}</div>
        </div>
      </Card>
      <section className="grid gap-6">
        {campaigns.map(c => (<Card key={c.id}><CampaignEditor c={c} onChange={(p)=>updateCampaign(c.id, p)} onRemove={()=>removeCampaign(c.id)} /></Card>))}
        {campaigns.length === 0 && (<Card><p>Aucune campagne pour l’instant. Crée ta première 💡</p></Card>)}
      </section>
    </div>
  );
}

function CampaignEditor({ c, onChange, onRemove }){
  const baseUrl = `${window.location.origin}${window.location.pathname}#/survey/${c.id}`;
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div>
        <h2 className="font-semibold text-lg mb-3">{c.name}</h2>
        <div className="grid gap-3">
          <div><Label>Nom de la campagne</Label><Input value={c.name} onChange={e=>onChange({name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Audience</Label>
              <select className="border rounded-xl px-3 py-2 w-full" value={c.audience} onChange={e=>onChange({audience: e.target.value})}>
                <option>clients</option><option>employé·e·s</option>
              </select>
            </div>
            <div><Label>Marque (affiché.e)</Label><Input value={c.brandName} onChange={e=>onChange({brandName: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Couleur d’accent (hex)</Label><Input value={c.accentHex} onChange={e=>onChange({accentHex: e.target.value})} /></div>
            <div><Label>Message de remerciement</Label><Input value={c.thankYou} onChange={e=>onChange({thankYou: e.target.value})} /></div>
          </div>
          <div><Label>URL Promoteur·rice·s (9–10)</Label><Input value={c.promoterUrl} onChange={e=>onChange({promoterUrl: e.target.value})} placeholder="https://..." /></div>
          <div><Label>URL Passif·ve·s (7–8)</Label><Input value={c.passiveUrl} onChange={e=>onChange({passiveUrl: e.target.value})} placeholder="https://..." /></div>
          <div><Label>URL Détracteur·rice·s (0–6)</Label><Input value={c.detractorUrl} onChange={e=>onChange({detractorUrl: e.target.value})} placeholder="https://..." /></div>
          <div>
            <Label>Webhook (optionnel) pour enregistrer la réponse</Label>
            <Input value={c.webhookUrl} onChange={e=>onChange({webhookUrl: e.target.value})} placeholder="https://script.google.com/.../exec" />
            <p className="text-xs text-gray-500 mt-1">Si rempli, chaque réponse est aussi POSTée en JSON.</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <Toggle checked={!!c.isActive} onChange={(v)=>onChange({isActive: v})} label="Campagne active"/>
            <div className="flex gap-2">
              <Button className="bg-gray-100" onClick={()=>navigator.clipboard.writeText(baseUrl)}>Copier lien</Button>
              <Button className="bg-black text-white" onClick={()=>window.open(baseUrl, "_blank")}>Ouvrir le sondage</Button>
              <Button className="bg-red-50 text-red-700" onClick={onRemove}>Supprimer</Button>
            </div>
          </div>
          <div className="text-xs text-gray-500">Lien de sondage: <span className="font-mono">{baseUrl}</span></div>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Aperçu NPS & instructions</h3>
        <ul className="text-sm list-disc pl-5 space-y-2">
          <li>Partage le lien ci-dessus. Tu peux ajouter des paramètres (ex.: <code>?email=nom@exemple.com&source=campagneQ4</code>).</li>
          <li>9–10 → Promoteur·rice, 7–8 → Passif·ve, 0–6 → Détracteur·rice (redirigé·e vers les URLs configurées).</li>
          <li>NPS = %Promoteur·rice·s – %Détracteur·rice·s.</li>
        </ul>
      </div>
    </div>
  );
}

function Survey({ campaigns, onSubmitResponse }){
  const { path, params } = hashRoute();
  const parts = path.split("/");
  const campaignId = parts[1] || "";
  const campaign = campaigns.find(c => c.id === campaignId);
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState(params.email || "");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { window.scrollTo(0,0); }, []);
  if (!campaign || !campaign.isActive) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Sondage introuvable</h1>
          <p className="text-gray-600">Ce lien n’est pas valide ou la campagne est inactive.</p>
          <div className="mt-4"><Button onClick={()=>setRoute("")}>Retour au tableau de bord</Button></div>
        </Card>
      </div>
    );
  }
  const accent = campaign.accentHex || "#2563eb";
  async function handleSubmit(){
    if (score == null) return alert("Choisis une note de 0 à 10");
    const payload = {
      id: uid(), tsISO: new Date().toISOString(), campaignId: campaign.id,
      score: Number(score), comment: comment?.trim() || "", email: email?.trim() || "",
      meta: { ua: navigator.userAgent, lang: navigator.language }, routeParams: params,
    };
    onSubmitResponse(payload); setSubmitted(true);
    if (campaign.webhookUrl) {
      try { await fetch(campaign.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), mode: "no-cors" }); } catch {}
    }
    const s = Number(score);
    let url = s >= 9 ? campaign.promoterUrl : s >= 7 ? campaign.passiveUrl : campaign.detractorUrl;
    if (url) { const u = new URL(url, window.location.origin); u.searchParams.set("score", String(s)); if (email) u.searchParams.set("email", email); Object.entries(params).forEach(([k,v]) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); }); window.location.href = u.toString(); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f8fafc" }}>
      <Card className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-8 rounded" style={{ background: accent }} />
          <div><div className="text-xs uppercase tracking-wider text-gray-500">Sondage NPS</div><h1 className="text-xl font-semibold">{campaign.brandName}</h1></div>
        </div>
        <p className="mb-4">Sur une échelle de 0 à 10, dans quelle mesure recommanderais-tu {campaign.brandName} à une personne de ton entourage&nbsp;?</p>
        <div className="grid grid-cols-11 gap-2 mb-2">
          {Array.from({length: 11}, (_,i)=>i).map(n => (
            <button key={n} onClick={()=>setScore(n)} className={classNames("rounded-xl border px-3 py-2 text-sm", score === n ? "ring-2" : "hover:bg-gray-50")} style={score===n ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}33` } : {}}>{n}</button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4"><span>0 – Pas du tout</span><span>10 – Tout à fait</span></div>
        <div className="grid gap-3 mb-4">
          <div><Label>Commentaire (optionnel)</Label><Textarea rows={3} placeholder="Dis-nous ce qui t’a plu ou ce qu’on peut améliorer" value={comment} onChange={e=>setComment(e.target.value)} /></div>
          <div><Label>Courriel (optionnel)</Label><Input type="email" placeholder="nom@exemple.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Ta note: <span className="font-semibold">{score ?? "—"}</span></div>
          <Button className="text-white" style={{ background: accent }} onClick={handleSubmit}>Envoyer</Button>
        </div>
        {submitted && (<div className="mt-3 text-sm text-gray-600">{campaign.thankYou}</div>)}
      </Card>
    </div>
  );
}

export default function App(){
  const [campaigns, setCampaigns] = useLocalArray(STORAGE_KEYS.campaigns, [DEFAULT_CAMPAIGN()]);
  const [responses, setResponses] = useLocalArray(STORAGE_KEYS.responses, []);
  const [route, setRouteState] = useState(hashRoute());
  useEffect(() => { const onHash = () => setRouteState(hashRoute()); window.addEventListener("hashchange", onHash); return () => window.removeEventListener("hashchange", onHash); }, []);
  function onSubmitResponse(r){ setResponses(prev => [r, ...prev]); }
  const isSurvey = route.path.startsWith("survey/");
  return (<div className="min-h-screen bg-gray-50">{isSurvey ? (<Survey campaigns={campaigns} onSubmitResponse={onSubmitResponse} />) : (<Dashboard campaigns={campaigns} setCampaigns={setCampaigns} responses={responses} />)}</div>);
}
