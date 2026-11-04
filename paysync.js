/* Connects pay.js with Firebase (module). Loads this user's unlocks and pending payments. */
import { configured, onUser, getMyPaymentState, submitPayment } from "./auth.js";
const L = window.LONYPAY;
L.attach({ submit: submitPayment });
if (!configured) {
  L.setState({ user: null });
} else {
  onUser(async (u) => {
    if (!u) { L.setState({ user: null }); return; }
    const base = { user: { uid: u.uid, email: u.email } };
    try {
      const st = await getMyPaymentState(u.uid);
      L.setState({ ...base, ...st });
      /* tell the student once per session if a payment was rejected after verification */
      if (st.rejected && st.rejected.length && window.LONYX && !sessionStorage.getItem("lony_fail_seen") && !/payment-failed\.html$/.test(location.pathname)) {
        try { sessionStorage.setItem("lony_fail_seen", "1"); } catch (e) {}
        window.LONYX.toast("A payment could not be verified.", { href: "payment-failed.html", label: "See details", ms: 7000 });
      }
    }
    catch (e) { L.setState(base); }
  });
}
