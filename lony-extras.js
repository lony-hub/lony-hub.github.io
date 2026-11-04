/* LONY extras: loading screen, cookie preferences, basic copy protection,
   online/offline detection and privacy/cookie footer links.
   Load it as the FIRST script in <head> (plain script, not module):  <script src="lony-extras.js"></script>
   No external libraries. No tracking. */
(function () {
  "use strict";
  if (window.LONYX) return;
  var D = document, R = D.documentElement;
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var NO_PROTECT = /^(admin|runner|privacy)\.html$/.test(page);   /* these pages need selection / copying */
  var NO_FOOTER = /^(admin|runner)\.html$/.test(page);

  /* ---------- tiny helpers ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function el(tag, cls, html) { var n = D.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function onReady(fn) { if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", fn); else fn(); }

  /* ---------- shared styles (one tag) ---------- */
  var css = [
    ":root{--lx-bg:#0f141d;--lx-card:#141b26;--lx-bd:#212c3d;--lx-tx:#f8fafc;--lx-mu:#94a3b8;--lx-a:#6366f1;--lx-b:#a855f7;--lx-c:#06b6d4;--lx-amber:#fbbf24;--lx-red:#f87171;--lx-green:#34d399}",
    /* loader */
    "#lony-ld{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#07090e;background-image:radial-gradient(circle at 20% 0,rgba(99,102,241,.28),transparent 50%),radial-gradient(circle at 100% 20%,rgba(168,85,247,.2),transparent 45%);color:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;transition:opacity .35s ease,visibility .35s;animation:lxldout .01s 12s forwards}",
    "#lony-ld.off{opacity:0;visibility:hidden;pointer-events:none}",
    "@keyframes lxldout{to{opacity:0;visibility:hidden;pointer-events:none}}",
    ".lx-mark{width:68px;height:68px;border-radius:20px;display:grid;place-items:center;font-weight:900;font-size:2rem;color:#fff;background:linear-gradient(135deg,var(--lx-a),var(--lx-b));box-shadow:0 0 0 1px rgba(255,255,255,.08),0 12px 40px rgba(99,102,241,.45);animation:lxfloat 2.2s ease-in-out infinite}",
    "@keyframes lxfloat{50%{transform:translateY(-6px);box-shadow:0 0 0 1px rgba(255,255,255,.1),0 20px 50px rgba(168,85,247,.5)}}",
    ".lx-word{font-weight:800;letter-spacing:.14em;font-size:1.25rem;background:linear-gradient(110deg,var(--lx-a),var(--lx-c),#fff,var(--lx-b),var(--lx-a));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:lxshine 2.6s linear infinite}",
    "@keyframes lxshine{to{background-position:200% center}}",
    ".lx-sub{font-size:.8rem;color:var(--lx-mu);margin-top:-8px}",
    ".lx-bar{width:min(240px,64vw);height:5px;border-radius:9px;background:rgba(148,163,184,.2);overflow:hidden}",
    ".lx-bar i{display:block;height:100%;width:100%;border-radius:9px;background:linear-gradient(90deg,var(--lx-a),var(--lx-c));transform-origin:left;transform:scaleX(.08);transition:transform .35s ease}",
    "@media(prefers-reduced-motion:reduce){.lx-mark,.lx-word{animation:none}#lony-ld,.lx-bar i{transition:none}}",
    /* banners / toasts */
    ".lx-net{position:fixed;left:0;right:0;top:0;z-index:99990;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;font:600 .85rem/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#fff;transform:translateY(-110%);transition:transform .3s ease}",
    ".lx-net.on{transform:none}.lx-net.off{background:#b91c1c}.lx-net.slow{background:#b45309}.lx-net.ok{background:#047857}",
    ".lx-net button{font:inherit;font-weight:800;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.16);color:#fff;border-radius:50px;padding:5px 14px;cursor:pointer}",
    ".lx-net button:focus-visible,.lx-cc button:focus-visible,.lx-cc a:focus-visible{outline:2px solid #fde047;outline-offset:2px}",
    ".lx-toast{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:99980;max-width:min(92vw,420px);background:#141b26;color:#f8fafc;border:1px solid #fbbf24;border-radius:14px;padding:10px 14px;font:600 .85rem/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:all .3s ease}",
    ".lx-toast.on{opacity:1;transform:translate(-50%,0)}.lx-toast a{color:#fde047;text-decoration:underline;margin-left:6px}",
    /* cookie UI */
    ".lx-cc{position:fixed;z-index:99970;left:0;right:0;bottom:0;padding:0 10px calc(10px + env(safe-area-inset-bottom,0px));font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;pointer-events:none;transform:translateY(120%);transition:transform .35s ease}",
    ".lx-cc.on{transform:none}",
    ".lx-cc .box{pointer-events:auto;max-width:560px;margin:0 auto;background:var(--lx-bg);color:var(--lx-tx);border:1px solid var(--lx-bd);border-top:2px solid var(--lx-a);border-radius:22px;padding:18px;box-shadow:0 -10px 40px rgba(0,0,0,.55)}",
    ".lx-cc h3{font-size:1.05rem;margin:0 0 6px}.lx-cc p{font-size:.84rem;color:var(--lx-mu);margin:0 0 12px;line-height:1.55}.lx-cc p a{color:#a5b4fc;text-decoration:underline}",
    ".lx-row{display:flex;gap:8px;flex-wrap:wrap}",
    ".lx-btn{flex:1 1 140px;font:800 .84rem system-ui,sans-serif;cursor:pointer;border-radius:50px;padding:11px 14px;border:1px solid var(--lx-bd);background:transparent;color:var(--lx-tx);min-height:44px}",
    ".lx-btn.pri{border:none;background:linear-gradient(135deg,var(--lx-a),var(--lx-b));color:#fff}.lx-btn.sec{background:var(--lx-card)}.lx-btn:hover{filter:brightness(1.12)}",
    ".lx-ov{position:fixed;inset:0;z-index:99975;background:rgba(0,0,0,.72);display:none;align-items:flex-end;justify-content:center;padding:0}",
    ".lx-ov.on{display:flex}",
    ".lx-pan{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:var(--lx-bg);color:var(--lx-tx);border:1px solid var(--lx-bd);border-radius:24px 24px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
    "@media(min-width:640px){.lx-ov{align-items:center;padding:16px}.lx-pan{border-radius:24px}}",
    ".lx-pan h3{font-size:1.1rem;margin:0 0 4px}.lx-pan>p{font-size:.84rem;color:var(--lx-mu);margin:0 0 14px;line-height:1.55}",
    ".lx-opt{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;background:var(--lx-card);border:1px solid var(--lx-bd);border-radius:16px;padding:12px 14px;margin-bottom:10px}",
    ".lx-opt b{display:block;font-size:.92rem}.lx-opt small{display:block;color:var(--lx-mu);font-size:.78rem;line-height:1.45;margin-top:2px}",
    ".lx-sw{position:relative;flex:none;width:46px;height:26px}.lx-sw input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:1}",
    ".lx-sw span{position:absolute;inset:0;border-radius:30px;background:#334155;transition:background .2s}.lx-sw span:after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}",
    ".lx-sw input:checked+span{background:linear-gradient(135deg,var(--lx-a),var(--lx-b))}.lx-sw input:checked+span:after{transform:translateX(20px)}.lx-sw input:disabled{cursor:not-allowed}.lx-sw input:disabled+span{opacity:.6}.lx-sw input:focus-visible+span{outline:2px solid #fde047;outline-offset:2px}",
    ".lx-ft{margin:28px auto 0;padding:18px 16px calc(22px + env(safe-area-inset-bottom,0px));text-align:center;font:.8rem/1.6 system-ui,sans-serif;color:#94a3b8}",
    ".lx-fl{margin-top:8px;font-size:.8rem}.lx-fl a,.lx-fl button{color:inherit;background:none;border:none;font:inherit;text-decoration:underline;cursor:pointer;padding:4px 6px}",
    "@media(prefers-reduced-motion:reduce){.lx-net,.lx-toast,.lx-cc{transition:none}}"
  ];
  /* copy protection CSS (only where appropriate) */
  if (!NO_PROTECT) {
    css.push("body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
      "input,textarea,select,[contenteditable='true'],[data-allow-copy],[data-allow-copy] *,.lp-box,.lp-box *,.lx-cc,.lx-cc *,.lx-pan,.lx-pan *,#lony-ai,#lony-ai *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}",
      "img{-webkit-user-drag:none;user-drag:none}");
  }
  var st = el("style"); st.id = "lony-extras-css"; st.textContent = css.join("\n");
  (D.head || R).appendChild(st);

  /* =========================================================
     1) LOADING SCREEN  (stage based progress, no fake delay)
     ========================================================= */
  var ld = el("div", "", '<div class="lx-mark" aria-hidden="true">L</div><div class="lx-word">LONY</div><div class="lx-sub">Loading your projects…</div><div class="lx-bar" aria-hidden="true"><i></i></div>');
  ld.id = "lony-ld"; ld.setAttribute("role", "status"); ld.setAttribute("aria-live", "polite"); ld.setAttribute("aria-label", "Loading LONY Projects");
  R.appendChild(ld);
  var bar = ld.querySelector(".lx-bar i"), ldDone = false;
  function prog(p) { if (!ldDone) bar.style.transform = "scaleX(" + Math.max(.08, Math.min(1, p)) + ")"; }
  function hideLoader() {
    if (ldDone) return; ldDone = true; prog(1); bar.style.transform = "scaleX(1)";
    setTimeout(function () {
      ld.classList.add("off"); ld.removeAttribute("role");
      setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 450);
      document.dispatchEvent(new CustomEvent("lony:ready"));
    }, 120);
  }
  function stage() {
    var s = D.readyState;
    prog(s === "loading" ? .25 : s === "interactive" ? .6 : .85);
  }
  stage(); D.addEventListener("readystatechange", stage);
  function whenAppReady() {
    /* index/project pages expose LONYPAY.ready (login state + unlock state). Wait for it if present. */
    var p = window.LONYPAY && window.LONYPAY.ready;
    if (p && p.then) p.then(hideLoader, hideLoader); else hideLoader();
  }
  if (D.readyState === "complete") setTimeout(whenAppReady, 0); else window.addEventListener("load", whenAppReady);
  setTimeout(hideLoader, 9000);                              /* safety: never trap the user */
  window.addEventListener("pageshow", function (e) { if (e.persisted) hideLoader(); });

  /* =========================================================
     2) COOKIE / STORAGE PREFERENCES
     Categories: necessary (always on), preferences, analytics (none used today; stays off until opted in)
     ========================================================= */
  var CK = "lony_consent", PREF_KEYS = ["lony_theme", "lony_glang", "lony_gdev", "lony_email"], listeners = [];
  function readConsent() {
    try { var c = JSON.parse(lsGet(CK) || "null"); if (c && c.v === 1) return c; } catch (e) {} return null;
  }
  var consent = readConsent();
  function has(cat) {
    if (cat === "necessary") return true;
    return !!(consent && consent[cat] === true);
  }
  /* Block optional storage writes until the user allows them (central gate, no edits needed elsewhere). */
  try {
    var _set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (this === window.localStorage && PREF_KEYS.indexOf(k) > -1 && !has("preferences")) return;
      return _set.apply(this, arguments);
    };
  } catch (e) {}
  function activateScripts() {
    /* Optional third-party scripts must be written as:
       <script type="text/plain" data-lony-consent="analytics" data-src="https://..."></script>  (or inline code) */
    var list = D.querySelectorAll('script[type="text/plain"][data-lony-consent]');
    for (var i = 0; i < list.length; i++) {
      var s = list[i], cat = s.getAttribute("data-lony-consent");
      if (!has(cat) || s.getAttribute("data-lony-on")) continue;
      s.setAttribute("data-lony-on", "1");
      var n = D.createElement("script");
      if (s.getAttribute("data-src")) n.src = s.getAttribute("data-src"); else n.text = s.text;
      (D.head || R).appendChild(n);
    }
  }
  function saveConsent(prefs, analytics) {
    var wasPref = has("preferences");
    consent = { v: 1, preferences: !!prefs, analytics: !!analytics, t: Date.now() };
    lsSet(CK, JSON.stringify(consent));
    if (!prefs) PREF_KEYS.forEach(lsDel);                 /* withdrawing consent removes saved preferences */
    activateScripts();
    listeners.forEach(function (f) { try { f(consent); } catch (e) {} });
    document.dispatchEvent(new CustomEvent("lony:consent", { detail: consent }));
    if (wasPref !== !!prefs) toast(prefs ? "Preferences saved" : "Optional cookies are off");
  }
  var banner, overlay;
  function buildBanner() {
    banner = el("div", "lx-cc", '<div class="box" role="dialog" aria-labelledby="lx-ct" aria-describedby="lx-cd"><h3 id="lx-ct">🍪 Your privacy choices</h3><p id="lx-cd">LONY uses essential storage to keep you signed in and to remember your payment status. With your permission we also save small preferences (theme, guide language). We do not run advertising trackers. Read our <a href="privacy.html">Privacy Policy</a>.</p><div class="lx-row"><button type="button" class="lx-btn pri" data-a="all">Accept All</button><button type="button" class="lx-btn sec" data-a="none">Reject Optional Cookies</button><button type="button" class="lx-btn" data-a="custom">Customize Preferences</button></div></div>');
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b) return;
      if (b.dataset.a === "all") { saveConsent(true, true); hideBanner(); }
      else if (b.dataset.a === "none") { saveConsent(false, false); hideBanner(); }
      else openPanel();
    });
    D.body.appendChild(banner);
  }
  function showBanner() { if (!banner) buildBanner(); requestAnimationFrame(function () { banner.classList.add("on"); }); }
  function hideBanner() { if (banner) banner.classList.remove("on"); }
  function openPanel() {
    if (!overlay) {
      overlay = el("div", "lx-ov", '<div class="lx-pan" role="dialog" aria-modal="true" aria-labelledby="lx-pt"><h3 id="lx-pt">Cookie Preferences</h3><p>Choose what LONY may store on this device. You can change this any time from “Cookie Preferences” in the footer.</p>' +
        '<div class="lx-opt"><div><b>Necessary</b><small>Sign-in session, payment/unlock status and security. Always on.</small></div><label class="lx-sw"><input type="checkbox" checked disabled aria-label="Necessary storage, always on"><span></span></label></div>' +
        '<div class="lx-opt"><div><b>Preferences</b><small>Remembers theme, guide language, phone/laptop choice and your contact email on this device.</small></div><label class="lx-sw"><input type="checkbox" id="lx-p" aria-label="Preferences storage"><span></span></label></div>' +
        '<div class="lx-opt"><div><b>Analytics</b><small>Not used at the moment. If LONY adds usage analytics later, it stays off unless you turn it on here.</small></div><label class="lx-sw"><input type="checkbox" id="lx-a" aria-label="Analytics cookies"><span></span></label></div>' +
        '<div class="lx-row" style="margin-top:14px"><button type="button" class="lx-btn pri" data-s="save">Save Preferences</button><button type="button" class="lx-btn sec" data-s="all">Accept All</button><button type="button" class="lx-btn" data-s="none">Reject Optional</button></div></div>');
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay && consent) return closePanel();
        var b = e.target.closest("button[data-s]"); if (!b) return;
        var p = overlay.querySelector("#lx-p"), a = overlay.querySelector("#lx-a");
        if (b.dataset.s === "all") saveConsent(true, true);
        else if (b.dataset.s === "none") saveConsent(false, false);
        else saveConsent(p.checked, a.checked);
        closePanel(); hideBanner();
      });
      D.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("on") && consent) closePanel(); });
      D.body.appendChild(overlay);
    }
    overlay.querySelector("#lx-p").checked = has("preferences");
    overlay.querySelector("#lx-a").checked = has("analytics");
    overlay.classList.add("on");
    var f = overlay.querySelector("#lx-p"); try { f.focus(); } catch (e) {}
  }
  function closePanel() { if (overlay) overlay.classList.remove("on"); }
  D.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (t) { e.preventDefault(); openPanel(); }
  });
  window.LONYConsent = {
    get: function () { return consent ? { preferences: !!consent.preferences, analytics: !!consent.analytics } : null; },
    has: has, open: openPanel,
    onChange: function (f) { listeners.push(f); }
  };

  /* =========================================================
     3) BASIC COPY PROTECTION (casual copying only, not real security)
     ========================================================= */
  if (!NO_PROTECT) {
    var ALLOW = "input,textarea,select,[contenteditable='true'],[data-allow-copy],.lp-box,.lx-cc,.lx-pan,#lony-ai";
    var tgt = function (e) { var t = e.target; return t && t.nodeType === 3 ? t.parentElement : t; };
    var okEl = function (e) { var t = tgt(e); return !!(t && t.closest && t.closest(ALLOW)); };
    ["selectstart", "copy", "cut", "dragstart"].forEach(function (ev) {
      D.addEventListener(ev, function (e) { if (!okEl(e)) e.preventDefault(); });
    });
    D.addEventListener("contextmenu", function (e) {
      var t = tgt(e);
      if (okEl(e) || (t && t.closest && t.closest("a[href]"))) return;   /* keep long-press on links usable */
      e.preventDefault();
    });
  }

  /* =========================================================
     4) ONLINE / OFFLINE + SLOW CONNECTION
     ========================================================= */
  var net, netMsg, netBtn, netTimer, wasOffline = false;
  function buildNet() {
    net = el("div", "lx-net", '<span class="m"></span><button type="button" class="r">Retry Connection</button>');
    net.setAttribute("role", "alert"); netMsg = net.querySelector(".m"); netBtn = net.querySelector(".r");
    netBtn.addEventListener("click", retry); D.body.appendChild(net);
  }
  function showNet(kind, msg, btn) {
    if (!net) buildNet();
    clearTimeout(netTimer);
    net.className = "lx-net " + kind; netMsg.textContent = msg; netBtn.style.display = btn ? "" : "none";
    requestAnimationFrame(function () { net.classList.add("on"); });
  }
  function hideNet() { if (net) net.classList.remove("on"); }
  function ping() {
    /* tiny same-origin file; HEAD + no-store so a cached copy can't fake "online" */
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); }, 7000);
    return fetch("videos.js?_=" + Date.now(), { method: "HEAD", cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); return r.ok || r.status < 500; }, function () { clearTimeout(t); return false; });
  }
  function goOffline() {
    wasOffline = true; showNet("off", "You are offline. Some features need internet.", true);
    document.dispatchEvent(new CustomEvent("lony:offline"));
  }
  function goOnline(silent) {
    hideNet();
    if (wasOffline) { wasOffline = false; if (!silent) toast("Back online ✅"); document.dispatchEvent(new CustomEvent("lony:online")); }
    slowCheck();
  }
  function retry() {
    netBtn.disabled = true; netBtn.textContent = "Checking…";
    ping().then(function (ok) {
      netBtn.disabled = false; netBtn.textContent = "Retry Connection";
      if (ok) goOnline(); else showNet("off", navigator.onLine ? "Connected, but LONY can't be reached right now." : "Still offline. Check Wi-Fi or mobile data.", true);
    });
  }
  function slowCheck() {
    /* Network Information API exists only in some browsers: warn only when it reports 2G-class speed. */
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c || wasOffline) return;
    if (/^(slow-2g|2g)$/.test(c.effectiveType || "")) {
      if (!sessionStorage.getItem("lx_slow_x")) {
        showNet("slow", "Slow connection detected. Pages may take longer to load.", false);
        netTimer = setTimeout(hideNet, 6000);
      }
    }
  }
  window.addEventListener("offline", goOffline);
  window.addEventListener("online", function () { ping().then(function (ok) { if (ok) goOnline(); else showNet("off", "Connected, but LONY can't be reached right now.", true); }); });
  try { var cn = navigator.connection; if (cn && cn.addEventListener) cn.addEventListener("change", slowCheck); } catch (e) {}
  window.LONYNet = { online: function () { return navigator.onLine !== false && !wasOffline; }, retry: function () { if (!net) buildNet(); retry(); } };

  /* =========================================================
     5) TOAST + FOOTER LINKS + START
     ========================================================= */
  var toastEl, toastT;
  function toast(msg, opt) {
    if (!D.body) return;
    opt = opt || {};
    if (!toastEl) { toastEl = el("div", "lx-toast"); toastEl.setAttribute("role", "status"); D.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    if (opt.href) { var a = el("a"); a.href = opt.href; a.textContent = opt.label || "View"; toastEl.appendChild(a); }
    toastEl.classList.add("on"); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("on"); }, opt.ms || 3200);
  }
  function footerLinks() {
    if (NO_FOOTER) return;
    var f = D.querySelector("footer");
    var needPriv = !D.querySelector('a[href="privacy.html"]');
    var html = (needPriv ? '<a href="privacy.html">Privacy Policy</a> · ' : "") + '<button type="button" data-cookie-settings>Cookie Preferences</button>';
    if (!f) { f = el("footer", "lx-ft", "<div>© 2026 LONY Projects</div>"); D.body.appendChild(f); }
    if (f.querySelector("[data-cookie-settings]")) return;
    var p = el("p", "lx-fl", html);
    (f.querySelector(".container,.wrap") || f).appendChild(p);
  }
  onReady(function () {
    footerLinks(); activateScripts();
    if (navigator.onLine === false) goOffline(); else slowCheck();
    if (!consent) {
      /* show the choice after the loader is gone so it is never hidden behind it */
      var go = function () { setTimeout(showBanner, 300); };
      if (ldDone) go(); else document.addEventListener("lony:ready", go, { once: true });
    }
  });
  window.LONYX = { toast: toast, hideLoader: hideLoader };
})();
