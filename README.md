# LONY Projects

A project hub for polytechnic students. Browse ready-made project ideas across departments, follow step-by-step guides, and unlock premium projects with 3D models, all from a phone-friendly website.

## Features

- **Project library** with free and premium projects across 7 departments (software, electronics, electrical, mechanical and more)
- **Step-by-step guides** for every project, with a built-in code runner for web and JavaScript projects
- **Ask AI** button in each guide: builds a ready-made question and opens ChatGPT, Claude, or Gemini. No API keys, and nothing is sent to LONY servers
- **Interactive 360° model viewer** for hardware and robotics projects
- **Google sign-in**, personal profile, and a "My Projects" page
- **Premium unlock** via UPI payment with UTR submission and admin approval
- **Admin dashboard** to review payments and manage users
- Privacy policy, cookie preferences, and online/offline detection

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Auth and database | Firebase Authentication (Google) and Firestore |
| Hosting | GitHub Pages |

## Project Structure

| File | Purpose |
|---|---|
| `index.html` | Home page, project list, premium popup |
| `project.html` | Single project page and guide |
| `login.html`, `profile.html`, `myprojects.html` | Account pages |
| `admin.html` | Payment approval and user management |
| `runner.html` | Code runner |
| `payment-failed.html`, `privacy.html` | Payment status and policy pages |
| `auth.js` | Firebase config, login, Firestore helpers |
| `pay.js`, `paysync.js` | UPI payment flow and status sync |
| `details.js` | Project guide content |
| `askai.js` | Ask AI feature |
| `viewer360.js`, `360/` | 360° viewer and model files |
| `videos.js`, `media.js`, `projsocial.js`, `lony-extras.js` | Videos, media, social features, shared extras |
| `FIREBASE_SETUP.md` | Firebase and Firestore rules setup |
| `CHANGES.md` | Change log |

## Setup

1. Create a Firebase project and enable **Google sign-in** and **Firestore**.
2. Add your Firebase config and admin email in `auth.js`.
3. Publish the Firestore security rules from `FIREBASE_SETUP.md`.
4. Add your UPI ID in `pay.js`.
5. Deploy to GitHub Pages and add the site domain under Firebase **Authorized domains**.

Full steps are in [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Adding Content

- **New project:** add it to the project list in `index.html` and `project.html` (keep both identical), and its guide in `details.js`.
- **360° model:** place the file in `360/` as `360-<project-slug>.bin`.
- **Project video:** add the YouTube link in `videos.js`.

## Security

- Admin access and payment data are protected by Firestore security rules, not by page code.
- Payment status is always read from Firestore, never from the URL.
- Never commit secret keys. Firebase web config is public by design; the rules are what protect your data.

## Author

Built by a Diploma (Web Designing) student at TNGPTC, Madurai, using HTML, CSS, JavaScript, and AI-assisted development.

## License

All rights reserved.
