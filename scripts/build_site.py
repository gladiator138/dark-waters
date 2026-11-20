"""Build the Dark Waters Ops site as one self-contained HTML file.

    python scripts/prepare_data.py   # 1. frozen numbers -> web/data.json (asserts)
    python scripts/build_site.py     # 2. -> app/static/darkwaters.html (served inside Streamlit)
                                     #    -> docs/index.html (GitHub Pages / USB backup, works offline)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
W = ROOT / "web"
SITE_URL = "https://darkwaters2026.streamlit.app"
geo = json.loads((ROOT / "assets" / "world_lowres.geojson").read_text(encoding="utf-8"))
for f in geo["features"]:  # trim coordinates to 2 decimals to keep the file small
    def rd(c):
        return [round(c[0], 2), round(c[1], 2)] if isinstance(c[0], (int, float)) else [rd(x) for x in c]
    f["geometry"]["coordinates"] = rd(f["geometry"]["coordinates"])
html = (W / "template.html").read_text(encoding="utf-8")
html = html.replace("/*ECHARTS*/", (W / "node_modules" / "echarts" / "dist" / "echarts.min.js").read_text(encoding="utf-8"))
html = html.replace("/*DATA*/", (W / "data.json").read_text(encoding="utf-8"))
html = html.replace("/*GEO*/", json.dumps(geo, separators=(",", ":")))
html = html.replace("/*APP*/", (W / "site.js").read_text(encoding="utf-8").replace("/*SITEURL*/", SITE_URL))
for out in [ROOT / "app" / "static" / "darkwaters.html", ROOT / "docs" / "index.html"]:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
print("site ->", out, round(len(html) / 1e6, 2), "MB")
