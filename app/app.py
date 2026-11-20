"""DARK WATERS - live dashboard for CDM Datathon-2026, Theme 6.2.

    streamlit run app/app.py

Opens on the Ops site (commander view + briefing). The analyst dashboard, with the
Streamlit sidebar, opens with ?mode=analyst. Every number comes from data/processed,
written by scripts/prepare_data.py from the submitted tables. No outbound calls.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "data" / "processed"
H = json.loads((P / "headline.json").read_text())
SITE = ROOT / "app" / "static" / "darkwaters.html"
SITE_URL = "https://darkwaters2026.streamlit.app"

T = dict(bg="#07131F", panel="#0F2236", panel2="#16304A", border="#24425F", text="#E6EDF4", text2="#AFC0D0",
         text3="#7F93A8", amber="#F0B03A", amber_bg="#2A2412", red="#E5484D", teal="#2BB3A3", cyan="#4FC3F7",
         violet="#9A7BFF", green="#3FB950", muted="#5D7186")

ANALYST = st.query_params.get("mode", "") == "analyst"
st.set_page_config(page_title="Dark Waters | CDM Datathon-2026", page_icon="🛰️", layout="wide",
                   initial_sidebar_state="expanded" if ANALYST else "collapsed")

st.markdown(f"""
<style>
html, body, [class*="css"] {{ font-size: 18px; }}
.block-container {{ padding-top: 1.2rem; padding-bottom: 2rem; max-width: 1500px; }}
h1 {{ font-size: 2.2rem !important; }} h2 {{ font-size: 1.6rem !important; }} h3 {{ font-size: 1.3rem !important; }}
section[data-testid="stSidebar"] {{ background: {T['panel']}; border-right: 1px solid {T['border']}; }}
.kicker {{ color: {T['amber']}; font-weight: 700; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: -0.4rem; }}
.card {{ background: {T['panel']}; border: 1px solid {T['border']}; border-radius: 12px; padding: 16px 18px; height: 100%; }}
.card .lab {{ color: {T['text3']}; font-size: 0.8rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }}
.card .big {{ font-size: 2.4rem; font-weight: 800; line-height: 1.1; margin: 6px 0 4px 0; }}
.card .sub {{ color: {T['text2']}; font-size: 0.95rem; }}
.sowhat {{ background: {T['amber_bg']}; border: 1px solid {T['amber']}; border-radius: 10px; padding: 12px 18px;
          color: {T['text']}; font-size: 1.02rem; margin: 10px 0 18px 0; }}
.sowhat b {{ color: {T['amber']}; letter-spacing: 1.5px; margin-right: 10px; }}
.tag {{ border-radius: 6px; padding: 1px 8px; font-weight: 700; font-size: 0.75rem; color: {T['bg']}; }}
.footer {{ color: {T['muted']}; font-size: 0.8rem; letter-spacing: 1.5px; margin-top: 30px; }}
table.recs td, table.recs th {{ border-bottom: 1px solid {T['border']}; padding: 8px 6px; vertical-align: top; text-align: left; }}
</style>
""", unsafe_allow_html=True)


def kicker(t):
    st.markdown(f'<div class="kicker">{t}</div>', unsafe_allow_html=True)


def sowhat(t, label="SO WHAT"):
    st.markdown(f'<div class="sowhat"><b>{label}</b>{t}</div>', unsafe_allow_html=True)


def card(label, big, sub, color=None):
    st.markdown(f'<div class="card"><div class="lab">{label}</div><div class="big" style="color:{color or T["amber"]}">'
                f'{big}</div><div class="sub">{sub}</div></div>', unsafe_allow_html=True)


def layout(fig, h=430, **kw):
    fig.update_layout(template="plotly_dark", paper_bgcolor=T["bg"], plot_bgcolor=T["bg"], height=h,
                      font=dict(color=T["text2"], size=14), margin=dict(l=10, r=10, t=50, b=10),
                      legend=dict(orientation="h", y=-0.12, x=0, yanchor="top"), **kw)
    fig.update_xaxes(gridcolor="#13263A"); fig.update_yaxes(gridcolor="#13263A")
    return fig


def show(fig, h=430, **kw):
    st.plotly_chart(layout(fig, h, **kw), theme=None, config={"displaylogo": False})


def download(df, name):
    st.download_button("⬇ Download CSV", df.to_csv(index=False).encode(), file_name=f"{name}.csv", mime="text/csv",
                       key=f"dl_{name}")


def geo(fig, lat=(-5, 35), lon=(22, 92)):
    fig.update_geos(projection_type="equirectangular", lataxis_range=list(lat), lonaxis_range=list(lon), showcountries=True,
                    countrycolor="#2A4560", showland=True, landcolor="#10202F", showocean=True, oceancolor="#06101A",
                    coastlinecolor="#3B5B7A", bgcolor=T["bg"], showframe=False)
    return fig


@st.cache_data(show_spinner=False)
def load(name):
    return pd.read_parquet(P / f"{name}.parquet")


# ---------------------------------------------------------------------------------------- navigation
PAGES = ["1 · Executive overview", "2 · Conflict dynamics", "3 · Hormuz supply shock", "4 · Dark vessels",
         "5 · Predicting dark spots", "6 · India decision room", "7 · Early warning & scenarios",
         "8 · Recommendations", "9 · Data, method & limits", "10 · 2027 outlook & departments"]

if not ANALYST:
    st.markdown("""<style>header[data-testid="stHeader"], section[data-testid="stSidebar"],
    div[data-testid="collapsedControl"] {display:none !important;}
    .block-container {padding: 0 !important; max-width: 100% !important;}</style>""", unsafe_allow_html=True)
    if SITE.exists():
        st.iframe(SITE, height=960)
    else:
        st.warning("Ops site not built. Run `python scripts/build_site.py`.")
    st.stop()

with st.sidebar:
    st.markdown(f"### 🛰️ DARK WATERS")
    st.caption("CDM Datathon-2026 · Theme 6.2 · Global Conflicts: Impact on Supply Chains")
    page = st.radio("Page", PAGES, label_visibility="collapsed")
    st.divider()
    st.link_button("🛰️ Back to the Ops site", "./", width="stretch")
    st.caption(f"RUN {H['run_id']} · UNCLASSIFIED · open-source data only")

# ---------------------------------------------------------------------------------------- 1 overview
if page.startswith("1 "):
    kicker("Executive overview")
    st.title("The Strait closed, the ships went dark, and India's buffer is thin")
    c = st.columns(4)
    with c[0]: card("Hormuz transits", f"−{H['its_drop']:.0f}%", f"immediate drop on 28 Feb 2026 (95% CI {H['its_ci'][0]}–{H['its_ci'][1]}%)", T["red"])
    with c[1]: card("Voyages lost", f"{H['missing_to_update']:,}", f"to {pd.Timestamp(H['update_end']):%d %b %Y} ({H['missing_to_20sep']:,} at submission)", T["red"])
    with c[2]: card("War-zone ships dark", f"{H['war_dark_rate_nf']}%", f"non-fishing, vs {H['row_dark_rate_nf']}% rest of world · {H['odds_ratio']}× odds", T["amber"])
    with c[3]: card("SPR cover", f"{H['spr_5_0']:.0f}–{H['spr_5_50']:.0f} d", f"at 5% retained flow; {H['req_sub_90']:.0f}% substitution needed for 90 days", T["cyan"])
    st.write("")
    a, b = st.columns([1.4, 1])
    with a:
        u = load("hormuz_update")
        fig = go.Figure()
        fig.add_scatter(x=u.Date, y=u.n_total, name="Daily transits", line=dict(color=T["muted"], width=1))
        fig.add_scatter(x=u.Date, y=u.MA7, name="7-day average", line=dict(color=T["amber"], width=3))
        fig.add_vline(x="2026-02-28", line_color=T["red"], line_dash="dash")
        fig.add_vline(x="2026-09-20", line_color=T["text3"], line_dash="dot")
        fig.add_annotation(x="2026-02-28", y=110, text="War, 28 Feb", showarrow=False, font=dict(color=T["red"]), xanchor="left")
        fig.add_annotation(x="2026-09-20", y=110, text="Submission cut-off", showarrow=False, font=dict(color=T["text3"]), xanchor="left")
        fig.update_layout(title="Strait of Hormuz: ships per day (IMF PortWatch)")
        show(fig, 420)
    with b:
        z = load("dim_zone_statistics").sort_values("Dark_Rate_NonFishing")
        col = [T["red"] if zz in ("Strait of Hormuz", "Gulf of Oman", "Persian Gulf") else T["muted"] for zz in z.Zone]
        fig = go.Figure(go.Bar(x=z.Dark_Rate_NonFishing * 100, y=z.Zone, orientation="h", marker_color=col,
                               error_x=dict(type="data", symmetric=False, array=(z.DRNF_CI_Hi - z.Dark_Rate_NonFishing) * 100,
                                            arrayminus=(z.Dark_Rate_NonFishing - z.DRNF_CI_Lo) * 100, color=T["text3"])))
        fig.update_layout(title="Non-fishing ships with no AIS, % (95% CI)", xaxis_title="% dark")
        show(fig, 420)
    sowhat("Traffic and AIS darkness moved before strike counts did, and the gap persisted. In the next crisis the maritime "
           "picture must be radar-verified, not built only on signals ships choose to send.")

# ---------------------------------------------------------------------------------------- 2 conflict
elif page.startswith("2"):
    kicker("Finding 1 · Conflict dynamics")
    st.title("The war was a structural break, and strikes spread to the shores of the Strait")
    cm = load("conflict_monthly")
    c = st.columns(3)
    with c[0]: card("Strikes per week, Mar 2026", f"{H['strikes_mar26']:,}", "highest in the 2017–2026 series", T["red"])
    with c[1]: card("vs 2025 average", f"{H['strikes_ratio']}×", f"2025 averaged {H['strikes_2025_avg']:.0f} a week")
    with c[2]: card("Gulf states newly struck", "4", "UAE, Kuwait, Bahrain, Oman: none in H1 2025", T["amber"])
    st.write("")
    yr = st.slider("From year", 2017, 2026, 2019)
    d = cm[cm.Month.dt.year >= yr]
    fig = go.Figure()
    fig.add_bar(x=d.Month, y=d.Strikes_per_week, name="Strikes per week (region)", marker_color=T["red"], opacity=0.85)
    fig.add_scatter(x=d.Month, y=d.Gulf_Strikes_per_week, name="Gulf strikes per week", line=dict(color=T["amber"], width=3), yaxis="y2")
    fig.update_layout(title="Air, drone, missile and shelling strikes, monthly average per week",
                      yaxis2=dict(overlaying="y", side="right", showgrid=False, title="Gulf"))
    show(fig, 440)
    a, b = st.columns(2)
    with a:
        g = pd.DataFrame([(k, v[0], v[1]) for k, v in H["gulf_strikes_h1"].items()], columns=["Country", "H1 2025", "H1 2026"])
        fig = go.Figure()
        fig.add_bar(x=g.Country, y=g["H1 2025"], name="H1 2025", marker_color=T["muted"])
        fig.add_bar(x=g.Country, y=g["H1 2026"], name="H1 2026", marker_color=T["red"])
        fig.update_layout(title="Strike events in GCC states, first half-year", barmode="group")
        show(fig, 380)
    with b:
        hs = load("hotspots").nlargest(400, "Strikes")
        fig = go.Figure(go.Scattergeo(lon=hs.Longitude, lat=hs.Latitude, text=hs.Country + " · " + hs.Province,
                                      marker=dict(size=np.clip(np.sqrt(hs.Strikes) / 2, 3, 30), color=T["red"], opacity=0.6,
                                                  line=dict(width=0)), hovertemplate="%{text}<br>%{customdata} strikes<extra></extra>",
                                      customdata=hs.Strikes))
        fig.update_layout(title="Where the strikes fell during the war (province centroids)")
        show(geo(fig, (12, 42), (26, 66)), 380)
    sowhat("Strike counts confirm that a war has started; they gave near-zero warning in the Gulf before the week of the attack.")
    download(cm, "conflict_monthly")

# ---------------------------------------------------------------------------------------- 3 hormuz
elif page.startswith("3"):
    kicker("Finding 2 · Hormuz supply shock")
    st.title("Traffic fell about 90% in 72 hours and has not come back")
    upd = st.toggle(f"Include post-submission PortWatch data to {pd.Timestamp(H['update_end']):%d %b %Y}", value=True)
    u = load("hormuz_update") if upd else load("hormuz_daily").rename(columns={"MA7_total": "MA7", "Missing_transits_cum": "Missing_cum"})
    c = st.columns(4)
    with c[0]: card("Pre-war baseline", f"{H['hormuz_baseline']:.0f}/day", "30 Mar 2025 – 27 Feb 2026", T["text"])
    with c[1]: card("First 72 hours", f"{H['hormuz_28feb']}→{H['hormuz_1mar']}→{H['hormuz_2mar']}", "ships on 28 Feb, 1 Mar, 2 Mar", T["red"])
    with c[2]: card("ITS immediate drop", f"{H['its_drop']}%", f"95% CI {H['its_ci'][0]}–{H['its_ci'][1]}% · tankers {H['its_tanker']}%")
    with c[3]:
        lost = H["missing_to_update"] if upd else H["missing_to_20sep"]
        tank = H["missing_tanker_to_update"] if upd else H["missing_tanker_to_20sep"]
        card("Transits lost", f"{lost:,}", f"{tank:,} of them tankers", T["red"])
    st.write("")
    win = st.select_slider("Window", ["Full series", "War onwards", "First 30 days"], value="Full series")
    d = u if win == "Full series" else u[u.Date >= "2026-02-20"] if win == "War onwards" else u[(u.Date >= "2026-02-20") & (u.Date <= "2026-03-30")]
    fig = go.Figure()
    fig.add_bar(x=d.Date, y=d.n_tanker, name="Tankers", marker_color=T["amber"])
    fig.add_bar(x=d.Date, y=d.n_total - d.n_tanker, name="Cargo and other", marker_color=T["cyan"], opacity=0.7)
    exp = d["Expected"] if "Expected" in d else d["Expected_total"]
    fig.add_scatter(x=d.Date, y=exp, name="Expected (pre-war weekday mean)", line=dict(color=T["text3"], dash="dot"))
    for _, p in load("hormuz_phases").iloc[1:].iterrows():
        fig.add_vrect(x0=p.Start, x1=p.End, fillcolor=T["red"], opacity=0.05, line_width=0)
    fig.update_layout(barmode="stack", title="Daily transits by vessel type")
    show(fig, 440)
    a, b = st.columns([1, 1])
    with a:
        fig = go.Figure(go.Scatter(x=u.Date, y=u.Missing_cum, fill="tozeroy", line=dict(color=T["red"])))
        fig.update_layout(title="Cumulative voyages lost since 28 Feb 2026")
        show(fig, 340)
    with b:
        ph = load("hormuz_phases")
        st.markdown("**Conflict phases**")
        st.dataframe(ph[["Phase", "Start", "End", "Mean_total", "Pct_of_baseline", "Tanker_share"]]
                     .rename(columns={"Mean_total": "Ships/day", "Pct_of_baseline": "% of pre-war", "Tanker_share": "Tanker share"}),
                     hide_index=True, width="stretch")
        if upd:
            st.caption(f"Since submission (21 Sep–{pd.Timestamp(H['update_end']):%d %b}): {H['since_sub_mean']} ships/day, "
                       f"{H['since_sub_pct']}% of pre-war. Latest 7-day average {H['latest_ma7']}.")
    sowhat("A ~90% fall persisting for over eight months is a supply shock, not a disruption. Planning must assume the Strait "
           "can stay near-closed for a season.")
    download(u, "hormuz_daily")

# ---------------------------------------------------------------------------------------- 4 dark vessels
elif page.startswith("4"):
    kicker("Finding 3 · Dark vessels: radar vs AIS")
    st.title("The ships did not vanish, they went dark")
    sar = load("sar")
    c = st.columns(4)
    with c[0]: card("Radar detections", f"{H['sar_detections']:,}", "Sentinel-1, 1–14 Mar 2026, worldwide", T["text"])
    with c[1]: card("War zone dark", f"{H['war_dark_rate_nf']}%", f"{H['war_dark_nf']:,} of {H['war_nonfishing']:,} non-fishing ships", T["red"])
    with c[2]: card("Odds of being dark", f"{H['odds_ratio']}×", f"95% CI {H['or_ci'][0]}–{H['or_ci'][1]} · {H['rate_ratio']}× the rate")
    with c[3]: card("Large ships dark in Strait", f"{H['hormuz_large_dark_rate']:.0f}%", "over 100 m", T["red"])
    st.write("")
    f1, f2, f3 = st.columns(3)
    show_fish = f1.checkbox("Include likely fishing craft", False)
    min_len = f2.slider("Minimum length (m)", 0, 250, 80, 10)
    layer = f3.radio("Show", ["Dark only", "Dark + AIS-visible"], horizontal=True)
    m = sar[sar.Latitude.between(-5, 35) & sar.Longitude.between(30, 80) & ~sar.On_Land_Mask & (sar.Length_m >= min_len)]
    if not show_fish:
        m = m[~m.Likely_Fishing]
    fig = go.Figure()
    if layer != "Dark only":
        v = m[~m.Is_Dark]
        v = v.sample(min(len(v), 6000), random_state=1)
        fig.add_scattergeo(lon=v.Longitude, lat=v.Latitude, name="AIS-visible", mode="markers",
                           marker=dict(size=3, color=T["cyan"], opacity=0.45))
    dk = m[m.Is_Dark]
    fig.add_scattergeo(lon=dk.Longitude, lat=dk.Latitude, name=f"Dark ({len(dk):,})", mode="markers",
                       marker=dict(size=4, color=T["red"], opacity=0.75),
                       text=dk.Zone + " · " + dk.Length_m.round(0).astype(int).astype(str) + " m", hoverinfo="text")
    clu = load("dim_dark_clusters")
    fig.add_scattergeo(lon=clu.Lon, lat=clu.Lat, name="Dark anchorages (DBSCAN)", mode="markers",
                       marker=dict(size=np.clip(np.sqrt(clu.Detections) * 1.4, 6, 40), color="rgba(0,0,0,0)",
                                   line=dict(color=T["amber"], width=2)),
                       text=clu.Nearest_Port + ": " + clu.Detections.astype(str) + " dark", hoverinfo="text")
    fig.update_layout(title="Western Indian Ocean, 1–14 Mar 2026")
    show(geo(fig), 560)
    a, b = st.columns(2)
    with a:
        dd = load("war_daily_dark")
        fig = go.Figure()
        fig.add_bar(x=dd.Date, y=dd.rate * 100, marker_color=T["red"], text=dd.n, hovertemplate="%{y:.0f}% of %{text} ships<extra></extra>")
        fig.update_layout(title="Daily dark share in the war zone, non-fishing (%)")
        show(fig, 360)
        st.caption(f"Raw daily shares follow where the satellite looked. The fixed-effects model, within the same 1° cell, gives "
                   f"+31% odds per day (OR {H['fe_or_per_day']}, 95% CI {H['fe_ci'][0]}–{H['fe_ci'][1]}).")
    with b:
        st.markdown("**Largest dark anchorages**")
        st.dataframe(clu.nlargest(8, "Detections")[["Nearest_Port", "Zone", "Detections", "Median_Length_m", "Days"]]
                     .rename(columns={"Median_Length_m": "Median length (m)"}).round(0), hide_index=True, width="stretch")
    sowhat("Three tests (controls for size and geography, same-place daily escalation, and clustering off Dubai, Fujairah and "
           "Bandar Abbas) show going dark is a response to the war, not an accident of where ships sit.")

# ---------------------------------------------------------------------------------------- 5 model
elif page.startswith("5"):
    kicker("Finding 4 · Predicting dark spots")
    st.title("AIS dark spots can be predicted in sea areas the model has never seen")
    c = st.columns(3)
    with c[0]: card("AUC on unseen seas", f"{H['model_auc']}", "5° spatial-block cross-validation", T["green"])
    with c[1]: card("Without conflict features", f"{H['model_auc_no_conflict']}", "ablation: conflict adds real skill")
    with c[2]: card("Use", "Risk-based", "SAR tasking and escort planning before the imagery arrives", T["cyan"])
    g = load("fact_sar_grid_risk")
    tiers = st.multiselect("Risk tiers", ["Very high", "High", "Moderate", "Low"], ["Very high", "High", "Moderate"])
    region = st.radio("Region", ["Western Indian Ocean", "World"], horizontal=True)
    gg = g[g.Risk_Tier.isin(tiers)]
    fig = go.Figure(go.Scattergeo(lon=gg.Grid_Lon, lat=gg.Grid_Lat, mode="markers",
                                  marker=dict(size=7, symbol="square", color=gg.Pred_Dark_Prob, colorscale="YlOrRd",
                                              cmin=0, cmax=1, colorbar=dict(title="P(dark)")),
                                  text=gg.Zone + "<br>predicted " + (gg.Pred_Dark_Prob * 100).round(0).astype(int).astype(str)
                                  + "% · observed " + (gg.Observed_Dark_Rate * 100).round(0).astype(int).astype(str) + "%",
                                  hoverinfo="text"))
    fig.update_layout(title="Predicted probability that a non-fishing ship is dark, per 1° cell")
    show(geo(fig) if region.startswith("Western") else geo(fig, (-55, 75), (-180, 180)), 520)
    a, b = st.columns(2)
    with a:
        fi = load("model_feature_importance").sort_values("Importance")
        fig = go.Figure(go.Bar(x=fi.Importance, y=fi.Feature, orientation="h", marker_color=T["amber"]))
        fig.update_layout(title="Permutation importance (gradient boosting, 11 features)")
        show(fig, 380)
    with b:
        rel = g[g.NonFishing_Detections >= 20]
        fig = go.Figure(go.Scatter(x=rel.Pred_Dark_Prob, y=rel.Observed_Dark_Rate, mode="markers",
                                   marker=dict(size=np.clip(np.sqrt(rel.NonFishing_Detections), 4, 20), color=T["cyan"], opacity=0.6),
                                   text=rel.Zone, hoverinfo="text+x+y"))
        fig.add_scatter(x=[0, 1], y=[0, 1], mode="lines", line=dict(color=T["text3"], dash="dot"), showlegend=False)
        fig.update_layout(title="Observed vs predicted dark rate (cells with 20+ ships)", xaxis_title="Predicted",
                          yaxis_title="Observed", showlegend=False)
        show(fig, 380)
    sowhat("The model reproduces the Gulf hotspot without having seen it. That makes risk-based SAR tasking possible days "
           "before imagery confirms a dark fleet.")
    download(g, "sar_grid_risk")

# ---------------------------------------------------------------------------------------- 6 india
elif page.startswith("6"):
    kicker("Finding 5 · India decision room")
    st.title("For India, the ability to substitute crude matters more than the size of the reserve")
    c = st.columns(4)
    with c[0]: card("Crude via Hormuz", f"{H['india_share_crude']}%", "of India's crude imports", T["amber"])
    with c[1]: card("LNG via Hormuz", f"{H['india_share_lng']}%", "of India's LNG imports", T["amber"])
    with c[2]: card("LPG via Hormuz", f"{H['india_share_lpg']}%", "of India's LPG imports", T["red"])
    with c[3]: card("SPR alone", f"{H['spr_days_net_imports']} d", f"of net imports ({H['spr_mb']} mn bbl)", T["cyan"])
    st.write("")
    st.subheader("What-if: how long does the Strategic Petroleum Reserve last?")
    s1, s2, s3 = st.columns(3)
    Hm = s1.slider("India crude via Hormuz, pre-war (mb/d)", 2.0, 2.7, 2.5, 0.1)
    ret = s2.slider("Hormuz flow still arriving (%)", 0, 100, 5, 5)
    sub = s3.slider("Gap replaced by other suppliers (%)", 0, 100, 50, 5)
    spr = st.slider("SPR size (million barrels; Phase-II adds ~48)", 20.0, 100.0, float(H["spr_mb"]), 1.0)
    gap = Hm * (1 - ret / 100) * (1 - sub / 100)
    days = spr / gap if gap > 0 else np.inf
    need = max(0.0, 1 - spr / (90 * Hm * (1 - ret / 100))) if ret < 100 else 0
    c = st.columns(3)
    col = T["red"] if days < 30 else T["amber"] if days < 90 else T["green"]
    with c[0]: card("Net deficit", f"{gap:.2f} mb/d", "after retained flow and substitution", T["text"])
    with c[1]: card("SPR lasts", "∞" if not np.isfinite(days) else f"{days:.0f} days", "at that deficit", col)
    with c[2]: card("Substitution for 90 days", f"{need * 100:.0f}%", "of the lost Hormuz crude", T["amber"])
    gr = load("india_spr_days_grid")
    piv = gr.pivot(index="Retained_Hormuz_Flow", columns="Substitution", values="SPR_Days").clip(upper=365)
    fig = go.Figure(go.Heatmap(z=piv.values, x=(piv.columns * 100).round(0), y=(piv.index * 100).round(0), colorscale="RdYlGn",
                               zmin=0, zmax=180, colorbar=dict(title="Days"),
                               hovertemplate="retained %{y}% · substitution %{x}%<br>%{z:.0f} days<extra></extra>"))
    fig.add_scatter(x=[sub], y=[ret], mode="markers", marker=dict(size=16, color="white", symbol="x"), showlegend=False)
    fig.update_layout(title="SPR days (39 mn bbl, 2.5 mb/d) by retained flow and substitution", xaxis_title="Substitution %",
                      yaxis_title="Retained Hormuz flow %")
    show(fig, 440)
    st.caption(f"Monte Carlo over the parameter ranges gives a median of {H['mc_spr_p50']} days. Inputs are ranges from "
               "secondary sources (PPAC, ISPRL, Kpler); treat outputs as planning bands, not forecasts.")

    st.subheader("Chokepoint Threat-Opacity Index: set your own weights")
    w1, w2, w3 = st.columns(3)
    a1 = w1.slider("Strike intensity within 500 km", 0.0, 1.0, 0.33, 0.01)
    a2 = w2.slider("Non-fishing dark rate", 0.0, 1.0, 0.33, 0.01)
    a3 = w3.slider("Large-vessel dark rate", 0.0, 1.0, 0.33, 0.01)
    ct = load("dim_chokepoint_index").copy()
    tot = a1 + a2 + a3 or 1
    ct["Your index"] = ((ct.n_Strike_Intensity_500km * a1 + ct.n_Dark_Rate_NonFishing * a2 + ct.n_Large_Vessel_Dark_Rate * a3) / tot * 100).round(1)
    ct = ct.sort_values("Your index", ascending=False)
    fig = go.Figure(go.Bar(x=ct.Zone, y=ct["Your index"], marker_color=[T["red"] if i < 3 else T["muted"] for i in range(len(ct))]))
    fig.update_layout(title="Threat-Opacity Index (0–100) with your weights")
    show(fig, 360)
    st.caption(f"Across {H['ctoi_weights']:,} random weightings, Hormuz, Gulf of Oman and Persian Gulf stay top 3 in more than 99% of runs.")
    sowhat(f"At 5% retained flow the SPR lasts {H['spr_5_0']:.0f} days with no substitution and {H['spr_5_50']:.0f} with 50%. "
           f"Reaching 90 days needs {H['req_sub_90']:.0f}% substitution: a contracting and shipping task, not a storage one.")

# ---------------------------------------------------------------------------------------- 7 warning
elif page.startswith("7"):
    kicker("Early warning & scenarios")
    st.title("Event data says a war has started; shipping behaviour says one is coming")
    u = load("hormuz_update")
    sc = load("hormuz_scenarios")
    fig = go.Figure()
    fig.add_scatter(x=u.Date, y=u.MA7, name="Actual, 7-day average", line=dict(color=T["amber"], width=3))
    colors = [T["green"], T["cyan"], T["red"]]
    names = ["S1 Negotiated reopening", "S2 Managed passage", "S3 Protracted (Red Sea pattern)"]
    for col, n, cc in zip(sc.columns[1:], names, colors):
        fig.add_scatter(x=sc.Date, y=sc[col], name=n, line=dict(color=cc, dash="dash"))
    for _, e in load("key_events").iterrows():
        if e.Date >= pd.Timestamp("2025-06-01"):
            fig.add_vline(x=e.Date, line_color="#2A4560", line_width=1)
    fig.add_vrect(x0="2025-11-01", x1="2026-02-27", fillcolor=T["amber"], opacity=0.07, line_width=0,
                  annotation_text="pre-war softening", annotation_position="top left")
    fig.update_layout(title="Hormuz ships per day: actual against the three planning scenarios (submitted 20 Sep)")
    show(fig, 480)
    c = st.columns(3)
    for i, (k, n) in enumerate(zip(sc.columns[1:], names)):
        with c[i]:
            card(n, f"{H['scen_mar27'][k]:.0f}/day", f"by Mar 2027 · on {pd.Timestamp(H['update_end']):%d %b} the path was "
                 f"{H['scen_on_update'][k]}/day; actual {H['latest_ma7']}", colors[i])
    st.write("")
    sowhat(f"Seven weeks after submission, traffic is tracking the protracted scenario (S3): {H['latest_ma7']} ships/day against "
           f"{H['scen_on_update']['S3_Protracted_RedSea_analogue']} on the S3 path. No strike forecast beat a naive benchmark, "
           "so planning uses scenarios and behavioural indicators, not strike counts.")
    ev = load("key_events")
    st.dataframe(ev.assign(Date=ev.Date.dt.strftime("%d %b %Y")), hide_index=True, width="stretch")

# ---------------------------------------------------------------------------------------- 8 recs
elif page.startswith("8"):
    kicker("Recommendations")
    st.title("Six recommendations, each with an owner and a timeline")
    R = [("R1", "SENSE", "SAR-verified maritime picture", "Fuse SAR detections with AIS at IFC-IOR; auto-flag dark vessels of 80 m and over near chokepoints", "Navy / IFC-IOR, ISRO", "90 days"),
         ("R2", "WARN", "Chokepoint early-warning dashboard", "Four behavioural indicators: transits, dark rate, war-risk premium, GNSS interference. This dashboard is the prototype.", "HQ IDS / DIA", "60 days"),
         ("R3", "SHIELD", "Risk-based escorts and ISR", "Allocate by the Threat-Opacity Index, refreshed monthly; add Bab el-Mandeb to SAR tasking", "Navy (WNC)", "Immediate"),
         ("R4", "SUSTAIN", "Energy resilience targets", "At least 82% crude-substitution capability; LPG reserve of 30 days or more; SPR Phase-II", "MoPNG / ISPRL", "6–12 months"),
         ("R5", "SUSTAIN", "Two-chokepoint contingency", "Joint plan for Hormuz and Bab el-Mandeb closing together; bypass pipelines exit via the Red Sea", "HQ IDS / MEA / MoPNG", "90 days"),
         ("R6", "SHIELD", "Navigation resilience", "NavIC-capable receivers and GNSS-interference reporting for Indian-flag Gulf traders", "DG Shipping / Navy", "6 months")]
    html = '<table class="recs" style="width:100%"><tr><th>#</th><th>Line</th><th>Action</th><th>What</th><th>Owner</th><th>When</th></tr>'
    for r_ in R:
        html += f'<tr><td><b>{r_[0]}</b></td><td style="color:{T["amber"]}">{r_[1]}</td><td><b>{r_[2]}</b></td><td>{r_[3]}</td><td>{r_[4]}</td><td>{r_[5]}</td></tr>'
    st.markdown(html + "</table>", unsafe_allow_html=True)
    st.write("")
    sowhat("A radar-verified, behaviour-driven, continuously refreshed maritime picture is achievable with open data and "
           "tools we already have.", "BOTTOM LINE")

# ---------------------------------------------------------------------------------------- 10 outlook
elif page.startswith("10"):
    O = json.loads((P / "outlook_2027.json").read_text())
    kicker("2027 outlook · scenario range, not a validated forecast")
    st.title("2027: forecast, impact on India, India's actions")
    dep = st.selectbox("Department", ["All departments"] + [v["short"] for v in O["depts"].values()])
    st.subheader("1 · Forecast: Hormuz traffic in 2027")
    c = st.columns(3)
    for i, k in enumerate(["S1", "S2", "S3"]):
        s_ = O["scenarios"][k]
        with c[i]:
            card(f"{k} · {s_['name']}" + (" · DATA TRACKING" if k == O["tracking"] else ""), f"{s_['mean_2027']}/day",
                 f"{s_['pct_2027']}% of pre-war · {s_['voyages_lost_2027']:,} voyages lost in 2027 · fit error {O['rmse'][k]}",
                 [T["green"], T["cyan"], T["red"]][i])
    pa = load("hormuz_2027_paths"); u = load("hormuz_update")
    fig = go.Figure()
    fig.add_scatter(x=u.Date, y=u.MA7, name="Actual, 7-day", line=dict(color=T["amber"], width=3))
    for k, cc in zip(["S1", "S2", "S3"], [T["green"], T["cyan"], T["red"]]):
        fig.add_scatter(x=pa.Date, y=pa[k], name=f"{k} {O['scenarios'][k]['name']}", line=dict(color=cc, dash="dash"))
    fig.update_layout(title=f"Hormuz ships per day, paths re-anchored on {pd.Timestamp(O['data_end']):%d %b %Y}")
    show(fig, 420)
    s27 = O["strikes_2027"]
    st.caption(f"Regional strikes in 2027: {s27['p10']:,}–{s27['p90']:,} a week (80% range from {s27['n_origins']} historical windows), "
               f"median {s27['p50']:,}, against {s27['avg_2025']:.0f} in 2025.")
    st.subheader("2 · Impact on India in 2027")
    rows = [("Hormuz flow still arriving", "retained_pct", "%"), ("Crude gap via Hormuz", "crude_gap_mbd", " mb/d"),
            ("Crude to replace over the year", "crude_to_replace_mn_bbl", " mn bbl"), ("SPR lasts, no substitution", "spr_days_0", " days"),
            ("SPR lasts, 50% substitution", "spr_days_50", " days"), ("Substitution for 90 days", "sub_for_90", "%"),
            ("Crude imports at risk", "crude_at_risk_pct", "%"), ("LNG imports at risk", "lng_at_risk_pct", "%"), ("LPG imports at risk", "lpg_at_risk_pct", "%")]
    st.dataframe(pd.DataFrame([[n] + [f"{O['impact'][k][f]}{u_}" for k in ["S1", "S2", "S3"]] for n, f, u_ in rows],
                              columns=["2027 average", "S1", "S2", "S3"]), hide_index=True, width="stretch")
    st.subheader("3 · India's actions, by department")
    for k, d in O["depts"].items():
        if dep != "All departments" and d["short"] != dep:
            continue
        with st.expander(f"{d['short']} · {d['name']} · owns {', '.join(d['recs'])}", expanded=dep != "All departments"):
            for when, what in O["actions"][k]:
                st.markdown(f"**{when}.** {what}")
    st.caption(O["note"])

# ---------------------------------------------------------------------------------------- 9 data
else:
    kicker("Data, method & limits")
    st.title("Two CDM datasets, one open source, and a reproducible pipeline")
    c = st.columns(3)
    with c[0]: card("CDM conflict events", f"{H['conflict_rows']:,}", "weekly, by province, 2014 – Jun 2026: the cause", T["text"])
    with c[1]: card("CDM Sentinel-1 detections", f"{H['sar_detections']:,}", "1–14 Mar 2026, matched to AIS: the behaviour", T["text"])
    with c[2]: card("IMF PortWatch", "589 days", f"daily Hormuz transits to {pd.Timestamp(H['update_end']):%d %b %Y}: the time axis", T["text"])
    st.write("")
    t1, t2, t3 = st.tabs(["Cleaning log", "Methods", "Limits"])
    with t1:
        st.markdown((ROOT / "data" / "cleaning_log.md").read_text(encoding="utf-8"))
    with t2:
        st.markdown("""
| Question | Method | Why not the simpler option |
|---|---|---|
| Measuring dark shipping | Radar detections unmatched to AIS | Gaps in AIS tracks cannot see ships that never transmit |
| Population compared | Non-fishing vessels only | All detections would make India's coast look 75% dark, a false alarm |
| Size of the Hormuz shock | Interrupted time series (negative binomial, HAC errors) | Before/after average ignores trend and weekly cycle |
| Is darkness escalating? | Location fixed effects, SEs clustered by radar scene | A daily trend is an artefact of where the satellite looked |
| Model validation | 5° spatial-block cross-validation and ablation | A random split leaks neighbouring ships and inflates AUC |
| Forecasting strikes | ARIMA/ETS vs a naive benchmark | A forecast that cannot beat "no change" misleads planners |
| Ranking chokepoints | Composite index with 5,000 random weightings | Fixed weights hide how arbitrary a ranking can be |
""")
    with t3:
        st.markdown("""
* **14 days of radar only.** The long-run trend comes from PortWatch.
* **Dark** includes spoofed AIS as well as AIS switched off; it does not prove intent.
* **PortWatch counts are AIS-based**, so they are a lower bound during the war.
* **Stress-test inputs** (crude volumes, substitution) are ranges from secondary sources.
* Conflict coordinates are province centroids; sea events use placeholder points (845 fixed during cleaning).
""")
    st.caption(f"Run ID {H['run_id']}: a hash of every headline number. The same ID is printed on the Ops site.")

st.markdown(f'<div class="footer">DARK WATERS · CDM DATATHON-2026 · THEME 6.2 · CAPT SIDDHARTH SANGWAN, FCE/MCTE MHOW · '
            f'RUN {H["run_id"]} · UNCLASSIFIED: OPEN-SOURCE DATA ONLY</div>', unsafe_allow_html=True)
