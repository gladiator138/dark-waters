const H = D.headline, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const C = {red:"#E5484D", amber:"#F0B03A", green:"#3FB950", cyan:"#4FC3F7", t2:"#AFC0D0", t3:"#7F93A8", line:"#1E3A55", muted:"#5D7186"};
const fmt = n => n.toLocaleString("en-US");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dt = s => { const d = new Date(s + "T00:00:00Z"); return `${String(d.getUTCDate()).padStart(2, "0")} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const SITE_URL = "/*SITEURL*/";
const O = D.outlook;
echarts.registerMap("world", WORLD);
const charts = [];
function chart(el, opt) {
  const c = echarts.getInstanceByDom(el) || echarts.init(el, null, {renderer: "canvas"});
  c.setOption(Object.assign({backgroundColor: "transparent", textStyle: {color: C.t2, fontFamily: "Inter,Segoe UI,sans-serif"},
    tooltip: {trigger: "axis", backgroundColor: "#0C1C2C", borderColor: C.line, textStyle: {color: "#E6EDF4"}},
    grid: {left: 48, right: 18, top: 36, bottom: 32}}, opt), true);
  if (!charts.includes(c)) charts.push(c);
  return c;
}
const ax = (o = {}) => Object.assign({axisLine: {lineStyle: {color: C.line}}, splitLine: {lineStyle: {color: "#10243A"}}, axisLabel: {color: C.t3}}, o);
addEventListener("resize", () => charts.forEach(c => c.resize()));
$("#rid").textContent = H.run_id;
$$(".upd-date").forEach(e => e.textContent = dt(H.update_end));

/* -------------------------------------------------- drawer (evidence sheet) */
function drawer(title, rows, note) {
  $("#dbody").innerHTML = `<div class="kick">Evidence</div><h2>${title}</h2><dl>${rows.map(r => `<dt>${r[0]}</dt><dd style="margin:0">${r[1]}</dd>`).join("")}</dl>` +
    (note ? `<div class="bluf" style="font-size:15px"><b>SO WHAT</b>${note}</div>` : "");
  $("#drawer").classList.add("on");
}
$("#dx").onclick = () => $("#drawer").classList.remove("on");

/* -------------------------------------------------- views */
function go(v) {
  $$(".nav button[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  setTimeout(() => charts.forEach(c => c.resize()), 30);
  if (v === "brief") reveal();
  if (v === "out") drawOutlook();
  scrollTo(0, 0);
}
$$(".nav button[data-v]").forEach(b => b.onclick = () => go(b.dataset.v));
$("#analyst").onclick = () => { const a = document.createElement("a"); a.href = SITE_URL + "/?mode=analyst"; a.target = "_top"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); };
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "1") go("cmd"); if (e.key === "2") go("out"); if (e.key === "3") go("brief"); if (e.key === "4") go("con");
  if (e.key.toLowerCase() === "v") openGate();
  if (e.key === "Escape") $("#drawer").classList.remove("on");
  if (e.key.toLowerCase() === "p") pres();
});
let tmr = null;
function pres() {
  document.body.classList.toggle("pres");
  clearInterval(tmr);
  if (document.body.classList.contains("pres")) {
    let s = 900; tmr = setInterval(() => { s--; $("#timer").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; if (s <= 0) clearInterval(tmr); }, 1000);
  }
  setTimeout(() => charts.forEach(c => c.resize()), 50);
}
setInterval(() => { $("#clock").textContent = new Date().toISOString().slice(11, 16) + "Z"; }, 1000);

/* -------------------------------------------------- commander */
const pctNow = H.latest_pct;
const TILES = [
  {cls: "R", l: "Hormuz flow", v: `${pctNow}%`, s: `of pre-war · ${H.latest_ma7} ships/day (7-day) vs ${Math.round(H.hormuz_baseline)}`,
   ev: () => drawer("Strait of Hormuz traffic", [["Source", "IMF PortWatch daily transits (AIS-based)"], ["Baseline", `${H.hormuz_baseline} ships/day, 30 Mar 2025 – 27 Feb 2026`],
     ["First 72 h", `${H.hormuz_28feb} on 28 Feb → ${H.hormuz_1mar} on 1 Mar → ${H.hormuz_2mar} on 2 Mar`], ["Method", `Interrupted time series, negative binomial, HAC errors: −${H.its_drop}% (95% CI ${H.its_ci[0]}–${H.its_ci[1]}%)`],
     ["Lost voyages", `${fmt(H.missing_to_update)} to ${dt(H.update_end)} (${fmt(H.missing_to_20sep)} at submission); ${fmt(H.missing_tanker_to_update)} tankers`],
     ["Since submission", `${H.since_sub_mean} ships/day (${H.since_sub_pct}% of pre-war), 21 Sep – ${dt(H.update_end)}`]], "Plan for a near-closed Strait for a season, not a fortnight.")},
  {cls: "R", l: "War-zone ships dark", v: `${H.war_dark_rate_nf}%`, s: `non-fishing, no AIS · ${H.row_dark_rate_nf}% rest of world`,
   ev: () => drawer("Dark vessels: radar vs AIS", [["Source", `CDM Sentinel-1 detections, ${fmt(H.sar_detections)} worldwide, 1–14 Mar 2026`], ["War zone", "Strait of Hormuz, Gulf of Oman, Persian Gulf"],
     ["Dark", `${fmt(H.war_dark_nf)} of ${fmt(H.war_nonfishing)} non-fishing ships had no matching AIS`], ["Odds ratio", `${H.odds_ratio}× (95% CI ${H.or_ci[0]}–${H.or_ci[1]}); ${H.rate_ratio}× the rate`],
     ["Escalation", `Same 1° cell, fixed effects: OR ${H.fe_or_per_day} per day (95% CI ${H.fe_ci[0]}–${H.fe_ci[1]})`], ["Large ships", `${H.hormuz_large_dark_rate}% of ships over 100 m in the Strait were dark`]],
     "AIS degraded exactly where and when it mattered. The picture must be radar-verified.")},
  {cls: "A", l: "India SPR cover", v: `${H.spr_5_0}–${H.spr_5_50} d`, s: `at 5% retained flow, 0–50% substitution · ${H.req_sub_90}% needed for 90 d`,
   ev: () => { go("con"); pane("spr"); }},
  {cls: "R", l: "Most opaque chokepoint", v: "Hormuz", s: `Threat-Opacity Index ${D.ctoi[0][3]} / 100 · top 3 all Gulf`,
   ev: () => { go("con"); pane("ctoi"); }},
];
$("#tiles").innerHTML = TILES.map((t, i) => `<div class="tile ${t.cls}" data-i="${i}"><div class="l">${t.l}<span class="rag">${{R: "RED", A: "AMBER", G: "GREEN"}[t.cls]}</span></div><div class="v">${t.v}</div><div class="s">${t.s}</div></div>`).join("");
$$(".tile[data-i]").forEach(e => e.onclick = () => TILES[+e.dataset.i].ev());
$("#bluf").innerHTML = `<b>BLUF</b>Hormuz traffic fell ~90% in 72 hours and is still at ${pctNow}% of normal. In the war zone ${H.war_dark_rate_nf}% of ships showed no AIS (${H.odds_ratio}× the odds elsewhere). ` +
  `India's reserve buys ${H.spr_5_0}–${H.spr_5_50} days; substitution, not storage, decides the outcome.`;

const ORD = [
  ["R1", "SENSE", "SAR-verified maritime picture", "Navy / IFC-IOR, ISRO", "90 days", "Fuse SAR detections with AIS at IFC-IOR; auto-flag dark vessels of 80 m and over near chokepoints.", `${H.war_dark_rate_nf}% of war-zone ships were invisible to AIS.`],
  ["R2", "WARN", "Chokepoint early-warning dashboard", "HQ IDS / DIA", "60 days", "Four behavioural indicators: transits, dark rate, war-risk premium, GNSS interference. This site is the prototype.", "Traffic softened from Nov 2025; strike counts gave near-zero warning."],
  ["R3", "SHIELD", "Risk-based escorts and ISR", "Navy (WNC)", "Immediate", "Allocate by the Threat-Opacity Index, refreshed monthly; add Bab el-Mandeb to SAR tasking.", "Gulf zones top the index in >99% of 5,000 weightings."],
  ["R4", "SUSTAIN", "Energy resilience targets", "MoPNG / ISPRL", "6–12 months", "At least 82% crude-substitution capability; LPG reserve of 30 days or more; SPR Phase-II.", `88% of LPG imports transit Hormuz; SPR alone covers ${H.spr_days_net_imports} days.`],
  ["R5", "SUSTAIN", "Two-chokepoint contingency", "HQ IDS / MEA / MoPNG", "90 days", "Joint plan for Hormuz and Bab el-Mandeb closing together; bypass pipelines exit via the Red Sea.", "Petroline pumping station hit 10 Sep; Houthis took Perim Island in Sep 2026."],
  ["R6", "SHIELD", "Navigation resilience", "DG Shipping / Navy", "6 months", "NavIC-capable receivers and GNSS-interference reporting for Indian-flag Gulf traders.", "1,100–1,650 vessels hit by GPS/AIS interference (Windward)."],
];
$("#orders").innerHTML = ORD.map((o, i) => `<div class="order" data-i="${i}"><div class="id">${o[0]}</div><div><div class="t">${o[2]}</div><div class="o">${o[1]} · ${o[3]}</div></div><div class="w">${o[4]}</div></div>`).join("");
$$(".order").forEach(e => e.onclick = () => { const o = ORD[+e.dataset.i]; drawer(`${o[0]} · ${o[2]}`, [["Line of effort", o[1]], ["Action", o[5]], ["Owner", o[3]], ["When", o[4]], ["Evidence", o[6]]]); });

const cmax = D.ctoi[0][3];
$("#watch").innerHTML = `<tr><th>#</th><th>ZONE</th><th>INDEX</th><th style="width:34%"></th><th>DARK NF</th></tr>` +
  D.ctoi.slice(0, 7).map((z, i) => `<tr><td>${i + 1}</td><td>${z[0]}</td><td><b>${z[3]}</b></td><td><div class="bar" style="width:${z[3] / cmax * 100}%;background:${i < 3 ? C.red : C.muted}"></div></td><td>${Math.round(z[9] * 100)}%</td></tr>`).join("");

function mapOpt(el, role = "HQIDS") {
  const RC = (D.outlook && D.outlook.risk_cells) || [];
  const c = chart(el, {
    tooltip: {trigger: "item", backgroundColor: "#0C1C2C", borderColor: C.line, textStyle: {color: "#E6EDF4"}},
    geo: {map: "world", roam: true, center: [54, 20], zoom: 4.6, itemStyle: {areaColor: "#1B3550", borderColor: "#3E6488", borderWidth: 0.8}, labelLayout: {hideOverlap: true},
      emphasis: {disabled: true}, label: {show: false}},
    legend: {top: 4, left: 6, textStyle: {color: C.t2}, data: ["AIS-visible (sample)", "Dark, 80 m+", "Dark anchorage", "Chokepoint index", "Predicted very-high cell"],
      selected: {"Predicted very-high cell": ["ISRO", "NAVY"].includes(role), "AIS-visible (sample)": role !== "ISRO"}},
    series: [
      {name: "AIS-visible (sample)", type: "scatter", coordinateSystem: "geo", data: D.vis_pts, symbolSize: 2.5, itemStyle: {color: C.cyan, opacity: .35}, silent: true},
      {name: "Dark, 80 m+", type: "scatter", coordinateSystem: "geo", data: D.dark_pts, symbolSize: 3.5, itemStyle: {color: C.red, opacity: .8},
       tooltip: {formatter: p => `Dark vessel · ${Math.round(p.value[2])} m`}},
      {name: "Dark anchorage", type: "effectScatter", coordinateSystem: "geo", data: D.clusters.map(c => ({value: [c[3], c[2], c[1]], c})),
       symbolSize: v => Math.max(8, Math.sqrt(v[2]) * 1.3), rippleEffect: {scale: 2.5, brushType: "stroke"}, itemStyle: {color: C.amber},
       tooltip: {formatter: p => `<b>Dark anchorage near ${p.data.c[5]}</b><br>${p.data.c[1]} dark detections · median ${Math.round(p.data.c[4])} m<br>${p.data.c[6]}`}},
      {name: "Chokepoint index", type: "scatter", coordinateSystem: "geo", symbol: "diamond", data: D.ctoi.map(z => ({value: [z[2], z[1], z[3]], z})),
       symbolSize: v => 8 + v[2] / 5, itemStyle: {color: "rgba(0,0,0,0)", borderColor: "#fff", borderWidth: 1.5},
       label: {show: true, formatter: p => p.data.z[3] >= 30 ? p.data.z[0] : "", position: "right", color: "#E6EDF4", fontSize: 11, textBorderColor: "#05101A", textBorderWidth: 3}, labelLayout: {hideOverlap: true},
       tooltip: {formatter: p => `<b>${p.data.z[0]}</b><br>Threat-Opacity Index ${p.data.z[3]}<br>Dark rate (non-fishing) ${Math.round(p.data.z[9] * 100)}%`}},
      {name: "Predicted very-high cell", type: "scatter", coordinateSystem: "geo", symbol: "rect", data: RC.map(r => ({value: [r[0], r[1], r[2]], r})),
       symbolSize: 9, itemStyle: {color: "rgba(154,123,255,.25)", borderColor: "#9A7BFF", borderWidth: 1.2},
       tooltip: {formatter: p => `<b>Predicted dark cell</b><br>${p.data.r[3]} · ${p.data.r[1]}° N ${p.data.r[0]}° E<br>P(dark) ${Math.round(p.data.r[2] * 100)}%`}},
    ]});
  c.off("click");
  c.on("click", p => {
    if (p.seriesName === "Chokepoint index") { const z = p.data.z; drawer(z[0], [["Index", `${z[3]} / 100 (median rank ${z[4]}, 90% range ${z[5]}–${z[6]})`], ["P(top 3)", `${Math.round(z[7] * 100)}% of 5,000 weightings`],
      ["Strikes ≤500 km", `${Math.round(z[8])} per detection (mean)`], ["Dark, non-fishing", `${Math.round(z[9] * 100)}%`], ["Dark, >100 m", `${Math.round(z[10] * 100)}%`]]); }
    if (p.seriesName === "Dark anchorage") { const k = p.data.c; drawer(`Dark anchorage near ${k[5]}`, [["Detections", k[1]], ["Median length", `${Math.round(k[4])} m`], ["Zone", k[6]], ["Position", `${k[2].toFixed(2)}° N, ${k[3].toFixed(2)}° E`], ["Method", "DBSCAN on dark vessels of 80 m and over"]], "Large ships waiting dark off ports: an anchorage, not a fishing fleet."); }
  });
  return c;
}


/* -------------------------------------------------- briefing */
const HZ = D.hormuz, SC = D.scenarios;
const CH = [
  {n: "01 · SUPPLY", t: "The Strait closed in 72 hours", big: `−${H.its_drop}%`, sub: "immediate fall in Hormuz transits",
   p: `Ships per day went from about ${Math.round(H.hormuz_baseline)} before the war to ${H.hormuz_28feb} on 28 February, ${H.hormuz_1mar} on 1 March and ${H.hormuz_2mar} on 2 March. Seven months later traffic was still 4–16% of normal.`,
   st: [[fmt(H.missing_to_update), `voyages lost to ${dt(H.update_end)}`], [fmt(H.missing_tanker_to_update), "of them tankers"]],
   ev: `Interrupted time series, negative binomial with HAC errors, 95% CI ${H.its_ci[0]}–${H.its_ci[1]}%. Source: IMF PortWatch.`,
   draw: el => chart(el, {legend: {top: 0, textStyle: {color: C.t2}}, xAxis: ax({type: "category", data: HZ.map(r => r[0])}), yAxis: ax({type: "value", name: "ships/day"}),
     dataZoom: [{type: "inside"}], series: [{name: "Daily", type: "bar", data: HZ.map(r => r[1]), itemStyle: {color: C.muted}},
       {name: "7-day average", type: "line", data: HZ.map(r => r[3]), showSymbol: false, lineStyle: {width: 3, color: C.amber}, itemStyle: {color: C.amber},
        markLine: {symbol: "none", label: {color: C.red, formatter: "War 28 Feb"}, lineStyle: {color: C.red, type: "dashed"}, data: [{xAxis: "2026-02-28"}]}}]})},
  {n: "02 · CAUSE", t: "Strikes spread to the shores of the Strait", big: fmt(H.strikes_mar26), sub: "strikes a week in March 2026, a series high",
   p: `That is ${H.strikes_ratio}× the 2025 weekly average. The UAE, Kuwait, Bahrain and Oman were struck in the first half of 2026 after none in the same months of 2025.`,
   st: [[`${H.strikes_ratio}×`, "the 2025 average"], ["4", "Gulf states newly struck"]],
   ev: `CDM conflict events, ${fmt(H.conflict_rows)} weekly province rows, 2017–Jun 2026 (full coverage period).`,
   draw: el => chart(el, {legend: {top: 0, textStyle: {color: C.t2}}, xAxis: ax({type: "category", data: D.conflict.map(r => r[0])}), yAxis: [ax({type: "value"}), ax({type: "value", splitLine: {show: false}})],
     series: [{name: "Strikes/week (region)", type: "bar", data: D.conflict.map(r => r[1]), itemStyle: {color: C.red}},
       {name: "Gulf strikes/week", type: "line", yAxisIndex: 1, data: D.conflict.map(r => r[2]), showSymbol: false, lineStyle: {width: 3, color: C.amber}, itemStyle: {color: C.amber}}]})},
  {n: "03 · VISIBILITY", t: "The ships did not vanish. They went dark.", big: `${H.war_dark_rate_nf}%`, sub: `of war-zone ships had no AIS, against ${H.row_dark_rate_nf}% elsewhere`,
   p: `Radar saw ships that AIS did not, at ${H.odds_ratio}× the odds. The effect survives controls for size, shore and port distance; within the same patch of sea the odds rose 31% a day; and dark ships gathered in anchorages off Dubai–Jebel Ali, Fujairah–Khor Fakkan and Bandar Abbas.`,
   st: [[`${H.odds_ratio}×`, `odds (CI ${H.or_ci[0]}–${H.or_ci[1]})`], [`+31%/day`, "same-cell escalation"], [`${H.hormuz_large_dark_rate}%`, "of 100 m+ ships dark in the Strait"]],
   ev: "CDM Sentinel-1 detections matched to AIS; non-fishing vessels only, so small fishing craft do not inflate the rate.",
   draw: el => { const z = D.zones.slice().sort((a, b) => a[3] - b[3]); return chart(el, {grid: {left: 190, right: 30, top: 10, bottom: 30}, tooltip: {trigger: "axis", axisPointer: {type: "shadow"}},
     xAxis: ax({type: "value", max: 80, axisLabel: {formatter: "{value}%", color: C.t3}}), yAxis: ax({type: "category", data: z.map(r => r[0])}),
     series: [{type: "bar", data: z.map(r => ({value: +(r[3] * 100).toFixed(1), itemStyle: {color: ["Strait of Hormuz", "Gulf of Oman", "Persian Gulf"].includes(r[0]) ? C.red : C.muted}})),
       label: {show: true, position: "right", color: C.t2, formatter: "{c}%"}}]}); }},
  {n: "04 · PREDICT", t: "Dark spots can be predicted on unseen seas", big: H.model_auc.toFixed(2), sub: "AUC with 5° spatial-block cross-validation",
   p: `A gradient-boosting model with 11 features, tested on blocks of sea it had never seen, reproduces the Gulf hotspot. Conflict features lift AUC from ${H.model_auc_no_conflict} to ${H.model_auc}: modest, but real.`,
   st: [["11", "features"], ["0.79 → 0.81", "ablation gain"]], ev: "A random split would leak neighbouring ships and inflate the score; spatial blocks stop that.",
   draw: el => { const f = D.importance.slice().reverse(); return chart(el, {grid: {left: 170, right: 20, top: 10, bottom: 30}, tooltip: {trigger: "axis", axisPointer: {type: "shadow"}},
     xAxis: ax({type: "value"}), yAxis: ax({type: "category", data: f.map(r => r[0])}), series: [{type: "bar", data: f.map(r => r[1]), itemStyle: {color: C.amber}}]}); }},
  {n: "05 · WARN", t: "Shipping behaviour warned; strike counts did not", big: "S3", sub: "traffic is tracking the protracted scenario",
   p: `Hormuz traffic softened from November 2025, months before the war, while Gulf strike counts stayed near zero until the week of the attack. Since submission, the 7-day average is ${H.latest_ma7} ships/day; the protracted (Red Sea pattern) path stood at ${H.scen_on_update.S3_Protracted_RedSea_analogue}.`,
   st: [[`~${H.scen_mar27.S1_Negotiated_reopening}`, "S1 reopening, Mar 2027"], [`~${H.scen_mar27.S2_Managed_passage_tolls}`, "S2 managed passage"], [`~${H.scen_mar27.S3_Protracted_RedSea_analogue}`, "S3 protracted"]],
   ev: "No strike forecast beat a naive benchmark, so planning uses scenarios rather than point forecasts.", upd: true,
   draw: el => scenChart(el)},
  {n: "06 · INDIA", t: "Substitution matters more than the size of the reserve", big: `${H.spr_5_0}–${H.spr_5_50}`, sub: "days of SPR cover at 5% retained flow",
   p: `Hormuz carries ${H.india_share_crude}% of India's crude, ${H.india_share_lng}% of its LNG and ${H.india_share_lpg}% of its LPG. With no substitution the reserve lasts ${H.spr_5_0} days; to last 90 days, ${H.req_sub_90}% of the lost crude must be replaced. The simulated median is ${H.mc_spr_p50} days.`,
   st: [[`${H.req_sub_90}%`, "substitution for 90 days"], [`${H.spr_days_net_imports} d`, "of net imports in the SPR"]], ev: "Try it: Ops console → SPR what-if.",
   draw: el => sprChart(el)},
];
$("#chapters").innerHTML = `<div class="kick">Briefing · scroll</div><h1>Dark Waters: how the 2026 Gulf war blinded maritime tracking, choked Hormuz, and what India can do</h1>` +
  CH.map((c, i) => `<div class="chap"><div class="reveal"><div class="n">${c.n}${c.upd ? ' <span class="chip upd">UPDATED TO ' + dt(H.update_end).toUpperCase() + "</span>" : ""}</div><h2>${c.t}</h2>
  <div class="big">${c.big} <small>${c.sub}</small></div><p>${c.p}</p><div class="stats">${c.st.map(s => `<div><div style="font-size:26px;font-weight:900;color:#F0B03A">${s[0]}</div><div style="color:#7F93A8;font-size:14px">${s[1]}</div></div>`).join("")}</div>
  <div class="ev">${c.ev}</div></div><div class="panel reveal"><div class="chart" id="ch${i}" style="height:400px"></div></div></div>`).join("") +
  `<div style="padding:40px 0"><div class="kick">Orders</div><h2>In the next crisis we cannot rely on signals that ships choose to send</h2><div class="orders">` +
  ORD.map(o => `<div class="order"><div class="id">${o[0]}</div><div><div class="t">${o[2]}</div><div class="o">${o[5]}</div></div><div class="w">${o[3]} · ${o[4]}</div></div>`).join("") + "</div></div>";
const drawn = new Set();
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in");
    const ch = e.target.querySelector(".chart"); if (ch && !drawn.has(ch.id)) { drawn.add(ch.id); CH[+ch.id.slice(2)].draw(ch); } } }), {threshold: .15});
  $$(".reveal").forEach(e => io.observe(e));
}

/* -------------------------------------------------- console */
function pane(p) {
  $$("#rail button").forEach(b => b.classList.toggle("on", b.dataset.p === p));
  $$(".pane").forEach(x => x.classList.toggle("on", x.id === "p-" + p));
  ({spr: updSpr, ctoi: updCtoi, ind: drawInd, scen: () => scenChart($("#scenChart")), zones: drawZones, model: drawModel, about: () => 0})[p]();
  setTimeout(() => charts.forEach(c => c.resize()), 30);
}
$$("#rail button").forEach(b => b.onclick = () => pane(b.dataset.p));

function sprCalc(h, r, s, b) { const gap = h * (1 - r) * (1 - s); return {gap, days: gap > 0 ? b / gap : Infinity, need: r < 1 ? Math.max(0, 1 - b / (90 * h * (1 - r))) : 0}; }
function sprChart(el, h = 2.5, r = .05, b = H.spr_mb, s0) {
  const xs = [...Array(21).keys()].map(i => i * 5);
  return chart(el, {xAxis: ax({type: "category", data: xs.map(x => x + "%"), name: "substitution"}), yAxis: ax({type: "value", name: "days", max: 200}),
    tooltip: {trigger: "axis", formatter: p => `${p[0].name} substitution → ${p[0].value} days`},
    series: [{type: "line", data: xs.map(x => Math.min(200, Math.round(sprCalc(h, r, x / 100, b).days))), smooth: true, areaStyle: {color: "rgba(240,176,58,.12)"},
      lineStyle: {color: C.amber, width: 3}, itemStyle: {color: C.amber},
      markLine: {symbol: "none", data: [{yAxis: 90, lineStyle: {color: C.green, type: "dashed"}, label: {formatter: "90 days", color: C.green}},
        {yAxis: 30, lineStyle: {color: C.red, type: "dashed"}, label: {formatter: "30 days", color: C.red}}].concat(s0 != null ? [{xAxis: s0 + "%", lineStyle: {color: "#fff"}, label: {formatter: "you", color: "#fff"}}] : [])}}]});
}
function updSpr() {
  const h = +$("#sH").value, r = +$("#sR").value / 100, s = +$("#sS").value / 100, b = +$("#sB").value;
  $("#vH").textContent = h.toFixed(1) + " mb/d"; $("#vR").textContent = Math.round(r * 100) + "%"; $("#vS").textContent = Math.round(s * 100) + "%"; $("#vB").textContent = b;
  const o = sprCalc(h, r, s, b), col = o.days < 30 ? "R" : o.days < 90 ? "A" : "G";
  $("#sprOut").innerHTML = `<div class="tile"><div class="l">Net deficit</div><div class="v">${o.gap.toFixed(2)}</div><div class="s">mb/d</div></div>` +
    `<div class="tile ${col}"><div class="l">SPR lasts<span class="rag">${{R: "RED", A: "AMBER", G: "GREEN"}[col]}</span></div><div class="v">${isFinite(o.days) ? Math.round(o.days) : "∞"}</div><div class="s">days</div></div>` +
    `<div class="tile A"><div class="l">For 90 days</div><div class="v">${Math.round(o.need * 100)}%</div><div class="s">substitution needed</div></div>`;
  sprChart($("#sprChart"), h, r, b, Math.round(s * 20) * 5);
}
["#sH", "#sR", "#sS", "#sB"].forEach(id => $(id).oninput = updSpr);

const lg = D.ctoi.map(z => Math.log1p(z[8])), mm = a => { const lo = Math.min(...a), hi = Math.max(...a); return a.map(x => (x - lo) / (hi - lo)); };
const N1 = mm(lg), N2 = mm(D.ctoi.map(z => z[9])), N3 = mm(D.ctoi.map(z => z[10]));
function updCtoi() {
  const w = ["#w1", "#w2", "#w3"].map(i => +$(i).value), t = w.reduce((a, b) => a + b, 0) || 1;
  ["#vw1", "#vw2", "#vw3"].forEach((i, k) => $(i).textContent = Math.round(w[k] / t * 100) + "%");
  const rows = D.ctoi.map((z, i) => [z[0], +((N1[i] * w[0] + N2[i] * w[1] + N3[i] * w[2]) / t * 100).toFixed(1)]).sort((a, b) => b[1] - a[1]);
  chart($("#ctoiChart"), {grid: {left: 200, right: 40, top: 10, bottom: 30}, tooltip: {trigger: "axis", axisPointer: {type: "shadow"}},
    xAxis: ax({type: "value", max: 100}), yAxis: ax({type: "category", data: rows.map(r => r[0]).reverse()}),
    series: [{type: "bar", data: rows.map((r, i) => ({value: r[1], itemStyle: {color: i < 3 ? C.red : C.muted}})).reverse(), label: {show: true, position: "right", color: C.t2}}]});
}
["#w1", "#w2", "#w3"].forEach(id => $(id).oninput = updCtoi);

function scenChart(el) {
  const act = new Map(HZ.map(r => [r[0], r[3]]));
  const days = HZ.filter(r => r[0] >= "2026-01-01").map(r => r[0]).concat(SC.map(r => r[0]).filter(d => d > HZ[HZ.length - 1][0]));
  const sm = new Map(SC.map(r => [r[0], r]));
  const S = (k, n, c) => ({name: n, type: "line", showSymbol: false, data: days.map(d => sm.has(d) ? sm.get(d)[k] : null), lineStyle: {type: "dashed", width: 2, color: c}, itemStyle: {color: c}});
  $("#scenNote") && ($("#scenNote").textContent = `On ${dt(H.update_end)}: actual 7-day average ${H.latest_ma7}; scenario paths S1 ${H.scen_on_update.S1_Negotiated_reopening}, S2 ${H.scen_on_update.S2_Managed_passage_tolls}, S3 ${H.scen_on_update.S3_Protracted_RedSea_analogue}. Data after 20 Sep was added after submission (IMF PortWatch).`);
  return chart(el, {legend: {top: 0, textStyle: {color: C.t2}}, xAxis: ax({type: "category", data: days}), yAxis: ax({type: "value", name: "ships/day"}),
    series: [{name: "Actual (7-day)", type: "line", showSymbol: false, data: days.map(d => act.has(d) ? act.get(d) : null), lineStyle: {width: 3, color: C.amber}, itemStyle: {color: C.amber},
      markLine: {symbol: "none", data: [{xAxis: "2026-09-20", lineStyle: {color: C.t3}, label: {formatter: "submitted", color: C.t3}}]}},
      S(1, "S1 Negotiated reopening", C.green), S(2, "S2 Managed passage", C.cyan), S(3, "S3 Protracted", C.red)]});
}
function drawZones() {
  const z = D.zones.slice().sort((a, b) => a[3] - b[3]);
  chart($("#zoneChart"), {grid: {left: 200, right: 30, top: 10, bottom: 30}, tooltip: {trigger: "item", formatter: p => { const r = z[p.dataIndex]; return `<b>${r[0]}</b><br>${(r[3] * 100).toFixed(1)}% dark (95% CI ${(r[4] * 100).toFixed(1)}–${(r[5] * 100).toFixed(1)})<br>${fmt(r[2])} non-fishing ships`; }},
    xAxis: ax({type: "value", max: 80, axisLabel: {formatter: "{value}%", color: C.t3}}), yAxis: ax({type: "category", data: z.map(r => r[0])}),
    series: [{type: "bar", data: z.map(r => ({value: +(r[3] * 100).toFixed(1), itemStyle: {color: ["Strait of Hormuz", "Gulf of Oman", "Persian Gulf"].includes(r[0]) ? C.red : C.muted}}))},
      {type: "custom", renderItem: (p, api) => { const lo = api.coord([api.value(0), api.value(2)]), hi = api.coord([api.value(1), api.value(2)]);
        return {type: "line", shape: {x1: lo[0], y1: lo[1], x2: hi[0], y2: hi[1]}, style: {stroke: "#E6EDF4", lineWidth: 2}}; },
       data: z.map((r, i) => [r[4] * 100, r[5] * 100, i])}]});
}
function drawModel() {
  $("#modelTiles").innerHTML = [["G", "AUC, unseen seas", H.model_auc, "5° spatial-block CV"], ["A", "Without conflict", H.model_auc_no_conflict, "ablation"], ["A", "Features", "11", "vessel, place, conflict"], ["G", "Gulf hotspot", "Found", "without seeing it"]]
    .map(t => `<div class="tile ${t[0]}"><div class="l">${t[1]}</div><div class="v">${t[2]}</div><div class="s">${t[3]}</div></div>`).join("");
  const f = D.importance.slice().reverse();
  chart($("#impChart"), {grid: {left: 170, right: 20, top: 10, bottom: 30}, tooltip: {trigger: "axis", axisPointer: {type: "shadow"}},
    xAxis: ax({type: "value"}), yAxis: ax({type: "category", data: f.map(r => r[0])}), series: [{type: "bar", data: f.map(r => r[1]), itemStyle: {color: C.amber}}]});
}
function drawInd() {
  const dd = D.daily_dark;
  $("#indTiles").innerHTML = [
    ["R", "1 · Transits", `${H.latest_ma7}/day`, `7-day average, ${pctNow}% of pre-war`, "DATA"],
    ["R", "2 · Dark rate", `${H.war_dark_rate_nf}%`, `war zone, last pass ${Math.round(dd[dd.length - 1][3] * 100)}%`, "DATA"],
    ["A", "3 · War-risk premium", "Feed", "insurer quotes: plug-in, not in CDM data", "EXTERNAL"],
    ["A", "4 · GNSS interference", "1,100+", "vessels hit in 24 h, 1 Mar (Windward)", "EXTERNAL"]]
    .map(t => `<div class="tile ${t[0]}"><div class="l">${t[1]}<span class="chip${t[4] === "EXTERNAL" ? " upd" : ""}">${t[4]}</span></div><div class="v">${t[2]}</div><div class="s">${t[3]}</div></div>`).join("");
  const ev = D.events.filter(e => e[0] >= "2025-06-01");
  chart($("#indChart"), {xAxis: ax({type: "category", data: HZ.map(r => r[0])}), yAxis: ax({type: "value"}), dataZoom: [{type: "inside"}],
    series: [{type: "line", data: HZ.map(r => r[3]), showSymbol: false, lineStyle: {color: C.amber, width: 3}, itemStyle: {color: C.amber}, name: "7-day average",
      markArea: {itemStyle: {color: "rgba(240,176,58,.08)"}, data: [[{xAxis: "2025-11-01", name: "pre-war softening"}, {xAxis: "2026-02-27"}]], label: {color: C.amber}},
      markLine: {symbol: "none", label: {show: false}, lineStyle: {color: "#2A4560"}, data: ev.map(e => ({xAxis: e[0], name: e[1]})),
        tooltip: {formatter: p => p.name}}}]});
}
$("#about").innerHTML = `<dl style="display:grid;grid-template-columns:200px 1fr;gap:8px 16px">
<dt>CDM conflict events</dt><dd style="margin:0">${fmt(H.conflict_rows)} weekly rows by province, Dec 2014 – Jun 2026: the cause</dd>
<dt>CDM Sentinel-1 radar</dt><dd style="margin:0">${fmt(H.sar_detections)} detections, 1–14 Mar 2026, matched to AIS: the behaviour</dd>
<dt>IMF PortWatch</dt><dd style="margin:0">Daily Hormuz transits to ${dt(H.update_end)}: the time axis (to 20 Sep at submission)</dd>
<dt>Cleaning</dt><dd style="margin:0">4 defects found and fixed: 845 sea events on one placeholder point; 13,566 rejected AIS IDs; 210 radar detections on land; UAE east coast in the wrong zone</dd>
<dt>Limits</dt><dd style="margin:0">14 days of radar only · "dark" includes spoofed as well as switched-off AIS · PortWatch is AIS-based, so a lower bound in war · stress-test inputs are secondary-source ranges</dd>
<dt>Run ID</dt><dd style="margin:0"><b>${H.run_id}</b>: a hash of every headline number; the same ID is on the analyst dashboard</dd></dl>`;
pane("spr");


/* ================================================== DEPARTMENT LOGIN + ROLE VIEWS */
const DEP = O.depts, DK = Object.keys(DEP), SCN = O.scenarios, IMP = O.impact, TRK = O.tracking;
const SCOL = {S1: C.green, S2: C.cyan, S3: C.red};
let ROLE = null;
try { ROLE = sessionStorage.getItem("dw-dept"); } catch {}
const TL = {  // tile library
  flow: () => TILES[0], dark: () => TILES[1], spr: () => TILES[2], ctoi: () => TILES[3],
  outlook: () => ({cls: "R", l: "2027 forecast", v: `${SCN[TRK].mean_2027}/day`, s: `Hormuz, tracking ${TRK} (${SCN[TRK].name}) · ${SCN[TRK].pct_2027}% of pre-war`, ev: () => go("out")}),
  lpg: () => ({cls: "R", l: "LPG at risk, 2027", v: `${IMP[TRK].lpg_at_risk_pct}%`, s: `of India's LPG imports under ${TRK} · crude ${IMP[TRK].crude_at_risk_pct}%`, ev: () => go("out")}),
  replace: () => ({cls: "A", l: "Crude to replace, 2027", v: `${IMP[TRK].crude_to_replace_mn_bbl} mn bbl`, s: `under ${TRK}; ${IMP[TRK].sub_for_90}% substitution for 90 days of SPR`, ev: () => go("out")}),
  cells: () => ({cls: "A", l: "SAR tasking cells", v: `${O.n_risk_cells}`, s: `very-high-risk 1° cells, W. Indian Ocean · AUC ${H.model_auc}`, ev: () => { go("con"); pane("model"); }}),
  anch: () => ({cls: "R", l: "Dark anchorages", v: `${D.clusters.length}`, s: `largest off ${D.clusters[0][5]} (${D.clusters[0][1]} dark)`, ev: () => go("cmd")}),
  strikes: () => ({cls: "A", l: "Strikes, 2027 range", v: `${fmt(O.strikes_2027.p10)}–${fmt(O.strikes_2027.p90)}`, s: `a week (median ${O.strikes_2027.p50}); 2025 avg ${O.strikes_2027.avg_2025}`, ev: () => go("out")}),
  gnss: () => ({cls: "A", l: "GNSS interference", v: "1,100+", s: "vessels hit in 24 h on 1 Mar (Windward) · external feed", ev: () => drawer("GNSS interference", [["Source", "Windward via CNBC/CNN, 1 Mar 2026"], ["Scale", "1,100 to 1,650 vessels affected by GPS/AIS interference"], ["In CDM data?", "No: an external feed to plug in (indicator 4 of R2)"]])}),
  track: () => ({cls: "R", l: "Scenario tracking", v: TRK, s: `${SCN[TRK].name}: error ${O.rmse[TRK]} vs ${O.rmse.S1} for S1`, ev: () => { go("con"); pane("scen"); }}),
};
const ROLE_TILES = {ALL: ["flow", "dark", "outlook", "spr"], HQIDS: ["track", "flow", "dark", "outlook"], NAVY: ["dark", "anch", "ctoi", "cells"],
  ISRO: ["cells", "dark", "anch", "ctoi"], DIA: ["track", "flow", "dark", "strikes"], MOPNG: ["spr", "replace", "lpg", "outlook"],
  MEA: ["track", "outlook", "replace", "flow"], DGS: ["gnss", "dark", "ctoi", "flow"]};
function openGate() {
  $("#gateIn").innerHTML = `<div class="kick">DARK WATERS · CHOKEPOINT EARLY-WARNING CONSOLE · RUN ${H.run_id}</div>
    <h1>Select your department</h1><div class="sub">Each department sees its own indicators, its 0600 brief and the actions it owns from the six recommendations. Demo login: no password, open-source data only.</div>
    <div class="gate-g"><button class="gc all" data-d="ALL" style="--rc:#E6EDF4"><div><div class="s">ALL DEPARTMENTS</div><div class="n">Joint view for the jury</div></div><div class="f">Every indicator and all six orders, R1–R6</div></button>
    ${DK.map(k => { const d = DEP[k]; return `<button class="gc" data-d="${k}" style="--rc:${d.color}"><div class="s">${d.short}</div><div class="n">${d.name}</div><div class="f">${d.focus}</div><div class="r">OWNS ${d.recs.join(" · ")}</div></button>`; }).join("")}</div>
    <div class="pin">🔒 UNCLASSIFIED DEMO · ROLE IS KEPT FOR THIS SESSION ONLY · PRESS V TO SWITCH</div>`;
  $("#gate").classList.add("on");
  $$(".gc").forEach(b => b.onclick = () => { ROLE = b.dataset.d; try { sessionStorage.setItem("dw-dept", ROLE); } catch {} $("#gate").classList.remove("on"); paint(); });
}
$("#deptBtn").onclick = openGate;
function deptOf(r) { return r === "ALL" ? {short: "ALL DEPTS", name: "Joint view", color: "#E6EDF4", recs: ["R1", "R2", "R3", "R4", "R5", "R6"], focus: "Every indicator and all six orders"} : DEP[r]; }
function paint() {
  const r = ROLE || "ALL", d = deptOf(r);
  $("#deptBtn").textContent = `DEPT · ${d.short} ▾`; $("#deptBtn").style.setProperty("--rc", d.color);
  $("#cmdKick").innerHTML = `${d.short} · ${r === "ALL" ? "joint view" : "department view"} · Western Indian Ocean · data to ${dt(H.update_end)}`;
  $("#cmdTitle").textContent = r === "ALL" ? "The Strait closed, the ships went dark, and India's buffer is thin" : `${d.name}`;
  $("#cmdTitle").insertAdjacentHTML("beforeend", r === "ALL" ? "" : `<div style="font-size:17px;font-weight:500;color:#AFC0D0;margin-top:4px">${d.focus} · owns ${d.recs.join(", ")}</div>`);
  const tl = ROLE_TILES[r].map(k => TL[k]());
  $("#tiles").innerHTML = tl.map((t, i) => `<div class="tile ${t.cls}" data-j="${i}"><div class="l">${t.l}<span class="rag">${{R: "RED", A: "AMBER", G: "GREEN"}[t.cls]}</span></div><div class="v">${t.v}</div><div class="s">${t.s}</div></div>`).join("");
  $$(".tile[data-j]").forEach(e => e.onclick = () => tl[+e.dataset.j].ev());
  const mine = ORD.filter(o => d.recs.includes(o[0]));
  $("#ordH").textContent = r === "ALL" ? "Orders · select for detail" : `Orders owned by ${d.short} · select for detail`;
  $("#orders").innerHTML = mine.map(o => `<div class="order" data-id="${o[0]}"><div class="id">${o[0]}</div><div><div class="t">${o[2]}</div><div class="o">${o[1]} · ${o[3]}</div></div><div class="w">${o[4]}</div></div>`).join("");
  $$("#orders .order").forEach(e => e.onclick = () => { const o = ORD.find(x => x[0] === e.dataset.id); drawer(`${o[0]} · ${o[2]}`, [["Line of effort", o[1]], ["Action", o[5]], ["Owner", o[3]], ["When", o[4]], ["Evidence", o[6]]]); });
  const acts = r === "ALL" ? O.actions.HQIDS : O.actions[r];
  $("#bluf").innerHTML = `<b>BLUF · 0600</b>` + (r === "ALL" ? $("#bluf").dataset.base :
    `Hormuz is at ${H.latest_pct}% of pre-war and the data track ${TRK} (${SCN[TRK].name}), ${SCN[TRK].mean_2027} ships/day across 2027. ${acts[0][1]}`);
  // 0600 brief (OODA) + inbox
  const inbox = O.inbox.filter(m => r === "ALL" || m.to.includes(r)).slice(0, 7);
  const obs = ROLE_TILES[r].map(k => TL[k]()).slice(0, 3).map(t => `${t.l}: <b>${t.v}</b>`).join("<br>");
  $("#cmdBrief").innerHTML = `<div class="panel"><h3>${d.short} · daily 0600 brief · ${dt(H.update_end)}</h3><div class="ooda">
    <div><span class="h">OBSERVE</span>${obs}</div>
    <div><span class="h">ORIENT</span>Data track <b>${TRK}</b> (error ${O.rmse[TRK]} ships/day vs ${O.rmse.S1} for S1). Strike counts gave no warning before 28 Feb; behaviour did.</div>
    <div><span class="h">DECIDE</span>${acts.map(a => `<i style="font-style:normal;color:#F0B03A;font:700 11px var(--mono)">${a[0].toUpperCase()}</i><br>${a[1]}`).slice(0, 2).join("<br>")}</div>
    <div><span class="h">ACT</span>${mine.map(o => `<b style="color:#F0B03A">${o[0]}</b> ${o[2]} · ${o[4]}`).join("<br>")}</div></div>
    <div class="ev">Auto-drafted from the data; staff check before release. Refresh weekly with new PortWatch and SAR passes.</div></div>
    <div class="panel"><h3>Inbox · routed to ${d.short}</h3>${inbox.map(m => `<div class="msg ${m.flash ? "flash" : ""}"><div class="t">${dt(m.date)} · ${m.flash ? "FLASH" : "ROUTINE"} · ${m.theatre.toUpperCase()}</div>${m.flash ? "⚡ " : ""}${m.text}</div>`).join("")}</div>`;
  mapOpt($("#map"), r);
  if ($("#v-out").classList.contains("on")) drawOutlook();
}
$("#bluf").dataset.base = $("#bluf").innerHTML.replace(/^<b>BLUF<\/b>/, "");

/* ================================================== 2027 OUTLOOK: forecast -> India impact -> India's actions */
function drawOutlook() {
  const r = ROLE || "ALL", S = ["S1", "S2", "S3"], st = O.strikes_2027;
  $("#outlook").innerHTML = `<div class="kick">2027 outlook · scenario range from history, not a validated forecast · data to ${dt(O.data_end)}</div>
  <h1>2027: what happens at Hormuz, what it does to India, and what India should do</h1>
  <div class="step"><div class="k">1</div><div><div class="kick">Forecast</div><h2 style="margin:0">Hormuz traffic in 2027 under three scenarios</h2></div></div>
  <div class="scn">${S.map(k => `<div class="c ${k === TRK ? "trk" : ""}" style="--sc:${SCOL[k]}">${k === TRK ? '<span class="trkb">DATA TRACKING</span>' : ""}<div class="h">${k} · ${SCN[k].name.toUpperCase()}</div>
    <div class="v">${SCN[k].mean_2027}<small style="font-size:16px;color:#AFC0D0"> ships/day</small></div>
    <div class="s">${SCN[k].pct_2027}% of pre-war across 2027 · Q1–Q4: ${SCN[k].q.join(" · ")}<br>${SCN[k].voyages_lost_2027.toLocaleString("en-US")} voyages lost in 2027${SCN[k].reach_50pct ? ` · half of normal by ${dt(SCN[k].reach_50pct)}` : " · never back to half of normal"}</div>
    <div class="ev">Fit to actual since 21 Sep: error ${O.rmse[k]} ships/day</div></div>`).join("")}</div>
  <div class="grid2"><div class="panel"><h3>Actual traffic and the 2027 paths (re-anchored on ${dt(O.data_end)})</h3><div class="chart" id="oChart" style="height:380px"></div></div>
   <div class="panel"><h3>Regional strike intensity, 2027 range</h3><div class="big" style="font-size:44px">${fmt(st.p10)}–${fmt(st.p90)}<small> strikes a week (80% range)</small></div>
   <p style="color:#AFC0D0">Median ${st.p50} a week against ${st.avg_2025} in 2025 and ${st.level_h1_2026} in H1 2026. In ${Math.round(st.p_above_2025 * 100)}% of ${st.n_origins} historical 18-month windows the level stayed above 2025.</p>
   <div class="ev">No strike forecast beat a naive benchmark, so this is a range, not a prediction. The indicators that choose the scenario are behavioural: transits and dark rates, then war-risk premium and GNSS interference.</div></div></div>

  <div class="step"><div class="k">2</div><div><div class="kick">Impact on India</div><h2 style="margin:0">What each scenario means for India's energy in 2027</h2></div></div>
  <div class="panel"><table class="imp"><tr><th>2027, AVERAGE</th>${S.map(k => `<th style="color:${SCOL[k]}">${k} · ${SCN[k].name.toUpperCase()}${k === TRK ? " ◀ TRACKING" : ""}</th>`).join("")}</tr>
   ${[["Hormuz flow still arriving", k => IMP[k].retained_pct + "%"], ["Crude gap via Hormuz", k => IMP[k].crude_gap_mbd + " mb/d"], ["Crude to replace over the year", k => IMP[k].crude_to_replace_mn_bbl + " mn bbl"],
      ["SPR lasts, no substitution", k => IMP[k].spr_days_0 + " days"], ["SPR lasts, 50% substitution", k => IMP[k].spr_days_50 + " days"], ["Substitution for 90 days of SPR", k => IMP[k].sub_for_90 + "%"],
      ["Share of crude imports at risk", k => IMP[k].crude_at_risk_pct + "%"], ["Share of LNG imports at risk", k => IMP[k].lng_at_risk_pct + "%"], ["Share of LPG imports at risk", k => IMP[k].lpg_at_risk_pct + "%"]]
     .map(row => `<tr><td>${row[0]}</td>${S.map(k => `<td class="n" style="${k === TRK ? "color:#F0B03A" : ""}">${row[1](k)}</td>`).join("")}</tr>`).join("")}</table>
   <div class="ev">Assumes India's Hormuz-routed crude (2.5 mb/d), LNG (${H.india_share_lng}%) and LPG (${H.india_share_lpg}%) fall in step with total transits. SPR 39.1 mn bbl. Same model as the submitted SPR stress test; inputs are ranges from secondary sources.</div></div>
  <div class="bluf"><b>SO WHAT</b>On the path the data are on (${TRK}), India must replace about ${IMP[TRK].crude_to_replace_mn_bbl} mn bbl of crude in 2027, and ${IMP[TRK].lpg_at_risk_pct}% of LPG imports stay at risk. The reserve buys ${IMP[TRK].spr_days_0}–${IMP[TRK].spr_days_50} days; contracts and shipping, not storage, decide the year.</div>

  <div class="step"><div class="k">3</div><div><div class="kick">India's actions</div><h2 style="margin:0">Who does what, and what changes the plan</h2></div></div>
  <div class="acts">${DK.map(k => { const d = DEP[k]; return `<div class="act ${r === k ? "me" : ""}" style="--rc:${d.color}"><div class="hd"><b>${d.short}</b><span class="chip">${d.recs.join(" · ")}</span></div>
    <ul>${O.actions[k].map(a => `<li><i>${a[0].toUpperCase()}</i>${a[1]}</li>`).join("")}</ul></div>`; }).join("")}</div>
  <div class="ev" style="margin-top:12px">${O.note}</div>`;
  const P27 = D.paths2027, act = HZ.filter(x => x[0] >= "2026-01-01");
  const days = act.map(x => x[0]).concat(P27.map(x => x[0]));
  const n = act.length;
  chart($("#oChart"), {legend: {top: 0, textStyle: {color: C.t2}}, xAxis: ax({type: "category", data: days}), yAxis: ax({type: "value", name: "ships/day"}),
    series: [{name: "Actual (7-day)", type: "line", showSymbol: false, data: act.map(x => x[3]), lineStyle: {width: 3, color: C.amber}, itemStyle: {color: C.amber},
      markLine: {symbol: "none", data: [{xAxis: O.data_end, lineStyle: {color: C.t3}, label: {formatter: "today's data", color: C.t3}}, {yAxis: Math.round(H.hormuz_baseline), lineStyle: {color: C.muted}, label: {formatter: "pre-war", color: C.t3}}]}},
      ...S.map((k, i) => ({name: `${k} ${SCN[k].name}`, type: "line", showSymbol: false, data: Array(n).fill(null).concat(P27.map(x => x[i + 1])), lineStyle: {type: "dashed", width: k === TRK ? 3 : 2, color: SCOL[k]}, itemStyle: {color: SCOL[k]}}))]});
}
paint();
if (!ROLE) openGate();
