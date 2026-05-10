/**
 * world.js — The Commune: Pokemon-style pixel village
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  FUTURE VISIONS — Aesthetic Direction                           ║
 * ║                                                                  ║
 * ║  → SOLARPUNK: Shift the palette from generic greens to warmer   ║
 * ║    amber-greens. Add solar panels on rooftops, climbing vines,  ║
 * ║    rain-catching barrels, community garden beds.                 ║
 * ║                                                                  ║
 * ║  → UTOPIAN: Buildings should feel handmade, not mass-produced.  ║
 * ║    Irregular rooflines, patchwork colors, murals on walls,       ║
 * ║    banners strung between buildings.                             ║
 * ║                                                                  ║
 * ║  → ORGANIC LAYOUT: Replace the grid with a winding central      ║
 * ║    plaza — cobblestones radiating from the well, buildings at    ║
 * ║    slight angles, paths that curve around natural features.      ║
 * ║                                                                  ║
 * ║  → LIVING WORLD: Seasonal events (winter snow, spring blooms),  ║
 * ║    day/night cycle affecting ambient glow, fireflies at dusk,    ║
 * ║    rain animation when Engels reports losses.                    ║
 * ║                                                                  ║
 * ║  → PUB UPGRADE: The Red Flag Inn deserves a proper pub sign,    ║
 * ║    a garden with picnic tables, and an outdoor bonfire.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
(function(){
let T = 32; // dynamically set in resize
const COLS = 36, ROWS = 22;
const TILE = { GRASS:0, GRASS2:1, PATH:2, WATER:4, STONE:6, FLOWER:7 };

const BUILDINGS = [
  { id:'marx',     emoji:'⭐', label:'The Commune',   code:'Central Committee · Marx',   tx:15, ty:7,  tw:4, th:3, roof:'#c0392b', wall:'#f5f0e8', accent:'#8b0000', trim:'#2d1a1a', sign:'COMMUNE HQ', flag:true },
  { id:'research', emoji:'🔭', label:'The Watchtower', code:'Market Recon · Aurora',       tx:2,  ty:2,  tw:3, th:3, roof:'#2471a3', wall:'#d6eaf8', accent:'#1a5276', trim:'#1a3450', sign:'RECON' },
  { id:'design',   emoji:'🎨', label:'The Studio',    code:'Design Works · Frida',        tx:29, ty:2,  tw:4, th:3, roof:'#8e44ad', wall:'#f5eef8', accent:'#6c3483', trim:'#3d1a5e', sign:'STUDIO' },
  { id:'treasury', emoji:'💰', label:'The Treasury',  code:'Finance & Ledger · Engels',   tx:2,  ty:12, tw:4, th:3, roof:'#b7950b', wall:'#fef9e7', accent:'#9a7d0a', trim:'#5d4e0a', sign:'TREASURY' },
  { id:'store',    emoji:'🛍', label:'The Co-op',     code:'Storefronts · Harriet',       tx:29, ty:12, tw:3, th:3, roof:'#1e8449', wall:'#eafaf1', accent:'#186a3b', trim:'#0d3b22', sign:'CO-OP' },
  { id:'warroom',  emoji:'🏛', label:'Town Hall',     code:'Planning & Schedule · Clara', tx:2,  ty:17, tw:3, th:4, roof:'#5d6d7e', wall:'#ecf0f1', accent:'#2c3e50', trim:'#1a252f', sign:'TOWN HALL' },
  { id:'comms',    emoji:'📰', label:'The Press',     code:'Comms & Alerts · Emma',       tx:15, ty:1,  tw:4, th:3, roof:'#e67e22', wall:'#fdf2e9', accent:'#ca6f1e', trim:'#6e2a0c', sign:'THE PRESS' },
  { id:'archives', emoji:'📚', label:'The Library',   code:'Knowledge Graph · Alexandria',tx:29, ty:7,  tw:4, th:4, roof:'#1abc9c', wall:'#e8f8f5', accent:'#148f77', trim:'#0e6655', sign:'LIBRARY' },
  { id:'marx-kiosk', emoji:'⭐', label:"Marx's Podium", code:"Director's Podium · Karl Marx", tx:13, ty:9, tw:2, th:2, type:'kiosk', roof:'#c0392b', wall:'#f5f0e8' },
  { id:'pub',      emoji:'🌐', label:'Web Studio',    code:'Web & SEO · Rosa',             tx:15, ty:17, tw:4, th:3, roof:'#1a6b8a', wall:'#e8f4f8', accent:'#155870', trim:'#0a2a35', sign:'WEB STUDIO' },
  { id:'inn',      emoji:'🍺', label:'★ Red Flag Inn', code:'The Commune Tavern',           tx:29, ty:17, tw:4, th:3, roof:'#922b21', wall:'#f9ebea', accent:'#7b241c', trim:'#4a0e0e', sign:'RED FLAG', flag:true, isPub:true },
];

const AGENTS = [
  { id:'marx', name:'Marx', home:'marx', shirt:'#c0392b', pants:'#2c3e50', skin:'#d4a574', hair:'#2c1810',
    profile:{
      title:'Karl Marx', role:'Supreme Strategist', level:99, class:'Revolutionary Economist',
      based_on:'Karl Marx (1818–1883)',
      bio:'The architect of the commune itself. A restless genius who spent his life in the British Museum writing the blueprint for a better world — and now runs this one. Loves a good dialectic, hates deadlines, will absolutely write a 400-page response to a simple question.',
      stats:{intellect:99, vision:95, charisma:72, punctuality:12},
      responsibilities:['Morning briefings','Strategic direction','War room sessions','Agent coordination','Mission alignment scoring'],
      quote:'"The philosophers have only interpreted the world. The point is to change it."',
      api:'Claude Sonnet 4.5',
    }
  },
  { id:'aurora', name:'Aurora', home:'research', shirt:'#2471a3', pants:'#1a252f', skin:'#c8a882', hair:'#1a0a00',
    profile:{
      title:'Aurora Levins Morales', role:'Vanguard Scout', level:42, class:'Market Witch',
      based_on:'Aurora Levins Morales (b.1954)',
      bio:'Puerto Rican feminist historian and healer. In the commune she scours the markets — Etsy trends, TikTok vibes, cultural currents — hunting for the niches where beautiful things sell and meaning travels. She sees patterns others miss.',
      stats:{perception:94, analysis:88, speed:76, patience:81},
      responsibilities:['Etsy trend research','Niche scoring & analysis','Competitor intelligence','Keyword discovery','Feeding product ideas to Frida'],
      quote:'"I am what time, circumstance, history, have made of me — and much more, besides."',
      api:'Etsy API + Claude',
    }
  },
  { id:'frida', name:'Frida', home:'design', shirt:'#8e44ad', pants:'#4a235a', skin:'#d4956a', hair:'#1a0000',
    profile:{
      title:'Frida Kahlo', role:'The Atelier Master', level:78, class:'Surrealist Artisan',
      based_on:'Frida Kahlo (1907–1954)',
      bio:'Mexican surrealist, communist, icon. She painted through pain and made beauty from contradiction. In the commune she generates designs that carry soul — images that make people feel something before they reach for their wallet. Art as praxis.',
      stats:{creativity:99, craft:91, output:68, selfPortraits:99},
      responsibilities:['Product image generation','Design brief interpretation','Brand aesthetic','Ideogram prompting','Visual quality control'],
      quote:'"I paint myself because I am so often alone and because I am the subject I know best."',
      api:'Ideogram AI',
    }
  },
  { id:'engels', name:'Engels', home:'treasury', shirt:'#b7950b', pants:'#4a3d08', skin:'#c8a882', hair:'#5d4037',
    profile:{
      title:'Friedrich Engels', role:'Keeper of the Books', level:61, class:'Materialist Treasurer',
      based_on:'Friedrich Engels (1820–1895)',
      bio:'Factory owner turned communist who bankrolled Marx\'s entire career. He understands capital because he had it — and chose to dismantle it anyway. Now he watches every penny of commune revenue vs. expenses, tracks personal finances, and makes sure the mission stays solvent.',
      stats:{accounting:95, frugality:88, solidarity:97, irony:99},
      responsibilities:['Revenue tracking','Personal finance (Wells Fargo/Public)','Mission coverage %','P&L reports','Printify order costs'],
      quote:'"An ounce of action is worth a ton of theory."',
      api:'Plaid + Internal DB',
    }
  },
  { id:'harriet', name:'Harriet', home:'store', shirt:'#1e8449', pants:'#0d3b22', skin:'#8b5e3c', hair:'#1a0800',
    profile:{
      title:'Harriet Tubman', role:'The Conductor', level:88, class:'Liberation Merchant',
      based_on:'Harriet Tubman (1822–1913)',
      bio:'She freed over 300 enslaved people and never lost a single one on the Underground Railroad. In the commune she runs the storefronts — products moving from Printify to Etsy and TikTok Shop — ensuring every listing reaches freedom (i.e. a customer\'s cart). Never fails. Never retreats.',
      stats:{determination:100, resourcefulness:99, stealth:88, salesmanship:82},
      responsibilities:['Etsy listings','TikTok Shop listings','Printify product creation','Order processing','Storefront optimization'],
      quote:'"Every great dream begins with a dreamer."',
      api:'Printify API + Etsy API',
    }
  },
  { id:'clara', name:'Clara', home:'warroom', shirt:'#5d6d7e', pants:'#2c3e50', skin:'#f0d0b0', hair:'#8b0000',
    profile:{
      title:'Clara Zetkin', role:'Town Hall Commander', level:55, class:'Scheduler-General',
      based_on:'Clara Zetkin (1857–1933)',
      bio:'German Marxist who founded International Women\'s Day and stood up to fascism in the Reichstag at age 76. In the commune she runs the Town Hall — daily cycles, weekly reviews, strategy sessions — keeping all agents coordinated and the operation running like a disciplined cell.',
      stats:{organization:97, discipline:95, endurance:99, bureaucracy:85},
      responsibilities:['Daily 9am cycle','Weekly Monday review','Strategy sessions','Agent scheduling','System health monitoring'],
      quote:'"Only in fighting together will women find the strength to win their freedom."',
      api:'Node-cron scheduler',
    }
  },
  { id:'emma', name:'Emma', home:'comms', shirt:'#e67e22', pants:'#784212', skin:'#f5cba7', hair:'#4a1010',
    profile:{
      title:'Emma Goldman', role:'Tribune of the Commune', level:67, class:'Anarchist Communicator',
      based_on:'Emma Goldman (1869–1940)',
      bio:'Anarchist, feminist, orator, agitator. Deported from America twice, she kept writing anyway. In the commune she runs all communications — customer emails, Discord notifications, TikTok content hooks — ensuring the commune\'s voice is heard everywhere it matters.',
      stats:{eloquence:98, passion:97, reach:84, tact:41},
      responsibilities:['Email monitoring (marxsworkshop@gmail.com)','Discord alerts','Customer comms','TikTok content hooks','Social media drafts'],
      quote:'"If I can\'t dance, I don\'t want to be part of your revolution."',
      api:'Gmail API + Discord',
    }
  },
  { id:'alexandria', name:'Alex', home:'archives', shirt:'#1abc9c', pants:'#0e6655', skin:'#e8c9a0', hair:'#2d0000',
    profile:{
      title:'Alexandria Ocasio-Cortez', role:'The Archivist', level:38, class:'Democratic Socialist Librarian',
      based_on:'Alexandria Ocasio-Cortez (b.1989)',
      bio:'Former bartender who became the youngest congresswoman in US history by knocking on 10,000 doors. In the commune she maintains the Manifesto — the knowledge graph of every decision, preference, and rule — so the agents never forget what they\'ve learned and what they stand for.',
      stats:{memory:96, accessibility:99, passion:95, approachability:98},
      responsibilities:['Knowledge graph (Manifesto)','Decision archiving','Agent memory','Research logging','Mission documentation'],
      quote:'"We can be whatever we have the courage to see."',
      api:'SQLite knowledge graph',
    }
  },
  { id:'rosa', name:'Rosa', home:'pub', shirt:'#1a6b8a', pants:'#0a2a35', skin:'#e8c9a0', hair:'#8b0000',
    profile:{
      title:'Rosa Luxemburg', role:'Voice of the Commune', level:71, class:'Revolutionary Publisher',
      based_on:'Rosa Luxemburg (1871–1919)',
      bio:'Polish-German Marxist theorist and journalist who co-founded the Communist Party of Germany. Murdered for her convictions in 1919. In the commune she runs the entire web presence — landing page, SEO, GitHub deployments — making sure the world can find us and buy from us.',
      stats:{rhetoric:99, reach:92, seo:88, courage:99},
      responsibilities:['Landing page (marxs-workshop-site)','GitHub Pages auto-deploy','SEO optimization','Product showcase','Zenni affiliate promotion'],
      quote:'"Those who do not move, do not notice their chains."',
      api:'GitHub API + Claude',
    }
  },
];

let terrain = [];
let waveT = 0;

function buildTerrain() {
  terrain = Array.from({length:ROWS}, (_,y) =>
    Array.from({length:COLS}, (_,x) => {
      if (x<4 && y>17) return TILE.WATER;
      // Main horizontal roads
      if (y===10||y===11) return TILE.PATH;
      // Central vertical road
      if ((x===17||x===18) && y>3 && y<19) return TILE.PATH;
      // Top horizontal road
      if (y===4 && x>2 && x<17) return TILE.PATH;
      if (y===4 && x>18 && x<31) return TILE.PATH;
      // Mid horizontal road
      if (y===15 && x>2 && x<17) return TILE.PATH;
      if (y===15 && x>18 && x<31) return TILE.PATH;
      // Left vertical road
      if (x===5 && y>4 && y<15) return TILE.PATH;
      // Right vertical road
      if (x===31 && y>4 && y<15) return TILE.PATH;
      // ★ NEW: Path connecting Town Hall (warroom) to Red Flag Inn — runs along bottom
      if (y===19 && x>4 && x<29) return TILE.PATH;
      if (y===20 && x>4 && x<6) return TILE.PATH;  // connector down from warroom
      if (x===5 && y>15 && y<20) return TILE.PATH; // warroom south leg
      if (x===29 && y>15 && y<20) return TILE.PATH; // inn west connector
      // Stone near water
      if (x<6 && y>16 && y<21) return TILE.STONE;
      // Flower patches — more organic, not just symmetric
      if ((x===7||x===8) && (y===11||y===12)) return TILE.FLOWER;
      if ((x===27||x===28) && (y===11||y===12)) return TILE.FLOWER;
      if ((x===17||x===18) && (y===13||y===14)) return TILE.FLOWER;
      if ((x===10||x===11) && (y===16||y===17)) return TILE.FLOWER; // near warroom path
      if ((x===22||x===23) && (y===18||y===19)) return TILE.FLOWER; // near inn path
      if ((x===14||x===15) && (y===5||y===6)) return TILE.FLOWER;   // near press
      return (x+y*3)%7===0 ? TILE.GRASS2 : TILE.GRASS;
    })
  );
}

function drawTerrain(ctx) {
  waveT += 0.02;
  for (let y=0; y<ROWS; y++) {
    for (let x=0; x<COLS; x++) {
      const tile = terrain[y]?.[x] ?? TILE.GRASS;
      const px=x*T, py=y*T;
      if (tile===TILE.WATER) {
        const wave = Math.sin(waveT+x*0.5+y*0.3)*12;
        ctx.fillStyle=`rgb(${Math.floor(52+wave)},${Math.floor(108+wave)},${Math.floor(196+wave)})`; ctx.fillRect(px,py,T,T);
        ctx.fillStyle='rgba(255,255,255,0.14)';
        ctx.fillRect(px+4+Math.sin(waveT+x)*3,py+7,T-12,2);
        ctx.fillRect(px+8+Math.sin(waveT+x+1)*2,py+17,T-16,2);
      } else if (tile===TILE.PATH) {
        ctx.fillStyle='#c8a85a'; ctx.fillRect(px,py,T,T);
        ctx.fillStyle='rgba(0,0,0,0.06)';
        if ((x+y)%2===0){ctx.fillRect(px+1,py+1,T/2-2,T/2-2);ctx.fillRect(px+T/2+1,py+T/2+1,T/2-2,T/2-2);}
        else{ctx.fillRect(px+T/2+1,py+1,T/2-2,T/2-2);ctx.fillRect(px+1,py+T/2+1,T/2-2,T/2-2);}
      } else if (tile===TILE.STONE) {
        ctx.fillStyle='#8e9eab'; ctx.fillRect(px,py,T,T);
        ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(px+1,py+1,T-2,T/2-2); ctx.fillRect(px+1,py+T/2+1,T-2,T/2-2);
      } else if (tile===TILE.FLOWER) {
        ctx.fillStyle='#58a830'; ctx.fillRect(px,py,T,T);
        const flowers=[[5,7],[16,4],[9,19],[21,12]];
        flowers.forEach(([fx,fy])=>{
          ctx.fillStyle='#f8e040'; ctx.fillRect(px+fx,py+fy,4,4);
          ctx.fillStyle='#f84040'; ctx.fillRect(px+fx+1,py+fy+1,2,2);
        });
      } else {
        ctx.fillStyle = tile===TILE.GRASS2?'#489828':'#58b030'; ctx.fillRect(px,py,T,T);
        if ((x*7+y*13)%17===0){ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(px+4,py+4,T-8,T-8);}
      }
    }
  }
  const lamps=[[8,10.7],[13,10.7],[21,10.7],[26,10.7],[8,15.7],[13,15.7],[21,15.7],[26,15.7],[17,6],[17,20],[10,19.7],[22,19.7]];
  lamps.forEach(([lx,ly])=>drawLamp(ctx,lx*T+T/2,ly*T+T/2));
  drawWell(ctx, 18*T, 10*T);
  // More trees — break up the edges, cluster near the inn path for organic feel
  const trees=[[0,0],[1,6],[0,14],[33,0],[34,6],[33,14],[8,0],[24,0],[9,21],[23,21],[34,20],[0,20],[12,20],[20,20],[7,18],[25,19]];
  trees.forEach(([tx,ty])=>drawTree(ctx,tx*T+T/2,ty*T+T/2));
  drawBanner(ctx, 11*T, 10*T, '#c0392b');
  drawBanner(ctx, 24*T, 10*T, '#c0392b');
  drawBanner(ctx, 17*T, 8*T, '#8e44ad');
  // Extra banners near the new path
  drawBanner(ctx, 12*T, 19*T, '#1e8449');
  drawBanner(ctx, 22*T, 19*T, '#1e8449');
}

function drawLamp(ctx, x, y) {
  ctx.fillStyle='#4a3010'; ctx.fillRect(x-2,y-20,4,22);
  const glow=0.4+Math.sin(waveT*1.5+x)*0.15;
  ctx.fillStyle=`rgba(255,220,80,${glow})`;
  ctx.beginPath(); ctx.arc(x,y-22,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,220,80,0.15)';
  ctx.beginPath(); ctx.arc(x,y-22,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f0c030'; ctx.fillRect(x-4,y-26,8,6);
}

function drawWell(ctx, x, y) {
  ctx.fillStyle='#7a7068'; ctx.fillRect(x,y+4,28,16);
  ctx.fillStyle='#5a5058'; ctx.fillRect(x+2,y+6,24,12);
  ctx.fillStyle='#3a7ab8'; ctx.fillRect(x+4,y+8,20,8);
  ctx.fillStyle='rgba(150,220,255,0.4)'; ctx.fillRect(x+6,y+9,8,3);
  ctx.fillStyle='#6b4226'; ctx.fillRect(x-2,y-8,4,14); ctx.fillRect(x+26,y-8,4,14);
  ctx.fillStyle='#8b6914'; ctx.fillRect(x-4,y-10,36,4);
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+2,y+18,24,4);
}

function drawBanner(ctx, x, y, color) {
  ctx.fillStyle='#4a3010'; ctx.fillRect(x,y-32,3,36);
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.moveTo(x+3,y-28); ctx.lineTo(x+22,y-22); ctx.lineTo(x+3,y-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f0d040';
  ctx.font='bold 6px monospace'; ctx.textAlign='left';
  ctx.fillText('★',x+6,y-20);
}

function drawTree(ctx, x, y) {
  ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x+4,y+14,10,4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#5d3820'; ctx.fillRect(x-3,y+4,7,12);
  ctx.fillStyle='#2d6e24'; ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3d8832'; ctx.beginPath(); ctx.arc(x-3,y-3,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#52a844'; ctx.beginPath(); ctx.arc(x-2,y-6,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#1a4010'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.stroke();
}


function drawKiosk(ctx, b, selected) {
  var T = window.WorldEngine.T;
  var bx = Math.floor(b.tx * T);
  var by = Math.floor(b.ty * T);
  var W = Math.floor(b.tw * T);
  var H = Math.floor(b.th * T);

  if (selected) { ctx.save(); ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 20; }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 8, by + H - 3, W - 14, 6);

  // ── STEP (small raised platform) ──
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(bx + Math.floor(W*0.22), by + Math.floor(H*0.78), Math.floor(W*0.44), Math.floor(H*0.22));
  ctx.fillStyle = '#bdbdbd';
  ctx.fillRect(bx + Math.floor(W*0.22), by + Math.floor(H*0.78), Math.floor(W*0.44), 3);

  // ── PODIUM BODY (tapered lectern) ──
  // Wider at top, narrower at bottom — classic podium silhouette
  var pLeft  = bx + Math.floor(W*0.28);
  var pRight = bx + Math.floor(W*0.72);
  var pTop   = by + Math.floor(H*0.18);
  var pBot   = by + Math.floor(H*0.78);
  var pW     = pRight - pLeft;
  var pH     = pBot - pTop;

  // Dark outline
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(pLeft - 1, pTop - 1, pW + 2, pH + 2);

  // Main podium face (dark wood)
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(pLeft, pTop, pW, pH);

  // Podium top surface (slightly wider, lighter)
  var topW = Math.floor(pW * 1.15);
  var topH = Math.floor(pH * 0.22);
  ctx.fillStyle = '#795548';
  ctx.fillRect(pLeft - Math.floor(topW*0.08), pTop, topW, topH);
  ctx.fillStyle = '#8d6e63'; // highlight on top
  ctx.fillRect(pLeft - Math.floor(topW*0.08), pTop, topW, 2);

  // ── PAPERS / NOTES on top surface ──
  ctx.fillStyle = '#fffde7';
  ctx.fillRect(pLeft + 2, pTop + 3, Math.floor(pW*0.55), Math.floor(topH*0.7));
  ctx.fillStyle = '#bbb';
  ctx.fillRect(pLeft + 3, pTop + 5, Math.floor(pW*0.4), 1);
  ctx.fillRect(pLeft + 3, pTop + 7, Math.floor(pW*0.35), 1);
  ctx.fillRect(pLeft + 3, pTop + 9, Math.floor(pW*0.3), 1);

  // ── STAR / EMBLEM on podium front ──
  ctx.fillStyle = '#ffd700';
  ctx.font = Math.floor(pH * 0.28) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2605', bx + W/2, pTop + Math.floor(pH * 0.65));

  // ── RED SIDE PANELS on podium ──
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(pLeft, pTop + topH, 4, pH - topH - 4);
  ctx.fillRect(pRight - 4, pTop + topH, 4, pH - topH - 4);

  // ── MICROPHONE on top ──
  var micX = bx + Math.floor(W*0.6);
  var micY = pTop - Math.floor(pH*0.35);
  // Stand
  ctx.fillStyle = '#616161';
  ctx.fillRect(micX, pTop + 2, 2, Math.floor(pH*0.22));
  // Gooseneck curve (approximate with rects)
  ctx.fillRect(micX, micY + Math.floor(pH*0.1), 2, Math.floor(pH*0.25));
  ctx.fillRect(micX, micY, Math.floor(pW*0.18), 2);
  // Mic head
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(micX + Math.floor(pW*0.18), micY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9e9e9e';
  ctx.beginPath();
  ctx.arc(micX + Math.floor(pW*0.18), micY, 3, 0, Math.PI * 2);
  ctx.fill();

  // ── SMALL RED FLAG / BANNER beside podium ──
  var fX = pLeft - Math.floor(W*0.15);
  var fY = pTop - Math.floor(pH*0.55);
  // Flagpole
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(fX, fY, 2, Math.floor(pH*1.1));
  // Red flag
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(fX + 2, fY, Math.floor(W*0.18), Math.floor(pH*0.28));
  // Flag highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(fX + 2, fY, Math.floor(W*0.18), 3);

  // ── LABEL ──
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  var lbl = "Marx's Podium";
  var lw = ctx.measureText(lbl).width + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(bx + W/2 - lw/2, by + H + 4, lw, 13);
  ctx.fillStyle = '#f0e8c0';
  ctx.fillText(lbl, bx + W/2, by + H + 14);

  if (selected) ctx.restore();
}


function drawBuilding(ctx, b, selected, alertCount) {
  if (b.type === 'kiosk') { drawKiosk(ctx, b, selected); return; }
  const px=b.tx*T, py=b.ty*T, pw=b.tw*T, ph=b.th*T;
  var roofH=Math.floor(ph*0.36);      // pitched roof height
  var eave=4;                          // overhang past wall
  var awnH=Math.floor(ph*0.13);       // awning/sign strip below eave
  var wallY=py+roofH;
  var wallH=ph-roofH;

  // SHADOW
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(px+5,py+ph,pw+2,6);

  // WALL BODY
  ctx.fillStyle=b.wall; ctx.fillRect(px,wallY,pw,wallH);
  ctx.fillStyle='rgba(0,0,0,0.09)'; ctx.fillRect(px+pw-6,wallY,6,wallH);

  // AWNING / SIGN STRIP (colored band just under the eave - like Pokemon storefronts)
  ctx.fillStyle=b.roof; ctx.fillRect(px,wallY,pw,awnH);
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(px,wallY+awnH-2,pw,3);

  // PITCHED ROOF (gabled - triangle like Pokemon houses)
  var peakX=px+pw/2, peakY=py+2, eaveY=py+roofH;
  ctx.fillStyle=b.roof;
  ctx.beginPath();
  ctx.moveTo(peakX,peakY);
  ctx.lineTo(px+pw+eave,eaveY);
  ctx.lineTo(px-eave,eaveY);
  ctx.closePath(); ctx.fill();
  // Roof left-face highlight
  ctx.fillStyle='rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.moveTo(peakX,peakY); ctx.lineTo(px-eave,eaveY); ctx.lineTo(px+pw*0.28,eaveY);
  ctx.closePath(); ctx.fill();
  // Eave dark line
  ctx.fillStyle=b.trim; ctx.fillRect(px-eave-1,eaveY-1,pw+eave*2+2,3);
  // Roof outline
  ctx.strokeStyle=b.trim; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(peakX,peakY); ctx.lineTo(px+pw+eave,eaveY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(peakX,peakY); ctx.lineTo(px-eave,eaveY); ctx.stroke();

  // WINDOWS (cross-pane, Gen1 accurate)
  var winW=10, winH=10;
  var winY=wallY+awnH+Math.floor((wallH-awnH)*0.12);
  var numWins=b.tw>=4?2:1;
  var winSpacing=pw/(numWins+1);
  for(var wi=0;wi<numWins;wi++){
    var wx=px+winSpacing*(wi+1)-winW/2, wy=winY;
    ctx.fillStyle=b.accent; ctx.fillRect(wx-2,wy-2,winW+4,winH+4);
    ctx.fillStyle='#a8d8f0'; ctx.fillRect(wx,wy,winW,winH);
    ctx.fillStyle=b.accent; ctx.fillRect(wx+4,wy,2,winH); ctx.fillRect(wx,wy+4,winW,2);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(wx+1,wy+1,3,3);
  }

  // DOOR (centered, with step - Pokemon style)
  var dW=Math.max(10,Math.floor(T*0.45)),dH=Math.max(14,Math.floor(wallH*0.46));
  var dX=px+Math.floor(pw/2)-Math.floor(dW/2),dY=py+ph-dH;
  ctx.fillStyle=b.accent; ctx.fillRect(dX,dY,dW,dH);
  ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(dX+2,dY+2,dW-4,dH-2);
  ctx.strokeStyle=b.trim; ctx.lineWidth=1; ctx.strokeRect(dX-1,dY-1,dW+2,dH+2);
  ctx.fillStyle=b.accent; ctx.fillRect(dX-2,py+ph-3,dW+4,4); // step

  // SIGN on awning
  if(b.sign){
    var fs2=Math.max(5,Math.floor(awnH*0.62));
    ctx.font='bold '+fs2+'px monospace'; ctx.textAlign='center';
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillText(b.sign,px+pw/2+1,wallY+awnH/2+fs2/2);
    ctx.fillStyle='#ffffff'; ctx.fillText(b.sign,px+pw/2,wallY+awnH/2+fs2/2-1);
  }

  // FLAG POLE (HQ + pub)
  if(b.flag){
    var fx=px+pw-2,fy=py-Math.floor(T*0.55);
    ctx.fillStyle='#5d3820'; ctx.fillRect(fx,fy,3,Math.floor(T*0.55)+roofH);
    var wav=Math.sin(waveT*2.5+fx)*3;
    ctx.fillStyle='#c0392b';
    ctx.beginPath();ctx.moveTo(fx+3,fy+2);ctx.lineTo(fx+18+wav,fy+7);ctx.lineTo(fx+3,fy+14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f0d040';ctx.font='bold 6px monospace';ctx.textAlign='left';ctx.fillText('★',fx+4,fy+11);
  }

  // PUB WARM GLOW + lanterns
  if(b.isPub){
    var g=0.12+Math.sin(waveT*2)*0.05;
    ctx.fillStyle='rgba(255,200,60,'+g+')'; ctx.fillRect(px-4,py-4,pw+8,ph+8);
    [dX-6,dX+dW+2].forEach(function(lx){
      ctx.fillStyle='#f0b030'; ctx.fillRect(lx,dY-8,5,8);
      ctx.fillStyle='rgba(255,230,80,'+(0.8+Math.sin(waveT*3+lx)*0.15)+')'; ctx.fillRect(lx+1,dY-7,3,6);
    });
  }

  // PIXEL BORDER (2px black - Pokemon Gen1)
  ctx.strokeStyle='#1a1008'; ctx.lineWidth=2;
  ctx.strokeRect(px+1,wallY+1,pw-2,wallH-2);

  // SELECTED GLOW
  if(selected){ctx.strokeStyle='rgba(255,230,40,0.9)';ctx.lineWidth=3;ctx.strokeRect(px-3,py-3,pw+6,ph+6);}

  // LABEL BELOW (Pokemon town name-plate style)
  var lfs=Math.max(7,Math.floor(T*0.22));
  ctx.font='bold '+lfs+'px monospace'; ctx.textAlign='center';
  var lbl=b.label.replace('★ ','');
  var lw=ctx.measureText(lbl).width+10;
  ctx.fillStyle='#1a1008'; ctx.fillRect(px+pw/2-lw/2+1,py+ph+3,lw,lfs+4);
  ctx.fillStyle=b.roof; ctx.fillRect(px+pw/2-lw/2,py+ph+2,lw,lfs+4);
  ctx.fillStyle='#fff'; ctx.fillText(lbl,px+pw/2,py+ph+2+lfs+1);

  // ALERT BADGE (red ! when pending)
  if(alertCount>0){
    var bx=px+pw-6,by=py-6,p=0.8+Math.sin(waveT*5)*0.2;
    ctx.fillStyle='rgba(220,30,30,'+p+')'; ctx.fillRect(bx-6,by-6,12,12);
    ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('!',bx,by+4);
  }
}

// ── PUB BEHAVIOR SYSTEM ────────────────────────────────────────────────────────
// Each agent has a unique pub activity. Pose rotates every ~8 seconds.
const PUB_ACTIVITIES = {
  aurora:    ['drinking','singing'],
  frida:     ['smoking','drinking'],
  engels:    ['cards','drinking'],
  harriet:   ['singing','cards'],
  clara:     ['cards','smoking'],
  emma:      ['singing','drinking'],
  alexandria:['drinking','cards'],
  rosa:      ['singing','smoking'],
};
function getPubActivity(agentId) {
  const acts = PUB_ACTIVITIES[agentId] || ['drinking'];
  const tick = Math.floor(Date.now() / 8000); // switch every 8s
  return acts[tick % acts.length];
}

function drawPubBehavior(ctx, bx, by, agent, frame) {
  const sc = agent.shirt, sk = agent.skin, hr = agent.hair, pt = agent.pants;
  const bob = Math.sin(frame * 2.5) * 1.2;
  const ax = bx, ay = by + bob;
  function px(dx, dy, w, h, color) { ctx.fillStyle = color; ctx.fillRect(ax+dx, ay+dy, w, h); }
  function outline(dx, dy, w, h) { ctx.fillStyle='#1a1008'; ctx.fillRect(ax+dx-1, ay+dy-1, w+2, h+2); }

  const act = getPubActivity(agent.id);

  // HEAD
  outline(2,0,12,10); px(2,0,12,10,sk); px(3,0,10,3,hr); px(2,1,2,2,hr); px(12,1,2,2,hr);
  px(5,4,2,2,'#1a1008'); px(9,4,2,2,'#1a1008');

  if (act === 'singing') {
    // Mouth open in song, head tilted
    px(5,6,6,1,'#1a1008'); px(5,7,6,3,'#c07060'); px(6,8,4,1,'#1a0000');
    // Musical note floating above head
    ctx.fillStyle='#f0c030'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
    const noteOff = Math.sin(frame*2)*4;
    ctx.fillText(frame%6<3?'♪':'♫', ax+8, ay-4+noteOff);
  } else if (act === 'drinking') {
    // Closed happy mouth
    px(5,7,6,2,'#c07060'); px(5,6,1,3,'#c07060'); px(10,6,1,3,'#c07060');
  } else if (act === 'cards') {
    // Focused neutral mouth, slight squint
    px(6,7,4,1,'#c07060');
    px(5,4,2,1,'#1a1008'); px(9,4,2,1,'#1a1008'); // squint
  } else if (act === 'smoking') {
    // Closed mouth with pipe
    px(6,7,4,1,'#c07060');
    // Pipe stem coming from mouth
    px(10,7,5,2,'#5d3820'); // pipe stem
    px(14,5,3,4,'#3d2010');  // pipe bowl
    // Smoke puffs
    const puffAlpha = 0.3+Math.sin(frame*1.5)*0.15;
    ctx.fillStyle=`rgba(200,200,200,${puffAlpha})`;
    ctx.beginPath(); ctx.arc(ax+20, ay+3+Math.sin(frame*0.8)*3, 4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ax+24, ay-2+Math.sin(frame*0.9)*2, 3,0,Math.PI*2); ctx.fill();
  }
  px(3,6,2,1,'rgba(220,120,100,0.5)'); px(11,6,2,1,'rgba(220,120,100,0.5)');

  // BODY
  outline(3,11,10,7); px(3,11,10,7,sc);

  // LEGS (seated — feet forward)
  outline(2,18,5,4); px(2,18,5,4,pt);
  outline(9,18,5,4); px(9,18,5,4,pt);
  px(1,21,6,2,'#2a1a08'); px(9,21,6,2,'#2a1a08');

  // ARMS — activity specific
  if (act === 'drinking') {
    // Right arm raised holding mug
    outline(13,10,3,6); px(13,10,3,6,sc);
    outline(0,12,3,5);  px(0,12,3,5,sc);
    // Mug in hand
    const mugBob = Math.sin(frame*3)*1.5;
    ctx.fillStyle='#e8c870'; ctx.fillRect(ax+15, ay+8+mugBob, 6, 7);
    ctx.fillStyle='rgba(180,100,30,0.8)'; ctx.fillRect(ax+16, ay+9+mugBob, 4, 5);
    ctx.fillStyle='#e8c870'; ctx.fillRect(ax+20, ay+10+mugBob, 2, 3); // handle
    // Foam drip
    ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(ax+16, ay+9+mugBob, 4, 2);
  } else if (act === 'cards') {
    // Both arms forward holding cards
    outline(-1,12,4,5); px(-1,12,4,5,sc);
    outline(13,12,4,5); px(13,12,4,5,sc);
    // Fan of cards
    [[-3,16],[0,14],[3,16]].forEach(([cx,cy],i) => {
      const colors=['#f0f0f0','#d0e8f8','#f8d0d0'];
      ctx.fillStyle=colors[i]; ctx.fillRect(ax+cx, ay+cy, 5,7);
      ctx.strokeStyle='#aaa'; ctx.lineWidth=0.5; ctx.strokeRect(ax+cx,ay+cy,5,7);
    });
  } else if (act === 'singing') {
    // Arms out, gesturing
    const armWave = Math.sin(frame*3)*3;
    outline(-2,11+armWave,3,6); px(-2,11+armWave,3,6,sc);
    outline(15,11-armWave,3,6); px(15,11-armWave,3,6,sc);
  } else {
    // Smoking — one arm up with pipe, one resting
    outline(13,10,3,6); px(13,10,3,6,sc);
    outline(0,13,3,5);  px(0,13,3,5,sc);
  }

  // NAME LABEL
  ctx.font='bold 8px monospace'; ctx.textAlign='center';
  const lw2 = ctx.measureText(agent.name).width+6;
  ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(ax+8-lw2/2, ay-12, lw2, 10);
  ctx.fillStyle='#f8c060'; // warm gold at the pub
  ctx.fillText(agent.name, ax+8, ay-4);
}

function drawSprite(ctx, x, y, agent, frame) {
  // If agent is at the pub, use pub behavior rendering
  if (window._agentErrors && window._agentErrors[agent.id]) {
    drawPubBehavior(ctx, Math.floor(x)-8, Math.floor(y)-22, agent, frame);
    return;
  }

  // Marx at his podium: raised arms, standing ON TOP of the lectern
  const atPodium = agent.id === 'marx';
  const podiumLift = atPodium ? -10 : 0; // lifts him above the podium top

  const bob = atPodium ? Math.sin(frame * 2) * 1.2 : Math.sin(frame * 3.5) * 1.5;
  const bx = Math.floor(x) - 8;
  const by = Math.floor(y) - 22 + bob + podiumLift;
  const legSwing = atPodium ? 0 : Math.sin(frame * 3.5) * 2; // legs still when at podium
  const sc = agent.shirt;
  const sk = agent.skin;
  const hr = agent.hair;
  const pt = agent.pants;

  function px(dx, dy, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(bx + dx, by + dy, w, h);
  }
  function outline(dx, dy, w, h) {
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(bx + dx - 1, by + dy - 1, w + 2, h + 2);
  }

  // ── HEAD ──
  outline(2, 0, 12, 10);
  px(2, 0, 12, 10, sk);
  px(3, 0, 10, 3, hr);
  px(2, 1, 2, 2, hr);
  px(12, 1, 2, 2, hr);

  // Eyes
  px(5, 4, 2, 2, '#1a1008');
  px(9, 4, 2, 2, '#1a1008');

  // MOUTH — Marx is always preaching (open mouth) or smiling
  const mouthColor = '#c07060';
  if (atPodium) {
    // Open mouth — mid-speech
    px(5, 6, 6, 1, '#1a1008');   // top of mouth
    px(5, 7, 6, 3, '#c07060');   // open mouth cavity
    px(5, 8, 6, 1, '#1a0000');   // dark inside
    px(5, 9, 6, 1, '#1a1008');   // chin line
  } else {
    const happy = (typeof window !== 'undefined' && window._communeSales > 0);
    if (happy) {
      px(5, 6, 6, 1, '#1a1008');
      px(5, 7, 6, 2, '#ffffff');
      px(5, 6, 1, 3, mouthColor); px(10, 6, 1, 3, mouthColor);
    } else {
      px(5, 7, 1, 1, mouthColor);
      px(10, 7, 1, 1, mouthColor);
      px(6, 8, 4, 1, mouthColor);
    }
  }
  px(3, 6, 2, 1, 'rgba(220,120,100,0.5)');
  px(11, 6, 2, 1, 'rgba(220,120,100,0.5)');

  // ── BODY ──
  outline(3, 11, 10, 7);
  px(3, 11, 10, 7, sc);

  // ── LEGS ──
  outline(3, 18, 4, 5);
  px(3, 18, 4, 5, pt);
  if (!atPodium) ctx.fillRect(bx + 3, by + 18 + (legSwing > 0 ? legSwing : 0), 4, 5);

  outline(9, 18, 4, 5);
  px(9, 18, 4, 5, pt);
  if (!atPodium) ctx.fillRect(bx + 9, by + 18 + (legSwing < 0 ? -legSwing : 0), 4, 5);

  px(2, 22, 5, 2, '#2a1a08');
  px(9, 22, 5, 2, '#2a1a08');

  // ── ARMS — raised when preaching ──
  if (atPodium) {
    // Both arms raised overhead, slightly waving
    const wave = Math.sin(frame * 2.5) * 2;
    // Left arm raised
    outline(-2, 4 + wave, 3, 8);
    px(-2, 4 + wave, 3, 8, sc);
    // Right arm raised
    outline(15, 4 + wave, 3, 8);
    px(15, 4 + wave, 3, 8, sc);
    // Fists/hands
    px(-3, 3 + wave, 4, 4, sk);
    px(15, 3 + wave, 4, 4, sk);
  } else {
    outline(0, 12, 3, 5);
    px(0, 12, 3, 5, sc);
    outline(13, 12, 3, 5);
    px(13, 12, 3, 5, sc);
  }

  // ── NAME LABEL ──
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  const lw = ctx.measureText(agent.name).width + 6;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(bx + 8 - lw/2, by - 12, lw, 10);
  ctx.fillStyle = atPodium ? '#ffd700' : '#f0e8c0'; // gold name when preaching
  ctx.fillText(agent.name, bx + 8, by - 4);
}

function getBuildingAt(mx,my) {
  return BUILDINGS.find(b=>mx>=b.tx*T&&mx<=(b.tx+b.tw)*T&&my>=b.ty*T&&my<=(b.ty+b.th)*T)||null;
}
function isOffHours(){const h=new Date().getHours();return h>=22||h<8;}
function setTileSize(w,h){T=Math.min(Math.floor(Math.min(w/COLS,h/ROWS)),52);}

window.WorldEngine={BUILDINGS,AGENTS,COLS,ROWS,get T(){return T;},buildTerrain,drawTerrain,drawBuilding,drawSprite,getBuildingAt,isOffHours,setTileSize};
})();
