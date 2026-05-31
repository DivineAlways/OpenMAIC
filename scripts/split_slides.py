#!/usr/bin/env python3
"""Split overloaded slides into Part A/B across all classroom JSON files."""
import json
import copy
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, "data", "classrooms")


def no_theme(canvas):
    """Remove theme field from canvas copy."""
    c = copy.deepcopy(canvas)
    c.pop("theme", None)
    return c


def set_bg(canvas, color="#0f172a"):
    canvas["background"] = {"type": "solid", "color": color}
    return canvas


def keep_elements(canvas, keep_ids):
    canvas["elements"] = [e for e in canvas["elements"] if e["id"] in keep_ids]
    return canvas


def remove_elements(canvas, remove_ids):
    canvas["elements"] = [e for e in canvas["elements"] if e["id"] not in remove_ids]
    return canvas


def patch_element(canvas, eid, **kwargs):
    for el in canvas["elements"]:
        if el["id"] == eid:
            el.update(kwargs)
    return canvas


# ─── oc-hs-blockchain ──────────────────────────────────────────────────────────

def split_bc(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-bc-s1 How Bitcoin Mining Works
    s2 = scenes[1]  # hs-bc-s2 Hashes, Merkle Trees & The Trilemma

    # s1: Part A = title+sub+body+4 flow boxes+arrows (keep all except fact/ft/comp)
    # s1: Part B = title+sub+fact box+comparison
    s1a_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1a_canvas)
    s1a_canvas["id"] = "hs-bc-s1a-canvas"
    remove_elements(s1a_canvas, {"hs-bc-s1-fact", "hs-bc-s1-ft", "hs-bc-s1-comp"})

    s1b_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1b_canvas)
    s1b_canvas["id"] = "hs-bc-s1b-canvas"
    keep_elements(s1b_canvas, {
        "hs-bc-s1-bar", "hs-bc-s1-hbg", "hs-bc-s1-title", "hs-bc-s1-sub",
        "hs-bc-s1-fact", "hs-bc-s1-ft", "hs-bc-s1-comp"
    })
    patch_element(s1b_canvas, "hs-bc-s1-title",
                  content="<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>⛏️ Bitcoin Mining — Proof of Work Explained</p>")
    patch_element(s1b_canvas, "hs-bc-s1-sub",
                  content="<p style='font-size:13px;color:#64748b;'>Why it's called Proof of Work and how it compares to other consensus types</p>")
    # Move fact and comp up since there are no flow boxes above
    patch_element(s1b_canvas, "hs-bc-s1-fact", top=120, height=80)
    patch_element(s1b_canvas, "hs-bc-s1-ft", top=130, height=60)
    patch_element(s1b_canvas, "hs-bc-s1-comp", top=220, height=110)

    # s2: Part A = left col (hash/Merkle) — actions 0-7
    # s2: Part B = right col (trilemma) + insight — actions 8-13
    s2a_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2a_canvas)
    s2a_canvas["id"] = "hs-bc-s2a-canvas"
    keep_elements(s2a_canvas, {
        "hs-bc-s2-bar", "hs-bc-s2-hbg", "hs-bc-s2-title", "hs-bc-s2-sub",
        "hs-bc-s2-hash-bg", "hs-bc-s2-hash-h", "hs-bc-s2-hash-b"
    })
    patch_element(s2a_canvas, "hs-bc-s2-title",
                  content="<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>🔗 Cryptographic Hashes & Merkle Trees</p>")
    patch_element(s2a_canvas, "hs-bc-s2-sub",
                  content="<p style='font-size:13px;color:#64748b;'>The math that makes tampering impossible</p>")
    patch_element(s2a_canvas, "hs-bc-s2-hash-bg", left=24, width=950, height=420)
    patch_element(s2a_canvas, "hs-bc-s2-hash-h", left=34, width=930)
    patch_element(s2a_canvas, "hs-bc-s2-hash-b", left=34, width=930, height=370)

    s2b_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2b_canvas)
    s2b_canvas["id"] = "hs-bc-s2b-canvas"
    keep_elements(s2b_canvas, {
        "hs-bc-s2-bar", "hs-bc-s2-hbg", "hs-bc-s2-title", "hs-bc-s2-sub",
        "hs-bc-s2-tri-bg", "hs-bc-s2-tri-h", "hs-bc-s2-tri-b", "hs-bc-s2-tri-table",
        "hs-bc-s2-insight", "hs-bc-s2-insight-t"
    })
    patch_element(s2b_canvas, "hs-bc-s2-title",
                  content="<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>⚖️ The Blockchain Trilemma</p>")
    patch_element(s2b_canvas, "hs-bc-s2-sub",
                  content="<p style='font-size:13px;color:#64748b;'>The tradeoff every blockchain faces — and where XRPL sits</p>")
    patch_element(s2b_canvas, "hs-bc-s2-tri-bg", left=24, width=950, height=300)
    patch_element(s2b_canvas, "hs-bc-s2-tri-h", left=34, width=930)
    patch_element(s2b_canvas, "hs-bc-s2-tri-b", left=34, width=930, height=170)
    patch_element(s2b_canvas, "hs-bc-s2-tri-table", left=34, width=930, height=130)
    patch_element(s2b_canvas, "hs-bc-s2-insight", left=24, width=950, top=430)
    patch_element(s2b_canvas, "hs-bc-s2-insight-t", left=34, width=930, top=440)

    s1a = {
        "id": "hs-bc-s1a", "type": "slide",
        "title": "How Bitcoin Mining Works",
        "order": 0,
        "content": {"type": "slide", "canvas": s1a_canvas},
        "actions": s1["actions"][:12]
    }
    s1b = {
        "id": "hs-bc-s1b", "type": "slide",
        "title": "How Bitcoin Mining Works (Part B)",
        "order": 1,
        "content": {"type": "slide", "canvas": s1b_canvas},
        "actions": s1["actions"][12:]
    }
    s2a = {
        "id": "hs-bc-s2a", "type": "slide",
        "title": "Hashes, Merkle Trees & The Trilemma",
        "order": 2,
        "content": {"type": "slide", "canvas": s2a_canvas},
        "actions": s2["actions"][:8]
    }
    s2b = {
        "id": "hs-bc-s2b", "type": "slide",
        "title": "Hashes, Merkle Trees & The Trilemma (Part B)",
        "order": 3,
        "content": {"type": "slide", "canvas": s2b_canvas},
        "actions": s2["actions"][8:]
    }

    remaining = scenes[2:]
    for i, s in enumerate(remaining):
        s["order"] = 4 + i
    data["scenes"] = [s1a, s1b, s2a, s2b] + remaining
    return data


# ─── oc-hs-crypto ──────────────────────────────────────────────────────────────

def split_cr(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-cr-s1 Market Cap & Tokenomics
    s2 = scenes[1]  # hs-cr-s2 Bitcoin Halving & Reading Price Action

    # s1: Part A = title+sub+formula+3 cap boxes (actions 0-9)
    # s1: Part B = title+sub+tokenomics text+xrp box (actions 10-13)
    s1a_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1a_canvas)
    s1a_canvas["id"] = "hs-cr-s1a-canvas"
    remove_elements(s1a_canvas, {"hs-cr-s1-tokenomics", "hs-cr-s1-xrp", "hs-cr-s1-xrp-t"})

    s1b_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1b_canvas)
    s1b_canvas["id"] = "hs-cr-s1b-canvas"
    keep_elements(s1b_canvas, {
        "hs-cr-s1-bar", "hs-cr-s1-hbg", "hs-cr-s1-title", "hs-cr-s1-sub",
        "hs-cr-s1-tokenomics", "hs-cr-s1-xrp", "hs-cr-s1-xrp-t"
    })
    patch_element(s1b_canvas, "hs-cr-s1-title",
                  content="<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>📊 Tokenomics & Supply Mechanics</p>")
    patch_element(s1b_canvas, "hs-cr-s1-sub",
                  content="<p style='font-size:13px;color:#64748b;'>How supply design shapes long-term value</p>")
    patch_element(s1b_canvas, "hs-cr-s1-tokenomics", top=118, height=280)
    patch_element(s1b_canvas, "hs-cr-s1-xrp", top=420, height=80)
    patch_element(s1b_canvas, "hs-cr-s1-xrp-t", top=432, height=60)

    # s2: Part A = title+sub+halving content (actions 0-7)
    # s2: Part B = title+sub+price action+caveat+altcoin (actions 8-13)
    s2a_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2a_canvas)
    s2a_canvas["id"] = "hs-cr-s2a-canvas"
    remove_elements(s2a_canvas, {
        "hs-cr-s2-pa-bg", "hs-cr-s2-pa-h", "hs-cr-s2-pa-b",
        "hs-cr-s2-caveat", "hs-cr-s2-caveat-t", "hs-cr-s2-altcoin"
    })

    s2b_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2b_canvas)
    s2b_canvas["id"] = "hs-cr-s2b-canvas"
    keep_elements(s2b_canvas, {
        "hs-cr-s2-bar", "hs-cr-s2-hbg", "hs-cr-s2-title", "hs-cr-s2-sub",
        "hs-cr-s2-pa-bg", "hs-cr-s2-pa-h", "hs-cr-s2-pa-b",
        "hs-cr-s2-caveat", "hs-cr-s2-caveat-t", "hs-cr-s2-altcoin"
    })
    patch_element(s2b_canvas, "hs-cr-s2-title",
                  content="<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>📈 Reading Price Action & Evaluating Altcoins</p>")
    patch_element(s2b_canvas, "hs-cr-s2-sub",
                  content="<p style='font-size:13px;color:#64748b;'>What charts are telling you and how to assess new projects</p>")
    patch_element(s2b_canvas, "hs-cr-s2-pa-bg", left=24, top=110, width=950, height=200)
    patch_element(s2b_canvas, "hs-cr-s2-pa-h", left=34, top=118, width=930)
    patch_element(s2b_canvas, "hs-cr-s2-pa-b", left=34, top=148, width=930, height=171)
    patch_element(s2b_canvas, "hs-cr-s2-caveat", left=24, top=332, width=950, height=60)
    patch_element(s2b_canvas, "hs-cr-s2-caveat-t", left=34, top=342, width=930, height=50)
    patch_element(s2b_canvas, "hs-cr-s2-altcoin", left=24, top=408, width=950, height=110)

    s1a = {"id": "hs-cr-s1a", "type": "slide", "title": "Market Cap & Tokenomics",
           "order": 0, "content": {"type": "slide", "canvas": s1a_canvas},
           "actions": s1["actions"][:10]}
    s1b = {"id": "hs-cr-s1b", "type": "slide", "title": "Market Cap & Tokenomics (Part B)",
           "order": 1, "content": {"type": "slide", "canvas": s1b_canvas},
           "actions": s1["actions"][10:]}
    s2a = {"id": "hs-cr-s2a", "type": "slide", "title": "Bitcoin Halving & Reading Price Action",
           "order": 2, "content": {"type": "slide", "canvas": s2a_canvas},
           "actions": s2["actions"][:8]}
    s2b = {"id": "hs-cr-s2b", "type": "slide", "title": "Bitcoin Halving & Reading Price Action (Part B)",
           "order": 3, "content": {"type": "slide", "canvas": s2b_canvas},
           "actions": s2["actions"][8:]}

    remaining = scenes[2:]
    for i, s in enumerate(remaining):
        s["order"] = 4 + i
    data["scenes"] = [s1a, s1b, s2a, s2b] + remaining
    return data


# ─── oc-hs-defi ────────────────────────────────────────────────────────────────

def split_defi(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-defi-s1 Liquidity Pools & The AMM Formula
    s2 = scenes[1]  # hs-defi-s2 Impermanent Loss & DeFi Risks

    # Need to inspect element IDs
    elids_s1 = [e["id"] for e in s1["content"]["canvas"]["elements"]]
    elids_s2 = [e["id"] for e in s2["content"]["canvas"]["elements"]]

    # s1 Part A: title, sub, intro text, formula box, how-to-trade text (actions 0-5)
    # s1 Part B: title, sub, provide liquidity section, defi building blocks (actions 6-9)
    s1a_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1a_canvas)
    s1a_canvas["id"] = "hs-defi-s1a-canvas"
    # Remove provide-liq, defi-blocks elements (keep formula and how-to-trade which are top half)
    remove_ids_s1b = set()
    for eid in elids_s1:
        if any(x in eid for x in ["-provide", "-defi-blocks", "-defi-blk", "-liq-h", "-liq-b",
                                    "-defi-bg", "-defi-h", "-defi-b", "-defi-t"]):
            remove_ids_s1b.add(eid)
    # Actually let's just figure out the specific IDs from the structure described
    # The s1 has: bar, hbg, title, sub, intro, formula-bg, formula-h, formula-b,
    # how-to-bg, how-to-h, how-to-b, provide-h, provide-b, defi-bg, defi-h/b
    # Part A = keep: bar, hbg, title, sub, intro, formula-bg/h/b, how-to-bg/h/b
    # Part B = keep: bar, hbg, title, sub, provide-h/b, defi-bg/h/b

    # Let's identify them by position from what we know:
    # intro: top ~112, formula-left top~186, how-to-trade top~186 (right)
    # provide: top~332, defi-blocks top~332 (right)

    part_a_ids = set()
    part_b_ids = set()
    shared = set()

    for el in s1["content"]["canvas"]["elements"]:
        eid = el["id"]
        t = el.get("top", 0)
        # Header area
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared.add(eid)
        elif t < 300:  # top half
            part_a_ids.add(eid)
        else:
            part_b_ids.add(eid)

    s1a_canvas["elements"] = [e for e in s1["content"]["canvas"]["elements"]
                               if e["id"] in shared | part_a_ids]
    no_theme(s1a_canvas)
    set_bg(s1a_canvas)

    s1b_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1b_canvas)
    s1b_canvas["id"] = "hs-defi-s1b-canvas"
    s1b_canvas["elements"] = [copy.deepcopy(e) for e in s1["content"]["canvas"]["elements"]
                               if e["id"] in shared | part_b_ids]

    # Update title/sub for part b
    for el in s1b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>💧 Providing Liquidity & DeFi Building Blocks</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>How to add liquidity and the key DeFi primitives</p>"

    # Shift part-b elements up if needed
    min_top_b = min((e["top"] for e in s1b_canvas["elements"] if e["id"] not in shared), default=332)
    shift = min_top_b - 112
    for el in s1b_canvas["elements"]:
        if el["id"] not in shared:
            el["top"] = el["top"] - shift

    actions_s1 = s1["actions"]
    mid = len(actions_s1) // 2

    s1a = {"id": "hs-defi-s1a", "type": "slide", "title": "Liquidity Pools & The AMM Formula",
           "order": 0, "content": {"type": "slide", "canvas": s1a_canvas},
           "actions": actions_s1[:mid]}
    s1b = {"id": "hs-defi-s1b", "type": "slide", "title": "Liquidity Pools & The AMM Formula (Part B)",
           "order": 1, "content": {"type": "slide", "canvas": s1b_canvas},
           "actions": actions_s1[mid:]}

    # s2 Part A: IL section (actions 0-5)
    # s2 Part B: risks + OC box (actions 6-11)
    part_a_ids_s2 = set()
    part_b_ids_s2 = set()
    shared_s2 = set()

    for el in s2["content"]["canvas"]["elements"]:
        eid = el["id"]
        t = el.get("top", 0)
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared_s2.add(eid)
        # IL is left column, risks is right column
        # IL header at top~112, risks-bg at top~110 (right)
        # OC box at top~420
        elif t >= 420:
            part_b_ids_s2.add(eid)
        elif el.get("left", 0) < 490:  # left column = IL
            part_a_ids_s2.add(eid)
        else:
            part_b_ids_s2.add(eid)

    s2a_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2a_canvas)
    s2a_canvas["id"] = "hs-defi-s2a-canvas"
    s2a_canvas["elements"] = [e for e in s2["content"]["canvas"]["elements"]
                               if e["id"] in shared_s2 | part_a_ids_s2]

    s2b_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2b_canvas)
    s2b_canvas["id"] = "hs-defi-s2b-canvas"
    s2b_canvas["elements"] = [copy.deepcopy(e) for e in s2["content"]["canvas"]["elements"]
                               if e["id"] in shared_s2 | part_b_ids_s2]

    # Update title/sub for s2b
    for el in s2b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>⚠️ DeFi Risks & OnlyCrypto's Approach</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>Smart contract risk, hacks, and how to stay safe</p>"

    # Expand right column elements to full width in s2b
    for el in s2b_canvas["elements"]:
        if el["id"] in part_b_ids_s2:
            el["left"] = max(el.get("left", 0) - 490, 24) if el.get("left", 0) > 400 else el.get("left", 24)

    actions_s2 = s2["actions"]
    mid2 = len(actions_s2) // 2

    s2a = {"id": "hs-defi-s2a", "type": "slide", "title": "Impermanent Loss & DeFi Risks",
           "order": 2, "content": {"type": "slide", "canvas": s2a_canvas},
           "actions": actions_s2[:mid2]}
    s2b = {"id": "hs-defi-s2b", "type": "slide", "title": "Impermanent Loss & DeFi Risks (Part B)",
           "order": 3, "content": {"type": "slide", "canvas": s2b_canvas},
           "actions": actions_s2[mid2:]}

    remaining = scenes[2:]
    for i, s in enumerate(remaining):
        s["order"] = 4 + i
    data["scenes"] = [s1a, s1b, s2a, s2b] + remaining
    return data


# ─── oc-hs-ecosystem ───────────────────────────────────────────────────────────

def split_ecosystem(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-ec-s1 Layers, Bridges & DAOs
    s2 = scenes[1]  # hs-ec-s2 Real World Assets, NFTs & Institutional Adoption
    s3 = scenes[2]  # hs-ec-s3 Ecosystem Participants & Sector Map

    def split_4panel(scene, sid_a, sid_b, title_a, title_b, sub_b):
        """Split 4-panel (2 top cols + full-width bottom) into Part A and B."""
        orig = scene["content"]["canvas"]
        elements = orig["elements"]

        # Shared header elements
        shared = set()
        top_left = set()
        top_right = set()
        bottom = set()

        for el in elements:
            eid = el["id"]
            t = el.get("top", 0)
            l = el.get("left", 0)
            if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
                shared.add(eid)
            elif t > 310:  # bottom full-width section
                bottom.add(eid)
            elif l < 490:  # top-left column
                top_left.add(eid)
            else:  # top-right column
                top_right.add(eid)

        # Part A: top-left + top-right as normal 2-col layout
        ca = no_theme(copy.deepcopy(orig))
        set_bg(ca)
        ca["id"] = f"{sid_a}-canvas"
        ca["elements"] = [e for e in elements if e["id"] in shared | top_left | top_right]

        # Part B: bottom section expanded full-width
        cb = no_theme(copy.deepcopy(orig))
        set_bg(cb)
        cb["id"] = f"{sid_b}-canvas"
        cb["elements"] = [copy.deepcopy(e) for e in elements
                          if e["id"] in shared | bottom]

        # Update title/sub for Part B
        for el in cb["elements"]:
            if "-title" in el["id"]:
                el["content"] = f"<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>{title_b}</p>"
            elif "-sub" in el["id"]:
                el["content"] = f"<p style='font-size:13px;color:#64748b;'>{sub_b}</p>"

        # Shift bottom elements up to top=112
        min_t = min((e["top"] for e in cb["elements"] if e["id"] in bottom), default=330)
        shift = min_t - 112
        for el in cb["elements"]:
            if el["id"] in bottom:
                el["top"] = el["top"] - shift
                # If the element was constrained to right side, expand to full width
                if el.get("left", 0) > 50:
                    el["left"] = 24
                    el["width"] = 950

        return ca, cb

    # s1: Layers, Bridges & DAOs — split
    ca1, cb1 = split_4panel(s1, "hs-ec-s1a", "hs-ec-s1b",
                             "Layers, Bridges & DAOs",
                             "DAOs — Decentralized Autonomous Organizations",
                             "How communities govern protocols without central authority")

    # s2: RWA, NFTs & Institutional — split
    ca2, cb2 = split_4panel(s2, "hs-ec-s2a", "hs-ec-s2b",
                             "Real World Assets, NFTs & Institutional Adoption",
                             "Institutional Crypto Adoption",
                             "How traditional finance is entering the blockchain space")

    # s3: Ecosystem Participants & Sector Map — split
    ca3, cb3 = split_4panel(s3, "hs-ec-s3a", "hs-ec-s3b",
                             "Ecosystem Participants & Sector Map",
                             "OnlyCrypto's Place in the Ecosystem",
                             "Where our platform sits in the broader crypto landscape")

    actions_s1 = s1["actions"]
    actions_s2 = s2["actions"]
    actions_s3 = s3["actions"]
    mid1 = len(actions_s1) // 2
    mid2 = len(actions_s2) // 2
    mid3 = len(actions_s3) // 2

    new_s = [
        {"id": "hs-ec-s1a", "type": "slide", "title": "Layers, Bridges & DAOs",
         "order": 0, "content": {"type": "slide", "canvas": ca1},
         "actions": actions_s1[:mid1]},
        {"id": "hs-ec-s1b", "type": "slide", "title": "Layers, Bridges & DAOs (Part B)",
         "order": 1, "content": {"type": "slide", "canvas": cb1},
         "actions": actions_s1[mid1:]},
        {"id": "hs-ec-s2a", "type": "slide",
         "title": "Real World Assets, NFTs & Institutional Adoption",
         "order": 2, "content": {"type": "slide", "canvas": ca2},
         "actions": actions_s2[:mid2]},
        {"id": "hs-ec-s2b", "type": "slide",
         "title": "Real World Assets, NFTs & Institutional Adoption (Part B)",
         "order": 3, "content": {"type": "slide", "canvas": cb2},
         "actions": actions_s2[mid2:]},
        {"id": "hs-ec-s3a", "type": "slide",
         "title": "Ecosystem Participants & Sector Map",
         "order": 4, "content": {"type": "slide", "canvas": ca3},
         "actions": actions_s3[:mid3]},
        {"id": "hs-ec-s3b", "type": "slide",
         "title": "Ecosystem Participants & Sector Map (Part B)",
         "order": 5, "content": {"type": "slide", "canvas": cb3},
         "actions": actions_s3[mid3:]},
    ]
    remaining = scenes[3:]
    for i, s in enumerate(remaining):
        s["order"] = 6 + i
    data["scenes"] = new_s + remaining
    return data


# ─── oc-hs-trading ─────────────────────────────────────────────────────────────

def split_trading(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-tr-s1 Candlestick Charts & Support/Resistance
    s2 = scenes[1]  # hs-tr-s2 RSI, MACD, Order Types & Psychology

    # s1: left col (candles) + right col top (S/R) already fit well on A
    # Part A: all except insight box at bottom (actions 0-11)
    # Part B: insight box repurposed as summary + the comparison (actions 12-13)

    # Actually from summary: s1 insight box at top=358 fits at y=429.
    # Let's split at insight box level.
    s1_els = s1["content"]["canvas"]["elements"]
    shared_s1 = set()
    top_s1 = set()
    bottom_s1 = set()
    for el in s1_els:
        eid = el["id"]
        t = el.get("top", 0)
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared_s1.add(eid)
        elif t >= 340:
            bottom_s1.add(eid)
        else:
            top_s1.add(eid)

    s1a_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1a_canvas)
    s1a_canvas["id"] = "hs-tr-s1a-canvas"
    s1a_canvas["elements"] = [e for e in s1_els if e["id"] in shared_s1 | top_s1]

    s1b_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1b_canvas)
    s1b_canvas["id"] = "hs-tr-s1b-canvas"
    s1b_canvas["elements"] = [copy.deepcopy(e) for e in s1_els
                               if e["id"] in shared_s1 | bottom_s1]
    for el in s1b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>📊 Candlestick Patterns & Key Insight</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>Recognizing patterns and applying them in real markets</p>"
    min_t = min((e["top"] for e in s1b_canvas["elements"] if e["id"] in bottom_s1), default=340)
    shift = min_t - 118
    for el in s1b_canvas["elements"]:
        if el["id"] in bottom_s1:
            el["top"] = el["top"] - shift
            if el.get("left", 0) > 50:
                el["left"] = 24
                el["width"] = 950

    # s2: RSI+MACD top, orders+psych bottom
    # Part A: RSI+MACD (actions 0-5)
    # Part B: order types + psychology (actions 6-9)
    s2_els = s2["content"]["canvas"]["elements"]
    shared_s2 = set()
    top_s2 = set()
    bottom_s2 = set()
    for el in s2_els:
        eid = el["id"]
        t = el.get("top", 0)
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared_s2.add(eid)
        elif t >= 290:
            bottom_s2.add(eid)
        else:
            top_s2.add(eid)

    s2a_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2a_canvas)
    s2a_canvas["id"] = "hs-tr-s2a-canvas"
    s2a_canvas["elements"] = [e for e in s2_els if e["id"] in shared_s2 | top_s2]

    s2b_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2b_canvas)
    s2b_canvas["id"] = "hs-tr-s2b-canvas"
    s2b_canvas["elements"] = [copy.deepcopy(e) for e in s2_els
                               if e["id"] in shared_s2 | bottom_s2]
    for el in s2b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>📋 Order Types & Trading Psychology</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>How to place orders and manage the emotional side of trading</p>"
    min_t2 = min((e["top"] for e in s2b_canvas["elements"] if e["id"] in bottom_s2), default=290)
    shift2 = min_t2 - 112
    for el in s2b_canvas["elements"]:
        if el["id"] in bottom_s2:
            el["top"] = el["top"] - shift2

    actions_s1 = s1["actions"]
    actions_s2 = s2["actions"]
    mid1 = len(actions_s1) // 2
    mid2 = len(actions_s2) // 2

    s1a = {"id": "hs-tr-s1a", "type": "slide", "title": "Candlestick Charts & Support/Resistance",
           "order": 0, "content": {"type": "slide", "canvas": s1a_canvas},
           "actions": actions_s1[:mid1]}
    s1b = {"id": "hs-tr-s1b", "type": "slide", "title": "Candlestick Charts & Support/Resistance (Part B)",
           "order": 1, "content": {"type": "slide", "canvas": s1b_canvas},
           "actions": actions_s1[mid1:]}
    s2a = {"id": "hs-tr-s2a", "type": "slide", "title": "RSI, MACD, Order Types & Psychology",
           "order": 2, "content": {"type": "slide", "canvas": s2a_canvas},
           "actions": actions_s2[:mid2]}
    s2b = {"id": "hs-tr-s2b", "type": "slide", "title": "RSI, MACD, Order Types & Psychology (Part B)",
           "order": 3, "content": {"type": "slide", "canvas": s2b_canvas},
           "actions": actions_s2[mid2:]}

    remaining = scenes[2:]
    for i, s in enumerate(remaining):
        s["order"] = 4 + i
    data["scenes"] = [s1a, s1b, s2a, s2b] + remaining
    return data


# ─── oc-hs-wallets ─────────────────────────────────────────────────────────────

def split_wallets(data):
    scenes = data["scenes"]
    s1 = scenes[0]  # hs-wl-s1 Seed Phrases, Keys & Wallet Types
    s2 = scenes[1]  # hs-wl-s2 Wallet Attack Vectors & Security Checklist

    # s1: Very complex. Split at key chain section (top ~308)
    # Part A: seed header + flow + entropy (actions 0-7)
    # Part B: key chain + wallet types + OC box (actions 8-15)
    s1_els = s1["content"]["canvas"]["elements"]
    shared_s1 = set()
    top_s1 = set()
    bottom_s1 = set()
    for el in s1_els:
        eid = el["id"]
        t = el.get("top", 0)
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared_s1.add(eid)
        elif t >= 295:
            bottom_s1.add(eid)
        else:
            top_s1.add(eid)

    s1a_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1a_canvas)
    s1a_canvas["id"] = "hs-wl-s1a-canvas"
    s1a_canvas["elements"] = [e for e in s1_els if e["id"] in shared_s1 | top_s1]

    s1b_canvas = no_theme(copy.deepcopy(s1["content"]["canvas"]))
    set_bg(s1b_canvas)
    s1b_canvas["id"] = "hs-wl-s1b-canvas"
    s1b_canvas["elements"] = [copy.deepcopy(e) for e in s1_els
                               if e["id"] in shared_s1 | bottom_s1]
    for el in s1b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>🔑 Keys, Wallet Types & Security</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>How private keys work and choosing the right wallet</p>"
    min_t = min((e["top"] for e in s1b_canvas["elements"] if e["id"] in bottom_s1), default=295)
    shift = min_t - 112
    for el in s1b_canvas["elements"]:
        if el["id"] in bottom_s1:
            el["top"] = el["top"] - shift

    # s2: 4 attack panels (2x2 grid top) + checklist (bottom)
    # Part A: title + sub + 4 attack panels (actions 0-5)
    # Part B: title + sub + checklist (actions 6-11)
    s2_els = s2["content"]["canvas"]["elements"]
    shared_s2 = set()
    top_s2 = set()
    bottom_s2 = set()
    for el in s2_els:
        eid = el["id"]
        t = el.get("top", 0)
        if any(x in eid for x in ["-bar", "-hbg", "-title", "-sub"]):
            shared_s2.add(eid)
        elif t >= 330:
            bottom_s2.add(eid)
        else:
            top_s2.add(eid)

    s2a_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2a_canvas)
    s2a_canvas["id"] = "hs-wl-s2a-canvas"
    s2a_canvas["elements"] = [e for e in s2_els if e["id"] in shared_s2 | top_s2]

    s2b_canvas = no_theme(copy.deepcopy(s2["content"]["canvas"]))
    set_bg(s2b_canvas)
    s2b_canvas["id"] = "hs-wl-s2b-canvas"
    s2b_canvas["elements"] = [copy.deepcopy(e) for e in s2_els
                               if e["id"] in shared_s2 | bottom_s2]
    for el in s2b_canvas["elements"]:
        if "-title" in el["id"]:
            el["content"] = "<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>🛡️ Wallet Security Checklist</p>"
        elif "-sub" in el["id"]:
            el["content"] = "<p style='font-size:13px;color:#64748b;'>Your step-by-step guide to keeping your funds safe</p>"
    min_t2 = min((e["top"] for e in s2b_canvas["elements"] if e["id"] in bottom_s2), default=330)
    shift2 = min_t2 - 112
    for el in s2b_canvas["elements"]:
        if el["id"] in bottom_s2:
            el["top"] = el["top"] - shift2
            el["left"] = 24
            el["width"] = 950

    actions_s1 = s1["actions"]
    actions_s2 = s2["actions"]
    mid1 = len(actions_s1) // 2
    mid2 = len(actions_s2) // 2

    s1a = {"id": "hs-wl-s1a", "type": "slide", "title": "Seed Phrases, Keys & Wallet Types",
           "order": 0, "content": {"type": "slide", "canvas": s1a_canvas},
           "actions": actions_s1[:mid1]}
    s1b = {"id": "hs-wl-s1b", "type": "slide", "title": "Seed Phrases, Keys & Wallet Types (Part B)",
           "order": 1, "content": {"type": "slide", "canvas": s1b_canvas},
           "actions": actions_s1[mid1:]}
    s2a = {"id": "hs-wl-s2a", "type": "slide", "title": "Wallet Attack Vectors & Security Checklist",
           "order": 2, "content": {"type": "slide", "canvas": s2a_canvas},
           "actions": actions_s2[:mid2]}
    s2b = {"id": "hs-wl-s2b", "type": "slide", "title": "Wallet Attack Vectors & Security Checklist (Part B)",
           "order": 3, "content": {"type": "slide", "canvas": s2b_canvas},
           "actions": actions_s2[mid2:]}

    remaining = scenes[2:]
    for i, s in enumerate(remaining):
        s["order"] = 4 + i
    data["scenes"] = [s1a, s1b, s2a, s2b] + remaining
    return data


# ─── oc-ecosystem ──────────────────────────────────────────────────────────────

def split_oc_ecosystem(data):
    """For oc-ecosystem: split ce-s1 (Tokenomics), ce-s4 (RWA/Governance), ce-s7 (Future Web3)."""
    scenes = data["scenes"]

    # These are 2-col full-height panels (lp/rp). Each has height=450 bg starting at top=108.
    # Split by putting left panel on Part A, right panel on Part B.

    target_ids = {"ce-s1", "ce-s4", "ce-s7"}

    def split_2col_scene(scene, new_id_a, new_id_b, title_suffix=""):
        orig = scene["content"]["canvas"]
        elements = orig["elements"]
        sid = scene["id"]

        shared = set()
        left_col = set()
        right_col = set()

        for el in elements:
            eid = el["id"]
            l = el.get("left", 0)
            if any(x in eid for x in ["-accent", "-titlebg", "-title", "-sub"]):
                shared.add(eid)
            elif l < 400:
                left_col.add(eid)
            else:
                right_col.add(eid)

        # Part A: left column expanded to full width
        ca = no_theme(copy.deepcopy(orig))
        set_bg(ca)
        ca["id"] = f"{new_id_a}-canvas"
        ca["elements"] = [copy.deepcopy(e) for e in elements if e["id"] in shared | left_col]
        # Expand left col elements
        for el in ca["elements"]:
            if el["id"] in left_col:
                el["left"] = 8
                el["width"] = 984

        # Part B: right column expanded to full width
        cb = no_theme(copy.deepcopy(orig))
        set_bg(cb)
        cb["id"] = f"{new_id_b}-canvas"
        cb["elements"] = [copy.deepcopy(e) for e in elements if e["id"] in shared | right_col]
        for el in cb["elements"]:
            if "-title" in el["id"] and "content" in el:
                el["content"] = el["content"].replace("</p>", f" (Part B)</p>", 1)
            elif "-sub" in el["id"]:
                pass  # keep subtitle
            elif el["id"] in right_col:
                el["left"] = 8
                el["width"] = 984

        return ca, cb

    # Find and split target scenes
    new_scenes = []
    order_counter = 0

    for scene in scenes:
        if scene["id"] not in target_ids:
            scene["order"] = order_counter
            order_counter += 1
            new_scenes.append(scene)
            continue

        sid = scene["id"]
        ca, cb = split_2col_scene(scene, f"{sid}a", f"{sid}b")
        actions = scene["actions"]
        mid = len(actions) // 2

        sa = {"id": f"{sid}a", "type": "slide", "title": scene["title"],
              "order": order_counter, "content": {"type": "slide", "canvas": ca},
              "actions": actions[:mid]}
        order_counter += 1
        sb = {"id": f"{sid}b", "type": "slide", "title": f"{scene['title']} (Part B)",
              "order": order_counter, "content": {"type": "slide", "canvas": cb},
              "actions": actions[mid:]}
        order_counter += 1
        new_scenes.extend([sa, sb])

    data["scenes"] = new_scenes
    return data


# ─── oc-xrpl-deepdive ──────────────────────────────────────────────────────────

def split_xrpl(data):
    """Split xd-s2 (Trust Lines), xd-s3 (Native DEX & AMM), xd-s6 (Why OnlyCrypto)."""
    scenes = data["scenes"]
    target_ids = {"xd-s2", "xd-s3", "xd-s6"}

    def split_2col_scene(scene):
        orig = scene["content"]["canvas"]
        elements = orig["elements"]
        sid = scene["id"]

        shared = set()
        left_col = set()
        right_col = set()

        for el in elements:
            eid = el["id"]
            l = el.get("left", 0)
            if any(x in eid for x in ["-accent", "-titlebg", "-title", "-sub"]):
                shared.add(eid)
            elif l < 400:
                left_col.add(eid)
            else:
                right_col.add(eid)

        ca = no_theme(copy.deepcopy(orig))
        set_bg(ca)
        ca["id"] = f"{sid}a-canvas"
        ca["elements"] = [copy.deepcopy(e) for e in elements if e["id"] in shared | left_col]
        for el in ca["elements"]:
            if el["id"] in left_col:
                el["left"] = 8
                el["width"] = 984

        cb = no_theme(copy.deepcopy(orig))
        set_bg(cb)
        cb["id"] = f"{sid}b-canvas"
        cb["elements"] = [copy.deepcopy(e) for e in elements if e["id"] in shared | right_col]
        for el in cb["elements"]:
            if "-title" in el["id"] and "content" in el:
                el["content"] = el["content"].replace("</p>", " (Part B)</p>", 1)
            elif el["id"] in right_col:
                el["left"] = 8
                el["width"] = 984

        return ca, cb

    new_scenes = []
    order_counter = 0

    for scene in scenes:
        if scene["id"] not in target_ids:
            scene["order"] = order_counter
            order_counter += 1
            new_scenes.append(scene)
            continue

        sid = scene["id"]
        ca, cb = split_2col_scene(scene)
        actions = scene["actions"]
        mid = len(actions) // 2

        sa = {"id": f"{sid}a", "type": "slide", "title": scene["title"],
              "order": order_counter, "content": {"type": "slide", "canvas": ca},
              "actions": actions[:mid]}
        order_counter += 1
        sb = {"id": f"{sid}b", "type": "slide", "title": f"{scene['title']} (Part B)",
              "order": order_counter, "content": {"type": "slide", "canvas": cb},
              "actions": actions[mid:]}
        order_counter += 1
        new_scenes.extend([sa, sb])

    data["scenes"] = new_scenes
    return data


# ─── Main ──────────────────────────────────────────────────────────────────────

def process_file(fname, split_fn):
    path = os.path.join(DATA_DIR, fname)
    with open(path) as f:
        data = json.load(f)
    data = split_fn(data)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"{fname}: {len(data['scenes'])} scenes")
    for s in data["scenes"]:
        print(f"  order={s['order']} id={s['id']} title={s['title'][:60]}")


if __name__ == "__main__":
    os.chdir(BASE)
    # hs files already done; only process the two large files
    process_file("oc-ecosystem.json", split_oc_ecosystem)
    process_file("oc-xrpl-deepdive.json", split_xrpl)
    print("\nAll done.")
