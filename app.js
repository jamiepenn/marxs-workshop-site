/* app.js — Main coordinator: animation loop, data loading, events */
const {BUILDINGS,AGENTS,COLS,ROWS,buildTerrain,drawTerrain,drawBuilding,drawSprite,getBuildingAt,setTileSize} = window.WorldEngine;

let dash={}, selectedRoom=null, frame=0, alertMap={};
const canvas=document.getElementById('world-canvas');
const ctx=canvas.getContext('2d');

// Agent state — initialized after first resize() so WorldEngine.T is set
let agentState = [];
function initAgents() {
  agentState = AGENTS.map(a=>{
    const T = window.WorldEngine.T;
    let px, py;
    if (a.id === 'marx') {
      // Marx spawns standing on TOP of his podium
      const kiosk = BUILDINGS.find(b=>b.id==='marx-kiosk');
      px = kiosk ? (kiosk.tx + kiosk.tw/2)*T : 14*T;
      const podiumTopY = kiosk ? kiosk.ty*T + kiosk.th*T*0.18 : 9*T;
      py = podiumTopY + 10;
    } else {
      const home = BUILDINGS.find(b=>b.id===a.home);
      px = home?(home.tx+Math.random()*home.tw)*T:200;
      py = home?(home.ty+home.th-0.5)*T:200;
    }
    return {...a, px, py, tx:px, ty:py, routeIdx:0, waitTick:Math.floor(Math.random()*120)};
  });
}

// ── PIPELINE ROUTES — each agent walks the actual data flow path ─────────────
// Each stop: { bld: buildingId, carry: emoji|null, label: string }
const PIPELINE_ROUTES = {
  aurora:    [
    { bld:'research',  carry:null,   label:'' },        // home: gather data
    { bld:'marx',      carry:'📊',   label:'niches' },   // delivers research to Marx
    { bld:'archives',  carry:'📊',   label:'niches' },   // logs to Library
    { bld:'research',  carry:null,   label:'' },         // returns home
  ],
  marx: [
    { bld:'marx-kiosk',carry:null,   label:'' },         // on podium
    { bld:'archives',  carry:null,   label:'' },         // reads Library
    { bld:'design',    carry:'📋',   label:'brief' },    // briefs Frida
    { bld:'treasury',  carry:'📊',   label:'review' },   // checks Engels
    { bld:'marx-kiosk',carry:null,   label:'' },         // back to podium
  ],
  frida: [
    { bld:'design',    carry:null,   label:'' },         // home: Studio
    { bld:'marx',      carry:null,   label:'' },         // receives brief from Marx
    { bld:'store',     carry:'🎨',   label:'design' },   // delivers design to Harriet
    { bld:'design',    carry:null,   label:'' },         // returns home
  ],
  harriet: [
    { bld:'store',     carry:null,   label:'' },         // home: Co-op
    { bld:'treasury',  carry:'📦',   label:'listing' },  // reports revenue to Engels
    { bld:'comms',     carry:'📦',   label:'live!' },    // announces to Press
    { bld:'store',     carry:null,   label:'' },         // returns home
  ],
  engels: [
    { bld:'treasury',  carry:null,   label:'' },         // home: Treasury
    { bld:'marx',      carry:'💰',   label:'report' },   // financial report to Marx
    { bld:'treasury',  carry:null,   label:'' },         // returns home
  ],
  clara: [
    { bld:'warroom',   carry:null,   label:'' },         // home: Town Hall
    { bld:'marx',      carry:'📅',   label:'plans' },    // brings plans to Marx
    { bld:'archives',  carry:'📅',   label:'plans' },    // logs to Library
    { bld:'warroom',   carry:null,   label:'' },         // returns home
  ],
  emma: [
    { bld:'comms',     carry:null,   label:'' },         // home: The Press
    { bld:'archives',  carry:'✉️',   label:'orders' },   // archives orders
    { bld:'marx',      carry:'✉️',   label:'alert' },    // alerts Marx
    { bld:'comms',     carry:null,   label:'' },         // returns home
  ],
  alexandria: [
    { bld:'archives',  carry:null,   label:'' },         // home: Library
    { bld:'marx',      carry:'📚',   label:'intel' },    // delivers intel to Marx
    { bld:'archives',  carry:null,   label:'' },         // returns home
  ],
  rosa: [
    { bld:'pub',       carry:null,   label:'' },         // home: Web Studio
    { bld:'store',     carry:null,   label:'' },         // reads live products from Harriet
    { bld:'comms',     carry:'🎬',   label:'script' },   // delivers TikTok script to Press
    { bld:'pub',       carry:null,   label:'' },         // returns home
  ],
};

// Handoff particles — page floats from agent when they arrive carrying something
let handoffParticles = []; // {x, y, vy, age, maxAge, emoji, label}

function spawnHandoff(x, y, emoji, label) {
  handoffParticles.push({
    x, y: y - 20,
    vy: -(0.6 + Math.random() * 0.4),
    vx: (Math.random() - 0.5) * 0.6,
    age: 0, maxAge: 80 + Math.random() * 40,
    emoji, label
  });
}

function drawHandoffs() {
  // Called AFTER ctx.restore, so add world offset back to coordinates
  const OX = window._worldOX || 0;
  const OY = window._worldOY || 0;
  handoffParticles = handoffParticles.filter(p => p.age < p.maxAge);
  for (const p of handoffParticles) {
    p.age++; p.x += p.vx; p.y += p.vy;
    const alpha = Math.sin((p.age / p.maxAge) * Math.PI);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji, p.x + OX, p.y + OY);
    if (p.label) {
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#2d2118';
      ctx.fillText(p.label, p.x + OX, p.y + OY + 13);
    }
    ctx.restore();
  }
}

function getBldCenter(bldId) {
  const T = window.WorldEngine.T;
  if (bldId === 'marx-kiosk') {
    const k = BUILDINGS.find(b => b.id === 'marx-kiosk');
    return k ? [(k.tx + k.tw/2)*T, k.ty*T + k.th*T*0.18 + 10] : [14*T, 9*T];
  }
  const b = BUILDINGS.find(b => b.id === bldId);
  return b ? [(b.tx + b.tw/2)*T, (b.ty + b.th)*T] : [15*T, 10*T];
}

// Agent error map — populated from dashboard logs, drives pub routing
window._agentErrors = {};
function isAgentInPub(agentId) { return !!(window._agentErrors?.[agentId]); }

function nextWaypoint(agent) {
  const T = window.WorldEngine.T;

  // Error state → Red Flag Inn
  if (isAgentInPub(agent.id)) {
    const inn = BUILDINGS.find(b => b.id === 'inn');
    if (inn) return [(inn.tx + Math.random()*inn.tw)*T, (inn.ty+inn.th)*T];
  }

  // Get this agent's pipeline route (fall back to simple marx patrol)
  const route = PIPELINE_ROUTES[agent.id];
  if (!route) {
    // Simple fallback: home → marx → home
    const [marxX, marxY] = getBldCenter('marx');
    const [homeX, homeY] = getBldCenter(agent.home);
    const stops = [[marxX, marxY], [homeX, homeY]];
    const idx = agent.routeIdx % stops.length;
    agent.routeIdx++;
    return stops[idx];
  }

  // Advance to next stop in pipeline route
  const stop = route[agent.routeIdx % route.length];

  // On arrival: spawn handoff particle if carrying something
  if (stop.carry && agent._lastStop !== agent.routeIdx) {
    agent._lastStop = agent.routeIdx;
    const [cx, cy] = getBldCenter(stop.bld);
    // Schedule particle after agent walks there (use agent's current target)
  }

  agent.carry = stop.carry;    // what this agent is currently transporting
  agent.carryLabel = stop.label;
  agent.routeIdx++;

  const [x, y] = getBldCenter(stop.bld);
  return [x + Math.random()*16 - 8, y + Math.random()*16 - 8];
}

// ── ANIMATION LOOP ─────────────────────────────────────────────────────────
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - 52;
  setTileSize(canvas.width, canvas.height);
}

// ── MUSIC NOTE PARTICLES (float from pub when agents are inside) ─────────────────
const NOTES = ['♪', '♫', '♬', '♩'];
let noteParticles = []; // {x,y,vy,age,maxAge,note,alpha,size}

function spawnNotes() {
  const inn = BUILDINGS.find(b=>b.id==='inn');
  if (!inn) return;
  const T = window.WorldEngine.T;
  const OX = window._worldOX||0, OY = window._worldOY||0;
  const agentsAtPub = agentState.filter(a => isAgentInPub(a.id));
  if (agentsAtPub.length === 0) return;
  // Spawn 1 note every ~40 frames — gentle, not overwhelming
  if (Math.random() > 0.025) return;
  noteParticles.push({
    x: OX + (inn.tx + Math.random()*inn.tw) * T,
    y: OY + inn.ty * T,
    vy: -(0.4 + Math.random()*0.5),
    vx: (Math.random()-0.5)*0.4,
    age: 0, maxAge: 90 + Math.random()*60,
    note: NOTES[Math.floor(Math.random()*NOTES.length)],
    size: 11 + Math.floor(Math.random()*7)
  });
}

function drawMusicNotes() {
  // Draw in screen space (outside ctx.translate)
  noteParticles = noteParticles.filter(p => p.age < p.maxAge);
  for (const p of noteParticles) {
    p.age++;
    p.x += p.vx;
    p.y += p.vy;
    const alpha = Math.sin((p.age/p.maxAge)*Math.PI) * 0.9;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f0c030';
    ctx.font = `bold ${p.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(240,100,30,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillText(p.note, p.x, p.y);
    ctx.restore();
  }
}

function loop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  frame += 0.15;

  // Center village in canvas (works on ultrawide and any size)
  const _T=window.WorldEngine.T;
  const OX = Math.floor((canvas.width  - COLS * _T) / 2);
  const OY = Math.floor((canvas.height - ROWS * _T) / 2);
  window._worldOX = OX; window._worldOY = OY; // expose for click/hover

  ctx.save();
  ctx.translate(OX, OY);

  // Draw world
  drawTerrain(ctx);

  // Sort things by Y for depth
  const drawables=[
    ...BUILDINGS.map(b=>({type:'bld',b,sortY:(b.ty+b.th)*_T})),
    ...agentState.map(a=>({type:'agent',a,sortY:a.py}))
  ].sort((a,b)=>a.sortY-b.sortY);

  drawables.forEach(d=>{
    if (d.type==='bld') {
      const alerts = alertMap[d.b.id] || 0;
      drawBuilding(ctx,d.b,d.b.id===selectedRoom,alerts);
    } else {
      const a=d.a;
      const dx=a.tx-a.px, dy=a.ty-a.py;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if (dist>2) { a.px+=dx/dist*1.2; a.py+=dy/dist*1.2; }
      else if (a.waitTick-->0) { /* wait */ }
      else { const [nx,ny]=nextWaypoint(a); a.tx=nx+Math.random()*20-10; a.ty=ny+Math.random()*20-10; a.waitTick=120+Math.random()*180; }
      drawSprite(ctx, a.px, a.py, a, dist>4 ? frame : 0);

      // Draw carry item above agent's head
      if (a.carry) {
        ctx.save();
        const bobY = Math.sin(frame * 2 + a.px * 0.1) * 2; // gentle float
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(a.carry, a.px, a.py - 22 + bobY);
        if (a.carryLabel) {
          ctx.shadowBlur = 0;
          ctx.font = 'bold 7px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#2d2118';
          ctx.lineWidth = 2;
          ctx.strokeText(a.carryLabel, a.px, a.py - 10 + bobY);
          ctx.fillText(a.carryLabel, a.px, a.py - 10 + bobY);
        }
        ctx.restore();

        // Spawn handoff particle when agent arrives at destination
        if (dist < 3 && a._lastHandoffFrame !== Math.floor(frame/60)) {
          a._lastHandoffFrame = Math.floor(frame/60);
          // Use screen coords (before restore) — will be drawn in restore space
          handoffParticles.push({
            x: a.px, y: a.py - 28,
            vy: -0.7, vx: (Math.random()-0.5)*0.8,
            age: 0, maxAge: 70,
            emoji: a.carry, label: a.carryLabel
          });
        }
      }
    }
  });

  ctx.restore();

  // Handoff particles and music notes drawn in world space before restore
  drawHandoffs();

  // Music notes float from the pub in screen space
  spawnNotes();
  drawMusicNotes();

  // Hover cursor — buildings AND sprites (use offset-adjusted coords)
  const hoverAgent = agentState.find(a=>Math.abs(a.px-hoverMx)<14&&Math.abs(a.py-hoverMy)<28);
  canvas.style.cursor = (hoverBld||hoverAgent) ? 'pointer' : 'default';

  requestAnimationFrame(loop);
}

// ── MOUSE HOVER ────────────────────────────────────────────────────────────
let hoverBld = null;
canvas.addEventListener('mousemove', e=>{
  const rect=canvas.getBoundingClientRect();
  const OX=window._worldOX||0, OY=window._worldOY||0;
  hoverMx=e.clientX-rect.left-OX; hoverMy=e.clientY-rect.top-OY;
  hoverBld = getBuildingAt(hoverMx, hoverMy);
});

let hoverMx=0, hoverMy=0;

// ── CLICK → OPEN PANEL ────────────────────────────────────────────────────
canvas.addEventListener('click', e=>{
  const rect=canvas.getBoundingClientRect();
  const OX=window._worldOX||0, OY=window._worldOY||0;
  const mx=e.clientX-rect.left-OX, my=e.clientY-rect.top-OY;
  // Buildings have priority — check first
  const bld=getBuildingAt(mx, my);
  if (bld) {
    if (bld.id === 'marx-kiosk') {
      // Podium click = open Marx's agent profile
      const marxAgent = agentState.find(a=>a.id==='marx');
      if (marxAgent) openAgentProfile(marxAgent);
      return;
    }
    openRoom(bld.id); return;
  }
  // Then check agent sprites
  const agent=agentState.find(a=>Math.abs(a.px-mx)<16&&Math.abs(a.py-my)<32);
  if (agent?.profile) openAgentProfile(agent);
});

function openAgentProfile(agent) {
  const p=agent.profile;
  const statBars=Object.entries(p.stats).map(([k,v])=>`
    <div class="ap-stat">
      <span class="ap-stat-lbl">${k}</span>
      <div class="ap-bar"><div class="ap-fill" style="width:${Math.min(v,99)}%;background:${agent.shirt}"></div></div>
      <span class="ap-stat-val">${v}</span>
    </div>`).join('');
  const duties=p.responsibilities.map(r=>`<li>${r}</li>`).join('');
  document.getElementById('agent-profile-modal').innerHTML=`
    <div class="ap-card">
      <button class="ap-close" onclick="document.getElementById('agent-profile-modal').style.display='none'">✕</button>
      <div class="ap-header" style="border-color:${agent.shirt}">
        <div class="ap-avatar" style="background:${agent.shirt}">${agent.name[0]}</div>
        <div class="ap-meta">
          <div class="ap-name">${p.title}</div>
          <div class="ap-role" style="color:${agent.shirt}">${p.role}</div>
          <div class="ap-class">Lvl ${p.level} ${p.class}</div>
          <div class="ap-based">Based on: <em>${p.based_on}</em></div>
        </div>
      </div>
      <div class="ap-bio">${p.bio}</div>
      <div class="ap-quote">${p.quote}</div>
      <div class="ap-section-title">Stats</div>
      <div class="ap-stats">${statBars}</div>
      <div class="ap-section-title">Responsibilities</div>
      <ul class="ap-duties">${duties}</ul>
      <div class="ap-api">⚡ Powered by: <code>${p.api}</code></div>
    </div>`;
  document.getElementById('agent-profile-modal').style.display='flex';
}
window.openAgentProfile=openAgentProfile;

// ── FLOATING PANELS — anchored near each building ──────────────────────────
const MAX_PANELS = 9; // one per building — natural 3x3 grid
let panelStack = []; // [{roomId, el}]

function getBuildingScreenPos(bld) {
  const T = window.WorldEngine?.T || 32;
  const topbar = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar')) || 44;
  // Right edge of building + small gap
  const rawX = (bld.tx + (bld.tw || 2)) * T + 8;
  // Vertical center of building
  const rawY = bld.ty * T + topbar;
  // Keep within viewport
  const panelW = 300, panelH = 360;
  const x = Math.min(rawX, window.innerWidth - panelW - 8);
  const y = Math.max(topbar + 4, Math.min(rawY, window.innerHeight - panelH - 8));
  return { x, y };
}

function makeDraggable(el) {
  let ox, oy, dragging = false;
  const header = el.querySelector('.pc-header');
  if (!header) return;
  header.style.cursor = 'grab';
  header.addEventListener('mousedown', e => {
    if (e.target.closest('button')) return;
    dragging = true;
    ox = e.clientX - el.offsetLeft;
    oy = e.clientY - el.offsetTop;
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const topbar = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar')) || 44;
    el.style.left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - ox)) + 'px';
    el.style.top  = Math.max(topbar, Math.min(window.innerHeight - el.offsetHeight, e.clientY - oy)) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; header.style.cursor = 'grab'; });
}

async function openRoom(roomId) {
  // Toggle: close if already open
  const existing = panelStack.find(p => p.roomId === roomId);
  if (existing) { closePanel(roomId); return; }

  // Fetch fresh data
  try {
    const [dr, ar] = await Promise.all([fetch('/api/dashboard'), fetch('/api/archives')]);
    dash = await dr.json(); dash._archives = await ar.json();
    updateTopbar(); buildAlertMap();
  } catch {}

  const bld = BUILDINGS.find(b => b.id === roomId);
  if (!bld) return;

  // If at max, close oldest
  if (panelStack.length >= MAX_PANELS) {
    panelStack[panelStack.length - 1].el.remove();
    panelStack.pop();
  }

  // Build floating card
  const card = document.createElement('div');
  card.className = 'panel-card';
  card.dataset.room = roomId;

  const header = document.createElement('div');
  header.className = 'pc-header';
  header.innerHTML = `
    <span class="pc-emoji">${bld.emoji||'★'}</span>
    <div class="pc-titles">
      <div class="pc-title">${bld.label}</div>
      <div class="pc-code">${bld.code||''}</div>
    </div>
    <button class="pc-close" onclick="closePanel('${roomId}')">✕</button>`;

  const cardBody = document.createElement('div');
  cardBody.className = 'pc-body';

  card.appendChild(header);
  card.appendChild(cardBody);

  // Position near the building
  const { x, y } = getBuildingScreenPos(bld);
  card.style.left = x + 'px';
  card.style.top  = y + 'px';

  document.getElementById('panel-stack').appendChild(card);
  panelStack.unshift({ roomId, el: card });
  selectedRoom = roomId;

  makeDraggable(card);
  renderPanel(roomId, dash, cardBody);
}

function closePanel(roomId) {
  const idx = panelStack.findIndex(p => p.roomId === roomId);
  if (idx === -1) return;
  panelStack[idx].el.remove();
  panelStack.splice(idx, 1);
  if (selectedRoom === roomId) selectedRoom = panelStack[0]?.roomId || null;
}
window.closePanel = closePanel;


// ── DATA LOAD ────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const [dr,ar,ds]=await Promise.all([
      fetch('/api/dashboard'),
      fetch('/api/archives'),
      fetch('/api/daemon/status').catch(()=>({json:()=>({running:false})}))
    ]);
    dash=await dr.json(); dash._archives=await ar.json();
    const daemonStatus = await ds.json().catch(()=>({running:false}));
    window._daemonStopped = !daemonStatus.running;
    setOnline(true); updateTopbar(); buildAlertMap();
    if (selectedRoom) renderPanel(selectedRoom,dash);
  } catch { setOnline(false); window._daemonStopped = true; }
}

function buildAlertMap() {
  const pending = dash.pendingApprovals||[];
  const logs = dash.recentLogs||[];
  const errorLogs = logs.filter(l=>l.status==='error');
  alertMap = {};
  // Map log agent names to building IDs
  const agentToBld = {research:'research',aurora:'research',frida:'design',
    engels:'treasury',harriet:'store',clara:'warroom',emma:'comms',alex:'archives',marx:'marx'};
  // Map agent IDs to log names for pub routing
  const agentToLog = {aurora:'aurora',frida:'frida',engels:'engels',
    harriet:'harriet',clara:'clara',emma:'emma',alexandria:'alex',rosa:'rosa'};

  if (pending.length) { alertMap.design = pending.length; alertMap.marx = pending.length; }
  if (errorLogs.length) {
    errorLogs.forEach(l=>{ const bId=agentToBld[l.agent?.toLowerCase()]; if(bId) alertMap[bId]=(alertMap[bId]||0)+1; });
  }

  // Auto-pub routing: agents go to the inn ONLY if they have a logged error
  // in the last 2 hours. Daemon being stopped ≠ error — they stay at buildings.
  // (Daemon stopped just shows the Offline dot in the topbar)
  const newErrors = {};
  const recent2h = Date.now() - 2*60*60*1000;
  const recentErrors = errorLogs.filter(l => new Date(l.created_at||0).getTime() > recent2h);
  for (const [agentId, logName] of Object.entries(agentToLog)) {
    const hasError = recentErrors.some(l => l.agent?.toLowerCase() === logName);
    if (hasError) newErrors[agentId] = true;
  }
  window._agentErrors = newErrors;
}

function setOnline(on) {
  const d=document.getElementById('sdot'),l=document.getElementById('slbl');
  if(d)d.className='sdot'+(on?' online':''); if(l)l.textContent=on?'Online':'Offline';
}
function updateTopbar() {
  const f=dash.financial||{},r=f.revenue||{};
  // TODAY revenue
  setText('m-today','$'+fmt(r.today || 0));
  // MONTH revenue
  setText('m-month','$'+fmt(r.thisMonth||0));
  // RENT coverage %
  setText('m-rent',(f.rentPct||0)+'%');
  const fill=document.getElementById('rent-bar-fill');
  if(fill){
    fill.style.width=Math.min(f.rentPct||0,100)+'%';
    fill.title = `$${fmt(r.thisMonth||0)} of $${fmt(f.rentTarget||1600)} goal`;
  }
  // LIVE = unique designs listed (deduplicated by niche)
  const listedProducts = dash.products?.listed || [];
  const uniqueNiches = listedProducts.length
    ? new Set(listedProducts.map(p => p.niche)).size
    : (f.listedProducts || dash.products?.byStatus?.listed || 0);
  const liveEl = document.getElementById('m-live');
  if(liveEl){
    liveEl.textContent = uniqueNiches;
    liveEl.title = `${f.listedProducts||0} total listings, ${uniqueNiches} unique designs`;
  }
  // APPROVALS queue
  const qEl = document.getElementById('m-queue');
  const qCount = dash.pendingApprovals?.length||0;
  if(qEl){ qEl.textContent=qCount; qEl.style.color = qCount>0 ? 'var(--rose)' : 'var(--lavender)'; }
  // ROI
  setText('m-roi',(f.roi||'0.0')+'%');
  // INVESTED — sum of all startup_costs from live DB
  const invested = typeof f.startupCosts === 'number' ? f.startupCosts : 0;
  setText('m-invested','$'+invested.toFixed(0));
}

// ── CLOCK ──────────────────────────────────────────────────────────────────
function clock(){const e=document.getElementById('clock');setInterval(()=>{if(e)e.textContent=new Date().toLocaleTimeString('en-US',{hour12:true});},1000);}

// ── ARCHIVE OVERLAY ────────────────────────────────────────────────────────
function openArchiveOverlay(){document.getElementById('archive-overlay').style.display='flex';loadGraph(null);}
document.getElementById('ao-close')?.addEventListener('click',()=>{document.getElementById('archive-overlay').style.display='none';});
document.getElementById('ao-add')?.addEventListener('click',()=>{document.getElementById('archive-modal').style.display='flex';});
document.getElementById('ao-add-sb')?.addEventListener('click',()=>{document.getElementById('archive-modal').style.display='flex';});
document.getElementById('archive-tabs')?.querySelectorAll('.otab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.otab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    loadGraph(btn.dataset.cat||null);
  });
});
async function loadGraph(cat){
  try{const data=await fetch(cat?`/api/archives?category=${cat}`:'/api/archives').then(r=>r.json());renderGraph(data);}catch{}
}
function renderGraph(archives){
  const c=document.getElementById('ao-graph'); c.innerHTML='';
  const w=c.clientWidth,h=c.clientHeight; if(!w||!h)return;
  const colors={rule:'#e8637a',preference:'#9b7ec8',feedback:'#c9963a',note:'#5aaa7e'};
  const nodes=[{id:'★',type:'center',r:18},...archives.map(a=>({id:'n'+a.id,type:a.category,r:9,data:a}))];
  const links=archives.map(a=>({source:'★',target:'n'+a.id}));
  const svg=d3.select('#ao-graph').append('svg').attr('width',w).attr('height',h);
  const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(120))
    .force('charge',d3.forceManyBody().strength(-80)).force('center',d3.forceCenter(w/2,h/2))
    .force('collision',d3.forceCollide(d=>d.r+10));
  const link=svg.append('g').selectAll('line').data(links).join('line').attr('stroke','rgba(201,150,58,0.2)').attr('stroke-width',1.5);
  const node=svg.append('g').selectAll('g').data(nodes).join('g').style('cursor','pointer')
    .call(d3.drag().on('start',(e,d)=>{if(!e.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;})
      .on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}))
    .on('click',(e,d)=>{if(d.data){document.getElementById('ao-node-title').textContent=d.data.category?.toUpperCase();document.getElementById('ao-node-content').textContent=d.data.content;document.getElementById('ao-stats').textContent='Source: '+d.data.source+' · '+new Date(d.data.created_at).toLocaleDateString()+(d.data.tags?' · '+d.data.tags:'');}});
  node.append('circle').attr('r',d=>d.r).attr('fill',d=>(colors[d.type]||'#e8637a')+'22').attr('stroke',d=>colors[d.type]||'#e8637a').attr('stroke-width',2);
  node.filter(d=>d.type==='center').append('text').attr('text-anchor','middle').attr('dy','0.35em').attr('fill','#e8637a').attr('font-size','16px').text('★');
  sim.on('tick',()=>{link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);node.attr('transform',d=>`translate(${d.x},${d.y})`);});
}

// ── ARCHIVE MODAL ──────────────────────────────────────────────────────────
document.getElementById('am-close')?.addEventListener('click',closeModal);
document.getElementById('am-cancel')?.addEventListener('click',closeModal);
document.getElementById('am-save')?.addEventListener('click',async()=>{
  const cat=document.getElementById('am-cat').value,content=document.getElementById('am-content').value.trim(),tags=document.getElementById('am-tags').value.trim();
  if(!content){toast('Content required','error');return;}
  try{await fetch('/api/archives',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:cat,content,source:'jamie',tags})});toast('Saved ★','success');closeModal();loadAll();}catch{toast('Save failed','error');}
});
function closeModal(){document.getElementById('archive-modal').style.display='none';document.getElementById('am-content').value='';}

// ── AGENTS ─────────────────────────────────────────────────────────────────
async function runAgent(ep){
  const btn = event?.target;
  if(btn){btn.disabled=true;btn.textContent='⟳ Running…';}
  toast('Starting '+ep+'…','info');
  try{
    const r=await fetch('/api/run/'+ep,{method:'POST'});
    if(r.ok){toast('Complete ✓','success');loadAll();}
    else toast('Error — check server logs','error');
  } catch{toast('Network error','error');}
  finally{if(btn){btn.disabled=false;}}
}
async function quickResolve(id,status){
  try{await fetch('/api/approvals/'+id+'/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,feedback:''})});toast('Design '+status,'success');loadAll();}catch{toast('Error','error');}
}
function openRevenueEntry(){
  const amount=prompt('Gross sale ($):'); if(!amount||isNaN(parseFloat(amount)))return;
  const platform=prompt('Platform (etsy/fiverr):')||'etsy';
  fetch('/api/revenue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform,gross_revenue_usd:parseFloat(amount),platform_fee_usd:parseFloat(amount)*.065,production_cost_usd:0})}).then(()=>{toast('Sale logged ✓','success');loadAll();});
}

// ── PLAID BANK CONNECTION ───────────────────────────────────────────────────
async function launchPlaidLink() {
  toast('Connecting to Plaid…','info');
  try {
    const r = await fetch('/api/plaid/link-token', { method:'POST' });
    const { link_token, error } = await r.json();
    if (error) { toast('Plaid error: '+error,'error'); return; }
    const handler = Plaid.create({
      token: link_token,
      onSuccess: async (public_token, metadata) => {
        const institution = metadata.institution?.name || 'bank';
        const ex = await fetch('/api/plaid/exchange-token', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ public_token, institution })
        });
        const result = await ex.json();
        if (result.success) {
          toast('✓ '+institution+' connected!','success');
          loadPlaidStatus();
        } else {
          toast('Exchange failed: '+result.error,'error');
        }
      },
      onExit: (err) => { if (err) toast('Plaid: '+err.display_message,'error'); }
    });
    handler.open();
  } catch(e) { toast('Plaid launch failed: '+e.message,'error'); }
}

async function loadPlaidStatus() {
  const el = document.getElementById('plaid-status-body');
  if (!el) return;
  try {
    const r = await fetch('/api/plaid/status');
    const { connected, env, hasKeys } = await r.json();
    if (!hasKeys) {
      el.innerHTML = '<span style="color:#e8637a">No Plaid keys in .env — see MANIFESTO.md</span>';
      return;
    }
    if (!connected.length) {
      el.innerHTML = `<span style="color:#c9963a">Mode: ${env} · No banks connected yet.</span><br><small style="color:var(--ink-dim)">Click Connect Bank below to link Wells Fargo or other accounts.</small>`;
    } else {
      el.innerHTML = connected.map(b =>
        `<div class="dp-row"><span class="dp-row-label">✓ ${b.institution}</span><span class="dp-row-val" style="color:#5aaa7e">Connected</span></div>`
      ).join('') + `<div style="font-size:10px;color:var(--ink-dim);margin-top:4px">Mode: ${env}</div>`;
    }
  } catch { el.textContent = 'Could not reach Plaid API'; }
}

// ── PRIVACY MODE ────────────────────────────────────────────────────────────────
let _privacyOn=localStorage.getItem('privacy')==='1';
function togglePrivacy(){
  _privacyOn=!_privacyOn;
  localStorage.setItem('privacy',_privacyOn?'1':'0');
  const kpis=document.querySelector('.topbar-kpis');
  const btn=document.getElementById('privacy-toggle');
  if(kpis) kpis.style.visibility=_privacyOn?'hidden':'visible';
  if(btn) btn.textContent=_privacyOn?'👁 Hidden':'👁 Visible';
}
if(_privacyOn){
  const k=document.querySelector('.topbar-kpis');
  if(k) k.style.visibility='hidden';
  const b=document.getElementById('privacy-toggle');
  if(b) b.textContent='👁 Hidden';
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function toast(msg,type='info'){const e=document.createElement('div');e.className=`toast ${type}`;e.textContent=msg;document.getElementById('toast-wrap').appendChild(e);setTimeout(()=>e.remove(),3500);}

// ── BOOT ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', resize);
window.runAgent=runAgent; window.quickResolve=quickResolve; window.openRevenueEntry=openRevenueEntry; window.openArchiveOverlay=openArchiveOverlay;

setTimeout(() => { resize(); buildTerrain(); initAgents(); clock(); loadAll(); setInterval(loadAll,30000); loop(); startQuotes(); }, 80);

// ── REVOLUTIONARY QUOTES (Marxist / Leninist / Black Liberation / BLM) ──
const QUOTES = [
  ['“Workers of the world, unite!”', 'Marx & Engels — Communist Manifesto, 1848'],
  ['“From each according to ability, to each according to need.”', 'Marx — Critique of the Gotha Programme'],
  ['“The history of all hitherto existing society is the history of class struggles.”', 'Marx & Engels'],
  ['“The philosophers have only interpreted the world. The point is to change it.”', 'Marx — Theses on Feuerbach'],
  ['“Capital is dead labor that, vampire-like, lives only by sucking living labor.”', 'Marx — Capital, Vol. 1'],
  ['“Let the ruling classes tremble. The workers have nothing to lose but their chains.”', 'Marx & Engels'],
  ['“Without revolutionary theory there can be no revolutionary movement.”', 'Lenin'],
  ['“There are decades where nothing happens; and there are weeks where decades happen.”', 'Lenin'],
  ['“The goal of socialism is communism.”', 'Lenin'],
  ['“Those who do not move, do not notice their chains.”', 'Rosa Luxemburg'],
  ['“Freedom is always the freedom of the one who thinks differently.”', 'Rosa Luxemburg'],
  ['“You fight racism with solidarity.”', 'Fred Hampton — Black Panther Party'],
  ['“We don’t fight fire with fire. We fight fire with water best.”', 'Fred Hampton — Black Panther Party'],
  ['“I am a revolutionary.”', 'Fred Hampton — Black Panther Party'],
  ['“It is our duty to fight for our freedom. It is our duty to win.”', 'Assata Shakur'],
  ['“Nobody has ever gotten their freedom by appealing to the moral sense of the people who were oppressing them.”', 'Assata Shakur'],
  ['“If you’re not careful, the newspapers will have you hating the oppressed and loving the oppressors.”', 'Malcolm X'],
  ['“Power never takes a back step — only in the face of more power.”', 'Malcolm X'],
  ['“You can’t separate peace from freedom.”', 'Malcolm X'],
  ['“Radical simply means grasping things at the root.”', 'Angela Davis'],
  ['“You have to act as if it were possible to radically transform the world.”', 'Angela Davis'],
  ['“I am no longer accepting the things I cannot change. I am changing the things I cannot accept.”', 'Angela Davis'],
  ['“I am not free while any woman is unfree, even when her bonds are very different from my own.”', 'Audre Lorde'],
  ['“Your silence will not protect you.”', 'Audre Lorde'],
  ['“If there is no struggle, there is no progress.”', 'Frederick Douglass'],
  ['“Power concedes nothing without a demand. It never did and it never will.”', 'Frederick Douglass'],
  ['“While there is a lower class, I am in it. While there is a soul in prison, I am not free.”', 'Eugene Debs'],
  ['“If I can’t dance, I don’t want to be in your revolution.”', 'Emma Goldman'],
  ['“Only in fighting together will women find the strength to win their freedom.”', 'Clara Zetkin'],
  ['“I freed a thousand slaves. I could have freed a thousand more if only they knew they were slaves.”', 'Harriet Tubman'],
  ['“Black lives matter.”', 'Alicia Garza, Patrisse Cullors, Opal Tometi — 2013'],
  ['“Until all of us are free, none of us are free.”', 'Black liberation movement'],
  ['“Art is not a mirror to reflect reality, but a hammer with which to shape it.”', 'Mayakovsky'],
];
function startQuotes() {
  const el = document.getElementById('topbar-quote');
  if (!el) return;
  let idx = Math.floor(Math.random() * QUOTES.length);
  function show() {
    const [q, attr] = QUOTES[idx % QUOTES.length];
    el.classList.add('fade');
    setTimeout(() => { el.textContent = q + ' — ' + attr; el.classList.remove('fade'); }, 800);
    idx = (idx + 1) % QUOTES.length;
  }
  show();
  setInterval(show, 25000);
}