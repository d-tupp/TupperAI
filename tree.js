(()=>{
const $=id=>document.getElementById(id);
const W=230,H=78,GX=28,GY=110,LX=250,TOP=40;
const LINES=[['Tupper',/Tupper/],['Salsman',/Sal(s|tz)man|Salzmann/],['Murphy',/Murphy/],['Doherty',/Doherty/],['Haines',/Haines/]];
const MORE=[['Morse',/Morse/],['Hiltz',/Hiltz/],['Wentzell',/Wentzell/],['Bassett',/Bassett/],['Legge',/Legge/],['Boehner',/Boehner/]];
const ALL=[...LINES,...MORE];
const AV=['#2b6cb0','#7b3fbf','#0f8b8d','#b7572a','#9c2f6b','#2f855a','#8a6d1f','#4c51bf'];
let P=[],by={},collapsed=new Set(),view={x:0,y:0,s:.75},line='',focus=null,sel=null,built=false,blood=new Set();
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const lineOf=p=>{const n=p.name;for(const[k,r]of ALL)if(r.test(n.replace(/\(.*?\)/,'')))return k;for(const[k,r]of ALL)if(r.test(n))return k;return''};
const birthSur=p=>{const m=p.name.match(/\(([^)]+)\)/);if(m&&!/^[A-Z][a-z]+ ?[A-Z]?\.?$/.test('')&&/^[A-Z]/.test(m[1])&&!/Daniel|Alfred|Dick/.test(m[1]))return m[1].split(' ').pop();return p.name.replace(/\(.*?\)|".*?"|Jr\.|Sr\./g,'').trim().split(/\s+/).pop()};
const ini=p=>{const w=p.name.replace(/\(.*?\)|".*?"|Jr\.|Sr\./g,'').trim().split(/\s+/);return(w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase()};
const yr=(p,k)=>(p.text.match(new RegExp(k+': [^\\n]*?(\\d{4})'))||[])[1];
const yrs=p=>p.living?'Living':(yr(p,'Born')||'?')+' – '+(yr(p,'Died')||'?');
const avc=p=>AV[[...p.id].reduce((a,c)=>a+c.charCodeAt(0),0)%AV.length];
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const REL={10:'CHILDREN',9:'YOUR GENERATION',8:'PARENTS',7:'GRANDPARENTS',6:'GREAT-GRANDPARENTS',5:'GREAT-GREAT GRANDPARENTS'};
function genLabel(g){const ys=P.filter(p=>+p.g===g).map(p=>+yr(p,'Born')).filter(Boolean).sort((a,b)=>a-b);const m=ys.length?Math.floor(ys[Math.floor(ys.length/2)]/10)*10:null;
  return{t:REL[g]||'GENERATION '+ROM[g],c:m?'c.'+m+'s':(g>=8?'today':'')}}
async function init(){if(built)return;built=true;
  P=await (await fetch('/knowledge.json')).json();P.forEach(p=>{by[p.id]=p;p.kids=[];p.line=lineOf(p);p.s=p.s||[];p.p=p.p||[]});
  P.forEach(p=>p.p.forEach(x=>by[x]&&by[x].kids.push(p.id)));
  P.forEach(p=>p.s.forEach(x=>{if(by[x]&&!by[x].s.includes(p.id))by[x].s.push(p.id)}));
  const roots=P.filter(p=>+p.g===0&&/Tupper/.test(p.name));const add=id=>{if(blood.has(id))return;blood.add(id);by[id].kids.forEach(add)};roots.forEach(r=>add(r.id));
  $('tsl').innerHTML=P.map(p=>`<option value="${esc(p.name)}">`).join('');
  $('tlines').innerHTML='<button data-l="" class="on">All</button>'+LINES.map(l=>`<button data-l="${l[0]}">${l[0]}</button>`).join('')+`<select id="tmore"><option value="">More lines…</option>${MORE.map(l=>`<option>${l[0]}</option>`).join('')}</select>`;
  layout();bind()}
function hiddenSet(){const h=new Set();const hide=id=>{for(const k of by[id].kids){if(h.has(k))continue;h.add(k);hide(k)}};collapsed.forEach(hide);
  if(focus){const keep=new Set([focus]);const up=x=>(by[x].p).forEach(a=>{if(by[a]&&!keep.has(a)){keep.add(a);by[a].s.forEach(s=>keep.add(s));up(a)}});const dn=x=>by[x].kids.forEach(k=>{if(!keep.has(k)){keep.add(k);dn(k)}});up(focus);dn(focus);by[focus].s.forEach(s=>keep.add(s));
    P.forEach(p=>{if(!keep.has(p.id))h.add(p.id)})}
  return h}
const inLine=p=>!line||p.line===line;
function layout(){
  const hid=hiddenSet(),vis=P.filter(p=>!hid.has(p.id));const gens=[...new Set(vis.map(p=>+p.g))].sort((a,b)=>a-b);
  const pos={};const rows=[];
  gens.forEach((g,ri)=>{const row=vis.filter(p=>+p.g===g);const y=TOP+ri*(H+GY);
    const key=p=>{const ps=p.p.filter(x=>pos[x]);if(ps.length)return ps.reduce((a,x)=>a+pos[x].x,0)/ps.length;const sp=p.s.find(x=>pos[x]);return sp?pos[sp].x+1:1e6+P.indexOf(p)};
    row.sort((a,b)=>key(a)-key(b));const seq=[];
    for(const p of row){if(seq.includes(p))continue;
      const sps=p.s.map(s=>by[s]).filter(q=>q&&row.includes(q)&&!seq.includes(q)&&!q.p.some(x=>pos[x]));
      if(sps.length&&!blood.has(p.id)&&!p.p.some(x=>pos[x])){seq.push(p);continue}
      if(sps.length===1&&!blood.has(sps[0].id)){seq.push(p,sps[0])}else{seq.push(p,...sps)}}
    seq.forEach((p,i)=>pos[p.id]={x:i*(W+GX),y});
    const withP=seq.filter(p=>p.p.some(x=>pos[x]&&pos[x].y<y));
    if(withP.length){const want=withP.reduce((a,p)=>{const ps=p.p.filter(x=>pos[x]);return a+ps.reduce((b,x)=>b+pos[x].x,0)/ps.length},0)/withP.length,have=withP.reduce((a,p)=>a+pos[p.id].x,0)/withP.length;seq.forEach(p=>pos[p.id].x+=want-have)}
    // resolve overlaps with previous rows is unnecessary (different y)
    rows.push({g,y})});
  const xs=Object.values(pos).map(v=>v.x);const minX=Math.min(...xs);Object.values(pos).forEach(v=>v.x+=LX-minX);
  const maxW=Math.max(...Object.values(pos).map(v=>v.x))+W+80,maxH=TOP+rows.length*(H+GY)+40;
  const tc=$('tc');tc.style.width=maxW+'px';tc.style.height=maxH+'px';
  let svg='';const drawn=new Set();
  for(const p of vis){const c=pos[p.id];
    for(const s of p.s){const q=pos[s];if(q&&q.y===c.y&&q.x>c.x&&Math.abs(q.x-c.x)<=W+GX+1)svg+=`<line x1="${c.x+W}" y1="${c.y+H/2}" x2="${q.x}" y2="${q.y+H/2}" class="cpl"/>`}
    const ps=p.p.filter(x=>pos[x]);if(ps.length){const px=ps.reduce((a,x)=>a+pos[x].x+W/2,0)/ps.length,py=Math.max(...ps.map(x=>pos[x].y))+H+16,mid=c.y-GY/2+8;
      const dim=line&&!(inLine(p)||ps.some(x=>inLine(by[x])))?' dim':'';
      const k=ps.sort().join();if(!drawn.has(k)){drawn.add(k);svg+=`<path d="M${px} ${py-16}V${mid}" class="lnk${dim}"/>`}
      svg+=`<path d="M${px} ${mid}H${c.x+W/2}V${c.y}" class="lnk${dim}"/>`}}
  let html=`<svg width="${maxW}" height="${maxH}" class="tsvg">${svg}</svg>`;
  for(const r of rows){const L=genLabel(r.g);html+=`<div class="glab" style="top:${r.y+H/2-22}px"><b>${L.t}</b><span>${L.c}</span></div><div class="gline" style="top:${r.y+H+GY/2}px;width:${maxW}px"></div>`}
  const btn=new Set();
  for(const p of vis){const c=pos[p.id];const sp=!blood.has(p.id)&&p.s.length;const tagOk=!/^Mother of|unknown|not known/i.test(p.name);const dim=line&&!inLine(p)?' dim':'';
    const av=p.ph?`<img src="${p.ph}" alt="">`:ini(p);
    html+=`<div class="tn${sp?' sp':''}${p.living?' lv':''}${dim}${sel===p.id?' sel':''}" data-id="${p.id}" style="left:${c.x}px;top:${c.y}px">
      <div class="av" style="background:${avc(p)}">${av}</div><div class="tx"><b>${esc(p.name)}</b><small>${yrs(p)}</small></div><i class="dot ${p.c||'confirmed'}" title="${p.c||''}"></i>${sp&&tagOk?`<em class="tag">↑ ${esc(birthSur(p))}</em>`:''}</div>`;
    if(p.kids.length){const pair=[p.id,...p.s.filter(s=>pos[s]&&pos[s].y===c.y&&Math.abs(pos[s].x-c.x)<=W+GX+1)];const key=[...pair].sort().join();if(btn.has(key))continue;btn.add(key);
      const bx=pair.reduce((a,x)=>a+pos[x].x+W/2,0)/pair.length;const col=pair.some(x=>collapsed.has(x));
      html+=`<button class="tg" data-t="${pair.join(',')}" style="left:${bx-12}px;top:${c.y+H+4}px">${col?'+':'–'}</button>`}}
  tc.innerHTML=html;tc._pos=pos;requestAnimationFrame(mmDraw);
  $('tfocus').textContent=sel?`◎ Focus on ${by[sel].name.split(' ')[0]}'s line`:'◎ Focus on a line';$('tfocus').classList.toggle('on',!!focus);
}
function apply(){$('tc').style.transform=`translate(${view.x}px,${view.y}px) scale(${view.s})`;mmView()}
let anim=null;function animTo(x,y,s,ms=450){cancelAnimationFrame(anim);const a={...view},t0=performance.now();const st=t=>{const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);view.x=a.x+(x-a.x)*e;view.y=a.y+(y-a.y)*e;view.s=a.s+(s-a.s)*e;apply();if(k<1)anim=requestAnimationFrame(st)};anim=requestAnimationFrame(st)}
function mmDraw(){const c=$('mm'),tc=$('tc');if(!c||!tc._pos)return;const w=c.width=c.clientWidth*2,h=c.height=c.clientHeight*2;const sc=Math.min(w/tc.offsetWidth,h/tc.offsetHeight);c._sc=sc;c._ox=(w-tc.offsetWidth*sc)/2;c._oy=(h-tc.offsetHeight*sc)/2;const g=c.getContext('2d');g.clearRect(0,0,w,h);
  for(const[id,p]of Object.entries(tc._pos)){g.fillStyle=id===sel?'#3fd6ff':id==='dustin'||id==='gracie'?'#7ad3ff':by[id].living?'#3f7f63':'#4a6a9a';g.fillRect(c._ox+p.x*sc,c._oy+p.y*sc,Math.max(2,W*sc),Math.max(2,H*sc))}mmView()}
function mmView(){const c=$('mm'),r=$('mmv'),tv=$('tv');if(!c||!c._sc)return;const k=c._sc/2;r.style.left=(c._ox/2+(-view.x/view.s)*k)+'px';r.style.top=(c._oy/2+(-view.y/view.s)*k)+'px';r.style.width=(tv.clientWidth/view.s*k)+'px';r.style.height=(tv.clientHeight/view.s*k)+'px'}
function fit(){const tv=$('tv'),tc=$('tc');let s=Math.min(tv.clientWidth/tc.offsetWidth,tv.clientHeight/tc.offsetHeight);s=Math.min(Math.max(s,.12),1);animTo(Math.max(10,(tv.clientWidth-tc.offsetWidth*s)/2),10,s)}
function center(id,sc){const c=$('tc')._pos[id];if(!c)return;const tv=$('tv');const mob=innerWidth<=700;const s=sc||Math.max(view.s,mob?.7:.85);
  animTo((tv.clientWidth-(!mob&&!$('tp').hidden?380:0))/2-(c.x+W/2)*s,tv.clientHeight*(mob&&!$('tp').hidden?.12:.4)-(c.y+H/2)*s,s)}
function sec(t,b){return b?`<div class="ps"><h4>${t}</h4>${b}</div>`:''}
function open(id){const p=by[id];if(!p)return;sel=id;
  const up=x=>by[x].p.forEach(a=>{if(by[a]){collapsed.delete(a);up(a)}});up(id);if(focus&&hiddenSet().has(id))focus=null;layout();
  const chips=(lab,ids)=>ids.filter(x=>by[x]).map(x=>`<a data-go="${x}"><span>${lab}</span>${esc(by[x].name)}</a>`).join('');
  const sib=[...new Set(p.p.flatMap(x=>by[x]?by[x].kids:[]))].filter(x=>x!==id);
  const L=p.text.split('\n');const get=k=>L.filter(l=>l.startsWith(k+': ')).map(l=>esc(l.slice(k.length+2)));
  const conf=(p.c||'confirmed').toUpperCase();
  let h=`<div class="phd"><div class="bav" style="background:${avc(p)}">${p.ph?`<img src="${p.ph}" alt="">`:ini(p)}</div><h3>${esc(p.name)}</h3><div class="pid">ID ${esc(p.id)} · Generation ${p.g}${p.line?' · '+p.line+' line':''}</div><span class="badge ${p.c||'confirmed'}">● ${p.living?'LIVING · ':''}${conf}</span></div>`;
  const fam=chips('Parent',p.p)+chips('Spouse',p.s)+chips('Sibling',sib)+chips('Child',p.kids);
  if(p.living){h+=sec('FAMILY',`<div class="chips">${fam}</div>`)+`<div class="priv">🔒 Living relative. Birth dates, ages, locations and photos are kept private.</div>`}
  else{const B=get('Born'),D=get('Died');
    h+=sec('DATES',(B.length?`<div class="kv"><span>Born</span>${B[0]}</div>`:'')+(D.length?`<div class="kv"><span>Died</span>${D[0]}</div>`:''));
    const hl=L.filter(l=>l.startsWith('- ')).map(l=>`<li>${esc(l.slice(2)).replace(/\[source: (.*?)\]$/,'<small>$1</small>')}</li>`).join('');h+=sec('HIGHLIGHTS',hl&&`<ul>${hl}</ul>`);
    h+=sec('OBITUARY',get('Obituary').map(x=>`<p>${x}</p>`).join(''));
    h+=sec('FAMILY',fam&&`<div class="chips">${fam}</div>`);
    h+=sec('RESTING PLACE',get('Grave').map(x=>`<p>🪦 ${x}</p>`).join(''));
    h+=sec('NOTES',get('Notes').map(x=>`<p>${x}</p>`).join(''));
    h+=sec('SOURCES',get('Sources').map(x=>`<ul class="src">${x.split('; ').map(s=>`<li>${s}</li>`).join('')}</ul>`).join('')+(p.phc?`<p class="cred">Photo: ${esc(p.phc)}</p>`:''))}
  $('tpb').innerHTML=h;$('tp').hidden=false;$('tpb').scrollTop=0;
  $('tpa').onclick=()=>{window.tupperSwitch('chat');$('t').value=p.living?`How is ${p.name} related to the rest of the family?`:`Tell me about ${p.name}.`;$('f').requestSubmit()};
  requestAnimationFrame(()=>center(id))}
function home(){const id=by.dustin?'dustin':P[0].id;if($('tc')._pos&&!$('tc')._pos[id]){collapsed.clear();focus=null;layout()}center(id,innerWidth<=700?.75:.9)}
function zoom(f,cx,cy){cancelAnimationFrame(anim);const r=$('tv').getBoundingClientRect();cx=(cx??r.left+r.width/2)-r.left;cy=(cy??r.top+r.height/2)-r.top;const ns=Math.min(2.5,Math.max(.12,view.s*f));const k=ns/view.s;view.x=cx-(cx-view.x)*k;view.y=cy-(cy-view.y)*k;view.s=ns;apply()}
function bind(){
  const tv=$('tv');const pts=new Map();let moved=0,vx=0,vy=0,lt=0,mom=null;
  tv.addEventListener('pointerdown',e=>{cancelAnimationFrame(mom);cancelAnimationFrame(anim);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;vx=vy=0;lt=performance.now()});
  tv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const o=pts.get(e.pointerId);
    if(pts.size===1){const dx=e.clientX-o.x,dy=e.clientY-o.y,now=performance.now(),dt=Math.max(1,now-lt);lt=now;vx=.8*dx/dt+.2*vx;vy=.8*dy/dt+.2*vy;view.x+=dx;view.y+=dy;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6&&!tv.hasPointerCapture(e.pointerId))tv.setPointerCapture(e.pointerId)}
    else if(pts.size===2){const[a,b]=[...pts.values()];const d0=Math.hypot(a.x-b.x,a.y-b.y);const m0={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const[c,d]=[...pts.values()];const m1={x:(c.x+d.x)/2,y:(c.y+d.y)/2};view.x+=m1.x-m0.x;view.y+=m1.y-m0.y;zoom(Math.hypot(c.x-d.x,c.y-d.y)/d0,m1.x,m1.y);moved+=10;vx=vy=0;return}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});apply()});
  const end=e=>{pts.delete(e.pointerId);if(pts.size===0&&moved>6&&performance.now()-lt<80&&Math.hypot(vx,vy)>.15){let px=vx*16,py=vy*16;const step=()=>{view.x+=px;view.y+=py;px*=.93;py*=.93;apply();if(Math.hypot(px,py)>.4)mom=requestAnimationFrame(step)};mom=requestAnimationFrame(step)}};
  tv.addEventListener('pointerup',end);tv.addEventListener('pointercancel',end);
  tv.addEventListener('dblclick',e=>{if(!e.target.closest('.tn'))zoom(1.6,e.clientX,e.clientY)});
  addEventListener('keydown',e=>{if($('tree').hidden||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;const k={ArrowLeft:[1,0],ArrowRight:[-1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];
    if(k){e.preventDefault();animTo(view.x+k[0]*160,view.y+k[1]*160,view.s,200)}else if(e.key==='+'||e.key==='=')zoom(1.25);else if(e.key==='-')zoom(.8);else if(e.key==='h'||e.key==='H')home();else if(e.key==='0')fit();else if(e.key==='Escape')$('tpx').click()});
  $('thome').onclick=home;
  const mm=$('mm');mm.addEventListener('pointerdown',e=>{e.stopPropagation();const go=ev=>{const r=mm.getBoundingClientRect(),k=mm._sc/2;const cx=(ev.clientX-r.left-mm._ox/2)/k,cy=(ev.clientY-r.top-mm._oy/2)/k;const tv=$('tv');view.x=tv.clientWidth/2-cx*view.s;view.y=tv.clientHeight/2-cy*view.s;apply()};go(e);mm.setPointerCapture(e.pointerId);mm.onpointermove=ev=>{if(ev.buttons||ev.pointerType==='touch')go(ev)};mm.onpointerup=()=>{mm.onpointermove=null}});
  addEventListener('resize',()=>{if(!$('tree').hidden){mmDraw();apply()}});
  tv.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
  tv.addEventListener('click',e=>{if(moved>6)return;const t=e.target.closest('.tg');if(t){const ids=t.dataset.t.split(',');const c=ids.some(x=>collapsed.has(x));ids.forEach(x=>c?collapsed.delete(x):collapsed.add(x));layout();return}const n=e.target.closest('.tn');if(n)open(n.dataset.id)});
  $('tpb').addEventListener('click',e=>{const a=e.target.closest('[data-go]');if(a)open(a.dataset.go)});
  $('tpx').onclick=()=>{$('tp').hidden=true;sel=null;layout()};
  $('tfit').onclick=fit;$('tzi').onclick=()=>zoom(1.25);$('tzo').onclick=()=>zoom(.8);
  $('texp').onclick=()=>{collapsed.clear();focus=null;layout();fit()};
  $('tcol').onclick=()=>{collapsed.clear();P.filter(p=>+p.g===6&&p.kids.length).forEach(p=>collapsed.add(p.id));focus=null;layout();fit()};
  $('tfocus').onclick=()=>{if(focus){focus=null}else if(sel){focus=sel}else{$('ts').focus();return}layout();fit();if(sel)center(sel)};
  $('tlines').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;line=b.dataset.l;$('tmore').value='';document.querySelectorAll('#tlines button').forEach(x=>x.classList.toggle('on',x===b));layout()});
  $('tlines').addEventListener('change',e=>{if(e.target.id!=='tmore')return;line=e.target.value;document.querySelectorAll('#tlines button').forEach(x=>x.classList.toggle('on',!line&&x.dataset.l===''));layout()});
  const go=()=>{const v=$('ts').value.trim().toLowerCase();if(!v)return;const p=P.find(p=>p.name.toLowerCase()===v)||P.find(p=>p.name.toLowerCase().includes(v));if(p){open(p.id);$('ts').blur()}};
  $('ts').addEventListener('change',go);$('ts').addEventListener('keydown',e=>{if(e.key==='Enter')go()})}
window.tupperSwitch=tab=>{const tree=tab==='tree';$('tree').hidden=!tree;$('chat').hidden=tree;$('f').hidden=tree;$('status').hidden=tree;document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));document.body.classList.toggle('treemode',tree);if(tree)init().then(()=>{if(!view.done){view.done=1;const tv=$('tv'),c=$('tc')._pos.dustin;if(c){const s=innerWidth<=700?.6:.8;view.s=s;view.x=tv.clientWidth/2-(c.x+W/2)*s;view.y=tv.clientHeight*.55-(c.y+H/2)*s;apply()}else fit()}mmDraw()})};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>window.tupperSwitch(b.dataset.tab));
if(location.hash==='#tree')window.tupperSwitch('tree');
})();
