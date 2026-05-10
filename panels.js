/* panels.js — Slide-out panel content for each room */
function fmt(n){return(parseFloat(n)||0).toFixed(2);}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}

function renderPanel(roomId, dash, targetEl) {
  // targetEl = the panel card body div; falls back to #dp-body for legacy use
  const body = targetEl || document.getElementById('dp-body');
  if (!body) return;
  const f = dash.financial||{}, r=f.revenue||{}, bs=dash.products?.byStatus||{};
  const pending = dash.pendingApprovals||[], archives=dash._archives||[], wr=dash.lastWarRoom;
  const pct = f.rentPct||0, circ=201;

  const advice = getAdvice(dash);

  // Sales velocity — revenue per day over last 7 days
  const weekRev = parseFloat(r.thisWeek || 0);
  const dayRev = (weekRev / 7).toFixed(2);
  const avgMargin = 16.49; // $24.99 price - $8.50 POD cost
  const rent = parseFloat(f.monthlyExpenses || 1600);
  const daysToBreakEven = weekRev > 0 ? Math.ceil(rent / (weekRev / 7)) : '∞';

  const panels = {
    marx:`
      <div class="dp-section">
        <div class="dp-sect-title">Revenue Velocity</div>
        <div class="stat-chips">
          <div class="stat-chip"><span class="sc-num" style="color:#5aaa7e">$${dayRev}</span><span class="sc-lbl">Per Day</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#e8637a">${pending.length}</span><span class="sc-lbl">Approvals</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#4aa8d8">${bs.listed||0}</span><span class="sc-lbl">Live</span></div>
        </div>
        <div style="font-size:10px;color:var(--ink-dim);margin-top:2px">Break-even in <strong style="color:var(--gold)">${daysToBreakEven} days</strong> at current pace · need $${fmt(avgMargin)}/sale margin</div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Last War Room</div>
        <div class="dp-briefing">${wr?new Date(wr.created_at).toLocaleDateString()+' — '+(wr.summary||'').slice(0,80)+'…':'No sessions yet. Run a Morning Briefing to get started.'}</div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Marx Says</div>
        ${advice}
      </div>
      <div class="dp-actions">
        <button class="map-btn" onclick="runAgent('morning-briefing')">☀ Morning Briefing</button>
        <button class="map-btn" onclick="runAgent('war-room')">★ Convene Town Hall</button>
        <button class="map-btn" onclick="runAgent('weekly-report')">📊 Weekly P&L</button>
        <button class="map-btn" onclick="launchDaemon()" id="daemon-btn">⚡ Launch Daemon</button>
      </div>`,

    research:`
      <div class="dp-section">
        <div class="dp-sect-title">Aurora — Vanguard Scout</div>
        <div class="stat-chips">
          <div class="stat-chip"><span class="sc-num" style="color:#4aa8d8" id="niche-count">…</span><span class="sc-lbl">Niches Found</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#5aaa7e" id="niche-low-comp">…</span><span class="sc-lbl">Low Competition</span></div>
        </div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Top Niches (Aurora's Latest)</div>
        <div class="mini-list" id="research-mini">
          <div class="mini-item" style="color:var(--ink-dim)">Loading Aurora's research…</div>
        </div>
      </div>
      <div class="dp-section" id="niche-detail-section" style="display:none">
        <div class="dp-sect-title" id="niche-detail-title"></div>
        <div id="niche-detail-body" style="font-size:11px;color:var(--ink-dim);line-height:1.6"></div>
      </div>
      <div class="dp-actions">
        <button class="map-btn" onclick="runAgent('research')">🔍 Run Research Cycle</button>
      </div>`,

    design:`
      <div class="dp-section">
        <div class="dp-sect-title">Frida — The Atelier</div>
        <div class="stat-chips">
          <div class="stat-chip"><span class="sc-num" style="color:#9b7ec8">${bs.designing||0}</span><span class="sc-lbl">Designing</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#c9963a">${pending.length}</span><span class="sc-lbl">Review</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#5aaa7e">${bs.approved||0}</span><span class="sc-lbl">Approved</span></div>
        </div>
      </div>
      ${pending.length>0?`
      <div class="dp-section">
        <div class="dp-sect-title">⚠ Awaiting Your Approval</div>
        ${pending.slice(0,3).map(a=>{const p=JSON.parse(a.payload||'{}');return`
        <div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">${p.title||'Untitled design'}</div>
          <div style="display:flex;gap:5px">
            <button class="map-btn" style="padding:5px 8px;font-size:11px" onclick="quickResolve(${a.id},'approved')">✓ Approve</button>
            <button class="map-btn" style="padding:5px 8px;font-size:11px" onclick="quickResolve(${a.id},'rejected')">✕ Reject</button>
          </div></div>`;}).join('')}
      </div>`:''}`,

    treasury:`
      <div class="dp-section">
        <div class="dp-sect-title">Engels — Finance & Ledger</div>
        <div class="ring-wrap">
          <div class="ring-svg-wrap">
            <svg viewBox="0 0 80 80">
              <circle class="rtrack" cx="40" cy="40" r="32"/>
              <circle class="rfill rfill-gold" cx="40" cy="40" r="32" stroke-dasharray="${(pct/100)*circ} ${circ}"/>
            </svg>
            <div class="ring-center"><span class="ring-pct">${pct}%</span><span class="ring-sub">rent</span></div>
          </div>
          <div class="ring-stats">
            <div class="dp-row"><span class="dp-row-label">Week</span><span class="dp-row-val" style="color:#c9963a">$${fmt(r.thisWeek)}</span></div>
            <div class="dp-row"><span class="dp-row-label">Month</span><span class="dp-row-val" style="color:#e8637a">$${fmt(r.thisMonth)}</span></div>
            <div class="dp-row"><span class="dp-row-label">All Time</span><span class="dp-row-val">$${fmt(r.allTime)}</span></div>
            <div class="dp-row"><span class="dp-row-label">Surplus</span><span class="dp-row-val" style="color:#5aaa7e">$${fmt(f.missionSurplus)}</span></div>
            <div class="dp-row"><span class="dp-row-label">Invested</span><span class="dp-row-val" style="color:#e8834a">$${fmt(f.startupCosts)}</span></div>
          </div>
        </div>
      </div>
      <div class="dp-section" id="mission-report-section">
        <div class="dp-sect-title">Mission Coverage — Engels' Report</div>
        <div id="mission-report-body" style="color:var(--ink-dim);font-size:11px">Loading Engels' report…</div>
      </div>
      <div class="dp-section" id="plaid-status-section">
        <div class="dp-sect-title">🏦 Bank Connection (Plaid)</div>
        <div id="plaid-status-body" style="color:var(--ink-dim);font-size:11px">Checking…</div>
      </div>
      <div class="dp-section" id="daemon-status-section">
        <div class="dp-sect-title">⚡ Daemon Status</div>
        <div id="daemon-status-body" style="color:var(--ink-dim);font-size:11px">Checking…</div>
      </div>
      <div class="dp-actions">
        <button class="map-btn" onclick="runAgent('weekly-report')">📊 P&L Report</button>
        <button class="map-btn" onclick="openRevenueEntry()">+ Log Sale</button>
        <button class="map-btn" style="background:#2a5a3a;color:#7ef0a0" onclick="launchPlaidLink()">🏦 Connect Bank</button>
      </div>`,

    store:`
      <div class="dp-section">
        <div class="dp-sect-title">Harriet — The Co-op</div>
        <div class="stat-chips">
          <div class="stat-chip"><span class="sc-num" style="color:#d85aaa" id="store-live-count">${bs.listed||0}</span><span class="sc-lbl">Live</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#c9963a" id="store-ready-count">${bs.ready||0}</span><span class="sc-lbl">Ready to List</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#9b7ec8" id="store-designed-count">${bs.designed||0}</span><span class="sc-lbl">Designed</span></div>
        </div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Platform Status</div>
        <div class="channel-rows" id="platform-status-rows">
          <div class="channel-row"><span style="font-size:14px">🔄</span><span class="ch-name">Loading…</span></div>
        </div>
      </div>
      <div class="dp-actions">
        <a class="map-btn" href="https://etsy.com/developers" target="_blank">→ Approve Etsy App</a>
        <a class="map-btn" href="https://seller.tiktok.com" target="_blank">→ TikTok Shop Keys</a>
        <a class="map-btn" href="https://printify.com" target="_blank">→ Printify</a>
      </div>`,

    comms:`
      <div class="dp-section">
        <div class="dp-sect-title">Emma — The Press</div>
        <div class="channel-rows">
          <div class="channel-row"><span style="font-size:14px">🔔</span><span class="ch-name">Discord</span><span style="font-size:9px;font-weight:700;color:#5aaa7e">LIVE</span></div>
          <div class="channel-row"><span style="font-size:14px">✉</span><span class="ch-name">Gmail (marxsworkshop)</span><span style="font-size:9px;font-weight:700;color:#5aaa7e">WATCHING</span></div>
          <div class="channel-row"><span style="font-size:14px">♪</span><span class="ch-name">TikTok</span><span style="font-size:9px;font-weight:700;color:#c9963a">PENDING</span></div>
          <div class="channel-row"><span style="font-size:14px">▶</span><span class="ch-name">YouTube</span><span style="font-size:9px;font-weight:700;color:#c9963a">PENDING</span></div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--ink-dim);line-height:1.6">📬 Emma is watching for Etsy orders, payment alerts, and customer messages every 5 min.</div>`,

    archives:`
      <div class="dp-section">
        <div class="dp-sect-title">Alex — The Library</div>
        <div class="stat-chips">
          <div class="stat-chip"><span class="sc-num" style="color:#4aa8d8" id="lib-total">…</span><span class="sc-lbl">Total Records</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#e8637a" id="lib-niches">…</span><span class="sc-lbl">Niches</span></div>
          <div class="stat-chip"><span class="sc-num" style="color:#9b7ec8" id="lib-designs">…</span><span class="sc-lbl">Designs</span></div>
        </div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Recent Archives</div>
        <div class="mini-list" id="lib-recent"><div class="mini-item" style="color:var(--ink-dim)">Loading…</div></div>
      </div>
      <div class="dp-actions">
        <button class="map-btn" onclick="openArchiveOverlay()">📜 Open Full Graph</button>
        <button class="map-btn" onclick="document.getElementById('archive-modal').style.display='flex'">+ Add Note</button>
      </div>`,

    warroom:`
      <div class="dp-section">
        <div class="dp-sect-title">Clara — Town Hall Scheduler</div>
        <div class="sched-list">
          <div class="sched-row"><span>🌅</span><span class="sched-lbl">Daily Cycle</span><span class="sched-time">9:00 AM</span><span class="chip-on">ON</span></div>
          <div class="sched-row"><span>📅</span><span class="sched-lbl">Weekly Review</span><span class="sched-time">Mon 8 AM</span><span class="chip-next">NEXT</span></div>
          <div class="sched-row"><span>🔍</span><span class="sched-lbl">Etsy Approval Check</span><span class="sched-time">Daily</span><span class="chip-on">ON</span></div>
        </div>
      </div>
      ${wr?`<div class="dp-section"><div class="dp-sect-title">Last Session</div><div class="dp-briefing">${(wr.summary||'Session recorded').slice(0,120)}</div></div>`:''}
      <div class="dp-actions"><button class="map-btn" onclick="runAgent('war-room')">★ Convene Now</button></div>`,

    pub:`
      <div class="dp-section">
        <div class="dp-sect-title">🍺 Red Flag Inn — Off-Hours Tavern</div>
        <div class="dp-briefing">${window.WorldEngine.isOffHours()?'The crew is here now — it\'s after hours. The machines rest, the comrades drink.':'The inn is quiet — everyone is at work. Opens at 10 PM.'}</div>
      </div>
      <div class="dp-section">
        <div class="dp-sect-title">Recent Activity</div>
        <div class="mini-list" id="pub-log-list">
          ${(dash.recentLogs||[]).slice(0,6).map(l=>`<div class="mini-item"><span>${l.agent}</span><span class="mini-score" style="color:${l.status==='error'?'#e8637a':'#5aaa7e'}">${(l.message||'').slice(0,30)}</span></div>`).join('') || '<div class="mini-item" style="color:var(--ink-dim)">No logs yet</div>'}
        </div>
      </div>`,
  };

  body.innerHTML = panels[roomId] || `<p class="dp-hint">Loading…</p>`;

  if (roomId === 'research') loadNiches();
  if (roomId === 'treasury') { loadMissionReport(); loadPlaidStatus(); loadDaemonStatus(); }
  if (roomId === 'store')    loadStoreStatus();
  if (roomId === 'archives') loadLibraryData();
}

function getAdvice(dash) {
  const f = dash.financial||{}, r=f.revenue||{}, bs=dash.products?.byStatus||{};
  const pending = dash.pendingApprovals||[];
  const pct = f.rentPct||0;
  const listed = bs.listed || 0;
  const avgMargin = 16.49;
  const rent = parseFloat(f.monthlyExpenses || 1600);
  const salesNeeded = Math.ceil(rent / avgMargin);
  let msg, color='#9b7ec8';

  if (pending.length > 2) {
    msg = `⚠ ${pending.length} designs await your approval. Approve now — every unreviewed design is lost revenue. Takes 10 seconds.`; color='#e8637a';
  } else if (pct === 0 && listed === 0) {
    msg = `★ Pipeline ready, market quiet. Connect Etsy at etsy.com/developers — or run the daemon to push products to TikTok Shop immediately.`; color='#c9963a';
  } else if (listed > 0 && pct < 10) {
    msg = `${listed} product${listed>1?'s':''} live — but no sales yet. Check TikTok Shop visibility. Try lower prices (test at $19.99) and add all 13 tags on Etsy listings.`; color='#c9963a';
  } else if (pct < 25) {
    msg = `Thin margins. Need ${salesNeeded} sales/month ($${avgMargin.toFixed(2)} margin each). Scale listings — Etsy discovery compounds with volume. Target 5+ new listings/week.`;
  } else if (pct < 75) {
    msg = `${pct}% to rent. On track. Keep the daemon running 24/7 and approve niches fast. At this pace, you need ${Math.ceil((100-pct)/100*rent/avgMargin)} more sales.`; color='#5aaa7e';
  } else {
    msg = `★ Almost there — ${100-pct}% left (~${Math.ceil((100-pct)/100*rent/avgMargin)} sales). Consider adding phone cases and tote bags — higher AOV than mugs.`; color='#5aaa7e';
  }

  return `<div class="advice-box"><div class="advice-label">★ Marx's Analysis</div><div class="advice-text" style="color:${color}">${msg}</div></div>`;
}

async function loadMissionReport() {
  const el = document.getElementById('mission-report-body');
  if (!el) return;
  try {
    const report = await fetch('/api/finance/mission-report').then(r=>r.json());
    const pct = report.missionCoverage||0;
    const color = pct>=100?'#5aaa7e':pct>=50?'#c9963a':'#e8637a';
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:5px">
        <div class="dp-row"><span class="dp-row-label">Mission Coverage</span><span class="dp-row-val" style="color:${color}">${pct}%</span></div>
        <div class="dp-row"><span class="dp-row-label">Monthly Gap</span><span class="dp-row-val" style="color:#e8637a">-$${fmt(report.remainingGap)}</span></div>
        <div class="dp-row"><span class="dp-row-label">Est. Expenses</span><span class="dp-row-val">$${fmt(report.monthlyExpenses)}</span></div>
        ${report.hasWellsFargoData?'':'<div style="font-size:10px;color:var(--ink-dim);margin-top:4px">📌 Drop a Wells Fargo CSV in /uploads/ for real data</div>'}
      </div>`;
  } catch {
    if(el) el.textContent = '⚠ Finance API not yet running — will show after first daily cycle';
  }
}

async function loadNiches() {
  try {
    // Fetch from daemon's JSON file (always fresh)
    const niches = await fetch('/api/niches').then(r=>r.json()).catch(()=>[]);
    const el = document.getElementById('research-mini');
    const countEl = document.getElementById('niche-count');
    const lowEl = document.getElementById('niche-low-comp');
    if (countEl) countEl.textContent = niches.length || 0;
    if (lowEl) lowEl.textContent = niches.filter(n=>n.competition==='low').length || 0;
    if (el) {
      if (niches.length) {
        el.innerHTML = niches.map(n=>`
          <div class="mini-item" style="cursor:pointer" onclick="showNicheDetail(${JSON.stringify(n).replace(/"/g,'&quot;')})">
            <span>${n.niche}</span>
            <span class="mini-score" style="color:${n.competition==='low'?'#5aaa7e':n.competition==='medium'?'#c9963a':'#e8637a'}">${n.trend_score}★ $${n.estimated_monthly_revenue}/mo</span>
          </div>`).join('');
      } else {
        el.innerHTML = '<div class="mini-item" style="color:var(--ink-dim)">No niches yet — daemon running every 6h</div>';
      }
    }
  } catch(e) { console.error('loadNiches:', e); }
}

function showNicheDetail(n) {
  const sec = document.getElementById('niche-detail-section');
  const title = document.getElementById('niche-detail-title');
  const body = document.getElementById('niche-detail-body');
  if (!sec || !title || !body) return;
  title.textContent = n.niche;
  body.innerHTML = `
    <div class="dp-row"><span class="dp-row-label">Why</span><span class="dp-row-val" style="font-size:10px;text-align:right;max-width:160px">${n.why||''}</span></div>
    <div class="dp-row"><span class="dp-row-label">Products</span><span class="dp-row-val" style="font-size:10px">${(n.products||[]).join(', ')}</span></div>
    <div class="dp-row"><span class="dp-row-label">Competition</span><span class="dp-row-val" style="color:${n.competition==='low'?'#5aaa7e':'#c9963a'}">${n.competition}</span></div>
    <div class="dp-row"><span class="dp-row-label">Est. Revenue</span><span class="dp-row-val" style="color:#5aaa7e">$${n.estimated_monthly_revenue}/mo</span></div>
    <div style="margin-top:6px;font-size:10px;color:var(--ink-dim)"><strong>Keywords:</strong> ${(n.keywords||[]).join(', ')}</div>`;
  sec.style.display = 'block';
}

async function loadStoreStatus() {
  try {
    const s = await fetch('/api/status').then(r=>r.json());
    const el = document.getElementById('platform-status-rows');
    if (!el) return;
    const badge = (ok, label) => `<span style="font-size:9px;font-weight:700;color:${ok?'#5aaa7e':'#c9963a'}">${label}</span>`;
    el.innerHTML = [
      `<div class="channel-row"><span style="font-size:14px">🏪</span><span class="ch-name">Etsy</span>${badge(false,'PENDING APPROVAL')}</div>`,
      `<div class="channel-row"><span style="font-size:14px">🎵</span><span class="ch-name">TikTok Shop</span>${badge(s.tiktok?.connected, s.tiktok?.status?.toUpperCase()||'NEEDS KEYS')}</div>`,
      `<div class="channel-row"><span style="font-size:14px">🖨</span><span class="ch-name">Printify</span>${badge(s.printify?.connected, s.printify?.status?.toUpperCase()||'MISSING')}</div>`,
      `<div class="channel-row"><span style="font-size:14px">🔔</span><span class="ch-name">Discord</span>${badge(s.discord?.connected, s.discord?.connected?'LIVE':'MISSING')}</div>`,
      `<div class="channel-row"><span style="font-size:14px">🏦</span><span class="ch-name">Plaid (Bank)</span>${badge(s.plaid?.connected, s.plaid?.status?.toUpperCase()||'MISSING')}</div>`,
    ].join('');
  } catch {}
}

async function loadLibraryData() {
  try {
    const archives = await fetch('/api/archives').then(r=>r.json()).catch(()=>[]);
    const niches   = await fetch('/api/niches').then(r=>r.json()).catch(()=>[]);
    const tEl = document.getElementById('lib-total');
    const nEl = document.getElementById('lib-niches');
    const dEl = document.getElementById('lib-designs');
    if (tEl) tEl.textContent = archives.length + niches.length;
    if (nEl) nEl.textContent = archives.filter(a=>a.category==='niche').length + niches.length;
    if (dEl) dEl.textContent = archives.filter(a=>a.category==='preference').length;
    const recentEl = document.getElementById('lib-recent');
    if (recentEl) {
      const combined = [
        ...niches.map(n=>({ label:`[NICHE] ${n.niche}`, sub:`Score: ${n.trend_score} | $${n.estimated_monthly_revenue}/mo`, color:'#5aaa7e' })),
        ...archives.slice(0,8).map(a=>({ label:`[${(a.category||'note').toUpperCase()}] ${(a.content||'').slice(0,40)}`, sub:a.source||'system', color:'#4aa8d8' }))
      ].slice(0,10);
      recentEl.innerHTML = combined.length
        ? combined.map(c=>`<div class="mini-item"><span style="color:${c.color}">${c.label}</span><span class="mini-score" style="color:var(--ink-dim);font-size:10px">${c.sub}</span></div>`).join('')
        : '<div class="mini-item" style="color:var(--ink-dim)">Library is empty — daemon populates on each run</div>';
    }
  } catch(e) { console.error('loadLibraryData:', e); }
}


async function loadPlaidStatus() {
  try {
    const s = await fetch('/api/status').then(r => r.json());
    const el = document.getElementById('plaid-status-row');
    if (!el) return;
    const connected = s.plaid?.connected;
    el.innerHTML = connected
      ? `<span style="color:#5aaa7e;font-weight:700">✓ Bank connected</span>`
      : `<span style="color:#c9963a">Not connected — click "Connect Bank" below</span>`;
  } catch {}
}

async function loadDaemonStatus() {
  const el = document.getElementById('daemon-status-body');
  if (!el) return;
  try {
    const s = await fetch('/api/daemon/status').then(r => r.json());
    if (s.running) {
      el.innerHTML = `<span style="color:#5aaa7e;font-weight:700">✓ RUNNING</span> &nbsp;·&nbsp; cycle #${s.cycle||'?'} &nbsp;·&nbsp; last ping ${s.minutesAgo}m ago<br><small style="color:var(--ink-dim)">Light tasks: claude-haiku · Heavy tasks: claude-sonnet</small>`;
    } else if (s.lastSeen) {
      el.innerHTML = `<span style="color:#e8637a;font-weight:700">✗ STOPPED</span> &nbsp;·&nbsp; last seen ${s.minutesAgo}m ago<br><small style="color:var(--ink-dim)">Run: <code>node daemon.js</code> to restart</small>`;
    } else {
      el.innerHTML = `<span style="color:#c9963a">Never started</span><br><small style="color:var(--ink-dim)">Run: <code>node daemon.js</code> in the project folder</small>`;
    }
  } catch {
    el.textContent = 'Could not reach daemon status API';
  }
}

async function launchDaemon() {
  const btn = document.getElementById('daemon-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Checking…'; }
  try {
    // Try hitting the daemon status; if daemon is not running, guide user
    const r = await fetch('/api/logs?limit=5');
    if (r.ok) {
      toast('Daemon is running — logs active ✓', 'success');
    } else {
      toast('Run: node daemon.js in the project folder', 'info');
    }
  } catch {
    toast('Server offline — open start-workshop.bat first', 'error');
  }
  if (btn) { btn.disabled = false; btn.textContent = '⚡ Launch Daemon'; }
}

window.renderPanel = renderPanel;
window.fmt = fmt;
window.setText = setText;
window.loadPlaidStatus = loadPlaidStatus;
window.loadNiches = loadNiches;
window.loadStoreStatus = loadStoreStatus;
window.loadLibraryData = loadLibraryData;
window.showNicheDetail = showNicheDetail;
window.launchDaemon = launchDaemon;
window.loadDaemonStatus = loadDaemonStatus;
