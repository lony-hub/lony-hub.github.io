# LONY Projects – enhancement notes (4 Nov 2026)

## New files
- `lony-extras.js` – loading screen, cookie preferences, basic copy protection, online/offline detection, footer links. Loaded first in `<head>` on every page.
- `privacy.html` – Privacy Policy. Set `LONY_CONTACT_EMAIL` at the bottom of the file.
- `payment-failed.html` – payment failure page, status is read from Firestore `payments` (never from the URL).
- `askai.js` – "Ask AI" button in every project guide (project.html and the index.html preview).

## Edited files (small, additive)
- `auth.js` – added `getMyPayments`, `getMyUnlocks`; `getMyPaymentState` now also returns `rejected` (existing fields unchanged).
- `paysync.js` – one-time "payment could not be verified" notice linking to payment-failed.html.
- `pay.js` – blocks duplicate submits (in-flight / already pending / already unlocked).
- `index.html` – Privacy link, askai.js, `?retry=prem_xxx` reopens the premium payment popup.
- `project.html` – askai.js, `window.LONY_CUR` (title/description/category for Ask AI), `?retry=1` reopens the payment popup.
- All other pages – only the `lony-extras.js` include.

## Notes
- `guide.js` in the repo is cut off mid-file (syntax error) and is not loaded by any page; the live guide code is inline in project.html/index.html. It was left untouched.
- No Firestore rule changes are needed.
- Ask AI URL prefill is OFF for all three providers (copy question + open official site). Enable per provider in `PROVIDERS` in `askai.js` only if the provider documents it.
- Optional storage keys (`lony_theme`, `lony_glang`, `lony_gdev`, `lony_email`) are written only after the user allows "Preferences".
- Optional third-party scripts must use: `<script type="text/plain" data-lony-consent="analytics" data-src="..."></script>`
site redeploy-5 nov 2026

## 13 Nov 2026 - 21 new free projects
- 3 new free projects added to every department (7 x 3). Edited: `index.html` and `project.html` (P list, both kept identical), `details.js` (LONY_X guides + 1 LONY_USE entry: FreeCAD).
- New free projects need no paid parts: web/JS tools, Python, Tinkercad simulations, FreeCAD.
- Robotics dept always shows the 360 box; new Robotics projects show "coming soon" there until a 360 model file is added.

## 360 models for new free projects
- Added 8 models in `360/`: ultrasonic-distance-meter-in-tinkercad, 2-link-robot-arm-simulator, grid-path-finder-visualizer-a, led-circuit-in-tinkercad, gear-ratio-speed-calculator, bolt-nut-3d-model-in-freecad, beam-bending-calculator, container-load-calculator.
- `project.html` and `viewer360.js`: tags Tinkercad, Gears, FreeCAD, Strength, Container added to the hardware tag list so the 360 box appears for these projects.
- Software-only projects (typing test, resume builder, etc.) have no 360, same as the existing web projects.
