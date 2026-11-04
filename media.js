/* Image compress + review card UI shared by profile, my projects and project pages.
   Firebase Storage needs a paid plan, so images are resized in the browser and saved in Firestore. */
export function imgToDataUrl(file, max = 900, q = 0.7, square = false) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error("Image file mattum select pannunga"));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("File read aagala"));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error("Indha image open aagala"));
      im.onload = () => {
        let sx = 0, sy = 0, sw = im.width, sh = im.height;
        if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
        const r = Math.min(1, max / Math.max(sw, sh));
        const w = Math.max(1, Math.round(sw * r)), h = Math.max(1, Math.round(sh * r));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", q));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement("style");
  s.textContent = ".rv{background:var(--bg-card,#141b26);border:1px solid var(--border-subtle,#212c3d);border-radius:16px;padding:14px;margin-bottom:12px}" +
    ".rv-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}.rv-h b{font-size:.95rem}" +
    ".rv-t{white-space:pre-wrap;word-break:break-word;font-size:.9rem;line-height:1.6;margin:0 0 8px;color:var(--text-main,#f8fafc)}" +
    ".rv-u{display:block;font-size:.82rem;color:var(--a-soft,#818cf8);word-break:break-all;margin-bottom:8px}" +
    ".rv-g{display:flex;gap:8px;flex-wrap:wrap}.rv-g img{width:96px;height:96px;object-fit:cover;border-radius:10px;border:1px solid var(--border-subtle,#212c3d);cursor:zoom-in}" +
    ".av-i{width:36px;height:36px;border-radius:50%;object-fit:cover;flex:none;background:rgba(99,102,241,.25);display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem}" +
    ".lbx{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:900;display:flex;align-items:center;justify-content:center;padding:14px;cursor:zoom-out}.lbx img{max-width:100%;max-height:100%;border-radius:10px}";
  document.head.appendChild(s);
}

export function avatarEl(name, src, size) {
  css();
  let e;
  if (src) { e = document.createElement("img"); e.src = src; e.alt = ""; e.referrerPolicy = "no-referrer"; }
  else { e = document.createElement("span"); e.textContent = (String(name || "S").trim()[0] || "S").toUpperCase(); }
  e.className = "av-i";
  if (size) { e.style.width = e.style.height = size + "px"; if (!src) e.style.fontSize = size / 2.2 + "px"; }
  return e;
}

function zoom(src) {
  const o = document.createElement("div"); o.className = "lbx";
  const i = document.createElement("img"); i.src = src; i.alt = "";
  o.appendChild(i); o.onclick = () => o.remove(); document.body.appendChild(o);
}

/* Builds a review card with DOM methods only (no innerHTML), so student text can never run as code. */
export function reviewEl(r) {
  css();
  const c = document.createElement("div"); c.className = "rv";
  const h = document.createElement("div"); h.className = "rv-h";
  const nm = document.createElement("b"); nm.textContent = r.name || "Student";
  h.append(avatarEl(r.name, r.avatar), nm); c.appendChild(h);
  if (r.text) { const p = document.createElement("p"); p.className = "rv-t"; p.textContent = r.text; c.appendChild(p); }
  if (r.url && /^https?:\/\//i.test(r.url)) {
    const a = document.createElement("a"); a.className = "rv-u"; a.href = r.url; a.target = "_blank";
    a.rel = "noopener noreferrer nofollow"; a.textContent = "\uD83D\uDD17 " + r.url.slice(0, 80); c.appendChild(a);
  }
  const imgs = (r.images || []).filter((s) => typeof s === "string" && s.startsWith("data:image/"));
  if (imgs.length) {
    const g = document.createElement("div"); g.className = "rv-g";
    imgs.forEach((src) => { const im = document.createElement("img"); im.src = src; im.alt = "Project image"; im.loading = "lazy"; im.onclick = () => zoom(src); g.appendChild(im); });
    c.appendChild(g);
  }
  return c;
}
