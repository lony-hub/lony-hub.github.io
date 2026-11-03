/* LONY UPI payment popup - change your UPI ID here only */
(function(){
  const UPI="lony-projects@ptyes";
  const K=k=>"lony_unlock_"+k;
  const has=k=>{try{return localStorage.getItem(K(k))==="1"}catch(e){return false}};
  let el,cur;
  function build(){
    const st=document.createElement("style");
    st.textContent=`#lp{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:500;padding:16px}#lp.on{display:flex}.lp-box{background:#0f141d;color:#f8fafc;border:1.5px solid #fbbf24;box-shadow:0 0 30px rgba(251,191,36,.4);border-radius:24px;padding:24px;max-width:380px;width:100%;position:relative;font-family:inherit}.lp-box h3{font-size:1.1rem;margin:0 0 4px;color:#fde047}.lp-box p{font-size:.85rem;color:#94a3b8;margin:0}.lp-price{font-size:2rem;font-weight:900;color:#fde047;margin:8px 0 10px}.lp-box ol{padding-left:18px;font-size:.85rem;color:#94a3b8;margin:0 0 14px}.lp-pay{display:block;text-align:center;text-decoration:none;font-weight:900;font-size:.9rem;padding:12px;border-radius:50px;background:linear-gradient(135deg,#fef08a,#f59e0b);color:#1a1204;margin-bottom:12px}.lp-in{width:100%;box-sizing:border-box;background:#141b26;border:1px solid #212c3d;color:#f8fafc;padding:11px 14px;border-radius:10px;font-size:.95rem;margin-bottom:10px}.lp-ok{width:100%;border:none;cursor:pointer;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:800;padding:12px;border-radius:50px;font-size:.9rem}.lp-x{position:absolute;top:10px;right:14px;background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer}.lp-err{color:#f87171;font-size:.8rem;min-height:1.1em;margin-bottom:6px}`;
    document.head.appendChild(st);
    el=document.createElement("div");el.id="lp";
    el.innerHTML=`<div class="lp-box"><button type="button" class="lp-x" aria-label="Close">✕</button><h3 id="lp-t"></h3><p id="lp-s">Unlock this project</p><div class="lp-price" id="lp-p"></div><ol><li>Pay using UPI</li><li>Enter the 12 digit UTR / Transaction ID</li><li>Confirm to unlock</li></ol><a class="lp-pay" id="lp-a" href="#"></a><input class="lp-in" id="lp-u" inputmode="numeric" maxlength="12" placeholder="12 digit UTR number"><div class="lp-err" id="lp-e"></div><button type="button" class="lp-ok" id="lp-c">Confirm Payment &amp; Unlock</button><p style="margin-top:10px;font-size:.72rem">UPI ID: ${UPI}</p></div>`;
    document.body.appendChild(el);
    el.querySelector(".lp-x").onclick=()=>el.classList.remove("on");
    el.addEventListener("click",e=>{if(e.target===el)el.classList.remove("on")});
    el.querySelector("#lp-c").onclick=()=>{
      const v=el.querySelector("#lp-u").value.trim();
      if(!/^\d{12}$/.test(v)){el.querySelector("#lp-e").textContent="Enter a valid 12 digit UTR number";return}
      try{localStorage.setItem(K(cur.key),"1");localStorage.setItem("lony_utr_"+cur.key,v)}catch(e){}
      el.classList.remove("on");cur.cb&&cur.cb();
    };
  }
  function open(key,label,price,cb){
    if(!el)build();
    cur={key,cb};
    el.querySelector("#lp-t").textContent=label;
    el.querySelector("#lp-p").textContent="₹"+price;
    const a=el.querySelector("#lp-a");a.textContent="Pay ₹"+price+" with UPI";
    a.href="upi://pay?pa="+encodeURIComponent(UPI)+"&pn=LONY%20Projects&am="+price+"&cu=INR&tn="+encodeURIComponent(label.slice(0,40));
    el.querySelector("#lp-u").value="";el.querySelector("#lp-e").textContent="";
    el.classList.add("on");
  }
  window.LONYPAY={UPI,has,open};
})();
