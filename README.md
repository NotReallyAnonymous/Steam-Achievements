# Steam Shift Achievements

A lightweight Steam-style tracker that unlocks achievements as your 2:30 PM – 10:30 PM EST shift progresses.

## Download

```bash
git clone <your-repo-url>
cd Steam-Achievements
```

## Run

### Option 1 (recommended): Node server (default `0.0.0.0:11019`)

```bash
npm start
```

Then open:

- `http://localhost:11019` (same machine)
- `http://<your-lan-ip>:11019` (from another device on your network)

You can override host/port if needed:

```bash
HOST=0.0.0.0 PORT=11019 npm start
```

### Option 2: Open directly

You can also open `index.html` directly in your browser, but notifications/audio behavior may vary by browser security settings.

## Behavior details

- Achievements unlock automatically as elapsed shift time increases.
- If you open the page and one or more achievements are already complete for the current day, those achievement sounds now play in sequence instead of overlapping.
