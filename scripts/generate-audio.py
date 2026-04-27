#!/usr/bin/env python3
"""
Pre-generate edge-tts audio for all OC Academy lesson speech actions.
Voice: en-US-AvaNeural (free, no API key, natural Microsoft neural voice)
Output: public/audio/lessons/<classroom-id>/<scene-index>-<action-index>.mp3

Run: python3 scripts/generate-audio.py
Then commit the mp3s — members stream static files, zero API cost at runtime.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

VOICE = "en-US-AvaNeural"
CLASSROOMS_DIR = Path(__file__).parent.parent / "data" / "classrooms"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "audio" / "lessons"
ELLIPSIS_RE = re.compile(r'\.{3,}|…')


TTS_PRONUNCIATIONS = [
    (re.compile(r'24/7/365'), '24 7 365'),
    (re.compile(r'24/7'), '24 7'),
    (re.compile(r'\bDeFi\b', re.IGNORECASE), 'Dee Fie'),
    (re.compile(r'\bNFTs?\b'), 'N-F-Ts'),
    (re.compile(r'\bXRP\b'), 'X-R-P'),
    (re.compile(r'\bDAOs?\b'), 'D-A-Os'),
    (re.compile(r'\bDEX\b'), 'decks'),
    (re.compile(r'\bAPY\b'), 'A-P-Y'),
    (re.compile(r'\bAPR\b'), 'A-P-R'),
    (re.compile(r'\bBitunix\b'), 'Bit-you-nix'),
    (re.compile(r'\bHODL\b'), 'hoddle'),
    # Fix "live" (active/current) pronounced as "lived" — force long 'i' sound
    (re.compile(r'\blive\b', re.IGNORECASE), 'lyve'),
]


def sanitize(text: str) -> str:
    # Strip emoji
    text = re.sub(
        r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF'
        r'\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251'
        r'\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF'
        r'☀-➿️]+',
        '', text
    )
    # Ellipsis → pause
    text = ELLIPSIS_RE.sub(', ', text)
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Collapse whitespace
    text = re.sub(r'\s{2,}', ' ', text).strip()
    # Apply pronunciations
    for pattern, replacement in TTS_PRONUNCIATIONS:
        text = pattern.sub(replacement, text)
    return text


def generate(text: str, out_path: Path) -> bool:
    if out_path.exists():
        return True  # already done

    clean = sanitize(text)
    if not clean:
        return True

    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        result = subprocess.run(
            ["edge-tts", "--voice", VOICE, "--text", clean, "--write-media", str(out_path)],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0 and out_path.exists():
            return True
        else:
            print(f"    ERROR: {result.stderr.strip()[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"    TIMEOUT")
        return False
    except FileNotFoundError:
        print("edge-tts not found. Install with: pip install edge-tts")
        sys.exit(1)


def main():
    filter_id = sys.argv[1] if len(sys.argv) > 1 else None
    classroom_files = sorted(CLASSROOMS_DIR.glob("*.json"))
    if filter_id:
        classroom_files = [f for f in classroom_files if filter_id in f.stem]

    total = generated = skipped = errors = 0

    for classroom_file in classroom_files:
        classroom_id = classroom_file.stem
        data = json.loads(classroom_file.read_text())
        scenes = data.get("scenes", [])

        print(f"\n{classroom_id} ({len(scenes)} scenes)")

        for scene_idx, scene in enumerate(scenes):
            actions = scene.get("actions", [])
            speech_actions = [(i, a) for i, a in enumerate(actions) if a.get("type") == "speech"]
            if not speech_actions:
                continue

            for action_idx, action in speech_actions:
                text = action.get("text", "")
                out_path = OUTPUT_DIR / classroom_id / f"{scene_idx}-{action_idx}.mp3"
                total += 1

                if out_path.exists():
                    skipped += 1
                    print(f"  [{scene_idx}-{action_idx}] skip")
                    continue

                ok = generate(text, out_path)
                if ok:
                    generated += 1
                    size = out_path.stat().st_size // 1024 if out_path.exists() else 0
                    print(f"  [{scene_idx}-{action_idx}] ok ({size}KB)")
                else:
                    errors += 1
                    print(f"  [{scene_idx}-{action_idx}] FAILED")

    print(f"\n{'='*50}")
    print(f"Generated: {generated}  Skipped: {skipped}  Errors: {errors}  Total: {total}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
