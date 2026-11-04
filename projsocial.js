/* Project page: "Select project" button + reviews from students who completed this project. */
import { onUser, listMyProjects, selectProject, listReviews, slug, friendlyError } from "./auth.js";
import { reviewEl } from "./media.js";

await window.LONYPAY.ready;           /* page builder runs first, then this */
const app = document.getElementById("app");
const h1 = app && app.querySelector("h1");
if (h1) {
  const title = h1.textContent.trim(), sl = slug(title);
  const here = "project.html" + location.search;
  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "padding:14px;margin:14px 0;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap";
  const hero = app.querySelector(".hero");
  if (hero) hero.after(box); else app.prepend(box);

  const sec = document.createElement("section");
  const h2 = document.createElement("h2"); h2.textContent = "Student reviews";
  const rb = document.createElement("div"); sec.append(h2, rb); app.appendChild(sec);

  const btn = (label, fn, ghost) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = fn;
    b.style.cssText = "font:inherit;font-weight:800;font-size:.85rem;cursor:pointer;border-radius:50px;padding:9px 18px;border:1px solid rgba(99,102,241,.6);" +
      (ghost ? "background:transparent;color:inherit" : "background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff");
    return b;
  };
  const msg = (t) => { const s = document.createElement("span"); s.style.cssText = "font-size:.85rem;opacity:.85"; s.textContent = t; return s; };

  async function paint(u) {
    box.textContent = ""; rb.textContent = "";
    if (!u) {
      box.append(msg("Intha project ah select panna login pannunga."),
        btn("Login & Select", () => { location.href = "login.html?next=" + encodeURIComponent(here); }));
      rb.appendChild(msg("Student reviews paaka login pannunga."));
      return;
    }
    let st = "";
    try { const m = (await listMyProjects(u.uid)).find((p) => p.slug === sl); st = m ? (m.status === "completed" ? "completed" : "pending") : ""; } catch (e) {}
    if (st === "completed") box.append(msg("✅ Neenga indha project ah complete pannitinga."), btn("My Projects", () => { location.href = "myprojects.html"; }, true));
    else if (st === "pending") box.append(msg("✓ Selected. Upload & Review My Projects la pannalam."), btn("Go to My Projects", () => { location.href = "myprojects.html"; }));
    else box.append(msg("Indha project ah pannanum nu irundha select pannunga."), btn("Select project", async (e) => {
      e.target.disabled = true;
      try { await selectProject(u.uid, title); paint(u); } catch (er) { e.target.disabled = false; alert(friendlyError(er)); }
    }));
    try {
      const list = await listReviews(sl);
      if (!list.length) rb.appendChild(msg("Innum yaarum review podala. Complete panni first review podunga!"));
      list.forEach((r) => rb.appendChild(reviewEl(r)));
    } catch (e) { rb.appendChild(msg("Reviews load aagala.")); }
  }
  onUser(paint);
}
