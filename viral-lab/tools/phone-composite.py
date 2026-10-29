# Put a rendered app screen (e.g. foco-video/public/vlog/screens/tap.mp4) into the phone of a stock clip.
#   white mode: the stock phone shows a blank white screen; every frame, the white blob around `seed` gives the
#               screen quad, and ONLY white pixels are replaced, so a finger over the screen stays in front.
#   track mode: the stock phone shows other content; `quad` (TL, TR, BR, BL at the first frame) is followed with
#               optical flow + a homography (camera push-ins, small pans).
# The screen keeps the phone's rounded corners (a rounded-rect alpha warped with the quad). Output is H.264 for Remotion.
# Usage: python viral-lab/tools/phone-composite.py <job.json>
#   job = {"clip", "screen", "out", "start", "dur", "mode", "seed": [x, y], "up": [ux, uy], "quad": [[x, y] x4],
#          "screenOffset": seconds into the screen video, "gain": brightness}
import json, subprocess, sys
import cv2
import numpy as np

job = json.load(open(sys.argv[1], encoding="utf8"))
cap = cv2.VideoCapture(job["clip"])
fps = cap.get(cv2.CAP_PROP_FPS)
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
cap.set(cv2.CAP_PROP_POS_FRAMES, round(job["start"] * fps))
scr = cv2.VideoCapture(job["screen"])
sfps = scr.get(cv2.CAP_PROP_FPS)
sw, sh = int(scr.get(cv2.CAP_PROP_FRAME_WIDTH)), int(scr.get(cv2.CAP_PROP_FRAME_HEIGHT))
src = np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]])
# rounded-corner alpha in screen space (iPhone-like radius)
rr = np.zeros((sh, sw), np.uint8)
r = int(sw * 0.11)
cv2.rectangle(rr, (r, 0), (sw - r, sh), 255, -1); cv2.rectangle(rr, (0, r), (sw, sh - r), 255, -1)
for cx, cy in [(r, r), (sw - r, r), (r, sh - r), (sw - r, sh - r)]: cv2.circle(rr, (cx, cy), r, 255, -1)

def order(pts, up):
    # TL, TR, BR, BL in the phone's own frame (up = direction from the screen's bottom edge to its top edge)
    u = np.array(up, float); u /= np.linalg.norm(u)
    rt = np.array([-u[1], u[0]])
    c = pts.mean(0)
    score = lambda p, a, b: a * np.dot(p - c, u) + b * np.dot(p - c, rt)
    return np.float32([max(pts, key=lambda p: score(p, 1, -1)), max(pts, key=lambda p: score(p, 1, 1)),
                       max(pts, key=lambda p: score(p, -1, 1)), max(pts, key=lambda p: score(p, -1, -1))])

def white_quad(frame, seed):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    white = ((hsv[..., 2] > 200) & (hsv[..., 1] < 40)).astype(np.uint8) * 255
    n, lab, stats, cent = cv2.connectedComponentsWithStats(white)
    sx, sy = int(seed[0]), int(seed[1])
    k = lab[sy, sx]
    if k == 0:  # seed fell on the finger: take the biggest blob near it
        d = [np.hypot(*(cent[i] - seed)) if stats[i, 4] > 2000 else 1e9 for i in range(1, n)]
        k = 1 + int(np.argmin(d))
    blob = (lab == k).astype(np.uint8) * 255
    hull = cv2.convexHull(cv2.findNonZero(blob))  # convex hull ignores the finger's notch
    box = cv2.boxPoints(cv2.minAreaRect(hull))
    return box, white, cent[k]

out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", job["out"]], stdin=subprocess.PIPE)
seed = np.array(job.get("seed", [W / 2, H / 2]), float)
quad = np.float32(job["quad"]) if "quad" in job else None
prev_gray, feats, smooth = None, None, None
gain = job.get("gain", 1.0)
for i in range(round(job["dur"] * fps)):
    ok, frame = cap.read()
    if not ok: break
    t = i / fps + job.get("screenOffset", 0)
    scr.set(cv2.CAP_PROP_POS_FRAMES, min(int(scr.get(cv2.CAP_PROP_FRAME_COUNT)) - 1, round(t * sfps)))
    ok2, sf = scr.read()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    if job["mode"] == "white":
        box, white, c = white_quad(frame, seed)
        seed = c
        q = order(box, job["up"])
        keep = cv2.GaussianBlur(cv2.dilate(white, np.ones((3, 3), np.uint8)), (5, 5), 0)
    else:
        if prev_gray is None:
            q = quad
        else:
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev_gray, gray, feats, None)
            good = st.ravel() == 1
            Hm, _ = cv2.findHomography(feats[good], nxt[good], cv2.RANSAC, 3.0)
            q = cv2.perspectiveTransform(q.reshape(-1, 1, 2), Hm).reshape(4, 2)
        if prev_gray is None or i % 8 == 0:
            m = np.zeros_like(gray); cv2.fillConvexPoly(m, q.astype(np.int32), 255)
            feats = cv2.goodFeaturesToTrack(gray, 300, 0.01, 6, mask=cv2.dilate(m, np.ones((41, 41), np.uint8)))
        else:
            feats = nxt[good].reshape(-1, 1, 2)
        keep = None
    # light smoothing kills detection jitter without lagging real motion
    smooth = q if smooth is None else 0.5 * smooth + 0.5 * q
    M = cv2.getPerspectiveTransform(src, np.float32(smooth))
    warped = cv2.warpPerspective(sf, M, (W, H)).astype(np.float32) * gain
    alpha = cv2.warpPerspective(rr, M, (W, H)).astype(np.float32) / 255
    if keep is not None: alpha *= keep.astype(np.float32) / 255
    alpha = alpha[..., None]
    frame = (frame * (1 - alpha) + warped * alpha).clip(0, 255).astype(np.uint8)
    out.stdin.write(frame.tobytes())
    prev_gray = gray
out.stdin.close(); out.wait()
print("wrote", job["out"], i + 1, "frames")
