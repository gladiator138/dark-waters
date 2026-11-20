"""Dark Waters - 2027 outlook: forecast -> India impact -> India's actions, by department.

    python scripts/outlook_2027.py      (run after prepare_data.py; build_site.py then picks it up)

1. FORECAST. Strait of Hormuz transits for calendar 2027 under the three planning scenarios submitted
   on 20 Sep 2026 (same logistic curves and ceilings as Code/p04_hormuz.py), re-anchored on the actual
   7-day average at the end of the data (8 Nov 2026). Regional strike intensity for 2027 as a range from
   history: the distribution of 18-month-ahead changes in the 2017-2026 monthly series, applied to the
   latest 6-month level. Neither is a validated forecast: no strike model beat a naive benchmark, so the
   outlook is a scenario range, and the live indicators say which scenario is unfolding.
2. INDIA IMPACT. Each scenario's 2027 Hormuz flow (share of pre-war) is used as the share of India's
   Hormuz-routed crude, LNG and LPG still arriving. The SPR model is the one in Code/p05_india_risk.py
   (2.5 mb/d via Hormuz, SPR 39.1 mn bbl).
3. ACTIONS. Triggers and actions per department, tied to recommendations R1-R6.

Writes data/processed/outlook_2027.json and merges it into web/data.json.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "data" / "processed"
H = json.loads((P / "headline.json").read_text())
BASE = H["hormuz_baseline"]
SPR, HM = H["spr_mb"], H["hormuz_crude_mbd"]

# ------------------------------------------------------------------ 1a Hormuz scenarios to Dec 2027
u = pd.read_parquet(P / "hormuz_update.parquet")
end = u.Date.max()
cur = float(u.MA7.iloc[-1]) / BASE
days = pd.date_range(end + pd.Timedelta(days=1), "2027-12-31", freq="D")
t = np.arange(len(days))
# Same ceilings and speeds as the submitted scenarios; time measured from the end of the data, so a deal
# that has not happened by 8 Nov pushes every path later rather than pretending it is already under way.
SC = {"S1": ("Negotiated reopening", 0.85, 45, 0.12), "S2": ("Managed passage, tolls", 0.45, 90, 0.05),
      "S3": ("Protracted, Red Sea pattern", 0.20, 120, 0.03)}
paths = pd.DataFrame({"Date": days})
for k, (_, ceil, mid, kk) in SC.items():
    paths[k] = (cur + (ceil - cur) / (1 + np.exp(-kk * (t - mid)))) * BASE
paths.to_parquet(P / "hormuz_2027_paths.parquet", index=False)
y27 = paths[paths.Date.dt.year == 2027]
scen = {}
for k, (name, ceil, mid, kk) in SC.items():
    s = y27[k]
    q = y27.groupby(y27.Date.dt.quarter)[k].mean()
    share = float(s.mean() / BASE)
    scen[k] = dict(name=name, ceiling_pct=int(ceil * 100), mean_2027=round(float(s.mean()), 1), pct_2027=round(share * 100, 1),
                   q=[round(float(x), 1) for x in q], dec_2027=round(float(s.iloc[-1]), 1),
                   voyages_lost_2027=int(round((BASE - s).sum())),
                   reach_50pct=str(paths.Date[paths[k] >= 0.5 * BASE].min().date()) if (paths[k] >= 0.5 * BASE).any() else None)

# which path is the data on? compare the last 49 days with each submitted path
sub = pd.read_parquet(P / "hormuz_scenarios.parquet").set_index("Date")
act = u.set_index("Date").MA7.loc["2026-09-21":]
cols = {"S1": "S1_Negotiated_reopening", "S2": "S2_Managed_passage_tolls", "S3": "S3_Protracted_RedSea_analogue"}
rmse = {k: round(float(np.sqrt(((sub.loc[act.index, c] - act) ** 2).mean())), 1) for k, c in cols.items()}
tracking = min(rmse, key=rmse.get)

# ------------------------------------------------------------------ 1b strike intensity range for 2027
cm = pd.read_parquet(P / "conflict_monthly.parquet").set_index("Month")
s = cm.Strikes_per_week
lvl = float(s.iloc[-6:].mean())  # Jan-Jun 2026
# 18 months ahead from the end of the data (Jun 2026) reaches Dec 2027: use ratios of the mean of months +7..+18
# to the trailing 6-month mean, over every origin in the series.
r = []
for i in range(6, len(s) - 18):
    r.append(s.iloc[i + 7:i + 19].mean() / s.iloc[i - 5:i + 1].mean())
r = np.array(r)
strikes = dict(level_h1_2026=round(lvl), n_origins=int(len(r)),
               p10=round(lvl * np.quantile(r, .1)), p50=round(lvl * np.quantile(r, .5)), p90=round(lvl * np.quantile(r, .9)),
               avg_2025=H["strikes_2025_avg"], p_above_2025=round(float((lvl * r > H["strikes_2025_avg"]).mean()), 2))

# ------------------------------------------------------------------ 2 India impact per scenario
def spr_days(ret, sub_):
    gap = HM * (1 - ret) * (1 - sub_)
    return round(SPR / gap) if gap > 0 else None


impact = {}
for k, v in scen.items():
    ret = v["pct_2027"] / 100
    impact[k] = dict(
        retained_pct=v["pct_2027"],
        crude_gap_mbd=round(HM * (1 - ret), 2),
        crude_to_replace_mn_bbl=round(HM * (1 - ret) * 365),
        spr_days_0=spr_days(ret, 0), spr_days_50=spr_days(ret, 0.5),
        sub_for_90=round(max(0, 1 - SPR / (90 * HM * (1 - ret))) * 100),
        lpg_at_risk_pct=round(H["india_share_lpg"] * (1 - ret)), lng_at_risk_pct=round(H["india_share_lng"] * (1 - ret)),
        crude_at_risk_pct=round(H["india_share_crude"] * (1 - ret)))

# ------------------------------------------------------------------ 3 departments, triggers, actions
DEPTS = {
    "HQIDS": dict(name="HQ Integrated Defence Staff", short="HQ IDS", color="#F0B03A", recs=["R2", "R5"],
                  focus="Joint picture, early warning and the two-chokepoint plan",
                  indicators=["Hormuz 7-day transits", "War-zone dark rate", "Scenario tracking", "Bab el-Mandeb status"]),
    "NAVY": dict(name="Indian Navy · IFC-IOR and Western Naval Command", short="NAVY", color="#4FC3F7", recs=["R1", "R3"],
                 focus="SAR-verified picture, dark-vessel flags, escorts and ISR by risk",
                 indicators=["Dark vessels 80 m+", "Dark anchorages", "Threat-Opacity Index", "Predicted dark cells"]),
    "ISRO": dict(name="ISRO · satellite tasking", short="ISRO", color="#9A7BFF", recs=["R1"],
                 focus="Where to point SAR passes before the imagery is needed",
                 indicators=["Very-high-risk 1° cells", "Model AUC on unseen seas", "Revisit gaps", "Chokepoint coverage"]),
    "DIA": dict(name="Defence Intelligence Agency", short="DIA", color="#E5484D", recs=["R2"],
                focus="Behavioural warning: shipping moves before strikes do",
                indicators=["Pre-war traffic softening", "Dark-rate trend", "Strike intensity", "Key events"]),
    "MOPNG": dict(name="MoPNG and ISPRL · energy security", short="MoPNG", color="#3FB950", recs=["R4", "R5"],
                  focus="SPR cover, crude substitution, LPG and LNG exposure",
                  indicators=["SPR days of cover", "Substitution needed for 90 d", "LPG at risk", "Scenario flow"]),
    "MEA": dict(name="Ministry of External Affairs", short="MEA", color="#2BB3A3", recs=["R5"],
                focus="Diplomatic track for passage, supplier deals and the Red Sea route",
                indicators=["Scenario tracking", "Supplier substitution", "Bab el-Mandeb status", "Negotiation events"]),
    "DGS": dict(name="DG Shipping · Indian-flag merchant fleet", short="DG SHIPPING", color="#F59E0B", recs=["R6"],
                focus="Advisories, GNSS-interference reporting and NavIC for Gulf traders",
                indicators=["GNSS interference reports", "Dark-rate by zone", "Hormuz transits", "Advisory level"]),
}
REC = {
    "R1": ("SENSE", "SAR-verified maritime picture", "Fuse SAR detections with AIS at IFC-IOR; auto-flag dark vessels of 80 m and over near chokepoints", "Navy / IFC-IOR, ISRO", "90 days"),
    "R2": ("WARN", "Chokepoint early-warning dashboard", "Four behavioural indicators: transits, dark rate, war-risk premium, GNSS interference", "HQ IDS / DIA", "60 days"),
    "R3": ("SHIELD", "Risk-based escorts and ISR", "Allocate by the Threat-Opacity Index, refreshed monthly; add Bab el-Mandeb to SAR tasking", "Navy (WNC)", "Immediate"),
    "R4": ("SUSTAIN", "Energy resilience targets", "At least 82% crude-substitution capability; LPG reserve of 30 days or more; SPR Phase-II", "MoPNG / ISPRL", "6–12 months"),
    "R5": ("SUSTAIN", "Two-chokepoint contingency", "Joint plan for Hormuz and Bab el-Mandeb closing together; bypass pipelines exit via the Red Sea", "HQ IDS / MEA / MoPNG", "90 days"),
    "R6": ("SHIELD", "Navigation resilience", "NavIC-capable receivers and GNSS-interference reporting for Indian-flag Gulf traders", "DG Shipping / Navy", "6 months"),
}
S3i, S1i = impact["S3"], impact["S1"]
# Scenario-conditioned actions: what each department does if the data keep tracking S3, or turn to S1/S2
ACT = {
    "HQIDS": [("Now", f"Adopt this dashboard as the weekly chokepoint brief; plan on S3 while the data track it (RMSE {rmse['S3']} vs {rmse['S1']} for S1)."),
              ("If S3 holds to Mar 2027", "Activate the two-chokepoint plan: Hormuz and Bab el-Mandeb both contested for most of 2027."),
              ("If transits pass 40/day", "Shift from closure to managed-passage posture (S2): escort windows, not escort convoys.")],
    "NAVY": [("Now", "Flag every dark vessel of 80 m+ within 100 km of a chokepoint; task ISR to the three Gulf dark anchorages."),
             ("If S3 holds to Mar 2027", "Sustain Op Urja Suraksha-type escorts through 2027; refresh the Threat-Opacity ranking monthly."),
             ("If S1 (reopening)", "Keep SAR-AIS fusion running: dark rates are the first sign of a relapse.")],
    "ISRO": [("Now", "Task SAR passes to the very-high-risk cells the model flags, before imagery is requested."),
             ("If S3 holds to Mar 2027", "Add Bab el-Mandeb and the Gulf of Aden to standing SAR tasking."),
             ("Always", "Share detections with IFC-IOR within the pass window, not days later.")],
    "DIA": [("Now", "Watch the four behavioural indicators weekly; strike counts alone gave no warning in Feb 2026."),
            ("Warning sign", "A 30% fall in Hormuz traffic over 8 weeks, as in Nov 2025, with rising dark rates."),
            ("If S1", "Monitor for relapse: dark rate rising while transits recover.")],
    "MOPNG": [("Now", f"Plan for S3: {S3i['crude_to_replace_mn_bbl']} mn bbl of Hormuz crude to replace in 2027; SPR lasts {S3i['spr_days_0']} days unaided."),
              ("Target", f"Contract {S3i['sub_for_90']}% substitution so the SPR lasts 90 days; build an LPG reserve of 30 days ({S3i['lpg_at_risk_pct']}% of LPG imports at risk under S3)."),
              ("If S1", f"Even under reopening, {S1i['crude_at_risk_pct']}% of crude imports stay exposed through 2027: keep SPR Phase-II on schedule.")],
    "MEA": [("Now", "Pursue assured-passage arrangements for Indian-flag and India-bound ships."),
            ("If S3 holds to Mar 2027", "Lock in non-Gulf crude and LPG supply deals (Americas, West Africa, Russia) for 2027."),
            ("Always", "Coordinate the Red Sea route: Gulf bypass pipelines exit through Bab el-Mandeb.")],
    "DGS": [("Now", "Issue Gulf advisories tied to the Threat-Opacity Index; mandate GNSS-interference reporting."),
            ("Within 6 months", "NavIC-capable receivers on Indian-flag Gulf traders."),
            ("If S2", "Brief masters on toll or inspection corridors and approved routes.")],
}
# FLASH / inbox items from the key-event timeline, routed to the departments that act on them
ROUTE = {"Hormuz": ["HQIDS", "NAVY", "MOPNG", "DGS", "DIA", "MEA"], "Red Sea": ["HQIDS", "NAVY", "MEA", "MOPNG"],
         "India": ["HQIDS", "NAVY", "MOPNG"], "Iran": ["DIA", "MEA", "HQIDS"], "Maritime": ["NAVY", "DGS", "HQIDS"],
         "Regional": ["DIA", "HQIDS", "MEA"]}
ev = pd.read_parquet(P / "key_events.parquet")
inbox = []
for e in ev.sort_values("Date", ascending=False).itertuples():
    flash = e.Theatre in ("Hormuz", "Red Sea") and e.Date >= pd.Timestamp("2026-02-01")
    inbox.append(dict(date=str(e.Date.date()), text=e.Event, theatre=e.Theatre, flash=bool(flash), to=ROUTE.get(e.Theatre, ["HQIDS"])))

g = pd.read_parquet(P / "fact_sar_grid_risk.parquet")
wior = g[g.Grid_Lat.between(-5, 35) & g.Grid_Lon.between(30, 80) & (g.Risk_Tier == "Very high")]
cells = wior.sort_values("Pred_Dark_Prob", ascending=False)
risk_cells = [[float(r_.Grid_Lon), float(r_.Grid_Lat), round(float(r_.Pred_Dark_Prob), 3), r_.Zone] for r_ in cells.itertuples()]
out = dict(risk_cells=risk_cells, n_risk_cells=len(risk_cells), data_end=str(end.date()), current_pct=round(cur * 100, 1), current_ma7=round(float(u.MA7.iloc[-1]), 1),
           scenarios=scen, rmse=rmse, tracking=tracking, strikes_2027=strikes, impact=impact,
           depts=DEPTS, recs=REC, actions=ACT, inbox=inbox,
           note="Scenario range, not a validated forecast. The submitted scenario paths are re-anchored on the "
                f"actual level on {end:%d %b %Y}; strike range from {len(r)} historical 18-month origins.")
(P / "outlook_2027.json").write_text(json.dumps(out, indent=1))
W = json.loads((ROOT / "web" / "data.json").read_text())
W["outlook"] = out
pp = paths.copy(); pp["Date"] = pp.Date.dt.strftime("%Y-%m-%d")
W["paths2027"] = [[r_[0]] + [round(float(x), 1) for x in r_[1:]] for r_ in pp.itertuples(index=False)]
(ROOT / "web" / "data.json").write_text(json.dumps(W, separators=(",", ":")))
print(json.dumps({k: out[k] for k in ["current_pct", "rmse", "tracking", "strikes_2027"]}, indent=1))
for k in scen: print(k, scen[k], impact[k])
