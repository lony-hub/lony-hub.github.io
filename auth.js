/* LONY auth: Google sign in / sign up + admin check (Firebase).
   Edit ONLY the two blocks below: FIREBASE_CONFIG and ADMIN_EMAILS. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit,
  where, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 1) Firebase console > Project settings > Your apps > Web app > Config */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtggUP1zBWctWCmtWVlE88RC-kN0-pfOg",
  authDomain: "lony-hub.firebaseapp.com",
  projectId: "lony-hub",
  appId: "1:567761949476:web:d77b7c6b23dcb5e80b19b1"
};

/* 2) Google accounts that can open the Admin panel (lowercase) */
export const ADMIN_EMAILS = [
  "romeo24juliet07@gmail.com"
];

export const configured = !String(FIREBASE_CONFIG.apiKey).startsWith("PASTE");

let app, auth, db;
if (configured) {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const isAdminEmail = (email) =>
  !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(String(email).toLowerCase());

export const isAdminUser = (u) => !!u && u.emailVerified && isAdminEmail(u.email);

/* Only allow same-site relative redirects */
export function safeNext(raw, fallback) {
  if (!raw || /^[a-z]+:|^\/\//i.test(raw) || raw.includes("\\")) return fallback;
  return raw;
}

export function onUser(cb) {
  if (!configured) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export const currentUser = () => (configured ? auth.currentUser : null);

export function logout() {
  return configured ? signOut(auth) : Promise.resolve();
}

/* mode: "signin" | "signup" | "admin" */
export async function signInWithGoogle(mode) {
  if (!configured) throw { code: "lony/not-configured" };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const isNew = !!getAdditionalUserInfo(result)?.isNewUser;
  const admin = isAdminUser(user);

  if (mode === "admin" && !admin) {
    await signOut(auth);
    throw { code: "lony/not-admin", email: user.email };
  }

  try {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || "",
      email: user.email || "",
      photo: user.photoURL || "",
      lastLogin: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {})
    }, { merge: true });
  } catch (e) { /* Firestore not enabled yet: login still works */ }

  return { user, isNew, admin };
}

/* Admin panel only. Firestore rules decide if this is allowed. */
export async function listUsers(max = 200) {
  const snap = await getDocs(query(collection(db, "users"), orderBy("lastLogin", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


/* ---------- Payments (UTR) ---------- */
export const slug = (k) => String(k).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Doc id = UTR, so the same UTR can never be submitted twice (Firestore rules block overwrite). */
export async function submitPayment({ key, amount, utr }) {
  const u = auth.currentUser;
  if (!u) throw { code: "lony/login" };
  await setDoc(doc(db, "payments", utr), {
    uid: u.uid, email: u.email || "", key, amount: Number(amount), utr,
    status: "pending", createdAt: serverTimestamp()
  });
}

export async function getMyPaymentState(uid) {
  const [a, b] = await Promise.all([
    getDocs(query(collection(db, "unlocks"), where("uid", "==", uid))),
    getDocs(query(collection(db, "payments"), where("uid", "==", uid)))
  ]);
  return {
    unlocked: a.docs.map((d) => d.data().slug),
    pending: b.docs.map((d) => d.data()).filter((p) => p.status === "pending").map((p) => slug(p.key))
  };
}

/* Admin only (Firestore rules enforce this) */
export async function listPayments(max = 300) {
  const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approvePayment(p) {
  const batch = writeBatch(db);
  batch.update(doc(db, "payments", p.id), { status: "approved", approvedAt: serverTimestamp() });
  batch.set(doc(db, "unlocks", p.uid + "_" + slug(p.key)), {
    uid: p.uid, slug: slug(p.key), key: p.key, utr: p.id, amount: p.amount,
    email: p.email || "", approvedAt: serverTimestamp()
  });
  await batch.commit();
}

export async function rejectPayment(p) {
  const batch = writeBatch(db);
  batch.update(doc(db, "payments", p.id), { status: "rejected", approvedAt: serverTimestamp() });
  await batch.commit();
}

export function friendlyError(e) {
  const c = (e && e.code) || "";
  if (c === "lony/not-configured") return "Firebase config is not filled in yet. Paste your FIREBASE_CONFIG into auth.js.";
  if (c === "lony/not-admin") return (e.email || "This account") + " is not in the admin list. Please sign in with an admin Google account.";
  if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "Sign in was cancelled. Please try again.";
  if (c === "auth/popup-blocked") return "Your browser blocked the popup. Allow popups and try again.";
  if (c === "auth/unauthorized-domain") return "This domain is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.";
  if (c === "auth/network-request-failed") return "Please check your internet connection.";
  if (c === "permission-denied" || c === "firestore/permission-denied") return "Firestore rules do not allow this account to view the data.";
  return "Sign in failed (" + (c || "unknown") + "). Please try again.";
}

/* Navbar button for index.html: Login when signed out, avatar menu when signed in */
export function mountNav() {
  const anchor = document.getElementById("tbtn");
  if (!anchor) return;
  const st = document.createElement("style");
  st.textContent =
    ".lauth{display:flex;align-items:center;gap:8px;margin-left:auto;margin-right:10px}" +
    ".lauth a,.lauth button{font:inherit;font-size:.82rem;font-weight:700;cursor:pointer;border-radius:50px;padding:7px 14px;border:1px solid rgba(var(--a-rgb),.45);background:rgba(var(--a-rgb),.12);color:var(--a-soft,#818cf8);text-decoration:none;white-space:nowrap}" +
    ".lauth a:hover,.lauth button:hover{background:rgba(var(--a-rgb),.22)}" +
    ".lauth a:focus-visible,.lauth button:focus-visible{outline:2px solid var(--a-soft,#818cf8);outline-offset:2px}" +
    ".lauth img{width:28px;height:28px;border-radius:50%;border:1px solid var(--border-subtle)}" +
    "@media(max-width:520px){.lauth{margin-right:6px}.lauth .lname{display:none}}";
  document.head.appendChild(st);

  const slot = document.createElement("div");
  slot.className = "lauth";
  anchor.parentNode.insertBefore(slot, anchor);

  const render = (u) => {
    slot.textContent = "";
    if (!u) {
      const a = document.createElement("a");
      a.href = "login.html";
      a.textContent = "Login";
      slot.appendChild(a);
      return;
    }
    if (u.photoURL) {
      const img = document.createElement("img");
      img.src = u.photoURL; img.alt = ""; img.referrerPolicy = "no-referrer";
      slot.appendChild(img);
    }
    if (isAdminUser(u)) {
      const a = document.createElement("a");
      a.href = "admin.html"; a.textContent = "Admin";
      slot.appendChild(a);
    }
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "Logout";
    b.onclick = () => logout();
    slot.appendChild(b);
  };
  render(null);
  onUser(render);
}
