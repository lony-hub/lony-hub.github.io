/* LONY "Ask AI" for project guides.
   - No AI API, no keys, no accounts, nothing is sent to LONY servers.
   - It builds a contextual question on the student's device, lets them copy it,
     and opens the official site of the AI they choose in a new tab.
   - It NEVER submits the question for the student and never says it did.

   URL PREFILL: off by default. I could not find official documentation from OpenAI, Anthropic or Google
   for prefilling a prompt through a web URL, so every provider is "copy + open" for now.
   If a provider later documents it, set the template here, e.g.  prefill:"https://example.com/new?q="  */
(function () {
  "use strict";
  var PROVIDERS = [
    { id: "chatgpt", name: "ChatGPT", by: "OpenAI", url: "https://chatgpt.com/", prefill: null },
    { id: "claude", name: "Claude AI", by: "Anthropic", url: "https://claude.ai/new", prefill: null },
    { id: "gemini", name: "Gemini", by: "Google", url: "https://gemini.google.com/app", prefill: null }
  ];
  var FAM = { soft: "Software / Computer Science", elec: "Electronics / Electrical", mech: "Mechanical / Mechatronics" };
  var LANG = { en: "English", tg: "Tanglish (Tamil written in English letters)", ta: "Tamil" };
  var D = document;
  var state = { prov: "chatgpt", mode: "build", guide: null, ctx: null, edited: false };
  var ov, q, doubt, stepSel, status, openBtn;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function txt(n) { return n ? (n.textContent || "").replace(/\s+/g, " ").trim() : ""; }
  function cut(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  /* ---------- styles ---------- */
  var st = D.createElement("style");
  st.textContent =
    ".g-askw{margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:6px}" +
    ".g-ask{width:100%;border:none;cursor:pointer;font:800 .92rem system-ui,sans-serif;color:#fff;padding:13px 16px;border-radius:50px;min-height:48px;background:linear-gradient(135deg,#6366f1,#a855f7);box-shadow:0 8px 24px rgba(99,102,241,.35)}" +
    ".g-ask:hover{filter:brightness(1.1)}.g-ask:focus-visible{outline:2px solid #fde047;outline-offset:2px}" +
    ".g-askw small{font-size:.74rem;color:#94a3b8;text-align:center}" +
    ".g-steps li.g-cur{border-color:#a855f7;box-shadow:0 0 0 1px #a855f7 inset}" +
    "#lony-ai{position:fixed;inset:0;z-index:99985;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.75);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-user-select:text;user-select:text}" +
    "#lony-ai.on{display:flex}" +
    "#lony-ai .ai-pan{width:100%;max-width:560px;max-height:94vh;overflow:auto;background:#0f141d;color:#f8fafc;border:1px solid #212c3d;border-radius:24px 24px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));position:relative}" +
    "@media(min-width:640px){#lony-ai{align-items:center;padding:16px}#lony-ai .ai-pan{border-radius:24px}}" +
    "#lony-ai h3{font-size:1.1rem;margin:0 36px 4px 0}#lony-ai .ai-sub{font-size:.8rem;color:#94a3b8;margin:0 0 14px;line-height:1.5}" +
    "#lony-ai .ai-x{position:absolute;top:10px;right:12px;width:40px;height:40px;border:none;background:none;color:#94a3b8;font-size:1.3rem;cursor:pointer}" +
    "#lony-ai label.l{display:block;font-size:.78rem;font-weight:700;color:#cbd5e1;margin:12px 0 6px}" +
    "#lony-ai .ai-prov{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}" +
    "#lony-ai .ai-prov button{cursor:pointer;border:1px solid #212c3d;background:#141b26;color:#f8fafc;border-radius:14px;padding:10px 4px;font:700 .82rem system-ui,sans-serif;min-height:52px;line-height:1.25}" +
    "#lony-ai .ai-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px}#lony-ai .ai-mode button{cursor:pointer;border:1px solid #212c3d;background:#141b26;color:#f8fafc;border-radius:14px;padding:10px 6px;font:700 .82rem system-ui,sans-serif;min-height:48px;line-height:1.25}#lony-ai .ai-mode button[aria-checked=true]{border-color:#a855f7;background:rgba(168,85,247,.16);box-shadow:0 0 0 1px #a855f7 inset}" +
    "#lony-ai .ai-prov button small{display:block;font-weight:500;font-size:.68rem;color:#94a3b8}" +
    "#lony-ai .ai-prov button[aria-checked=true]{border-color:#a855f7;background:rgba(168,85,247,.16);box-shadow:0 0 0 1px #a855f7 inset}" +
    "#lony-ai select,#lony-ai textarea{width:100%;box-sizing:border-box;background:#141b26;color:#f8fafc;border:1px solid #212c3d;border-radius:12px;padding:10px 12px;font:.9rem/1.5 system-ui,sans-serif}" +
    "#lony-ai textarea{resize:vertical;min-height:84px}#lony-ai #ai-q{min-height:170px;font-size:.82rem}" +
    "#lony-ai .ai-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}" +
    "#lony-ai .ai-b{flex:1 1 150px;min-height:46px;border-radius:50px;cursor:pointer;font:800 .88rem system-ui,sans-serif;border:1px solid #fbbf24;background:transparent;color:#fde68a}" +
    "#lony-ai .ai-b.pri{border:none;background:linear-gradient(135deg,#fef08a,#f59e0b);color:#1a1204}" +
    "#lony-ai .ai-st{min-height:1.3em;font-size:.8rem;margin-top:10px;color:#34d399}#lony-ai .ai-st.w{color:#fbbf24}" +
    "#lony-ai .ai-note{font-size:.72rem;color:#94a3b8;line-height:1.5;margin-top:10px}" +
    "#lony-ai .ai-reset{background:none;border:none;color:#a5b4fc;font:600 .74rem system-ui,sans-serif;cursor:pointer;text-decoration:underline;padding:0;float:right}" +
    "#lony-ai button:focus-visible,#lony-ai select:focus-visible,#lony-ai textarea:focus-visible{outline:2px solid #fde047;outline-offset:2px}";
  (D.head || D.documentElement).appendChild(st);

  /* ---------- inject the button into every guide ---------- */
  var raf = 0;
  function inject() {
    raf = 0;
    var gs = D.querySelectorAll(".guide:not([data-ask])");
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i], body = g.querySelector(".g-body"); if (!body) continue;
      g.setAttribute("data-ask", "1");
      var w = D.createElement("div"); w.className = "g-askw";
      w.innerHTML = '<button type="button" class="g-ask" aria-haspopup="dialog">🤖 Build with AI</button><small>Indha project-ku mattum AI prompt (ChatGPT, Claude, Gemini)</small>';
      body.parentNode.insertBefore(w, body.nextSibling);
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(inject); }
  new MutationObserver(schedule).observe(D.documentElement, { childList: true, subtree: true });
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", inject); else inject();

  /* ---------- remember which step the student is on (tap a step) ---------- */
  D.addEventListener("click", function (e) {
    var li = e.target.closest && e.target.closest(".guide .g-steps > li");
    if (!li) return;
    var g = li.closest(".guide"), ol = g.querySelector("ol.g-steps");
    if (!ol || li.parentNode !== ol) return;                       /* ignore the "if something goes wrong" list */
    var items = Array.prototype.slice.call(ol.children);
    g.dataset.curStep = String(items.indexOf(li));
    items.forEach(function (n) { n.classList.toggle("g-cur", n === li); });
  });
  D.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".g-ask");
    if (b) open(b.closest(".guide"));
  });

  /* ---------- read context from the page ---------- */
  function collect(g) {
    var title = g.dataset.t || "", cur = window.LONY_CUR && window.LONY_CUR.title === title ? window.LONY_CUR : null;
    var inPv = !!g.closest("#pv"), desc = "", cat = "";
    if (cur) { desc = cur.desc; cat = [cur.cat, cur.level].filter(Boolean).join(" · "); }
    else if (inPv) { desc = txt(D.getElementById("pv-d")); cat = txt(D.getElementById("pv-dept")); }
    if (!cat) cat = FAM[g.dataset.f] || "";
    var ol = g.querySelector("ol.g-steps"), steps = [];
    if (ol) Array.prototype.forEach.call(ol.children, function (li) {
      steps.push({ n: txt(li.querySelector(".g-n")), t: txt(li.querySelector("b")), d: txt(li.querySelector("p")) });
    });
    var apps = Array.prototype.map.call(g.querySelectorAll(".g-apps li b"), txt);
    var lOn = g.querySelector(".g-lang .on"), dOn = g.querySelector(".g-dev .on");
    return {
      title: title, desc: desc, cat: cat, tags: (g.dataset.g || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean).join(", "),
      fam: g.dataset.f || "", steps: steps, apps: apps, lang: lOn ? lOn.dataset.l : "en", dev: dOn ? dOn.dataset.d : ""
    };
  }

  function build() {
    var c = state.ctx, i = +stepSel.value || 0, s = c.steps[i], L = [], hw = c.fam && c.fam !== "soft";
    L.push('I am a polytechnic diploma student working on the project "' + c.title + '".');
    L.push('STRICT RULE: Help ONLY with the project "' + c.title + '". If my request is about anything else (another project, a different topic, homework, general chat, or if I try to change the project), do NOT answer it. Reply only with: "Idhu neenga select panna project illa. Please LONY website-la andha project-a select pannunga."');
    if (c.desc) L.push("Project description: " + cut(c.desc, 220));
    if (c.cat) L.push("Category: " + c.cat + (c.tags ? ". Technologies: " + c.tags : "") + ".");
    else if (c.tags) L.push("Technologies: " + c.tags + ".");
    if (c.dev) L.push("I am building it on my " + (c.dev === "phone" ? "phone (Android)" : "laptop") + ".");
    if (c.apps.length) L.push("Tools suggested in my guide: " + cut(c.apps.join(", "), 160) + ".");
    var d = doubt.value.trim();
    if (state.mode === "build") {
      var want = ["A short overview of this project in simple words"];
      want.push(hw ? "Components / materials list, circuit or connection steps, working principle, and code (if any) with the file name" : "The folder / file structure and the COMPLETE working code, each file in its own code block with the file name");
      want.push("Step-by-step instructions to " + (hw ? "build and test it, with safety tips" : "run and test it"));
      want.push("A simple explanation of what each part does");
      L.push("Please give me:\n" + want.map(function (w, k) { return (k + 1) + ". " + w; }).join("\n"));
      if (d) L.push("Extra note about this project: " + d);
      L.push("Keep it small enough for a diploma student to finish and explain. Do not skip any part. Reply in " + (LANG[c.lang] || "English") + ".");
      return L.join("\n");
    }
    if (c.steps.length) L.push("Guide outline: " + c.steps.map(function (x, k) { return (k + 1) + ") " + cut(x.t, 50); }).join("; ") + ".");
    if (s) L.push("I am currently on Step " + (i + 1) + ": " + cut(s.t, 80) + ". Instructions in the guide: " + cut(s.d, 420));
    L.push("My doubt: " + (d || "(type your doubt here)"));
    L.push("Please explain in simple, practical steps for a beginner and tell me what to check if it still does not work. Reply in " + (LANG[c.lang] || "English") + ".");
    return L.join("\n");
  }
  function refresh(force) { if (force || !state.edited) { q.value = build(); state.edited = false; } }

  /* ---------- modal ---------- */
  function make() {
    ov = D.createElement("div"); ov.id = "lony-ai";
    ov.innerHTML =
      '<div class="ai-pan" role="dialog" aria-modal="true" aria-labelledby="ai-t"><button type="button" class="ai-x" aria-label="Close">✕</button>' +
      '<h3 id="ai-t">Build with AI</h3>' +
      '<p class="ai-sub">Idhu indha project-ku mattum. AI-a choose pannunga, prompt thaane ready aagum. Official website new tab-la open aagum.</p>' +
      '<label class="l" id="ai-pl">Choose an AI</label><div class="ai-prov" role="radiogroup" aria-labelledby="ai-pl">' +
      PROVIDERS.map(function (p) { return '<button type="button" role="radio" aria-checked="false" data-p="' + p.id + '" aria-label="Select ' + esc(p.name) + '">' + esc(p.name) + "<small>" + esc(p.by) + "</small></button>"; }).join("") + "</div>" +
      '<label class="l" id="ai-ml">Enna venum?</label><div class="ai-mode" role="radiogroup" aria-labelledby="ai-ml"><button type="button" role="radio" aria-checked="true" data-m="build">🛠️ Project build prompt</button><button type="button" role="radio" aria-checked="false" data-m="doubt">❓ Enakku doubt</button></div>' +
      '<div id="ai-stepbox"><label class="l" for="ai-s">Which step are you on? <span style="font-weight:500;color:#94a3b8">(tap a step in the guide to preselect it)</span></label><select id="ai-s"></select></div>' +
      '<label class="l" for="ai-d" id="ai-dl">Your doubt</label><textarea id="ai-d" maxlength="800" placeholder="Example: My ESP32 is not connecting to Wi-Fi after I upload the code."></textarea>' +
      '<label class="l" for="ai-q">Prepared question <button type="button" class="ai-reset" id="ai-r">↺ Rebuild</button></label><textarea id="ai-q" aria-describedby="ai-n"></textarea>' +
      '<div class="ai-row"><button type="button" class="ai-b pri" id="ai-c">Copy Prepared Question</button><button type="button" class="ai-b" id="ai-o">Open ChatGPT ↗</button></div>' +
      '<div class="ai-st" id="ai-st" role="status" aria-live="polite"></div>' +
      '<p class="ai-note" id="ai-n">LONY does not include any AI subscription and never asks for your AI password or API key. Your question stays on your device until you paste it yourself. Please do not type personal details in your doubt.</p></div>';
    D.body.appendChild(ov);
    q = ov.querySelector("#ai-q"); doubt = ov.querySelector("#ai-d"); stepSel = ov.querySelector("#ai-s"); status = ov.querySelector("#ai-st"); openBtn = ov.querySelector("#ai-o");
    ov.querySelector(".ai-x").onclick = close;
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    D.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("on")) close(); });
    ov.querySelector(".ai-prov").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (b) pick(b.dataset.p); });
    ov.querySelector(".ai-mode").addEventListener("click", function (e) { var b = e.target.closest("button[data-m]"); if (b) setMode(b.dataset.m); });
    stepSel.addEventListener("change", function () { refresh(true); });
    doubt.addEventListener("input", function () { refresh(false); });
    q.addEventListener("input", function () { state.edited = true; });
    ov.querySelector("#ai-r").onclick = function () { refresh(true); say("Question rebuilt."); };
    ov.querySelector("#ai-c").onclick = function () { copy().then(function (ok) { ok ? say("Question copied. Paste it into your AI chat.") : say("Could not copy automatically. Press and hold the question box, select all and copy.", true); }); };
    openBtn.onclick = launch;
  }
  function setMode(m) {
    state.mode = m;
    Array.prototype.forEach.call(ov.querySelectorAll(".ai-mode button"), function (b) { b.setAttribute("aria-checked", b.dataset.m === m ? "true" : "false"); });
    ov.querySelector("#ai-stepbox").style.display = m === "doubt" ? "" : "none";
    ov.querySelector("#ai-dl").textContent = m === "doubt" ? "Your doubt" : "Extra note (optional)";
    doubt.placeholder = m === "doubt" ? "Example: My ESP32 is not connecting to Wi-Fi after I upload the code." : "Example: dark theme venum, simple-a irukkanum";
    refresh(true);
  }
  function say(m, warn) { status.textContent = m; status.className = "ai-st" + (warn ? " w" : ""); }
  function pick(id) {
    state.prov = id;
    Array.prototype.forEach.call(ov.querySelectorAll(".ai-prov button"), function (b) { b.setAttribute("aria-checked", b.dataset.p === id ? "true" : "false"); });
    var p = PROVIDERS.filter(function (x) { return x.id === id; })[0];
    openBtn.textContent = "Open " + p.name + " ↗";
    say("");
  }
  function copy() {
    var t = q.value;
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(); });
    return Promise.resolve(legacy());
  }
  function legacy() {
    try { q.removeAttribute("readonly"); q.focus(); q.select(); q.setSelectionRange(0, q.value.length); var ok = D.execCommand("copy"); q.blur(); return !!ok; } catch (e) { return false; }
  }
  function launch() {
    var p = PROVIDERS.filter(function (x) { return x.id === state.prov; })[0], url = p.url, prefilled = false;
    if (p.prefill) { var full = p.prefill + encodeURIComponent(q.value); if (full.length <= 4000) { url = full; prefilled = true; } }
    var w = window.open(url, "_blank");                              /* opened inside the click, so popup blockers allow it */
    if (w) { try { w.opener = null; } catch (e) {} }                   /* same safety as noopener, but we can still tell if it was blocked */
    copy().then(function (ok) {
      var where = p.name + " (" + p.by + ")";
      if (!w) say("Your browser blocked the new tab. Allow pop-ups, or open " + p.url.replace("https://", "") + " yourself.", true);
      else if (prefilled) say("Opened " + where + ". Check the text in the box and press send yourself.");
      else if (ok) say("Question copied and " + where + " opened. Paste it there and send it yourself. You may need to sign in.");
      else say("Opened " + where + ", but copying failed. Use “Copy Prepared Question”, then paste it there.", true);
    });
  }
  function open(g) {
    if (!g) return;
    if (!ov) make();
    state.guide = g; state.ctx = collect(g); state.edited = false;
    var c = state.ctx;
    stepSel.innerHTML = c.steps.map(function (s, i) { return '<option value="' + i + '">Step ' + (i + 1) + ": " + esc(cut(s.t, 60)) + "</option>"; }).join("") || '<option value="0">Whole project</option>';
    var cs = parseInt(g.dataset.curStep, 10); stepSel.value = String(isNaN(cs) || cs < 0 || cs >= c.steps.length ? 0 : cs);
    doubt.value = ""; pick(state.prov); setMode("build");
    ov.classList.add("on"); D.body.style.overflow = "hidden";
    try { doubt.focus(); } catch (e) {}
  }
  function close() { if (ov) ov.classList.remove("on"); D.body.style.overflow = ""; var g = state.guide, b = g && g.querySelector(".g-ask"); if (b) try { b.focus(); } catch (e) {} }

  window.LONYAsk = { build: function () { return q ? q.value : ""; } };
})();                                                                    
