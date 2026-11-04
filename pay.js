/* LONY UPI payment popup. Change your UPI ID here only.
   Flow: user logs in > pays by UPI > submits 12 digit UTR (saved in Firestore as "pending")
   > admin checks bank statement and approves in admin.html > unlock is saved on the user's account. */
(function(){
  const UPI="lony-projects@ptyes";
  const slug=k=>String(k).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  let unlocked=new Set(),pending=new Set(),user=null,isReady=false,api=null,el,cur;
  const listeners=[];
  let resolveReady;const ready=new Promise(r=>{resolveReady=r});
  const done=()=>{if(!isReady){isReady=true;resolveReady()}};
  setTimeout(done,5000);
  const notify=()=>listeners.forEach(f=>{try{f()}catch(e){}});
  const has=k=>unlocked.has(slug(k));
  const isPending=k=>pending.has(slug(k));

  function setState(s){
    user=s.user||null;
    unlocked=new Set(s.unlocked||[]);
    pending=new Set(s.pending||[]);
    done();notify();
  }
  function gotoLogin(){
    const here=(location.pathname.split("/").pop()||"index.html")+location.search;
    location.href="login.html?next="+encodeURIComponent(here);
  }
  /* true = ok to show the payment popup. false = a message / redirect already happened */
  function guard(key){
    if(!isReady){alert("Loading, please try again in a second.");return false}
    if(!user){gotoLogin();return false}
    if(has(key))return false;
    if(isPending(key)){alert("Payment already submitted. Admin verify pannina apram unlock aagum.");return false}
    return true;
  }
  async function submit(key,amount,utr){
    if(!api)throw new Error("not-ready");
    await api.submit({key,amount,utr});
    pending.add(slug(key));notify();
  }
  function errText(e){
    const c=(e&&e.code)||"";
    if(c.indexOf("permission-denied")>-1)return "This UTR is already used or invalid. Check the number.";
    if(c.indexOf("unavailable")>-1||c.indexOf("network")>-1)return "Network problem. Try again.";
    return "Could not submit. Try again.";
  }

  function build(){
    const st=document.createElement("style");
    st.textContent=`#lp{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:500;padding:16px}#lp.on{display:flex}.lp-box{background:#0f141d;color:#f8fafc;border:1.5px solid #fbbf24;box-shadow:0 0 30px rgba(251,191,36,.4);border-radius:24px;padding:24px;max-width:380px;width:100%;position:relative;font-family:inherit}.lp-box h3{font-size:1.1rem;margin:0 0 4px;color:#fde047}.lp-box p{font-size:.85rem;color:#94a3b8;margin:0}.lp-price{font-size:2rem;font-weight:900;color:#fde047;margin:8px 0 10px}.lp-box ol{padding-left:18px;font-size:.85rem;color:#94a3b8;margin:0 0 14px}.lp-pay{display:block;text-align:center;text-decoration:none;font-weight:900;font-size:.9rem;padding:12px;border-radius:50px;background:linear-gradient(135deg,#fef08a,#f59e0b);color:#1a1204;margin-bottom:12px}.lp-in{width:100%;box-sizing:border-box;background:#141b26;border:1px solid #212c3d;color:#f8fafc;padding:11px 14px;border-radius:10px;font-size:.95rem;margin-bottom:10px}.lp-ok{width:100%;border:none;cursor:pointer;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:800;padding:12px;border-radius:50px;font-size:.9rem}.lp-ok:disabled{opacity:.6;cursor:default}.lp-x{position:absolute;top:10px;right:14px;background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer}.lp-err{color:#f87171;font-size:.8rem;min-height:1.1em;margin-bottom:6px}.lp-good{color:#34d399}`;
    document.head.appendChild(st);
    el=document.createElement("div");el.id="lp";
    el.innerHTML=`<div class="lp-box"><button type="button" class="lp-x" aria-label="Close">✕</button><h3 id="lp-t"></h3><p id="lp-s">Unlock this project</p><div class="lp-price" id="lp-p"></div><ol><li>Pay using UPI</li><li>Enter the 12 digit UTR / Transaction ID</li><li>Submit. We verify and unlock your account</li></ol><a class="lp-pay" id="lp-a" href="#"></a><input class="lp-in" id="lp-u" inputmode="numeric" maxlength="12" placeholder="12 digit UTR number"><div class="lp-err" id="lp-e" role="status"></div><button type="button" class="lp-ok" id="lp-c">Submit Payment</button><p style="margin-top:10px;font-size:.72rem">UPI ID: ${UPI}</p></div>`;
    document.body.appendChild(el);
    el.querySelector(".lp-x").onclick=()=>el.classList.remove("on");
    el.addEventListener("click",e=>{if(e.target===el)el.classList.remove("on")});
    el.querySelector("#lp-c").onclick=async()=>{
      const eE=el.querySelector("#lp-e"),btn=el.querySelector("#lp-c");
      const v=el.querySelector("#lp-u").value.trim();
      eE.className="lp-err";
      if(!/^\d{12}$/.test(v)){eE.textContent="Enter a valid 12 digit UTR number";return}
      btn.disabled=true;eE.textContent="Submitting...";
      try{
        await submit(cur.key,cur.price,v);
        eE.className="lp-err lp-good";
        eE.textContent="Submitted! Admin verify pannina apram unlock aagum.";
        setTimeout(()=>el.classList.remove("on"),1800);
      }catch(e){eE.textContent=errText(e)}
      btn.disabled=false;
    };
  }
  function open(key,label,price){
    if(!guard(key))return;
    if(!el)build();
    cur={key,price};
    el.querySelector("#lp-t").textContent=label;
    el.querySelector("#lp-p").textContent="₹"+price;
    const a=el.querySelector("#lp-a");a.textContent="Pay ₹"+price+" with UPI";
    a.href="upi://pay?pa="+encodeURIComponent(UPI)+"&pn=LONY%20Projects&am="+price+"&cu=INR&tn="+encodeURIComponent(label.slice(0,40));
    el.querySelector("#lp-u").value="";el.querySelector("#lp-e").textContent="";
    el.classList.add("on");
  }
  window.LONYPAY={
    UPI,has,open,guard,submit,ready,slug,
    user:()=>user,
    onChange:f=>listeners.push(f),
    setState,
    attach:a=>{api=a}
  };
})();
