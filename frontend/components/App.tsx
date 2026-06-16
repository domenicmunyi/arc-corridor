"use client";
/* Arc Corridor — remittance corridor quote. Layout: TOP-NAV + lưới THẺ TUYẾN (flag→flag) + panel quote,
   coral, KHÔNG sidebar — khác các trang khác. + nút mạng luôn hiện.
   ABI preserved: setRate(pair,bps)/rateOf(pair)/convert(pair)payable/owner/total. */
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
const C = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0") as `0x${string}`;
const CHAIN = 5042002, HEX = "0x4CEF52";
const ABI = [
  { name: "setRate", type: "function", stateMutability: "nonpayable", inputs: [{ name: "pair", type: "string" }, { name: "bps", type: "uint256" }], outputs: [] },
  { name: "rateOf", type: "function", stateMutability: "view", inputs: [{ name: "pair", type: "string" }], outputs: [{ type: "uint256" }] },
  { name: "convert", type: "function", stateMutability: "payable", inputs: [{ name: "pair", type: "string" }], outputs: [{ type: "uint256" }] },
  { name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;
const cut = (a?: string) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
const COR = [{ p: "US/MX", f: "🇺🇸", t: "🇲🇽", n: "United States → Mexico" }, { p: "US/IN", f: "🇺🇸", t: "🇮🇳", n: "United States → India" }, { p: "UK/NG", f: "🇬🇧", t: "🇳🇬", n: "United Kingdom → Nigeria" }, { p: "EU/PH", f: "🇪🇺", t: "🇵🇭", n: "Europe → Philippines" }];
async function toArc() { const e = (window as any).ethereum; if (!e) return; try { await e.request({ method: "wallet_addEthereumChain", params: [{ chainId: HEX, chainName: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: ["https://rpc.testnet.arc.network"], blockExplorerUrls: ["https://testnet.arcscan.app"] }] }); } catch { try { await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEX }] }); } catch {} } }
const CSS = `
.cr{--bg:#1a0f0a;--card:#241510;--card2:#2e1a12;--bd:#432414;--bd2:#5a3420;--mut:#d39a72;--txt:#ffeede;--acc:#f97316;--acc2:#fb923c;min-height:100vh;background:radial-gradient(700px 360px at 80% -10%,rgba(249,115,22,.16),transparent),var(--bg);color:var(--txt);font-family:'Sora','Segoe UI',system-ui,sans-serif}
.cr *{box-sizing:border-box}.cr a{color:var(--acc2);text-decoration:none}
.cr header{display:flex;align-items:center;gap:14px;padding:13px 22px;border-bottom:1px solid var(--bd)}
.cr .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:16px;color:#fff}
.cr .mark{width:31px;height:31px;border-radius:9px;background:linear-gradient(135deg,#f97316,#fb923c);display:grid;place-items:center;font-size:15px}
.cr .tabs{display:flex;gap:4px;background:var(--card);border:1px solid var(--bd);border-radius:11px;padding:4px;margin-left:6px}
.cr .tab{border:0;background:none;color:var(--mut);font:inherit;font-weight:600;font-size:13px;padding:7px 15px;border-radius:8px;cursor:pointer}.cr .tab.on{background:var(--acc);color:#2a1404;font-weight:700}
.cr .btn{border:0;border-radius:9px;font:inherit;font-weight:700;cursor:pointer;padding:9px 15px;transition:.15s}.cr .btn:disabled{opacity:.5;cursor:not-allowed}
.cr .pri{background:var(--acc);color:#2a1404}.cr .pri:hover:not(:disabled){background:var(--acc2)}.cr .gho{background:var(--card2);color:var(--txt);border:1px solid var(--bd2)}.cr .red{background:#dc2626;color:#fff}
.cr .wrap{max-width:920px;margin:0 auto;padding:22px 22px 50px}
.cr .grid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
.cr .lane{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;cursor:pointer;transition:.15s;margin-bottom:12px}
.cr .lane:hover{border-color:var(--acc)}.cr .lane.on{border-color:var(--acc);background:linear-gradient(180deg,#2e1a12,#241510)}
.cr .route{display:flex;align-items:center;gap:12px}
.cr .dash{flex:1;height:0;border-top:2px dashed var(--bd2);position:relative}.cr .dash::after{content:"🛫";position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:14px}
.cr .card{background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px;position:sticky;top:18px}
.cr label{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;margin:8px 0 5px}
.cr input{width:100%;background:var(--bg);border:1px solid var(--bd2);border-radius:10px;padding:11px 13px;font:inherit;font-size:14px;color:var(--txt);outline:none}.cr input:focus{border-color:var(--acc)}
.cr .out{background:linear-gradient(135deg,#f97316,#fb923c);border-radius:14px;padding:14px;margin:12px 0;color:#2a1404}
.cr .menu{position:absolute;right:0;top:116%;background:var(--card2);border:1px solid var(--bd2);border-radius:11px;padding:6px;min-width:180px;z-index:30;box-shadow:0 14px 34px rgba(0,0,0,.5)}
.cr .menu button{display:block;width:100%;text-align:left;background:none;border:0;color:var(--txt);font:inherit;font-weight:600;font-size:13px;padding:8px 11px;border-radius:7px;cursor:pointer}.cr .menu button:hover{background:rgba(255,255,255,.05)}
@media(max-width:780px){.cr .grid{grid-template-columns:1fr}.cr .card{position:static}.cr .tabs{flex-wrap:wrap}}
`;
function Lane({ c, on, onPick }: { c: typeof COR[number]; on: boolean; onPick: () => void }) {
  const r = useReadContract({ address: C, abi: ABI, functionName: "rateOf", args: [c.p] });
  const bps = r.data !== undefined ? Number(r.data) : 0;
  return (
    <div className={"lane" + (on ? " on" : "")} onClick={onPick}>
      <div className="route"><span style={{ fontSize: 26 }}>{c.f}</span><span className="dash" /><span style={{ fontSize: 26 }}>{c.t}</span>
        <div style={{ textAlign: "right", minWidth: 84 }}><div style={{ fontWeight: 800, color: "var(--acc2)", fontFamily: "ui-monospace" }}>{bps > 0 ? (bps / 10000).toFixed(2) : "—"}</div><div style={{ fontSize: 11, color: "var(--mut)" }}>{c.p}</div></div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 8 }}>{c.n}</div>
    </div>
  );
}
export default function App() {
  const { address, isConnected } = useAccount(); const net = useChainId();
  const { connectors, connect } = useConnect(); const { disconnect } = useDisconnect();
  const [pop, setPop] = useState(false); const [tab, setTab] = useState<"corridors" | "send">("corridors");
  const [pair, setPair] = useState("US/MX"); const [amt, setAmt] = useState("");
  const [sr, setSr] = useState({ pair: "US/MX", rate: "170500" });
  const tx = useWriteContract(); const rcpt = useWaitForTransactionReceipt({ hash: tx.data, query: { enabled: !!tx.data } });
  const busy = tx.isPending || rcpt.isLoading;
  useEffect(() => { if (rcpt.isSuccess) { tx.reset(); setAmt(""); } }, [rcpt.isSuccess]); // eslint-disable-line
  const rate = useReadContract({ address: C, abi: ABI, functionName: "rateOf", args: [pair] });
  const owner = useReadContract({ address: C, abi: ABI, functionName: "owner" });
  const wrong = isConnected && net !== CHAIN; const bps = rate.data !== undefined ? Number(rate.data) : 0;
  const recv = bps > 0 && Number(amt) > 0 ? (Number(amt) * bps / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0";
  const isOwner = address && owner.data && (owner.data as string).toLowerCase() === address.toLowerCase();
  const cor = COR.find(c => c.p === pair);
  return (
    <div className="cr">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header>
        <div className="logo"><span className="mark">🛫</span>Arc Corridor</div>
        <div className="tabs">{([["corridors", "Corridors"], ["send", "Send abroad"]] as const).map(([t, l]) => <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{l}</button>)}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <button className={"btn " + (wrong ? "red" : "gho")} onClick={toArc}>{wrong ? "Switch to Arc" : "⚡ Arc network"}</button>
          <div style={{ position: "relative" }}><button className="btn pri" onClick={() => setPop(p => !p)}>{isConnected ? cut(address) : "Connect"}</button>
            {pop && <div className="menu">{isConnected ? <button onClick={() => { disconnect(); setPop(false); }} style={{ color: "#f87171" }}>Disconnect</button> : connectors.map(c => <button key={c.uid} onClick={() => { connect({ connector: c }); setPop(false); }}>{c.name}</button>)}</div>}</div>
        </div>
      </header>
      <div className="wrap">
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Remittance corridors</div>
        <div style={{ color: "var(--mut)", fontSize: 14, marginBottom: 16 }}>Pick a corridor and send USDC at the locked on-chain rate.</div>
        <div className="grid">
          <div>{COR.map(c => <Lane key={c.p} c={c} on={c.p === pair} onPick={() => { setPair(c.p); setSr(s => ({ ...s, pair: c.p })); setTab("send"); }} />)}</div>
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Send on {pair}</div>
            <div style={{ fontSize: 12.5, color: "var(--mut)", marginBottom: 8 }}>{cor?.n}</div>
            <label>You send (USDC)</label><input value={amt} onChange={e => setAmt(e.target.value)} type="number" placeholder="0.00" />
            <div className="out"><div style={{ fontSize: 12, opacity: .9 }}>Recipient gets</div><div style={{ fontSize: 26, fontWeight: 800 }}>{recv}</div><div style={{ fontSize: 11, opacity: .9 }}>{bps > 0 ? `rate ${(bps / 10000).toFixed(2)}` : "no rate"}</div></div>
            <button className="btn pri" style={{ width: "100%" }} disabled={!isConnected || busy || !(Number(amt) > 0) || !bps} onClick={() => tx.writeContract({ address: C, abi: ABI, functionName: "convert", args: [pair], value: parseEther(amt || "0") })}>{busy ? "Sending…" : "Send through corridor 🛫"}</button>
            {isOwner && <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--bd)" }}>
              <label>Owner · set rate (bps)</label>
              <div style={{ display: "flex", gap: 6 }}><select style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--bd2)", borderRadius: 10, padding: "10px 12px", color: "var(--txt)" }} value={sr.pair} onChange={e => setSr(s => ({ ...s, pair: e.target.value }))}>{COR.map(c => <option key={c.p} value={c.p}>{c.p}</option>)}</select><input style={{ width: 92 }} value={sr.rate} onChange={e => setSr(s => ({ ...s, rate: e.target.value }))} type="number" /><button className="btn pri" disabled={busy || !(Number(sr.rate) > 0)} onClick={() => tx.writeContract({ address: C, abi: ABI, functionName: "setRate", args: [sr.pair, BigInt(sr.rate || "0")] })}>Set</button></div>
            </div>}
          </div>
        </div>
        <div style={{ textAlign: "center", color: "#7a4f36", fontSize: 12, marginTop: 22 }}>Built on <a href="https://arc.network" target="_blank" rel="noopener noreferrer">Arc Network</a></div>
      </div>
    </div>
  );
}
