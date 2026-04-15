# Minutescape-style GitHub Pages Prototype

This is a browser prototype inspired by the Steam game **Minutescape**: dodge bullets, gain currency over time, and buy upgrades while trying to survive for **5 minutes**.

## Features

- Real-time bullet-dodging arena on HTML Canvas.
- Currency earned each second while your run is active.
- Upgrade shop with scaling costs.
- Keyboard and mobile directional controls.
- Win condition at 5:00 survival, lose condition at 0 HP.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy on GitHub Pages

1. Push to GitHub.
2. Go to **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select your branch and `/ (root)`.
5. Save.
