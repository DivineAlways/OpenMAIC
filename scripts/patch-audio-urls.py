#!/usr/bin/env python3
"""
Patch classroom JSON files to inject audioUrl for each speech action,
pointing to the pre-generated static mp3 at /audio/lessons/<id>/<scene>-<action>.mp3
Run AFTER generate-audio.py completes.
"""

import json
from pathlib import Path

CLASSROOMS_DIR = Path(__file__).parent.parent / "data" / "classrooms"
AUDIO_DIR = Path(__file__).parent.parent / "public" / "audio" / "lessons"

patched = 0
missing = 0

for classroom_file in sorted(CLASSROOMS_DIR.glob("*.json")):
    classroom_id = classroom_file.stem
    data = json.loads(classroom_file.read_text())
    scenes = data.get("scenes", [])
    changed = False

    for scene_idx, scene in enumerate(scenes):
        actions = scene.get("actions", [])
        for action_idx, action in enumerate(actions):
            if action.get("type") != "speech":
                continue

            mp3_path = AUDIO_DIR / classroom_id / f"{scene_idx}-{action_idx}.mp3"
            url = f"/audio/lessons/{classroom_id}/{scene_idx}-{action_idx}.mp3"

            if mp3_path.exists():
                if action.get("audioUrl") != url:
                    action["audioUrl"] = url
                    changed = True
                    patched += 1
            else:
                missing += 1
                print(f"  MISSING: {mp3_path.name} in {classroom_id}")

    if changed:
        classroom_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"Patched: {classroom_id}")

print(f"\nDone: {patched} audioUrls injected, {missing} missing mp3s")
