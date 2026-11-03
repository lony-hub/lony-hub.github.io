/* LONY 360 viewer (shared by project.html and the premium popup in index.html)
   Usage: box.innerHTML = LONY360.html();  LONY360.mount(LONY360.slug(title));
   Model file: 360/360-<slug>.bin  (slug = title in lowercase, symbols -> "-") */
(function(){
const HWT=["ESP32","IoT","Arduino","Sensor","Relay","Motor","Model","Hydraulics","Physics","LDR","Transistor","Servo","GSM","GPS","Meter","Power","Battery","Robot","Pneumatic"];
const CSS=".v360{position:relative;border-radius:var(--radius-md);overflow:hidden;background:linear-gradient(#eef2f8,#c4ccda);border:1px solid var(--border-subtle);aspect-ratio:4/3;touch-action:none;cursor:grab;box-shadow:0 0 30px color-mix(in srgb,var(--neon-cyan) 14%,transparent)}\n.v360 img{width:100%;height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none}\n.v360 .hint{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:.75rem;color:var(--text-muted)}\n.v360 .sp{position:absolute;inset:0;background-repeat:no-repeat;background-size:600% 400%;background-position:0 0;user-select:none;-webkit-user-select:none}\n.v360 .nv{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:1px solid var(--border-subtle);background:color-mix(in srgb,var(--bg-base) 70%,transparent);color:var(--text-main);font-size:1.1rem;cursor:pointer;z-index:2}\n.v360 .nv.l{left:8px}.v360 .nv.r{right:8px}\n.v360 .cnt{position:absolute;top:8px;right:10px;font-size:.7rem;padding:2px 8px;border-radius:99px;background:color-mix(in srgb,var(--bg-base) 70%,transparent);color:var(--neon-cyan);z-index:2}\n.v360 .fo{position:absolute;top:8px;left:10px;font-size:.7rem;padding:2px 8px;border-radius:99px;background:var(--neon-cyan);color:#052e3a;font-weight:700;z-index:2}\n.v360 canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none}\n.v360 .zc{position:absolute;right:10px;bottom:30px;display:flex;flex-direction:column;gap:8px;z-index:2}\n.v360 .zc button{width:38px;height:38px;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:rgba(20,24,40,.72);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer}\n.v360 .hint{color:#5b6478}\n.v360 .none{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;text-align:center;color:var(--text-muted);font-size:.85rem}\n.v360 .none b{font-size:2rem;color:var(--neon-cyan)}";
if(!document.getElementById("v360css")){const st=document.createElement("style");st.id="v360css";st.textContent=CSS;document.head.appendChild(st)}
let gen=0,stop=null;
const slugOf=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const isHW=(dept,tags)=>dept==="robo"||(tags||[]).some(t=>HWT.includes(String(t).trim()));
const html=()=>'<div class="v360" id="v360"><canvas id="v360cv"></canvas><span class="fo">FINAL OUTPUT</span><div class="zc" id="v360zc"><button type="button" id="v360in" aria-label="Zoom in">+</button><button type="button" id="v360out" aria-label="Zoom out">&minus;</button><button type="button" id="v360rs" aria-label="Reset view">&#8634;</button></div><div class="none" id="v360none"><b>360\u00b0</b><span id="v360msg">Final output 360 view coming soon</span></div><div class="hint" id="v360hint">Drag to rotate &middot; Pinch to zoom</div></div>';
function dispose(){gen++;if(stop){stop();stop=null}}
function mount(slug){
if(stop){stop();stop=null}
const tok=++gen;
const box=document.getElementById("v360");if(!box)return;
const cv=document.getElementById("v360cv"),none=document.getElementById("v360none"),hint=document.getElementById("v360hint"),msg=document.getElementById("v360msg"),zc=document.getElementById("v360zc");
cv.style.display="none";zc.style.display="none";hint.style.display="none";
const soon=t=>{none.style.display="flex";msg.innerHTML=t||("Final output 360\u00b0 coming soon<br><small>Model needed: 360-"+slug+".bin</small>")};
const C=[["360/360-"+slug+".bin",0],["360-"+slug+".bin",0],["360/"+slug+".bin",0],["360-"+slug+".txt",1],["360/360-"+slug+".txt",1]];
(function next(i){if(i>=C.length){soon();return}
fetch(C[i][0]).then(r=>{if(!r.ok)throw 0;return C[i][1]?r.text():r.arrayBuffer()}).then(d=>{if(C[i][1]){const b=atob(d.trim().replace(/\s+/g,"")),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);d=u.buffer}return d}).then(d=>{start(d)},()=>next(i+1))})(0);
function start(buf){
if(tok!==gen||!box.isConnected)return;
const gl=cv.getContext("webgl",{antialias:true,alpha:true,premultipliedAlpha:true});
if(!gl){soon("3D view is not supported on this device");return}
const dv=new DataView(buf),R=dv.getFloat32(0,true),n=dv.getUint32(4,true);
const solid=[],glass=[];
let o=8;
for(let i=0;i<n;i++){const v=new Float32Array(12);for(let k=0;k<12;k++){v[k]=dv.getInt16(o,true)/100;o+=2}
const p={v:v,r:dv.getUint8(o),g:dv.getUint8(o+1),b:dv.getUint8(o+2),a:dv.getUint8(o+3)};o+=4;(p.a>=255?solid:glass).push(p)}
function build(ps){const nv=ps.length*6,ab=new ArrayBuffer(nv*28),f=new Float32Array(ab),u=new Uint8Array(ab);let k=0;
for(const p of ps){const v=p.v,ax=v[6]-v[0],ay=v[7]-v[1],az=v[8]-v[2],bx=v[9]-v[3],by=v[10]-v[4],bz=v[11]-v[5];
let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
for(const j of [0,1,2,0,2,3]){const w=k*7;f[w]=v[j*3];f[w+1]=v[j*3+1];f[w+2]=v[j*3+2];f[w+3]=nx;f[w+4]=ny;f[w+5]=nz;const c=k*28+24;u[c]=p.r;u[c+1]=p.g;u[c+2]=p.b;u[c+3]=p.a;k++}}
const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,ab,gl.STATIC_DRAW);return{bf:bf,nv:nv}}
const S=build(solid),G=glass.length?build(glass):null;
function sh(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return s}
const pr=gl.createProgram();
gl.attachShader(pr,sh(gl.VERTEX_SHADER,"attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uP;uniform mat4 uMV;uniform mat3 uR;varying vec3 vN;varying vec3 vPE;varying vec4 vC;void main(){vec4 e=uMV*vec4(aP,1.0);vPE=e.xyz;vN=uR*aN;vC=aC;gl_Position=uP*e;}"));
gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,"precision mediump float;varying vec3 vN;varying vec3 vPE;varying vec4 vC;void main(){vec3 n=normalize(vN);if(dot(n,normalize(-vPE))<0.0)n=-n;float s=0.46+0.62*max(dot(n,normalize(vec3(0.5,0.9,0.6))),0.0);gl_FragColor=vec4(vC.rgb*s,vC.a);}"));
gl.linkProgram(pr);gl.useProgram(pr);
const aP=gl.getAttribLocation(pr,"aP"),aN=gl.getAttribLocation(pr,"aN"),aC=gl.getAttribLocation(pr,"aC");
const uP=gl.getUniformLocation(pr,"uP"),uMV=gl.getUniformLocation(pr,"uMV"),uR=gl.getUniformLocation(pr,"uR");
gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
const FOV=30*Math.PI/180,D0=R*4.3;
const qax=(x,y,z,a)=>{const s=Math.sin(a/2);return[x*s,y*s,z*s,Math.cos(a/2)]};
const qm=(a,b)=>{const r=[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];const l=Math.hypot(r[0],r[1],r[2],r[3]);return r.map(v=>v/l)};
const Q0=qm(qax(1,0,0,27*Math.PI/180),qax(0,1,0,20*Math.PI/180));
let q=Q0,zoom=1,auto=true,vis=true,raf=0,last=0;
function mats(){const[x,y,z,w]=q,m=[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)];
const d=D0/zoom,mv=new Float32Array([m[0],m[1],m[2],0,m[3],m[4],m[5],0,m[6],m[7],m[8],0,0,0,-d,1]);
const f=1/Math.tan(FOV/2),a=cv.width/cv.height,nr=d*0.05,fr=d*6;
const p=new Float32Array([f/a,0,0,0,0,f,0,0,0,0,(fr+nr)/(nr-fr),-1,0,0,2*fr*nr/(nr-fr),0]);
return{p:p,mv:mv,r:new Float32Array(m)}}
function bind(b){gl.bindBuffer(gl.ARRAY_BUFFER,b.bf);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(aN);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,28,12);gl.enableVertexAttribArray(aC);gl.vertexAttribPointer(aC,4,gl.UNSIGNED_BYTE,true,28,24)}
function draw(){const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(cv.clientWidth*dpr),h=Math.round(cv.clientHeight*dpr);
if(w&&h&&(cv.width!==w||cv.height!==h)){cv.width=w;cv.height=h}
gl.viewport(0,0,cv.width,cv.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const m=mats();gl.uniformMatrix4fv(uP,false,m.p);gl.uniformMatrix4fv(uMV,false,m.mv);gl.uniformMatrix3fv(uR,false,m.r);
gl.disable(gl.BLEND);gl.depthMask(true);bind(S);gl.drawArrays(gl.TRIANGLES,0,S.nv);
if(G){gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);bind(G);gl.drawArrays(gl.TRIANGLES,0,G.nv);gl.depthMask(true)}}
function loop(t){raf=0;if(!vis)return;const dt=last?Math.min((t-last)/1000,0.1):0;last=t;if(auto)q=qm(q,qax(0,1,0,0.45*dt));draw();raf=requestAnimationFrame(loop)}
function kick(){if(!raf&&vis){last=0;raf=requestAnimationFrame(loop)}}
cv.style.display="block";zc.style.display="flex";hint.style.display="block";
let io=null;if("IntersectionObserver" in window){io=new IntersectionObserver(e=>{vis=e[0].isIntersecting;kick()});io.observe(box)}
const P=new Map();let pd=0;
box.addEventListener("pointerdown",e=>{if(e.target.closest(".zc"))return;P.set(e.pointerId,[e.clientX,e.clientY]);auto=false;hint.style.display="none";try{box.setPointerCapture(e.pointerId)}catch(_){}if(P.size===2){const a=[...P.values()];pd=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])}});
box.addEventListener("pointermove",e=>{if(!P.has(e.pointerId))return;const o=P.get(e.pointerId);
if(P.size===1){const dx=e.clientX-o[0],dy=e.clientY-o[1];q=qm(qm(qax(0,1,0,dx*0.009),qax(1,0,0,dy*0.009)),q)}
P.set(e.pointerId,[e.clientX,e.clientY]);
if(P.size===2){const a=[...P.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pd>0)zoom=Math.max(0.5,Math.min(5,zoom*d/pd));pd=d}});
const up=e=>{P.delete(e.pointerId);pd=0};
box.addEventListener("pointerup",up);box.addEventListener("pointercancel",up);
box.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(0.5,Math.min(5,zoom*Math.exp(-e.deltaY*0.0015)))},{passive:false});
const reset=()=>{q=Q0;zoom=1;auto=true;kick()};
box.addEventListener("dblclick",reset);
document.getElementById("v360in").onclick=()=>{zoom=Math.min(5,zoom*1.3)};
document.getElementById("v360out").onclick=()=>{zoom=Math.max(0.5,zoom/1.3)};
document.getElementById("v360rs").onclick=reset;
stop=()=>{vis=false;if(io)io.disconnect();if(raf)cancelAnimationFrame(raf);raf=0;try{const ex=gl.getExtension("WEBGL_lose_context");if(ex)ex.loseContext()}catch(_){}};
kick();
}
}
window.LONY360={slug:slugOf,isHW:isHW,html:html,mount:mount,dispose:dispose};
})();
