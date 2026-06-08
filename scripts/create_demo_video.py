from pathlib import Path
import math
import subprocess
import struct
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
FRAMES_DIR = OUT_DIR / "demo-video-frames"
GIF_PATH = OUT_DIR / "last-mile-margin-feature-demo.gif"
AVI_PATH = OUT_DIR / "last-mile-margin-feature-demo.avi"
M4V_PATH = OUT_DIR / "last-mile-margin-feature-demo.m4v"
POSTER_PATH = OUT_DIR / "last-mile-margin-feature-demo-poster.png"
LOGO_PATH = ROOT / "public" / "assets" / "last-mile-margin-logo-transparent.png"

W, H = 1440, 810
FPS = 8
HOLD_FRAMES = 18
FADE_FRAMES = 5

BG = "#050918"
PANEL = "#101827"
PANEL_2 = "#172033"
PANEL_3 = "#0B1020"
BORDER = "#26344F"
TEXT = "#F8FAFC"
MUTED = "#9AA8BD"
BLUE = "#2563EB"
BLUE_2 = "#3B82F6"
GREEN = "#059669"
GREEN_2 = "#34D399"
RED = "#EF4444"
AMBER = "#F59E0B"
PURPLE = "#8B5CF6"


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            pass
    return ImageFont.load_default()


F = {
    "tiny": font(12, True),
    "small": font(15),
    "small_b": font(15, True),
    "body": font(18),
    "body_b": font(18, True),
    "sub": font(22, True),
    "h2": font(30, True),
    "h1": font(44, True),
    "num": font(40, True),
    "hero": font(58, True),
}


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, font_key="body", fill=TEXT, anchor=None):
    draw.text(xy, value, font=F[font_key], fill=fill, anchor=anchor)


def wrap(draw, xy, value, max_width, font_key="body", fill=MUTED, line_gap=6):
    words = value.split()
    lines = []
    current = ""
    fnt = F[font_key]
    for word in words:
        test = f"{current} {word}".strip()
        box = draw.textbbox((0, 0), test, font=fnt)
        if box[2] - box[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def load_logo(max_w=130, max_h=100):
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo.thumbnail((max_w, max_h), Image.LANCZOS)
    return logo


LOGO = load_logo(145, 110)


def base(progress=0):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # subtle radial glow
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((860, -120, 1740, 620), fill=(37, 99, 235, 28))
    overlay = overlay.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)

    # sidebar
    rounded(d, (0, 0, 210, H), 0, "#070D1A", "#1E2A42")
    img.paste(LOGO, (52, 24), LOGO)
    nav = ["Dashboard", "Intake", "Profitability", "Contracts", "Claims", "Reports"]
    for i, item in enumerate(nav):
        y = 170 + i * 58
        if item == "Dashboard":
            rounded(d, (18, y - 10, 192, y + 38), 12, BLUE)
            fill = TEXT
        else:
            fill = MUTED
        text(d, (52, y), item, "small_b", fill)
        d.rounded_rectangle((28, y - 2, 38, y + 8), 2, outline=fill, width=2)

    # top controls
    rounded(d, (1050, 16, 1168, 58), 12, "#062C24", "#0E5F4D")
    text(d, (1086, 29), "Save Day", "small_b", "#B7F7D4")
    rounded(d, (1184, 16, 1310, 58), 12, "#121827", BORDER)
    text(d, (1218, 29), "Saved Days  2", "small_b", TEXT)
    rounded(d, (1324, 16, 1424, 58), 12, "#121827", BORDER)
    text(d, (1346, 29), "Jun 1", "small_b", TEXT)
    return img


def caption(img, title, body):
    d = ImageDraw.Draw(img)
    rounded(d, (245, H - 122, W - 35, H - 32), 18, "#020617D0", "#1D4ED8", 2)
    text(d, (272, H - 102), title, "sub", TEXT)
    wrap(d, (272, H - 68), body, W - 340, "body", "#C7D2FE", 3)


def card(d, xy, title, value, note, color=TEXT, icon="$"):
    x1, y1, x2, y2 = xy
    rounded(d, xy, 18, PANEL, BORDER, 2)
    # icon chip + label on the top row
    rounded(d, (x1 + 22, y1 + 20, x1 + 60, y1 + 58), 11, "#13213A")
    text(d, (x1 + 41, y1 + 28), icon, "sub", color, anchor="ma")
    text(d, (x1 + 74, y1 + 30), title.upper(), "tiny", MUTED)
    # big value, full card width below the icon row, with the note at the bottom
    text(d, (x1 + 24, y1 + 64), value, "num", color)
    text(d, (x1 + 24, y1 + 110), note, "small_b", MUTED)


def draw_dashboard(progress=0):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Dashboard", "h1")
    text(d, (245, 142), "Overview of routes, profitability, claims, and performance.", "body", MUTED)
    card(d, (245, 190, 475, 318), "Day Net Profit", "$356.03", "Healthy route", GREEN, "$")
    card(d, (495, 190, 725, 318), "Day Claims", "$2,600", "Needs review", RED, "!")
    card(d, (745, 190, 975, 318), "Day Revenue", "$1,200", "8.7% vs prior day", BLUE_2, "$")
    card(d, (995, 190, 1235, 318), "Day Margin", "26.5%", "Above target", GREEN, "%")
    rounded(d, (245, 350, 760, 640), 20, "#0D1A2E", BLUE, 1)
    text(d, (270, 380), "Today's Profit", "sub", TEXT)
    text(d, (270, 430), "$356.03", "hero", TEXT)
    text(d, (270, 505), "Margin", "small_b", MUTED)
    text(d, (270, 530), "26.5%", "h2", TEXT)
    text(d, (405, 530), "↗ 12.32%", "sub", GREEN_2)
    points = [(500, 555), (560, 535), (620, 500), (690, 475), (735, 440)]
    d.line(points, fill=BLUE_2, width=5)
    rounded(d, (790, 350, 1235, 640), 20, PANEL, BORDER)
    text(d, (820, 382), "Needs Attention", "sub", RED)
    items = ["Team C missing photo", "Claims review needed", "Cost above target", "Escrow under target"]
    for i, item in enumerate(items):
        y = 430 + i * 46
        rounded(d, (820, y - 8, 856, y + 28), 10, "#351B2B")
        text(d, (874, y), item, "body_b", TEXT)
        text(d, (874, y + 22), "Click to view what is driving it", "small", MUTED)
    caption(img, "Dashboard: know what needs attention", "Profit, claims, revenue, cost, margin, and attention items are visible before the contractor starts digging.")
    return img


def draw_intake(progress=0):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Intake", "h1")
    text(d, (245, 142), "Drop messy info once. Review what was found, then send it where it belongs.", "body", MUTED)
    rounded(d, (245, 180, 1235, 336), 18, "#0C1629", BLUE, 2)
    text(d, (660, 226), "Drop files here or paste your text", "sub", TEXT, anchor="ma")
    text(d, (718, 268), "Email, screenshot, PDF, route sheet, contract terms, or delivery notes", "body", MUTED, anchor="ma")
    rounded(d, (630, 290, 780, 330), 12, BLUE)
    text(d, (658, 302), "Attach Files", "small_b")
    rounded(d, (245, 368, 790, 638), 18, PANEL, BORDER)
    text(d, (275, 400), "Extracted Information", "sub")
    fields = [
        ("Source", "Email"),
        ("Store / Customer", "Lowe's Store #1234"),
        ("Route / Stop", "Route 14 / Stop 23"),
        ("Issue Type", "Wall Damage"),
        ("Claim Amount", "$950.00"),
        ("Driver", "Mike Johnson"),
    ]
    for i, (label, val) in enumerate(fields):
        x = 275 + (i % 2) * 250
        y = 455 + (i // 2) * 56
        text(d, (x, y), label.upper(), "tiny", MUTED)
        rounded(d, (x, y + 17, x + 215, y + 52), 8, PANEL_3, BORDER)
        text(d, (x + 12, y + 26), val, "small_b", TEXT)
    rounded(d, (820, 368, 1235, 638), 18, PANEL, BORDER)
    text(d, (850, 400), "Next Step", "sub")
    actions = [("Save to Claim", RED), ("Save to Contract", BLUE_2), ("Save to Profitability", GREEN), ("Save to Saved Day", AMBER)]
    for i, (label, color) in enumerate(actions):
        y = 455 + i * 50
        rounded(d, (850, y, 1198, y + 38), 9, "#0B1020", BORDER)
        rounded(d, (865, y + 8, 889, y + 31), 7, color)
        text(d, (905, y + 10), label, "small_b", TEXT)
    caption(img, "AI Intake: capture the messy stuff", "Emails, notes, screenshots, PDFs, and route sheets become reviewable drafts instead of manual entry.")
    return img


def draw_claims(progress=0):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Claims", "h1")
    text(d, (245, 142), "Drag claims between columns and the status updates automatically.", "body", MUTED)
    columns = [("Needs Review", RED), ("In Progress", BLUE_2), ("Resolved", GREEN)]
    for ci, (name, color) in enumerate(columns):
        x = 245 + ci * 330
        rounded(d, (x, 190, x + 300, 650), 18, PANEL, BORDER)
        text(d, (x + 22, 220), name, "sub", TEXT)
        for i in range(3 if ci == 0 else 2):
            y = 280 + i * 112
            rounded(d, (x + 18, y, x + 282, y + 86), 14, "#0B1020", BORDER)
            title = ["Wall Damage", "Product Damage", "Missed Window"][i % 3]
            amount = ["$950", "$725", "$250"][i % 3]
            text(d, (x + 36, y + 18), title, "body_b", TEXT)
            text(d, (x + 36, y + 45), "Driver assigned · Route linked", "small", MUTED)
            text(d, (x + 218, y + 18), amount, "body_b", color)
    # drag ghost
    x = int(330 + progress * 260)
    rounded(d, (x, 398, x + 240, 476), 14, "#13213A", BLUE_2, 2)
    text(d, (x + 22, 420), "Wall Damage", "body_b")
    text(d, (x + 22, 448), "Dragging to In Progress", "small", "#C7D2FE")
    caption(img, "Claims: drag to update status", "Contractors can move fast without opening a long form just to change a claim status.")
    return img


def draw_route_profit(progress=0):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Route Profit Check", "h1")
    text(d, (245, 142), "Pick the contract, choose pay types, add custom charges, and see profit live.", "body", MUTED)
    rounded(d, (245, 180, 1235, 250), 18, PANEL, BORDER)
    text(d, (275, 204), "View:", "body_b")
    rounded(d, (340, 194, 500, 238), 12, "#20283A")
    text(d, (365, 206), "All Contracts", "small_b", MUTED)
    rounded(d, (510, 194, 710, 238), 12, BLUE)
    text(d, (534, 206), "Route Profit Check", "small_b")
    rounded(d, (820, 194, 1160, 238), 12, PANEL_3, BORDER)
    text(d, (846, 206), "Lowe's Appliance Delivery", "small_b", TEXT)
    rounded(d, (245, 284, 815, 660), 18, PANEL, BORDER)
    text(d, (275, 318), "Contract Rate Card", "sub")
    labels = ["Flat Route Pay", "Per Stop Pay", "Install Pay", "Accessorials", "Fuel Surcharge", "Reattempt Pay"]
    for i, label in enumerate(labels):
        x = 275 + (i % 2) * 260
        y = 370 + (i // 2) * 58
        rounded(d, (x, y, x + 230, y + 44), 12, "#0B1020", BORDER)
        d.rectangle((x + 16, y + 15, x + 30, y + 29), outline=BLUE_2, width=2)
        d.line((x + 18, y + 22, x + 23, y + 27, x + 31, y + 15), fill=GREEN_2, width=3)
        text(d, (x + 44, y + 13), label, "small_b", TEXT)
    rounded(d, (275, 560, 780, 630), 14, "#062C24", "#0E5F4D")
    text(d, (300, 578), "Custom Charge", "small_b", GREEN_2)
    text(d, (300, 606), "Stairs Fee", "body_b", TEXT)
    text(d, (690, 606), "$75", "body_b", GREEN_2)
    rounded(d, (850, 284, 1235, 660), 18, PANEL, BORDER)
    text(d, (880, 318), "Live Route Summary", "sub")
    summary = [("Revenue", "$1,275", BLUE_2), ("Cost", "$775", RED), ("Net Profit", "$500", GREEN_2), ("Margin", "39.22%", GREEN_2)]
    for i, (label, val, color) in enumerate(summary):
        y = 380 + i * 70
        text(d, (880, y), label, "body_b", MUTED)
        text(d, (1085, y - 4), val, "h2", color)
    caption(img, "Route Profit Check: decide before running it", "Every contract can have different pay types, plus custom charges that are treated like real rate-card items.")
    return img


def draw_context_popup(progress=0):
    img = draw_route_profit(progress)
    d = ImageDraw.Draw(img)
    rounded(d, (650, 330, 1245, 650), 20, "#070B19", "#1D4ED8", 2)
    text(d, (682, 360), "Edit Route Section", "small_b", MUTED)
    text(d, (682, 398), "Revenue", "h2", TEXT)
    fields = [("Base Route Pay", "1200"), ("Stops", "20"), ("Per Stop Pay", "0"), ("Stairs Fee", "75")]
    for i, (label, value) in enumerate(fields):
        x = 682 + (i % 2) * 260
        y = 462 + (i // 2) * 72
        text(d, (x, y), label.upper(), "tiny", MUTED)
        rounded(d, (x, y + 18, x + 225, y + 58), 10, PANEL_3, BORDER)
        text(d, (x + 14, y + 29), value, "body_b", TEXT)
    text(d, (682, 612), "Click outside to close", "small_b", "#C7D2FE")
    caption(img, "Contextual popup: opens where you click", "Section editors appear beside the selected card and disappear when you click outside.")
    return img


def draw_contracts(progress=0, show_popup=True):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Contracts Roll-Up", "h1")
    text(d, (245, 142), "Click any contract row to review revenue, costs, claims, profit, and margin.", "body", MUTED)
    rounded(d, (245, 190, 1235, 610), 18, PANEL, BORDER)
    headers = ["Contract", "Routes", "Revenue", "Costs", "Claims", "Profit", "Margin"]
    xs = [280, 600, 700, 820, 950, 1060, 1180]
    for x, h in zip(xs, headers):
        text(d, (x, 220), h.upper(), "tiny", MUTED)
    rows = [
        ("RC Willey Furniture", "5", "$20,700", "$12,730", "250", "$7,970", "38.5%"),
        ("Home Depot Large Item", "6", "$19,000", "$13,800", "400", "$5,200", "27.3%"),
        ("Best Buy Tech", "4", "$13,200", "$10,050", "725", "$3,150", "23.9%"),
        ("Lowe's Appliance", "5", "$15,600", "$12,700", "1,625", "$2,900", "18.6%"),
    ]
    for i, row in enumerate(rows):
        y = 270 + i * 70
        if i == 3 and show_popup:
            rounded(d, (260, y - 18, 1215, y + 48), 12, "#13213A", BLUE, 2)
        for x, val in zip(xs, row):
            fill = RED if val in ("1,625", "18.6%") else GREEN_2 if val.startswith("$") and x >= 1060 else TEXT
            text(d, (x, y), val, "body_b", fill)
    if show_popup:
        rounded(d, (760, 444, 1220, 705), 18, "#070B19", "#1D4ED8", 2)
        text(d, (790, 475), "Edit Contract", "small_b", MUTED)
        text(d, (790, 510), "Lowe's Appliance Delivery", "sub")
        for i, (label, val) in enumerate([("Revenue", "15600"), ("Labor", "5200"), ("Claims", "1625"), ("Routes / Week", "5")]):
            x = 790 + (i % 2) * 210
            y = 560 + (i // 2) * 62
            text(d, (x, y), label.upper(), "tiny", MUTED)
            rounded(d, (x, y + 18, x + 170, y + 54), 9, PANEL_3, BORDER)
            text(d, (x + 12, y + 26), val, "small_b")
    caption(img, "Contracts: click a row, edit in place", "Contract totals stay clean while detailed editing happens in a focused popup.")
    return img


def draw_saved_day(progress=0):
    img = base(progress)
    d = ImageDraw.Draw(img)
    text(d, (245, 86), "Save Day", "h1")
    text(d, (245, 142), "Save today automatically or manually, then come back to the exact day later.", "body", MUTED)
    rounded(d, (245, 210, 480, 290), 16, "#062C24", "#0E5F4D")
    text(d, (295, 240), "Save Day", "h2", "#B7F7D4")
    rounded(d, (520, 210, 815, 290), 16, PANEL, BORDER)
    text(d, (570, 240), "Saved Days   2", "h2", TEXT)
    rounded(d, (850, 210, 1145, 520), 20, PANEL, BORDER)
    text(d, (880, 246), "Saved Days", "sub")
    for i, day in enumerate(["Jun 1, 2026", "May 31, 2026"]):
        y = 305 + i * 78
        rounded(d, (880, y, 1115, y + 54), 12, PANEL_3, BORDER)
        text(d, (900, y + 14), day, "body_b")
        text(d, (1040, y + 14), "$356", "body_b", GREEN_2)
    rounded(d, (245, 360, 790, 625), 20, PANEL, BORDER)
    text(d, (280, 400), "Day Snapshot", "sub")
    for i, (label, val, color) in enumerate([("Profit", "$356.03", GREEN_2), ("Claims", "$2,600", RED), ("Revenue", "$1,200", BLUE_2), ("Margin", "26.5%", GREEN_2)]):
        x = 280 + (i % 2) * 245
        y = 460 + (i // 2) * 72
        text(d, (x, y), label.upper(), "tiny", MUTED)
        text(d, (x, y + 22), val, "h2", color)
    caption(img, "Saved Day: close the loop", "The day can be saved at midnight or on demand, so the contractor can return to the exact snapshot later.")
    return img


def draw_end(progress=0):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((360, 90, 1080, 740), fill=(37, 99, 235, 45))
    overlay = overlay.filter(ImageFilter.GaussianBlur(110))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)
    logo = load_logo(260, 210)
    img.paste(logo, ((W - logo.width) // 2, 130), logo)
    text(d, (W // 2, 390), "Last Mile Margin", "hero", TEXT, anchor="ma")
    wrap(d, (390, 460), "Capture the messy stuff once. Understand the numbers. Keep moving.", 720, "h2", "#C7D2FE", 8)
    rounded(d, (540, 610, 900, 672), 18, BLUE)
    text(d, (620, 627), "Built for final-mile contractors", "body_b", TEXT)
    return img


SCENES = [
    draw_dashboard,
    draw_intake,
    draw_claims,
    draw_route_profit,
    draw_context_popup,
    draw_contracts,
    draw_saved_day,
    draw_end,
]


def make_frames():
    OUT_DIR.mkdir(exist_ok=True)
    FRAMES_DIR.mkdir(exist_ok=True)
    scene_images = []
    for scene in SCENES:
        local = []
        for i in range(HOLD_FRAMES):
            progress = i / max(1, HOLD_FRAMES - 1)
            local.append(scene(progress))
        scene_images.append(local)

    frames = []
    previous = None
    for local in scene_images:
        first = local[0]
        if previous is not None:
            for i in range(1, FADE_FRAMES + 1):
                alpha = i / (FADE_FRAMES + 1)
                frames.append(Image.blend(previous, first, alpha))
        frames.extend(local)
        previous = local[-1]

    POSTER_PATH.parent.mkdir(exist_ok=True)
    frames[0].save(POSTER_PATH)

    # Save a moderate-size GIF. It is intentionally optimized for easy sharing.
    frames[0].save(
        GIF_PATH,
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )

    # Also save selected frames for review.
    for idx, frame in enumerate(frames[:: max(1, len(frames) // 8)]):
        frame.save(FRAMES_DIR / f"frame-{idx + 1:02d}.png")

    return frames


def avi_chunk(fourcc, data):
    padding = b"\0" if len(data) % 2 else b""
    return fourcc + struct.pack("<I", len(data)) + data + padding


def avi_list(list_type, data):
    return b"LIST" + struct.pack("<I", len(data) + 4) + list_type + data + (b"\0" if (len(data) + 4) % 2 else b"")


def write_mjpeg_avi(frames, path):
    jpeg_frames = []
    max_frame_size = 0
    for frame in frames:
        buffer = BytesIO()
        frame.save(buffer, format="JPEG", quality=88, optimize=True)
        data = buffer.getvalue()
        jpeg_frames.append(data)
        max_frame_size = max(max_frame_size, len(data))

    width, height = frames[0].size
    frame_count = len(frames)
    usec_per_frame = int(1_000_000 / FPS)
    max_bytes_per_second = max_frame_size * FPS

    avih = struct.pack(
        "<10I4I",
        usec_per_frame,
        max_bytes_per_second,
        0,
        0x10,
        frame_count,
        0,
        1,
        max_frame_size,
        width,
        height,
        0,
        0,
        0,
        0,
    )

    strh = struct.pack(
        "<4s4sIHHIIIIIIIIiiii",
        b"vids",
        b"MJPG",
        0,
        0,
        0,
        0,
        1,
        FPS,
        0,
        frame_count,
        max_frame_size,
        0xFFFFFFFF,
        0,
        0,
        0,
        width,
        height,
    )

    strf = struct.pack(
        "<IiiHH4sIiiII",
        40,
        width,
        height,
        1,
        24,
        b"MJPG",
        max_frame_size,
        0,
        0,
        0,
        0,
    )

    hdrl = avi_list(
        b"hdrl",
        avi_chunk(b"avih", avih) + avi_list(b"strl", avi_chunk(b"strh", strh) + avi_chunk(b"strf", strf)),
    )

    movi_data = bytearray()
    index_entries = []
    for data in jpeg_frames:
        offset = len(movi_data) + 4
        movi_data.extend(avi_chunk(b"00dc", data))
        index_entries.append(struct.pack("<4sIII", b"00dc", 0x10, offset, len(data)))

    movi = avi_list(b"movi", bytes(movi_data))
    idx1 = avi_chunk(b"idx1", b"".join(index_entries))
    riff_data = hdrl + movi + idx1
    path.write_bytes(b"RIFF" + struct.pack("<I", len(riff_data) + 4) + b"AVI " + riff_data)


def try_convert_to_m4v():
    avconvert = Path("/usr/bin/avconvert")
    if not avconvert.exists():
        return False

    command = [
        str(avconvert),
        "--source",
        str(AVI_PATH),
        "--preset",
        "Preset1280x720",
        "--output",
        str(M4V_PATH),
        "--replace",
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        return result.returncode == 0 and M4V_PATH.exists()
    except Exception:
        return False


if __name__ == "__main__":
    frames = make_frames()
    write_mjpeg_avi(frames, AVI_PATH)
    converted = try_convert_to_m4v()
    print(f"Created {GIF_PATH}")
    print(f"Created {AVI_PATH}")
    print(f"Created {POSTER_PATH}")
    print(f"Frames: {len(frames)} at {FPS} fps")
    if converted:
        print(f"Created {M4V_PATH}")
    else:
        print("M4V conversion was not available; GIF is ready.")
