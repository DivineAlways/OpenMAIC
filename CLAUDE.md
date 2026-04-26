# CLAUDE.md — OpenMAIC (learn.onlycrypto.io)

Claude Code config for the OpenMAIC academy platform deployed at `learn.onlycrypto.io`.

---

## Deployment

- **Repo**: `DivineAlways/OpenMAIC` (GitHub)
- **Host**: Vercel — auto-deploys on push to `main`
- **Local path**: `/home/lpch/doc-ai/ONLYCRYPTO/OpenMAIC/`

---

## Classroom Data — Correct Slide Schema

All classroom JSON files live in `data/classrooms/<id>.json`.

### Top-level structure

```json
{
  "id": "oc-hs-ecosystem",
  "createdAt": "2025-04-24T00:00:00.000Z",
  "stage": { ... },
  "scenes": [ ... ]
}
```

### Stage object (required fields — all must be present or the classroom crashes)

```json
{
  "id": "oc-hs-ecosystem",
  "name": "Crypto Ecosystem",
  "description": "Optional description.",
  "createdAt": 1745452800000,
  "updatedAt": 1745452800000,
  "languageDirective": "en",
  "style": "academic",
  "agentIds": [],
  "generatedAgentConfigs": []
}
```

A corrupt stage (e.g. `{ "agentIds": [] }` with no `id`) causes a silent load failure. Always include all fields.

### Scene object

```json
{
  "id": "oc-hs-s1",
  "type": "slide",
  "title": "Scene Title",
  "order": 0,
  "content": { "type": "slide", "canvas": { "elements": [...] } },
  "actions": [...]
}
```

### Canvas element schema — MUST use this exact format (PPT slide renderer format)

**Shape element:**
```json
{
  "id": "unique-id",
  "type": "shape",
  "left": 0,
  "top": 0,
  "width": 1000,
  "height": 6,
  "rotate": 0,
  "path": "M 0 0 L 1 0 L 1 1 L 0 1 Z",
  "viewBox": [1, 1],
  "fill": "#f59e0b",
  "fixedRatio": false
}
```

**Text element:**
```json
{
  "id": "unique-id",
  "type": "text",
  "left": 50,
  "top": 30,
  "width": 900,
  "height": 50,
  "rotate": 0,
  "content": "<p style='font-size:32px;font-weight:bold;color:#f59e0b;'>Title text here</p>",
  "defaultFontName": "Inter",
  "defaultColor": "#f59e0b"
}
```

### WRONG schema (do not use — causes "Cannot read properties of undefined (reading '0')" crash)

```json
{
  "type": "text",
  "text": "Title",
  "position": { "x": 50, "y": 30 },
  "size": { "width": 900, "height": 50 },
  "style": { "fontSize": 32 }
}
```

The slide renderer expects `left/top/width/height` (flat) and `content` (HTML string), not `position/size` and `text`. Using the wrong schema silently crashes the classroom with a client-side exception.

### Actions array

```json
[
  {
    "id": "action-id",
    "type": "spotlight",
    "elementId": "element-id-to-highlight"
  },
  {
    "id": "action-id",
    "type": "speech",
    "text": "What the narrator says.",
    "audioUrl": "/audio/lessons/oc-hs-ecosystem/0-1.mp3"
  }
]
```

---

## Audio — Pre-generated Ava Neural Voice

All speech actions use pre-generated mp3 files. Zero runtime API cost — static files served from Vercel CDN.

### Files

- **mp3 location**: `public/audio/lessons/<classroom-id>/<scene-index>-<action-index>.mp3`
- **Voice**: `en-US-AvaNeural` (Microsoft edge-tts, free, no API key)
- **Tool**: `edge-tts` CLI (`pip install edge-tts`)

### How to generate audio for a new classroom

```bash
# 1. Generate mp3s
python3 scripts/generate-audio.py oc-hs-ecosystem

# 2. Inject audioUrl into the classroom JSON
python3 scripts/patch-audio-urls.py

# 3. Commit everything
git add public/audio/lessons/oc-hs-ecosystem/ data/classrooms/oc-hs-ecosystem.json
git commit -m "feat(audio): pre-generate Ava voice for oc-hs-ecosystem"
git push
```

### Pronunciation corrections (applied automatically)

Both `generate-audio.py` (for Ava mp3s) and `lib/audio/tts-utils.ts` (for browser TTS fallback) apply these before generating:

| Text | Spoken as |
|------|-----------|
| `24/7/365` | `24 7 365` |
| `24/7` | `24 7` |
| `DeFi` | `Dee Fie` |
| `NFT` / `NFTs` | `N-F-T` / `N-F-Ts` |
| `XRP` | `X-R-P` |
| `DAO` / `DAOs` | `D-A-O` / `D-A-Os` |
| `DEX` | `decks` |
| `APY` | `A-P-Y` |
| `APR` | `A-P-R` |
| `Bitunix` | `Bit-you-nix` |
| `HODL` | `hoddle` |

Add new entries to **both** `scripts/generate-audio.py` (the `TTS_PRONUNCIATIONS` list) and `lib/audio/tts-utils.ts` (the `TTS_PRONUNCIATIONS` array) when you need a new correction.

### Regenerating audio after text changes

If speech text changes, delete the affected mp3s and re-run:

```bash
rm public/audio/lessons/oc-hs-ecosystem/0-1.mp3
python3 scripts/generate-audio.py oc-hs-ecosystem
python3 scripts/patch-audio-urls.py
```

### Adding a new classroom

1. Create `data/classrooms/<new-id>.json` using the correct schema above
2. Run `python3 scripts/generate-audio.py <new-id>`
3. Run `python3 scripts/patch-audio-urls.py`
4. Commit JSON + mp3s + push

---

## Common Bugs & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Cannot read properties of undefined (reading '0')" | Canvas elements use wrong schema (`position/size/text`) | Convert to `left/top/width/height/content` schema |
| Classroom shows "Could not load this lesson" | Stage object missing `id` field | Add all required stage fields |
| No audio on desktop | Stale IndexedDB has no `audioUrl`; server fetch returns correct data | Already fixed — classroom page always loads from server first |
| TTS says "dot dot dot" | Ellipsis not sanitized | `sanitizeSpeechText()` in `tts-utils.ts` replaces `...` with `, ` |
| Wrong TTS voice (robotic) | Browser picked default voice | `engine.ts` prefers natural male en-US voices; Ava mp3 takes priority |
