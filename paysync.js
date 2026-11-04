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
    try { L.setState({ ...base, ...(await getMyPaymentState(u.uid)) }); }
    catch (e) { L.setState(base); }
  });
}
