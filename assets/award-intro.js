'use strict';
(() => {
  const intro = document.querySelector('#award-intro');
  const key = 'interiores-bartz-award-v1';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === 'seen'; } catch { /* Storage may be blocked. */ }
  if (!intro || seen || location.hash) return;
  const skip = intro.querySelector('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const previousFocus = document.activeElement;
  const locked = [];
  let closed = false, raf = 0, timer;
  function finish() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem(key, 'seen'); } catch { /* Still dismiss normally. */ }
    intro.classList.add('is-leaving');
    document.documentElement.classList.remove('award-intro-active');
    locked.forEach(node => { node.inert = false; });
    document.removeEventListener('keydown', onKey);
    if (intro.contains(document.activeElement)) {
      const target = previousFocus?.isConnected && previousFocus !== document.body
        ? previousFocus : document.querySelector('.header .brand');
      target?.focus({ preventScroll: true });
    }
    document.dispatchEvent(new Event('interiores-intro-finished'));
    setTimeout(() => { intro.hidden = true; }, reduced.matches ? 0 : 500);
  }
  function onKey(event) {
    if (event.key === 'Escape') finish();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  }
  intro.hidden = false;
  document.documentElement.classList.add('award-intro-active');
  // Independent of rendering, map/network access and font loading.
  timer = setTimeout(finish, 3400);
  skip.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  document.addEventListener('DOMContentLoaded', () => {
    if (closed) return;
    for (const node of document.body.children) {
      if (node !== intro && !['SCRIPT', 'STYLE'].includes(node.tagName) && !node.inert) {
        node.inert = true;
        locked.push(node);
      }
    }
    skip.focus({ preventScroll: true });
  }, { once: true });
  addEventListener('pagehide', finish, { once: true });
  try {
    const canvas = intro.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Small procedural 3D mesh: a hollow, faceted cup, curved tubular handles,
    // turned stem and pedestal. Painter's algorithm avoids a WebGL dependency.
    const faces = [];
    const gold = [243, 188, 46], edge = [255, 209, 91], dark = [60, 55, 43];
    function face(points, color) { faces.push({ points, color }); }
    function lathe(profile, color, segments = 32) {
      for (let j = 0; j < profile.length - 1; j++) {
        for (let i = 0; i < segments; i++) {
          const a = i * Math.PI * 2 / segments, b = (i + 1) * Math.PI * 2 / segments;
          const [r, y] = profile[j], [s, z] = profile[j + 1];
          face([[r*Math.cos(a),y,r*Math.sin(a)],[r*Math.cos(b),y,r*Math.sin(b)],
            [s*Math.cos(b),z,s*Math.sin(b)],[s*Math.cos(a),z,s*Math.sin(a)]], color);
        }
      }
    }
    function box(w, bottom, top, depth, color) {
      const v = [[-w,bottom,-depth],[w,bottom,-depth],[w,top,-depth],[-w,top,-depth],
        [-w,bottom,depth],[w,bottom,depth],[w,top,depth],[-w,top,depth]];
      [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]].forEach(ids => face(ids.map(i=>v[i]),color));
    }
    // Cup profile folds over the rim and down inside for visible hollow depth.
    lathe([[0,.0],[.25,.06],[.40,.22],[.58,.48],[.76,.85],[.86,1.20],[.88,1.42],
      [.79,1.42],[.77,1.20],[.67,.88],[.49,.53],[.30,.30],[0,.23]], gold);
    lathe([[.88,1.38],[.91,1.40],[.91,1.47],[.78,1.47],[.78,1.40]],edge);
    lathe([[0,-.89],[.47,-.89],[.47,-.79],[.32,-.73],[.17,-.60],[.13,-.15],
      [.24,-.08],[.25,.02],[0,.08]],gold);
    box(.64,-1.26,-.91,.47,dark);
    box(.71,-1.36,-1.26,.53,gold);
    box(.66,-.94,-.86,.49,edge);
    // Front plaque.
    box(.36,-1.18,-1.00,.482,gold);
    for (const side of [-1,1]) {
      const rings = [], steps = 24, sides = 8;
      for (let i=0;i<=steps;i++) {
        const t=i/steps, a=t*Math.PI;
        const x=side*(.78+.52*Math.sin(a)-.36*t), y=1.26-1.08*t;
        const dx=side*(.52*Math.PI*Math.cos(a)-.36), dy=-1.08, n=Math.hypot(dx,dy);
        rings.push(Array.from({length:sides},(_,j)=>{
          const q=j/sides*Math.PI*2;
          return [x+dy/n*.085*Math.cos(q),y-dx/n*.085*Math.cos(q),.085*Math.sin(q)];
        }));
      }
      for(let i=0;i<steps;i++)for(let j=0;j<sides;j++)face([rings[i][j],rings[i][(j+1)%sides],rings[i+1][(j+1)%sides],rings[i+1][j]],edge);
    }
    const start=performance.now();
    function draw(now) {
      if (closed) return;
      const rect=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2);
      const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
      if (canvas.width!==width || canvas.height!==height) { canvas.width=width;canvas.height=height; }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,rect.width,rect.height);
      const t=Math.min(1,(now-start)/2600), eased=1-Math.pow(1-t,3);
      const angle=reduced.matches?.22:-.65+eased*.95;
      const pitch=.16, ca=Math.cos(angle),sa=Math.sin(angle), cp=Math.cos(pitch),sp=Math.sin(pitch);
      const scale=Math.min(rect.width/3.65,rect.height/3.35)*(reduced.matches?1:.90+.10*eased);
      const lift=reduced.matches?0:Math.sin(t*Math.PI)*.055;
      const transform=([x,y,z])=>{const a=x*ca+z*sa,b=-x*sa+z*ca;return [a,(y+lift)*cp-b*sp,(y+lift)*sp+b*cp];};
      const polygons=faces.map(f=>{const p=f.points.map(transform);return {p,color:f.color,z:p.reduce((s,v)=>s+v[2],0)/p.length};}).sort((a,b)=>a.z-b.z);
      ctx.lineJoin='round';
      for(const f of polygons){
        const [a,b,c]=f.p, u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
        const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const len=Math.hypot(...n)||1;
        // Two-sided flat lighting preserves the interior and thin handle surfaces.
        if(n[2]<0)n.forEach((_,i)=>n[i]*=-1);
        const light=Math.max(0,(-.45*n[0]+.65*n[1]+.60*n[2])/len);
        const shade=.52+.52*light;
        ctx.fillStyle=`rgb(${f.color.map(c=>Math.min(255,Math.round(c*shade))).join(',')})`;
        ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.6;ctx.beginPath();
        f.p.forEach(([x,y,z],i)=>{const perspective=5/(5-z);const px=rect.width/2+x*scale*perspective,py=rect.height*.52-y*scale*perspective;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});
        ctx.closePath();ctx.fill();ctx.stroke();
      }
      intro.querySelector('.award-intro__fallback').hidden=true;
      if(!reduced.matches)raf=requestAnimationFrame(draw);
    }
    draw(start);
    reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);draw(performance.now());});
  } catch { /* Static trophy fallback; skip and automatic dismissal remain active. */ }
})();
