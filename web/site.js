/* Dark Waters Ops site: three tabs (Verdict, 2027, Explore), one department lens, verdict first. */
const H = D.headline, O = D.outlook, SC = O.scenarios, IM = O.impact, TRK = O.tracking;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const C = {red: "#F0575C", amber: "#F2B23C", green: "#43C26B", cyan: "#56C8F0", t2: "#B4C3D2", t3: "#7D92A8", line: "#1C3550", muted: "#4A6178"};
const fmt = n => Number(n).toLocaleString("en-US");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dt = s => { const d = new Date(s + "T00:00:00Z"); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const SITE_URL = "/*SITEURL*/";
echarts.registerMap("world", WORLD);
const charts = [];
function chart(el, opt) {
  const c = echarts.getInstanceByDom(el) || echarts.init(el);
  c.setOption(Object.assign({backgroundColor: "transparent", animationDuration: 600, textStyle: {color: C.t2, fontFamily: "Inter,Segoe UI,sans-serif", fontSize: 13},
    tooltip: {trigger: "axis", backgroundColor: "#0D1E2F", borderColor: C.line, textStyle: {color: "#EEF3F8"}},
    grid: {left: 44, right: 16, top: 30, bottom: 30}}, opt), true);
  if (!charts.includes(c)) charts.push(c);
  return c;
}
const ax = (o = {}) => Object.assign({axisLine: {lineStyle: {color: C.line}}, axisTick: {show: false}, splitLine: {lineStyle: {color: "#122940"}}, axisLabel: {color: C.t3}}, o);
addEventListener("resize", () => charts.forEach(c => c.resize()));
$("#rid").textContent = H.run_id;
$("#analyst").onclick = e => { e.preventDefault(); const a = document.createElement("a"); a.href = SITE_URL + "/?mode=analyst"; a.target = "_top"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); };

/* ------------------------------------------------------------ plain-language content per department */
const S3 = IM[TRK], P = SC[TRK];
const R = {
  ALL: {s: "All departments", f: "The joint picture for the panel", c: "#EEF3F8",
    v: `The Strait stays <em>near-closed through 2027</em>. India must replace its crude, not just store it.`,
    why: `Hormuz traffic is at ${H.latest_pct}% of normal and following the protracted path. In the war zone, ${H.war_dark_rate_nf}% of ships hid from AIS.`,
    n: [[`${H.latest_pct}%`, "of normal Hormuz traffic today", "red"], [`${H.war_dark_rate_nf}%`, "of war-zone ships invisible to AIS", "red"], [`${fmt(S3.crude_to_replace_mn_bbl)} mn bbl`, "crude India must replace in 2027", "amb"]],
    a: [["Now", "Run this dashboard as the weekly chokepoint brief, and fuse radar with AIS."], ["By March 2027", "If traffic is still on the protracted path, activate the joint Hormuz and Bab el-Mandeb plan."], ["Through 2027", `Contract ${S3.sub_for_90}% substitute crude and build a 30-day LPG reserve.`]]},
  HQIDS: {s: "HQ IDS", f: "Joint picture, early warning, two-chokepoint plan", c: "#F2B23C",
    v: `Plan 2027 on a <em>closed Strait</em>. If nothing changes by March, activate the two-chokepoint plan.`,
    why: `Since submission, real traffic has followed our protracted scenario almost exactly, not the reopening one.`,
    n: [[`${Math.round(P.mean_2027)}/day`, "Hormuz ships forecast for 2027 (85 before the war)", "red"], [`${H.latest_pct}%`, "of normal traffic today", "red"], ["90 days", "to a joint Hormuz + Bab el-Mandeb plan (R5)", "amb"]],
    a: [["Now", "Adopt this dashboard as the weekly chokepoint brief (R2)."], ["End of March 2027", "If still on the protracted path, activate the joint Hormuz and Bab el-Mandeb plan (R5)."], ["If traffic passes 40 a day", "Shift to managed passage: escort windows, not convoys."]]},
  NAVY: {s: "Navy", f: "IFC-IOR and Western Naval Command", c: "#56C8F0",
    v: `Trust radar, not AIS. <em>Flag every dark ship over 80 m</em> near the chokepoints.`,
    why: `In the war zone ${H.war_dark_rate_nf}% of non-fishing ships showed no AIS: ${H.odds_ratio} times the odds anywhere else.`,
    n: [[`${H.war_dark_rate_nf}%`, "of war-zone ships dark on AIS", "red"], [`${D.clusters.length}`, "dark anchorages found by radar", "amb"], [`${O.n_risk_cells}`, "sea cells flagged for SAR and ISR", "cya"]],
    a: [["Now", "Fuse SAR with AIS at IFC-IOR; auto-flag dark ships of 80 m+ within 100 km of a chokepoint (R1)."], ["This month", "Task ISR to the three Gulf dark anchorages: Dubai–Jebel Ali, Fujairah, Bandar Abbas (R3)."], ["Through 2027", "Allocate escorts by the Threat-Opacity Index, refreshed monthly (R3)."]]},
  ISRO: {s: "ISRO", f: "Satellite tasking", c: "#A78BFA",
    v: `Point SAR at the <em>${O.n_risk_cells} sea cells</em> the model flags, before anyone asks.`,
    why: `The model finds dark-ship hotspots on seas it has never seen (AUC ${H.model_auc}, where 1.0 is perfect and 0.5 is a coin toss).`,
    n: [[`${O.n_risk_cells}`, "very-high-risk sea cells, W. Indian Ocean", "cya"], [`${H.model_auc}`, "model score on unseen seas (AUC)", "grn"], [`${H.war_dark_rate_nf}%`, "of war-zone ships only radar can see", "red"]],
    a: [["Now", "Standing SAR tasking over the flagged cells; pass detections to IFC-IOR (R1)."], ["If no change by March 2027", "Add Bab el-Mandeb and the Gulf of Aden to standing tasking."], ["Always", "Detections to the Navy in hours, not days."]]},
  DIA: {s: "DIA", f: "Defence Intelligence Agency", c: "#F0575C",
    v: `Watch the ships, not the strikes. <em>Traffic warned months early</em>; strike counts did not.`,
    why: `Hormuz traffic fell a third from November 2025. Gulf strike counts stayed near zero until the week of the attack.`,
    n: [["−33%", "Hormuz traffic before the war began", "amb"], ["~0", "strike warning in the Gulf", "red"], ["4", "signals to watch every week", "cya"]],
    a: [["Now", "Track four signals weekly: transits, dark rate, war-risk premium, GPS jamming (R2)."], ["Warning sign", "Hormuz traffic down 30% over 8 weeks while dark rates rise."], ["If it reopens", "Watch for relapse: dark rate rising while traffic recovers."]]},
  MOPNG: {s: "MoPNG / ISPRL", f: "Energy security and the strategic reserve", c: "#43C26B",
    v: `Contract <em>${S3.sub_for_90}% substitute crude</em> and a 30-day LPG reserve for 2027.`,
    why: `On the current path India must replace ${fmt(S3.crude_to_replace_mn_bbl)} million barrels of crude in 2027. The reserve alone lasts ${S3.spr_days_0} days.`,
    n: [[`${fmt(S3.crude_to_replace_mn_bbl)} mn bbl`, "crude to replace in 2027", "amb"], [`${S3.spr_days_0} days`, "reserve cover with no substitute", "red"], [`${S3.lpg_at_risk_pct}%`, "of LPG imports at risk", "red"]],
    a: [["Now", `Plan 2027 supply on the protracted path; the reserve alone covers ${S3.spr_days_0} days (R4).`], ["Target", `Contract ${S3.sub_for_90}% substitution so the reserve lasts 90 days; LPG reserve of 30 days (R4).`], ["Even if it reopens", `${IM.S1.crude_at_risk_pct}% of crude imports stay exposed: keep SPR Phase-II on schedule.`]]},
  MEA: {s: "MEA", f: "Diplomacy, passage and supply deals", c: "#2BB3A3",
    v: `Secure <em>passage and non-Gulf supply</em> now. The Strait will not reopen on its own.`,
    why: `Seven weeks of new data follow the protracted path. Reopening needs a deal.`,
    n: [[`${Math.round(P.mean_2027)}/day`, "Hormuz ships forecast for 2027", "red"], [`${fmt(S3.crude_to_replace_mn_bbl)} mn bbl`, "crude to source elsewhere", "amb"], ["2", "chokepoints at risk together", "red"]],
    a: [["Now", "Pursue assured passage for Indian-flag and India-bound ships (R5)."], ["If no change by March 2027", "Lock in crude and LPG from the Americas, West Africa and Russia."], ["Always", "Coordinate the Red Sea route: Gulf bypass pipelines exit through Bab el-Mandeb."]]},
  DGS: {s: "DG Shipping", f: "Indian-flag merchant fleet", c: "#F59E0B",
    v: `Warn Indian ships: <em>GPS and AIS cannot be trusted</em> in the Gulf. Fit NavIC.`,
    why: `1,100 to 1,650 vessels were hit by GPS and AIS interference; ${H.war_dark_rate_nf}% of war-zone ships ran dark.`,
    n: [["1,100+", "ships hit by GPS/AIS jamming in a day", "red"], [`${H.war_dark_rate_nf}%`, "of war-zone ships dark", "red"], ["6 months", "to NavIC receivers (R6)", "amb"]],
    a: [["Now", "Issue Gulf advisories and make GPS-interference reporting mandatory (R6)."], ["Within 6 months", "NavIC-capable receivers on Indian-flag Gulf traders (R6)."], ["If managed passage", "Brief masters on toll and inspection corridors."]]},
};
const ORDER = ["HQIDS", "NAVY", "ISRO", "DIA", "MOPNG", "MEA", "DGS"];
let ROLE = null;
try { ROLE = sessionStorage.getItem("dw-dept"); } catch {}
if (ROLE && !R[ROLE]) ROLE = null;

function gate() {
  $("#gateIn").innerHTML = `<div class="kick">Dark Waters · chokepoint early warning</div><h1>Who is reading?</h1>
    <p>Pick your department. You will see one verdict, your numbers and your actions. You can switch at any time.</p>
    <div class="gg"><button class="gc all" data-d="ALL"><span class="s">All departments</span><span class="f">The joint picture, for the panel</span></button>
    ${ORDER.map(k => `<button class="gc" data-d="${k}" style="--rc:${R[k].c}"><div class="s">${R[k].s}</div><div class="f">${R[k].f}</div></button>`).join("")}</div>`;
  $("#gate").classList.add("on");
  $$(".gc").forEach(b => b.onclick = () => { ROLE = b.dataset.d; try { sessionStorage.setItem("dw-dept", ROLE); } catch {} $("#gate").classList.remove("on"); render(); });
}
$("#who").onclick = gate;

/* ------------------------------------------------------------ tabs */
let TAB = "verdict";
function go(v) {
  TAB = v;
  $$(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  render(); scrollTo(0, 0);
}
$$(".tabs button").forEach(b => b.onclick = () => go(b.dataset.v));

function render() {
  const r = R[ROLE || "ALL"];
  document.documentElement.style.setProperty("--rc", r.c);
  $("#who").innerHTML = innerWidth < 700 ? `<b>${r.s}</b> ▾` : `Viewing as <b>${r.s}</b> ▾`;
  ({verdict: verdict, y2027: outlook, explore: explore})[TAB](r);
  setTimeout(() => charts.forEach(c => c.resize()), 40);
}

/* ------------------------------------------------------------ 1 VERDICT */
const HZ = D.hormuz, P27 = D.paths2027;
function trafficChart(el, all) {
  const act = HZ.filter(x => x[0] >= "2025-10-01"), n = act.length;
  const days = act.map(x => x[0]).concat(P27.map(x => x[0]));
  const ks = all ? ["S1", "S2", "S3"] : [TRK], col = {S1: C.green, S2: C.cyan, S3: C.red};
  const narrow = innerWidth < 700;
  return chart(el, {legend: {show: !narrow, top: 0, right: 0, textStyle: {color: C.t2}, itemWidth: 18},
    xAxis: ax({type: "category", data: days, axisLabel: {color: C.t3, formatter: v => { const d = new Date(v + "T00:00:00Z"); return d.getUTCDate() <= 1 && d.getUTCMonth() % (narrow ? 6 : 3) === 0 ? `${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : ""; }, interval: 0}}),
    yAxis: ax({type: "value", max: 120, interval: 20, name: "ships/day", nameTextStyle: {color: C.t3}}),
    series: [{name: "Actual", type: "line", showSymbol: false, data: act.map(x => x[3]), lineStyle: {width: 3, color: C.amber}, itemStyle: {color: C.amber},
      markLine: {symbol: "none", silent: true, data: [{xAxis: "2026-02-28", lineStyle: {color: C.red, type: "dashed"}, label: {formatter: "War", color: C.red}},
        {yAxis: 85, lineStyle: {color: C.muted, type: "dotted"}, label: {formatter: "Normal ~85", color: C.t3, position: "insideEndTop"}}]}},
      ...ks.map(k => ({name: all ? `${k} ${SC[k].name}` : "Forecast 2027", type: "line", showSymbol: false, data: Array(n).fill(null).concat(P27.map(x => x[["S1", "S2", "S3"].indexOf(k) + 1])),
        lineStyle: {type: "dashed", width: k === TRK ? 3 : 2, color: col[k]}, itemStyle: {color: col[k]}}))]});
}
function verdict(r) {
  $("#v-verdict").innerHTML = `<div class="kick">Verdict for <b>${r.s}</b> · data to ${dt(H.update_end)}</div>
    <div class="verdict">${r.v}</div><p class="why">${r.why}</p>
    <div class="nums">${r.n.map(x => `<div class="num"><div class="v ${x[2]}">${x[0]}</div><div class="l">${x[1]}</div></div>`).join("")}</div>
    <h2>What ${r === R.ALL ? "India should do" : "you do"}</h2><p class="sub">${r === R.ALL ? "The six recommendations in three moves." : "Your part of the six recommendations."}</p>
    <div class="do">${r.a.map((a, i) => `<div class="act ${i ? "" : "now"}"><div class="w">${a[0]}</div><div class="t">${a[1]}</div></div>`).join("")}</div>
    <div class="card"><h2 style="font-size:22px">Hormuz traffic, and where it is heading</h2><p class="sub" style="margin:0">Ships per day. Dashed line: our 2027 forecast on the path the data follow.</p>
    <div class="chart" id="vChart"></div>
    <details><summary>How do we know?</summary><ul>
      <li>Traffic: IMF PortWatch daily transits; fall of ${H.its_drop}% measured with an interrupted time series (95% range ${H.its_ci[0]}–${H.its_ci[1]}%).</li>
      <li>Dark ships: ${fmt(H.sar_detections)} Sentinel-1 radar detections from CDM, matched to AIS. Holds after controls for ship size and location.</li>
      <li>2027: our three submitted scenarios, restarted from today's level. The data match the protracted one best. A range, not a prediction.</li></ul></details></div>`;
  trafficChart($("#vChart"), false);
}

/* ------------------------------------------------------------ 2 2027: forecast -> impact -> actions */
let SCN = TRK;
function outlook(r) {
  const I = IM[SCN];
  $("#v-y2027").innerHTML = `<div class="kick">2027 outlook · forecast, then impact, then actions</div>
    <div class="verdict" style="font-size:clamp(30px,4vw,46px)">2027 looks like <em>a closed Strait</em>. India's answer is supply, not storage.</div>
    <p class="why">A range built from our scenarios and today's data, not a promise. The dashboard shows which path we are on each week.</p>
    <div class="step"><div class="n">1</div><div><div class="kick">Forecast</div>
      <h3>Hormuz averages <em>${Math.round(P.mean_2027)} ships a day</em> in 2027, about a sixth of normal.</h3>
      <div class="card"><div class="chart" id="oChart"></div><div class="note">Since submission the data follow S3 (${SC.S3.name}). Reopening (S1) would mean ${Math.round(SC.S1.mean_2027)} a day; managed passage (S2) ${Math.round(SC.S2.mean_2027)}.</div></div></div></div>
    <div class="step"><div class="n">2</div><div><div class="kick">Impact on India</div>
      <h3>India must replace <em>${fmt(I.crude_to_replace_mn_bbl)} million barrels</em> of crude in 2027.</h3>
      <div class="pills">${["S1", "S2", "S3"].map(k => `<button data-s="${k}" class="${k === SCN ? "on" : ""}">${k === "S1" ? "If it reopens" : k === "S2" ? "Managed passage" : "Current path"}</button>`).join("")}</div>
      <div class="grid4">
        <div class="num"><div class="v amb">${fmt(I.crude_to_replace_mn_bbl)}</div><div class="l">million barrels of crude to replace</div></div>
        <div class="num"><div class="v ${I.spr_days_0 < 30 ? "red" : "amb"}">${I.spr_days_0}–${I.spr_days_50} d</div><div class="l">reserve cover, with 0–50% substitute</div></div>
        <div class="num"><div class="v amb">${I.sub_for_90}%</div><div class="l">substitute needed for 90 days</div></div>
        <div class="num"><div class="v ${I.lpg_at_risk_pct > 40 ? "red" : "amb"}">${I.lpg_at_risk_pct}%</div><div class="l">of LPG imports at risk</div></div></div>
      <div class="note">Hormuz carries ${H.india_share_crude}% of India's crude, ${H.india_share_lng}% of LNG and ${H.india_share_lpg}% of LPG. Reserve 39 million barrels.</div></div></div>
    <div class="step"><div class="n">3</div><div><div class="kick">India's actions</div>
      <h3>Seven departments, <em>one move each, now</em>.</h3>
      <div class="who-does">${ORDER.map(k => `<div class="wd ${ROLE === k ? "me" : ""}" style="--rc:${R[k].c}"><div class="d">${R[k].s.toUpperCase()}</div><div class="t">${R[k].a[0][1]}</div></div>`).join("")}</div></div></div>`;
  trafficChart($("#oChart"), true);
  $$("#v-y2027 .pills button").forEach(b => b.onclick = () => { SCN = b.dataset.s; const y = scrollY; outlook(r); scrollTo(0, y); });
}

/* ------------------------------------------------------------ 3 EXPLORE: map, where, what-if */
let XS = TRK, SUB = 50;
function explore(r) {
  $("#v-explore").innerHTML = `<div class="kick">Explore</div><div class="verdict" style="font-size:clamp(28px,3.6vw,40px)">See it for yourself.</div>
    <div class="ex"><div class="card"><h2 style="font-size:22px">Where ships went dark</h2><p class="sub" style="margin:0">Red: ships radar saw but AIS did not (80 m+, 1–14 Mar 2026). Rings: dark anchorages.</p>
      <div class="chart map" id="xMap"></div></div>
      <div style="display:grid;gap:16px;align-content:start">
        <div class="card"><h2 style="font-size:22px">Dark rate by sea area</h2><div class="chart" id="xZone" style="height:250px"></div></div>
        <div class="card"><h2 style="font-size:22px">How long does the reserve last?</h2>
          <div class="pills" style="margin-top:8px">${["S1", "S2", "S3"].map(k => `<button data-s="${k}" class="${k === XS ? "on" : ""}">${k === "S1" ? "Reopens" : k === "S2" ? "Managed" : "Current path"}</button>`).join("")}</div>
          <div class="slider"><label>Lost crude replaced by other suppliers <b id="subV">${SUB}%</b></label><input type="range" id="sub" min="0" max="100" step="5" value="${SUB}"></div>
          <div class="big-out" id="days"></div><div class="l" id="daysL" style="color:var(--t2)"></div></div></div></div>`;
  const RC = O.risk_cells;
  chart($("#xMap"), {tooltip: {trigger: "item", backgroundColor: "#0D1E2F", borderColor: C.line, textStyle: {color: "#EEF3F8"}},
    geo: {map: "world", roam: true, center: [55, 15], zoom: 3.2, layoutCenter: ["50%", "50%"], layoutSize: "160%", itemStyle: {areaColor: "#16304A", borderColor: "#2F5276", borderWidth: .7}, emphasis: {disabled: true}},
    series: [{type: "scatter", coordinateSystem: "geo", data: D.dark_pts, symbolSize: 3.5, itemStyle: {color: C.red, opacity: .8}, silent: true},
      {type: "effectScatter", coordinateSystem: "geo", data: D.clusters.map(c => ({value: [c[3], c[2], c[1]], c})), symbolSize: v => Math.min(24, Math.max(7, Math.sqrt(v[2]) * 0.9)),
       rippleEffect: {scale: 1.8, brushType: "stroke"}, itemStyle: {color: C.amber},
       tooltip: {formatter: p => `<b>Dark anchorage near ${p.data.c[5]}</b><br>${p.data.c[1]} dark ships · median ${Math.round(p.data.c[4])} m`}},
      ...(["NAVY", "ISRO"].includes(ROLE) ? [{type: "scatter", coordinateSystem: "geo", symbol: "rect", data: RC.map(x => ({value: [x[0], x[1]], x})), symbolSize: 9,
        itemStyle: {color: "rgba(167,139,250,.22)", borderColor: "#A78BFA"}, tooltip: {formatter: p => `<b>Flagged for SAR</b><br>${p.data.x[3]} · chance dark ${Math.round(p.data.x[2] * 100)}%`}}] : [])]});
  const z = D.zones.filter(x => x[2] >= 150).sort((a, b) => b[3] - a[3]).slice(0, 7).reverse();
  chart($("#xZone"), {grid: {left: 130, right: 46, top: 6, bottom: 6}, tooltip: {show: false}, xAxis: ax({type: "value", max: 80, show: false}),
    yAxis: ax({type: "category", data: z.map(x => x[0].replace("Strait of ", "")), axisLine: {show: false}, axisLabel: {color: C.t2}}),
    series: [{type: "bar", barWidth: 16, data: z.map(x => ({value: Math.round(x[3] * 100), itemStyle: {borderRadius: 4, color: ["Strait of Hormuz", "Gulf of Oman", "Persian Gulf"].includes(x[0]) ? C.red : C.muted}})),
      label: {show: true, position: "right", color: C.t2, formatter: "{c}%"}}]});
  const upd = () => {
    const ret = IM[XS].retained_pct / 100, gap = H.hormuz_crude_mbd * (1 - ret) * (1 - SUB / 100), d = gap > 0 ? H.spr_mb / gap : Infinity;
    $("#subV").textContent = SUB + "%";
    $("#days").innerHTML = isFinite(d) && d < 1000 ? `${Math.round(d)} <span style="font-size:24px;color:var(--t2)">days</span>` : "No gap";
    $("#days").className = "big-out " + (d < 30 ? "red" : d < 90 ? "amb" : "grn");
    $("#daysL").textContent = d < 90 ? `Short of the 90-day goal. Replace ${IM[XS].sub_for_90}% to reach it.` : "Meets the 90-day goal.";
  };
  $("#sub").oninput = e => { SUB = +e.target.value; upd(); };
  $$("#v-explore .pills button").forEach(b => b.onclick = () => { XS = b.dataset.s; $$("#v-explore .pills button").forEach(x => x.classList.toggle("on", x === b)); upd(); });
  upd();
}

render();
if (!ROLE) gate();
