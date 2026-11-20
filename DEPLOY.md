# Hosting

## Streamlit Community Cloud (public URL)
1. Go to share.streamlit.io and sign in with the GitHub account that owns this repository.
2. **Create app** → repository `gladiator138/dark-waters`, branch `main`, main file `app/app.py`.
3. **App URL**: `darkwaters2026` (gives https://darkwaters2026.streamlit.app).
4. **Advanced settings** → Python **3.13**. No secrets needed. Deploy (about 2–3 minutes).

## GitHub Pages (backup URL for the Ops site)
Repository **Settings → Pages → Deploy from a branch → `main` / `docs`**. The site appears at
https://gladiator138.github.io/dark-waters/ within a minute.

## Offline backup for the presentation
Open `docs/index.html` from a USB stick or the laptop: it is one file with everything inlined. Keep
`streamlit run app/app.py` running locally as the fallback for the analyst dashboard.
