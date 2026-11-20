"""Dark Waters - build the dashboard data from the submitted Power BI tables.

    python scripts/prepare_data.py

Reads data/raw/ (the 17 cleaned tables submitted on 30 Sep 2026, plus the IMF PortWatch
update to 8 Nov 2026) and writes:
  data/processed/*.parquet   compact tables for the Streamlit analyst dashboard
  data/processed/headline.json  every headline number, with asserts against the jury deck
  web/data.json              the frozen numbers for the Ops site
Source files are never modified. The script fails loudly if a headline number drifts.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW, OUT = ROOT / "data" / "raw", ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)
WAR = pd.Timestamp("2026-02-28")
WAR_ZONES = ["Strait of Hormuz", "Gulf of Oman", "Persian Gulf"]
H = {}  # headline numbers


def r(x, n=1):
    return float(round(float(x), n))


# ---------------------------------------------------------------- SAR detections
sar = pd.read_csv(RAW / "fact_sar_detections.csv.gz", parse_dates=["Date"])
keep = ["Detection_ID", "Date", "Hour_UTC", "Latitude", "Longitude", "Zone", "Grid_ID", "Grid_Lat", "Grid_Lon",
        "Length_m", "Size_Class", "Is_Dark", "Likely_Fishing", "Dark_Profile", "Dist_Shore_km", "On_Land_Mask",
        "Shore_Band", "Dist_Conflict_km", "Strike_Events_500km", "Nearest_Port", "Dist_Port_km", "Dist_Hormuz_km",
        "War_Zone"]
sar = sar[keep]
sar.to_parquet(OUT / "sar.parquet", index=False)
H["sar_detections"] = int(len(sar))
H["sar_dark"] = int(sar.Is_Dark.sum())

zs = pd.read_csv(RAW / "dim_zone_statistics.csv")
w = zs[zs.Zone.isin(WAR_ZONES)]
H["war_dark_rate_nf"] = r(w.Dark_NonFishing.sum() / w.NonFishing.sum() * 100)
row = zs.set_index("Zone").loc["Rest of World"]
H["row_dark_rate_nf"] = r(row.Dark_Rate_NonFishing * 100)
H["war_dark_nf"] = int(w.Dark_NonFishing.sum())
H["war_nonfishing"] = int(w.NonFishing.sum())
p1, p0 = w.Dark_NonFishing.sum() / w.NonFishing.sum(), row.Dark_NonFishing / row.NonFishing
H["odds_ratio"] = r(p1 / (1 - p1) / (p0 / (1 - p0)))
H["rate_ratio"] = r(p1 / p0)
hz = zs.set_index("Zone").loc["Strait of Hormuz"]
H["hormuz_large_dark_rate"] = r(hz.Large_Dark_Rate * 100, 0)

# daily dark share in the war zone (non-fishing, sea only)
nf = sar[~sar.Likely_Fishing & ~sar.On_Land_Mask]
daily = (nf[nf.War_Zone].groupby("Date").agg(n=("Is_Dark", "size"), dark=("Is_Dark", "sum")).reset_index())
daily["rate"] = daily.dark / daily.n
daily.to_parquet(OUT / "war_daily_dark.parquet", index=False)

# map layer for the Ops site: western Indian Ocean, dark non-fishing vessels of 80 m and over + AIS-visible sample
box = sar[sar.Latitude.between(-5, 35) & sar.Longitude.between(30, 80) & ~sar.On_Land_Mask & ~sar.Likely_Fishing]
dark_pts = box[box.Is_Dark & (box.Length_m >= 80)]
vis_pts = box[~box.Is_Dark].sample(min(2500, (~box.Is_Dark).sum()), random_state=7)
H["map_dark_80m"] = int(len(dark_pts))

# ---------------------------------------------------------------- Hormuz
hd = pd.read_csv(RAW / "fact_hormuz_daily.csv", parse_dates=["Date"])
hd.to_parquet(OUT / "hormuz_daily.parquet", index=False)
H["hormuz_baseline"] = r(hd.loc[hd.Date < WAR, "n_total"].mean())
H["missing_to_20sep"] = int(hd.Missing_transits_cum.iloc[-1])
H["missing_tanker_to_20sep"] = int(hd.Missing_tanker_cum.iloc[-1])
H["hormuz_27feb"] = int(hd.set_index("Date").loc["2026-02-27", "n_total"])
H["hormuz_28feb"] = int(hd.set_index("Date").loc["2026-02-28", "n_total"])
H["hormuz_1mar"] = int(hd.set_index("Date").loc["2026-03-01", "n_total"])
H["hormuz_2mar"] = int(hd.set_index("Date").loc["2026-03-02", "n_total"])

# PortWatch update to 8 Nov (same method as Code/p07_update_since_submission.py)
t = pd.read_csv(RAW / "src_hormuz_transits_portwatch_to_2026-11-08.csv", parse_dates=["date"]).rename(columns={"date": "Date"})
t = t.set_index("Date").asfreq("D").interpolate().round().astype(int).loc["2025-03-30":]
base = t.loc[:"2026-02-27"]
t["MA7"] = t.n_total.rolling(7).mean()
t["Expected"] = t.index.dayofweek.map(base.groupby(base.index.dayofweek).n_total.mean()).values
t["Expected_tanker"] = t.index.dayofweek.map(base.groupby(base.index.dayofweek).n_tanker.mean()).values
post = t.loc[WAR:]
t["Missing_cum"] = 0.0
t.loc[WAR:, "Missing_cum"] = (post.Expected - post.n_total).cumsum()
t["Pct_of_baseline"] = t.MA7 / base.n_total.mean() * 100
upd = t.reset_index()
upd.to_parquet(OUT / "hormuz_update.parquet", index=False)
H["update_end"] = str(upd.Date.max().date())
H["missing_to_update"] = int(round((post.Expected - post.n_total).sum()))
H["missing_tanker_to_update"] = int(round((post.Expected_tanker - post.n_tanker).sum()))
new = t.loc["2026-09-21":]
H["since_sub_mean"] = r(new.n_total.mean())
H["since_sub_pct"] = r(new.n_total.mean() / base.n_total.mean() * 100)
H["latest_ma7"] = r(t.MA7.iloc[-1])
H["latest_pct"] = r(t.Pct_of_baseline.iloc[-1])

sc = pd.read_csv(RAW / "fact_hormuz_scenarios.csv", parse_dates=["Date"])
sc.to_parquet(OUT / "hormuz_scenarios.parquet", index=False)
s_end = sc.set_index("Date").loc["2027-03-31"]
H["scen_mar27"] = {k: r(v, 0) for k, v in s_end.items()}  # transits per day
s8 = sc.set_index("Date").loc[H["update_end"]]
H["scen_on_update"] = {k: r(v, 1) for k, v in s8.items()}

ph = pd.read_csv(RAW / "dim_hormuz_phases.csv")
ph.to_parquet(OUT / "hormuz_phases.parquet", index=False)
ev = pd.read_csv(RAW / "dim_key_events.csv", parse_dates=["Date"])
ev.to_parquet(OUT / "key_events.parquet", index=False)

# ---------------------------------------------------------------- Conflict
cm = pd.read_csv(RAW / "fact_conflict_regional_monthly.csv", parse_dates=["Month"])
cm.to_parquet(OUT / "conflict_monthly.parquet", index=False)
cw = pd.read_csv(RAW / "fact_conflict_weekly.csv.gz", parse_dates=["Week", "Month"])
H["conflict_rows"] = int(len(cw))
cw.to_parquet(OUT / "conflict_weekly.parquet", index=False)
mar26 = cm.set_index("Month").loc["2026-03-01"]
H["strikes_mar26"] = int(round(mar26.Strikes_per_week))
avg25 = cm[cm.Month.dt.year == 2025].Strikes_per_week.mean()
H["strikes_2025_avg"] = r(avg25, 0)
H["strikes_ratio"] = r(mar26.Strikes_per_week / avg25)
# Gulf states struck in H1 2026 vs H1 2025
gs = cw[cw.Is_Strike & cw.Country.isin(["United Arab Emirates", "Kuwait", "Bahrain", "Oman", "Qatar", "Saudi Arabia"])]
s25 = gs[(gs.Week >= "2025-01-01") & (gs.Week < "2025-07-01")].groupby("Country").Events.sum()
s26 = gs[(gs.Week >= "2026-01-01") & (gs.Week < "2026-07-01")].groupby("Country").Events.sum()
H["gulf_strikes_h1"] = {c: [int(s25.get(c, 0)), int(s26.get(c, 0))] for c in sorted(set(s25.index) | set(s26.index))}
fc = pd.read_csv(RAW / "fact_conflict_forecast.csv", parse_dates=["Month"])
fc.to_parquet(OUT / "conflict_forecast.parquet", index=False)
hs = pd.read_csv(RAW / "dim_conflict_hotspots_war.csv")
hs.to_parquet(OUT / "hotspots.parquet", index=False)

# ---------------------------------------------------------------- Model, CTOI, India
for f in ["dim_chokepoint_index", "dim_dark_clusters", "fact_sar_grid_risk", "model_feature_importance",
          "india_spr_days_grid", "india_required_substitution", "dim_zone_statistics"]:
    pd.read_csv(RAW / f"{f}.csv").to_parquet(OUT / f"{f}.parquet", index=False)
ct = pd.read_csv(RAW / "dim_chokepoint_index.csv")
gr = pd.read_csv(RAW / "india_spr_days_grid.csv")
rq = pd.read_csv(RAW / "india_required_substitution.csv")
g = gr.set_index(["Retained_Hormuz_Flow", "Substitution"]).SPR_Days
H["spr_5_0"], H["spr_5_50"] = r(g.loc[(0.05, 0.0)], 0), r(g.loc[(0.05, 0.5)], 0)
H["req_sub_90"] = r(rq[(rq.Retained_Hormuz_Flow == 0.05) & (rq.Target_Days == 90)].Required_Substitution.iloc[0] * 100, 0)
H["spr_mb"] = r(5.33 * 7.33)
H["hormuz_crude_mbd"] = 2.5
clu = pd.read_csv(RAW / "dim_dark_clusters.csv")

# ---------------------------------------------------------------- Checks against the jury deck
EXPECT = dict(war_dark_rate_nf=56.6, row_dark_rate_nf=13.8, odds_ratio=8.2, missing_to_20sep=16022,
              strikes_mar26=1406, spr_5_0=16, spr_5_50=33, req_sub_90=82, hormuz_large_dark_rate=73,
              sar_detections=107257, conflict_rows=149825)
for k, v in EXPECT.items():
    got = H[k]
    assert abs(got - v) <= (0.15 if isinstance(v, float) else 1), f"{k}: expected {v}, got {got}"
assert H["missing_tanker_to_20sep"] in range(9150, 9260), H["missing_tanker_to_20sep"]
# Model and statistical results are quoted from the submitted pipeline output (report and deck)
H.update(model_auc=0.811, model_auc_no_conflict=0.789, fe_or_per_day=1.31, fe_ci=[1.19, 1.44], or_ci=[7.7, 8.7],
         its_drop=89.5, its_ci=[82, 94], its_tanker=91.5, mc_spr_p50=59, ctoi_weights=5000,
         india_share_crude=41, india_share_lng=55, india_share_lpg=88, spr_days_net_imports=9.5)

rid = hashlib.sha256(json.dumps(H, sort_keys=True).encode()).hexdigest()[:8].upper()
H["run_id"] = f"DW-{rid}"
(OUT / "headline.json").write_text(json.dumps(H, indent=1))

# ---------------------------------------------------------------- Ops site data
def recs(df, cols, nd=3):
    return [[(round(float(x), nd) if isinstance(x, (float, np.floating)) else x) for x in row] for row in df[cols].itertuples(index=False)]


hd2 = upd[["Date", "n_total", "n_tanker", "MA7", "Expected"]].copy()
hd2["Date"] = hd2.Date.dt.strftime("%Y-%m-%d")
sc2 = sc.copy(); sc2["Date"] = sc2.Date.dt.strftime("%Y-%m-%d")
cm2 = cm[cm.Month >= "2019-01-01"].copy(); cm2["Month"] = cm2.Month.dt.strftime("%Y-%m")
dd = daily.copy(); dd["Date"] = dd.Date.dt.strftime("%d %b")
ev2 = ev.copy(); ev2["Date"] = ev2.Date.dt.strftime("%Y-%m-%d")
web = dict(
    headline=H,
    hormuz=recs(hd2, ["Date", "n_total", "n_tanker", "MA7", "Expected"], 1),
    scenarios=recs(sc2, list(sc2.columns), 1),
    phases=recs(ph, ["Phase", "Start", "End", "Mean_total", "Pct_of_baseline"], 1),
    events=recs(ev2, ["Date", "Event", "Theatre"]),
    conflict=recs(cm2, ["Month", "Strikes_per_week", "Gulf_Strikes_per_week", "Fatalities_per_week"], 1),
    zones=recs(zs, ["Zone", "Detections", "NonFishing", "Dark_Rate_NonFishing", "DRNF_CI_Lo", "DRNF_CI_Hi", "Large_Dark_Rate"], 4),
    daily_dark=recs(dd, ["Date", "n", "dark", "rate"], 3),
    ctoi=recs(ct, ["Zone", "Lat", "Lon", "CTOI", "Rank_median", "Rank_p5", "Rank_p95", "P_top3",
                   "Strike_Intensity_500km", "Dark_Rate_NonFishing", "Large_Vessel_Dark_Rate"], 3),
    clusters=recs(clu, ["Cluster", "Detections", "Lat", "Lon", "Median_Length_m", "Nearest_Port", "Zone"], 3),
    dark_pts=recs(dark_pts, ["Longitude", "Latitude", "Length_m"], 2),
    vis_pts=recs(vis_pts, ["Longitude", "Latitude"], 2),
    importance=recs(pd.read_csv(RAW / "model_feature_importance.csv"), ["Feature", "Importance"], 4),
)
(ROOT / "web").mkdir(exist_ok=True)
(ROOT / "web" / "data.json").write_text(json.dumps(web, separators=(",", ":")))
print(json.dumps({k: v for k, v in H.items()}, indent=1))
print("run", H["run_id"], "| web/data.json", round((ROOT / "web" / "data.json").stat().st_size / 1e3), "kB")
