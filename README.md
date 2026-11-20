# DARK WATERS – CDM Datathon-2026, Theme 6.2

**How the 2026 Gulf war blinded maritime tracking, choked the Strait of Hormuz, and what India's Armed Forces can do about it.**

Capt Siddharth Sangwan, FCE/MCTE Mhow · UNCLASSIFIED: open-source data only

**Live dashboard:** https://darkwaters2026.streamlit.app
**Ops site (standalone, works offline):** `docs/index.html` (GitHub Pages: https://gladiator138.github.io/dark-waters/)

---

## What is in this repository

| Path | What it is |
|---|---|
| `app/app.py` | Hosted app. Opens on the **Ops site**; the 9-page **analyst dashboard** opens with `?mode=analyst` |
| `app/static/darkwaters.html`, `docs/index.html` | The Ops site as one self-contained HTML file (ECharts, data and map inlined; no internet needed) |
| `web/template.html`, `web/site.js` | Ops site source |
| `scripts/prepare_data.py` | Builds `data/processed/` and `web/data.json` from the submitted tables, with asserts on every headline number |
| `scripts/build_site.py` | Builds the Ops site into `app/static/` and `docs/` |
| `data/raw/` | The 17 cleaned tables submitted on 30 Sep 2026, plus IMF PortWatch Hormuz transits to 8 Nov 2026 |
| `data/processed/headline.json` | Every number shown anywhere, with the run ID |
| `data/cleaning_log.md` | Data preprocessing log |

## Ops site

**Department login.** The site opens on *Select your department*: HQ IDS, Navy (IFC-IOR and WNC), ISRO, DIA, MoPNG/ISPRL,
MEA and DG Shipping, the owners of recommendations R1–R6, or *All departments*. Each department gets its own tiles, its
0600 brief (Observe, Orient, Decide, Act), the orders it owns and an inbox of routed FLASH events. Press `V` to switch.

**2027 outlook** (`scripts/outlook_2027.py`): 1 forecast (Hormuz under three scenarios re-anchored on 8 Nov 2026, strike range
from history) → 2 impact on India (crude, SPR days, LNG and LPG at risk) → 3 India's actions by department.

1. **Command** (one screen): four RAG status tiles, the dark-vessel map with dark anchorages and chokepoint index, six orders (R1–R6) and the chokepoint watch-list. Select any tile, marker or order for its evidence sheet.
2. **Briefing** (scroll story): six findings, each with its chart and evidence line, then the orders.
3. **Ops console**: Decide (SPR what-if, Threat-Opacity weights) · Warn (four indicators, scenarios vs actual) · Verify (dark rate by zone, model, data and limits).

Keys: `1` `2` `3` switch views, `P` presentation mode with a 15-minute timer, `Esc` closes a sheet.

## Analyst dashboard (`?mode=analyst`)

1 Executive overview · 2 Conflict dynamics · 3 Hormuz supply shock (toggle: post-submission data) · 4 Dark vessels (interactive map filters) · 5 Predicting dark spots · 6 India decision room (live SPR and index what-ifs) · 7 Early warning & scenarios · 8 Recommendations · 9 Data, method & limits · 10 2027 outlook & departments.

## Data

* **CDM conflict events**: 149,825 weekly province rows, Dec 2014 – Jun 2026.
* **CDM Sentinel-1 radar detections**: 107,257, 1–14 Mar 2026, matched to AIS.
* **IMF PortWatch**: daily Hormuz transits. To 20 Sep 2026 at submission; extended to 8 Nov 2026 afterwards and labelled as such everywhere.

Model and statistical results (spatial-CV AUC, fixed-effects odds ratio, ITS intervals, Monte Carlo median) are quoted from the submitted pipeline; everything else is recomputed from the tables here.

## Run it

```bash
pip install -r requirements.txt
streamlit run app/app.py                 # http://localhost:8501 (Ops site), add ?mode=analyst
python scripts/prepare_data.py           # rebuild numbers (asserts against the jury deck)
cd web && npm install && cd .. && python scripts/build_site.py   # rebuild the Ops site
```
