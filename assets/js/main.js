(function(){
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const root=document.documentElement;
const store={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}},del:k=>{try{sessionStorage.removeItem(k)}catch(e){}}};

/* if libraries failed to load, still show the page */
if(!window.gsap||!window.ScrollTrigger){root.classList.remove('trans');const p=$('#pre');p&&p.remove();return}

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
gsap.registerPlugin(ScrollTrigger);
const curtain=$('#curtain');
const arrivedByTransition=root.classList.contains('trans');
store.del('bm_nav');

/* images: if one ever fails, hide the broken icon and let the gradient frame show */
$$('img').forEach(i=>{const f=()=>{i.style.visibility='hidden'};i.addEventListener('error',f);if(i.complete&&i.naturalWidth===0&&i.getAttribute('src'))f()});

/* smooth scroll */
let lenis=null;
if(window.Lenis&&!reduce){
  lenis=new Lenis({duration:1.15,smoothWheel:true});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}

/* in-page anchors */
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href'); if(id.length<2) return;
  const el=$(id); if(!el) return; e.preventDefault();
  $('#mm').classList.remove('open');
  lenis?lenis.scrollTo(el,{offset:-60}):el.scrollIntoView({behavior:'smooth'});
}));
$('#burger').onclick=()=>$('#mm').classList.toggle('open');

/* page transition wipe between pages */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]'); if(!a||e.defaultPrevented) return;
  const h=a.getAttribute('href');
  if(!h||h[0]==='#'||/^(mailto:|tel:|javascript:)/.test(h)||a.target==='_blank'||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.hasAttribute('download')) return;
  let u; try{u=new URL(a.href,location.href)}catch(_){return}
  if(u.origin!==location.origin||!/\.html?$/.test(u.pathname)) return;
  if(u.pathname===location.pathname&&u.hash) return;
  e.preventDefault();
  store.set('bm_nav','1');store.set('bm_seen','1');
  lenis&&lenis.stop();
  gsap.fromTo(curtain,{yPercent:100},{yPercent:0,duration:.6,ease:'power3.inOut',onComplete:()=>{location.href=a.href}});
});
addEventListener('pageshow',e=>{if(e.persisted){gsap.set(curtain,{yPercent:100});root.classList.remove('trans');lenis&&lenis.start()}});

/* split text into masked words */
$$('[data-split]').forEach(el=>{
  const walk=n=>{[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){
      const f=document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(p=>{
        if(p===''||/^\s+$/.test(p)){f.append(document.createTextNode(p));return}
        const w=document.createElement('span');w.className='w';
        const i=document.createElement('span');i.className='wi';i.textContent=p;w.append(i);f.append(w);
      });
      c.replaceWith(f);
    } else if(c.nodeType===1) walk(c);
  })};
  walk(el);
});

/* nav state */
ScrollTrigger.create({start:60,onUpdate:s=>$('#nav').classList.toggle('scrolled',s.scroll()>60)});

/* ---------- THREE.JS ---------- */
const state={x:0,y:0,z:0,s:1};
let three=null;
try{
  const canvas=$('#bg3d');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.z=7;
  scene.add(new THREE.AmbientLight(0xffffff,.4));
  const l1=new THREE.PointLight(0x5b8cff,2.4,30);l1.position.set(4,3,5);scene.add(l1);
  const l2=new THREE.PointLight(0x2f4bff,3,30);l2.position.set(-5,-2,4);scene.add(l2);

  const group=new THREE.Group();scene.add(group);
  const geo=new THREE.IcosahedronGeometry(1.5,1);
  const core=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x0a1250,metalness:.95,roughness:.22,flatShading:true}));
  const wire=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x5b8cff,wireframe:true,transparent:true,opacity:.5}));
  wire.scale.setScalar(1.04);
  const inner=new THREE.Mesh(new THREE.OctahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:0x5b8cff,emissive:0x5b8cff,emissiveIntensity:.8,metalness:.3,roughness:.3}));
  group.add(core,wire,inner);

  const rings=[];
  [[2.4,0],[2.9,1.1],[3.4,-.8]].forEach(([r,t],i)=>{
    const m=new THREE.Mesh(new THREE.TorusGeometry(r,.012,12,220),new THREE.MeshBasicMaterial({color:i==1?0x2f4bff:0xffffff,transparent:true,opacity:.35}));
    m.rotation.x=1.2+t;m.rotation.y=t;group.add(m);rings.push(m);
  });
  const cubes=[];
  for(let i=0;i<16;i++){
    const s=.1+Math.random()*.22;
    const m=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s,s,s)),new THREE.LineBasicMaterial({color:i%3?0xffffff:0x5b8cff,transparent:true,opacity:.7}));
    const a=Math.random()*Math.PI*2,r=2.6+Math.random()*2.2;
    m.position.set(Math.cos(a)*r,(Math.random()-.5)*4,Math.sin(a)*r);
    m.userData={sp:.2+Math.random()*.6,a,r,y:m.position.y};
    group.add(m);cubes.push(m);
  }
  const N=1400,pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){const r=6+Math.random()*16,a=Math.random()*6.283,b=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.sin(b)*Math.sin(a);pos[i*3+2]=r*Math.cos(b)-4;}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.03,color:0xffffff,transparent:true,opacity:.6}));
  scene.add(pts);

  const mouse={x:0,y:0,tx:0,ty:0};
  addEventListener('mousemove',e=>{mouse.tx=(e.clientX/innerWidth-.5);mouse.ty=(e.clientY/innerHeight-.5)});
  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};
  resize();addEventListener('resize',resize);

  const mobile=()=>innerWidth<1000;
  const clock=new THREE.Clock();let visible=true;
  document.addEventListener('visibilitychange',()=>visible=!document.hidden);
  gsap.ticker.add(()=>{
    if(!visible) return;
    const t=clock.getElapsedTime(), sy=scrollY;
    mouse.x+=(mouse.tx-mouse.x)*.05;mouse.y+=(mouse.ty-mouse.y)*.05;
    const m=mobile();
    group.position.x=m?0:state.x; group.position.y=(m?1.6:state.y)+Math.sin(t*.8)*.12; group.position.z=state.z;
    group.scale.setScalar(Math.max(state.s,.001)*(m?.65:1));
    group.rotation.y=t*.15+sy*.0011+mouse.x*.8;
    group.rotation.x=Math.sin(t*.3)*.15+sy*.0004+mouse.y*.6;
    core.rotation.y=-t*.1; inner.rotation.x=t*.6; inner.rotation.y=t*.4;
    rings.forEach((r,i)=>{r.rotation.z=t*(.12+i*.07)*(i%2?-1:1)});
    cubes.forEach(c=>{const d=c.userData;d.a+=d.sp*.004;c.position.x=Math.cos(d.a)*d.r;c.position.z=Math.sin(d.a)*d.r;c.position.y=d.y+Math.sin(t*d.sp+d.a)*.3;c.rotation.x+=.01;c.rotation.y+=.013});
    pts.rotation.y=t*.012+sy*.00015;
    camera.position.x=mouse.x*.6;camera.position.y=-mouse.y*.4;camera.lookAt(0,0,0);
    renderer.render(scene,camera);
  });
  three={wire,inner};
}catch(e){console.warn('3D unavailable',e)}

/* 3D scene pose for each section */
const A=0x5b8cff,B=0x2f4bff;
const scenes={
  hero:{x:2.7,y:-.1,z:0,s:1,c:A},
  page:{x:3.1,y:.1,z:-1.2,s:.9,c:A},
  services:{x:-3.6,y:0,z:-2.5,s:.75,c:B},
  why:{x:-3.2,y:.4,z:-1,s:.9,c:A},
  pricing:{x:0,y:0,z:-6,s:.9,c:B},
  stats:{x:3.4,y:0,z:-2,s:.8,c:A},
  work:{x:0,y:2.4,z:-6.5,s:.7,c:B},
  process:{x:-4,y:0,z:-2,s:.8,c:A},
  reviews:{x:0,y:-2.5,z:-7,s:.7,c:B},
  blog:{x:3.6,y:0,z:-3,s:.75,c:A},
  faq:{x:-3.8,y:0,z:-3,s:.7,c:B},
  contact:{x:2.8,y:.2,z:-.5,s:1.05,c:A},
  content:{x:3.8,y:-.2,z:-3.5,s:.7,c:B}
};
function goScene(k){
  const s=scenes[k];if(!s)return;
  gsap.to(state,{x:s.x,y:s.y,z:s.z,s:s.s,duration:1.6,ease:'power3.out',overwrite:true});
  if(three){const c=new THREE.Color(s.c);
    gsap.to(three.wire.material.color,{r:c.r,g:c.g,b:c.b,duration:1.2});
    gsap.to(three.inner.material.color,{r:c.r,g:c.g,b:c.b,duration:1.2});
    gsap.to(three.inner.material.emissive,{r:c.r,g:c.g,b:c.b,duration:1.2});}
}
$$('[data-scene]').forEach(sec=>{
  const k=sec.dataset.scene;
  ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 45%',onEnter:()=>goScene(k),onEnterBack:()=>goScene(k)});
});
const firstScene=$('[data-scene]');
if(firstScene&&scenes[firstScene.dataset.scene]) Object.assign(state,{x:scenes[firstScene.dataset.scene].x});

/* ---------- ANIMATIONS ---------- */
const inHero=el=>el.closest('.hero,.page-hero');
function reveal(){
  $$('[data-split]').forEach(el=>{
    if(inHero(el)) return;
    gsap.from($$('.wi',el),{yPercent:115,rotate:4,duration:1,ease:'power4.out',stagger:.045,scrollTrigger:{trigger:el,start:'top 88%'}});
  });
  $$('.eyebrow').forEach(e=>{ if(inHero(e))return;
    gsap.from(e,{opacity:0,x:-20,duration:.8,scrollTrigger:{trigger:e,start:'top 92%'}})});
  $$('.lead').forEach(e=>{ if(inHero(e))return;
    gsap.from(e,{opacity:0,y:30,duration:1,ease:'power3.out',scrollTrigger:{trigger:e,start:'top 92%'}})});

  if($('.card')) ScrollTrigger.batch('.card',{start:'top 92%',onEnter:b=>gsap.from(b,{opacity:0,y:70,rotateX:-12,duration:1,stagger:.1,ease:'power3.out'}),once:true});
  if($('.why-list')) gsap.from('.why-item',{opacity:0,y:80,duration:1,stagger:.2,ease:'power3.out',scrollTrigger:{trigger:'.why-list',start:'top 82%'}});
  if($('.price-grid')) gsap.from('.plan',{opacity:0,y:100,scale:.94,duration:1.1,stagger:.18,ease:'power3.out',scrollTrigger:{trigger:'.price-grid',start:'top 85%'}});
  if($('.blog')) gsap.from('.blog .post',{opacity:0,y:70,duration:1,stagger:.15,ease:'power3.out',scrollTrigger:{trigger:'.blog',start:'top 88%'}});
  if($('.case-grid')) gsap.from('.case-grid .case',{opacity:0,y:80,duration:1,stagger:.15,ease:'power3.out',scrollTrigger:{trigger:'.case-grid',start:'top 88%'}});
  if($('.tgrid')) gsap.from('.tgrid .tcard',{opacity:0,y:70,duration:1,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.tgrid',start:'top 88%'}});
  if($('.faq')) gsap.from('.q',{opacity:0,y:40,duration:.8,stagger:.1,scrollTrigger:{trigger:'.faq',start:'top 88%'}});
  if($('.dm')) gsap.from('.dm div',{opacity:0,y:50,duration:1,stagger:.12,scrollTrigger:{trigger:'.dm',start:'top 88%'}});
  if($('.info-cards')) gsap.from('.info-cards .card',{opacity:0,y:60,duration:1,stagger:.12,scrollTrigger:{trigger:'.info-cards',start:'top 90%'}});
  $$('.band').forEach(b=>gsap.from(b,{opacity:0,y:80,scale:.96,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:b,start:'top 88%'}}));
  $$('.hero-img,.about-img').forEach(b=>{
    gsap.from(b,{opacity:0,y:70,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:b,start:'top 90%'}});
    const im=$('img',b); if(im) gsap.fromTo(im,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:b,start:'top bottom',end:'bottom top',scrub:true}});
  });
  $$('.prose > *, .tick li').forEach(el=>gsap.from(el,{opacity:0,y:30,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%'}}));
  const qf=$('#contact .quote-form')||$('.cta .quote-form'); if(qf) gsap.from(qf,{opacity:0,y:80,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:qf,start:'top 88%'}});

  /* counters */
  $$('[data-count]').forEach(el=>{
    const end=+el.dataset.count,o={v:0};
    ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:()=>gsap.to(o,{v:end,duration:2.2,ease:'power2.out',onUpdate:()=>el.textContent=Math.round(o.v)})});
  });
  if($('.stats')) gsap.from('.stat',{opacity:0,y:50,stagger:.12,duration:1,scrollTrigger:{trigger:'.stats',start:'top 88%'}});

  /* process line + steps */
  if($('.proc')){
    gsap.to('.proc-line i',{scaleY:1,ease:'none',scrollTrigger:{trigger:'.proc',start:'top 60%',end:'bottom 70%',scrub:.6}});
    $$('.step').forEach(s=>{
      ScrollTrigger.create({trigger:s,start:'top 62%',onEnter:()=>s.classList.add('on'),onLeaveBack:()=>s.classList.remove('on')});
      gsap.from([s.children[1],s.children[2]],{opacity:0,x:40,duration:.9,stagger:.1,scrollTrigger:{trigger:s,start:'top 78%'}});
    });
  }

  /* testimonial rows drift */
  $$('.trow').forEach(r=>{
    const d=+r.dataset.dir, dist=Math.max(0,r.scrollWidth-innerWidth)*0.85+60;
    gsap.fromTo(r,{x:d<0?0:-dist},{x:d<0?-dist:0,ease:'none',scrollTrigger:{trigger:r.parentElement,start:'top bottom',end:'bottom top',scrub:1}});
  });

  /* footer giant text */
  if($('#giant')) gsap.from('#giant',{yPercent:60,opacity:0,ease:'power3.out',duration:1.4,scrollTrigger:{trigger:'#giant',start:'top 100%'}});
  /* case image parallax (horizontal section + grid) */
  $$('.case .img img').forEach(im=>gsap.fromTo(im,{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:true}}));
  if($('.marquee')) gsap.to('.marquee',{backgroundColor:'rgba(91,140,255,.08)',scrollTrigger:{trigger:'.marquee',start:'top 80%',end:'bottom 20%',scrub:true}});

  /* pinned horizontal case studies (home page, desktop) */
  const track=$('.cases-track');
  if(track){
    const mm=gsap.matchMedia();
    mm.add('(min-width:1001px)',()=>{
      const dist=()=>track.scrollWidth-innerWidth+innerWidth*.04;
      gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.cases',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1}});
    });
  }
}

/* hero intro */
function intro(delay){
  const hero=$('.hero,.page-hero'); if(!hero) return;
  const h=$('[data-split]',hero), words=h?$$('.wi',h):[];
  const tl=gsap.timeline({delay:delay||0,defaults:{ease:'power4.out'}});
  const pre=$$('.eyebrow,.crumbs',hero);
  if(pre.length) tl.from(pre,{opacity:0,y:20,duration:.8});
  if(words.length) tl.from(words,{yPercent:120,rotate:5,duration:1.2,stagger:.06},pre.length?'-=.5':0);
  const fades=$$('.hero-fade',hero); if(fades.length) tl.from(fades,{opacity:0,y:40,duration:1,stagger:.12},'-=.7');
  const si=$('.scroll-ind'); if(si) tl.from(si,{opacity:0,duration:1},'-=.5');
  tl.from('nav',{yPercent:-100,duration:1},'-=1.2');
  if(three) gsap.from(state,{s:.01,duration:2.2,delay:delay||0,ease:'elastic.out(1,.7)'});
}
function boot(delay){intro(delay);reveal();ScrollTrigger.refresh()}

const pre=$('#pre');
if(arrivedByTransition){
  /* arriving from another page: lift the wipe, then play the intro */
  pre&&pre.remove();
  gsap.set(curtain,{yPercent:0});
  gsap.to(curtain,{yPercent:-100,duration:.75,delay:.05,ease:'power3.inOut',onComplete:()=>root.classList.remove('trans')});
  boot(.35);
}else if(pre&&!root.classList.contains('seen')){
  /* first visit of the session: percentage preloader */
  const pn=$('#preN'),o={v:0};
  gsap.to(o,{v:100,duration:reduce?.1:1.4,ease:'power2.inOut',onUpdate:()=>pn.textContent=Math.round(o.v),onComplete:()=>{
    store.set('bm_seen','1');
    gsap.to(pre,{yPercent:-100,duration:.9,ease:'power4.inOut',onComplete:()=>{pre.remove();boot(0)}});
  }});
}else{
  pre&&pre.remove();
  boot(0);
}

/* tilt + glow cards */
if(fine) $$('.tilt').forEach(c=>{
  c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',y*100+'%');
    gsap.to(c,{rotateY:(x-.5)*10,rotateX:-(y-.5)*10,transformPerspective:900,duration:.4,ease:'power2.out'});
  });
  c.addEventListener('mouseleave',()=>gsap.to(c,{rotateX:0,rotateY:0,duration:.7,ease:'elastic.out(1,.6)'}));
});
/* magnetic buttons */
if(fine) $$('.magnetic').forEach(b=>{
  b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();
    gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.3,y:(e.clientY-r.top-r.height/2)*.4,duration:.4})});
  b.addEventListener('mouseleave',()=>gsap.to(b,{x:0,y:0,duration:.7,ease:'elastic.out(1,.5)'}));
});
/* custom cursor */
if(fine){
  const cu=$('.cursor'),dot=$('.cursor-dot');
  const qx=gsap.quickTo(cu,'x',{duration:.35}),qy=gsap.quickTo(cu,'y',{duration:.35});
  addEventListener('mousemove',e=>{qx(e.clientX);qy(e.clientY);gsap.set(dot,{x:e.clientX,y:e.clientY})});
  document.addEventListener('mouseover',e=>{cu.classList.toggle('big',!!e.target.closest('a,button,.card,.plan,.post,.q,.case'))});
}

/* FAQ */
$$('.q').forEach(q=>q.querySelector('button').addEventListener('click',()=>{
  const open=q.classList.contains('open');
  $$('.q.open').forEach(o=>{o.classList.remove('open');gsap.to($('.a',o),{height:0,duration:.5,ease:'power3.inOut'})});
  if(!open){q.classList.add('open');gsap.to($('.a',q),{height:'auto',duration:.6,ease:'power3.out',onComplete:()=>ScrollTrigger.refresh()})}
  else ScrollTrigger.refresh();
}));

/* quote modal + forms */
const modal=$('#modal');
const setModal=v=>{modal.classList.toggle('open',v);lenis&&(v?lenis.stop():lenis.start());
  if(v)gsap.from('#modal form',{y:60,opacity:0,duration:.6,ease:'power3.out'})};
$$('[data-quote]').forEach(b=>b.addEventListener('click',()=>setModal(true)));
$('#mx').onclick=()=>setModal(false);
modal.addEventListener('click',e=>{if(e.target===modal)setModal(false)});
addEventListener('keydown',e=>{if(e.key==='Escape')setModal(false)});
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500)};
$$('.quote-form').forEach(f=>f.addEventListener('submit',e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(f));
  /* Opens the visitor's email app with the details filled in. Swap for your form service / backend endpoint when ready. */
  const body='Name: '+d.name+'\nEmail: '+d.email+'\nPhone: '+(d.phone||'-')+'\nService: '+d.service+'\n\n'+(d.msg||'');
  location.href='mailto:ballinmedia0@gmail.com?subject='+encodeURIComponent('Quote request: '+d.service)+'&body='+encodeURIComponent(body);
  toast('Thanks! Your quote request is ready to send.');f.reset();setModal(false);
}));
const news=$('.news'); if(news) news.addEventListener('submit',e=>{e.preventDefault();toast('Subscribed. Welcome aboard!');e.target.reset()});
})();
