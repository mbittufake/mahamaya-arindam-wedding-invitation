(() => {
  const $ = id => document.getElementById(id);
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const TARGET = new Date('2026-12-06T19:00:00+05:30').getTime();

  /* ================= celebration particles (canvas) ================= */
  const FX = (() => {
    const cv = $('fx'), ctx = cv.getContext('2d');
    let W = 0, H = 0, parts = [], last = 0, raf = 0, amb = null, acc = { a: 0, b: 0, c: 0 };
    let quality = 1, ema = 16.7, nF = 0, scrolling = false, scT = 0;   // quality drops automatically on slow devices
    addEventListener('scroll', () => { scrolling = true; clearTimeout(scT); scT = setTimeout(() => scrolling = false, 180); }, { passive: true });
    const GOLD = ['#f6dcaa', '#e7bd8b', '#d9b77e', '#fff1d6'];
    const MIX = ['#f6dcaa', '#e7bd8b', '#f1d7ca', '#e08a9a', '#fff4e9', '#c88c82', '#eaa76c'];
    const PETAL = ['#f1c4b8', '#e7a1a5', '#f6dcaa', '#d98a96', '#fbe3d6'];

    function resize() {
      const d = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    addEventListener('resize', resize); resize();

    function add(p) {
      if (parts.length > 650 * quality) return;
      parts.push(Object.assign({ life: 0, max: 3, g: 0, drag: 1, rot: 0, vr: 0, size: 6, vx: 0, vy: 0, type: 'dot', color: '#fff', tw: rnd(0, 6), vt: 0.1, a: 1, sway: 0, sw: 2 }, p));
      kick();
    }
    const q = n => Math.ceil(n * (reduce ? 0.2 : 1) * Math.max(.4, quality));

    function confetti(x, y, n = 60, o = {}) {
      const { angle = -Math.PI / 2, spread = Math.PI * 2, speed = [4, 11], g = 0.18, drag = 0.985 } = o;
      for (let i = 0; i < q(n); i++) {
        const a = angle + rnd(-spread / 2, spread / 2), s = rnd(speed[0], speed[1]), r = Math.random();
        add({ type: r < .62 ? 'rect' : r < .82 ? 'petal' : 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g, drag,
          size: rnd(5, 10), color: pick(MIX), rot: rnd(0, 6), vr: rnd(-.25, .25), vt: rnd(.08, .25), max: rnd(3, 5) });
      }
    }
    function fireworks(x, y) {
      const pal = pick([['#f6dcaa', '#e7bd8b'], ['#f1d7ca', '#e08a9a'], ['#fff4e9', '#d9b77e'], ['#ffd9a0', '#f0a07a']]);
      const n = q(52);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + rnd(-.05, .05), s = rnd(2.2, 6.4);
        add({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: .05, drag: .962, max: rnd(1.1, 1.9), color: pick(pal), size: 2 });
      }
      for (let i = 0; i < q(8); i++) add({ type: 'star', x, y, vx: rnd(-2, 2), vy: rnd(-2, 2), g: .02, drag: .97, size: rnd(7, 13), color: '#fff1d6', max: rnd(1.2, 2), vt: .2 });
    }
    function cannons() {
      confetti(0, H, 70, { angle: -Math.PI * .33, spread: .55, speed: [10, 20], g: .26, drag: .985 });
      confetti(W, H, 70, { angle: -Math.PI * .67, spread: .55, speed: [10, 20], g: .26, drag: .985 });
    }
    function glints(x, y, n = 16) {
      for (let i = 0; i < q(n); i++) {
        const a = rnd(0, 6.283), s = rnd(.6, 2.6);
        add({ type: 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: .97, g: -.01, size: rnd(5, 11), color: pick(GOLD), max: rnd(1.6, 2.8), vt: .15 });
      }
    }
    function petals(n = 18) {
      for (let i = 0; i < q(n); i++) setTimeout(() => petal(rnd(0, W), -20), i * 90);
    }
    function petal(x, y) {
      add({ type: 'petal', x, y, vx: rnd(-.3, .3), vy: rnd(.7, 1.5), g: .002, size: rnd(5, 9), color: pick(PETAL), rot: rnd(0, 6), vr: rnd(-.04, .04), vt: rnd(.03, .08), sway: rnd(.4, 1), sw: rnd(1, 2.4), max: 14, a: .85 });
    }

    let bfs = [];
    function butterfly(p, size, dur = 7200) { bfs.push({ t: 0, dur, p, size, x: p[0], y: p[1], ang: 0 }); kick(); }
    function bfPos(b, u, t, s) {
      const [x0, y0, x1, y1, x2, y2, x3, y3] = b.p, v = 1 - u;
      const x = v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3;
      const y = v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3;
      // lazy, wandering flutter on top of the main curve
      return [x + Math.sin(t / 640) * s * 1.1 + Math.sin(t / 260) * s * .18,
              y + Math.sin(t / 470) * s * .9 + Math.sin(t / 150 + 1) * s * .14];
    }
    function bfStep(dt) {
      if (!bfs.length) return;
      for (const b of bfs) {
        b.t += dt * 16.667;
        const u = b.t / b.dur;
        if (u >= 1) continue;
        const [nx, ny] = bfPos(b, u, b.t, b.size);
        const vx = nx - b.x, vy = ny - b.y;
        if (Math.hypot(vx, vy) > .05) {
          let target = Math.atan2(vy, vx) + Math.PI / 2, d = target - b.ang;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          b.ang += d * .06 * dt;                       // turn gently toward where it is going
        }
        b.x = nx; b.y = ny;
        if (Math.random() < .75) add({ type: Math.random() < .28 ? 'star' : 'dot', x: b.x + rnd(-6, 6), y: b.y + rnd(0, 10), vx: rnd(-.2, .2), vy: rnd(.05, .4), g: .004, size: rnd(1.5, 4.2), color: pick(GOLD), max: rnd(1, 2.2), a: .9, vt: .2, rot: rnd(0, 6) });
      }
      bfs = bfs.filter(b => b.t < b.dur);
    }
    function drawBf() {
      for (const bf of bfs) {
        const s = bf.size, fade = Math.max(0, Math.min(1, bf.t / 900, (bf.dur - bf.t) / 1100));
        const ph = bf.t / 125, down = .5 + .5 * Math.cos(ph + .75 * Math.sin(ph)); // quick downstroke, slower lift
        const flap = .34 + .66 * down;
        ctx.save();
        ctx.translate(bf.x, bf.y + Math.sin(ph) * s * .05);
        ctx.rotate(bf.ang + Math.sin(bf.t / 700) * .12);
        ctx.globalAlpha = fade;
        // soft aura
        const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5);
        aura.addColorStop(0, '#ffe9c04d'); aura.addColorStop(1, '#ffe9c000');
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, s * 1.5, 0, 6.283); ctx.fill();

        const fore = () => { ctx.beginPath(); ctx.moveTo(.03, -.1);
          ctx.bezierCurveTo(.22, -.98, .86, -1.2, 1.06, -.86);
          ctx.bezierCurveTo(1.14, -.55, .95, -.22, .6, -.06);
          ctx.bezierCurveTo(.4, .0, .18, .02, .03, .04); ctx.closePath(); };
        const hind = () => { ctx.beginPath(); ctx.moveTo(.03, 0);
          ctx.bezierCurveTo(.4, -.1, .8, .02, .82, .34);
          ctx.bezierCurveTo(.84, .6, .6, .8, .4, .8);
          ctx.bezierCurveTo(.36, .92, .3, 1.12, .2, 1.2);        // tail
          ctx.bezierCurveTo(.2, 1.0, .16, .8, .1, .55);
          ctx.bezierCurveTo(.05, .35, .02, .2, .03, .04); ctx.closePath(); };
        const veins = (list) => { ctx.strokeStyle = '#fff1d655'; ctx.lineWidth = Math.max(.6, s * .012);
          ctx.beginPath(); for (const [x, y] of list) { ctx.moveTo(.04, -.02); ctx.quadraticCurveTo(x * .5, y * .35, x, y); } ctx.stroke(); };
        const paint = (shape, lift, lag, vein) => {
          for (const side of [-1, 1]) {
            ctx.save(); ctx.scale(side * s, s);
            const f = Math.max(.12, flap - lag);
            ctx.transform(f, 0, side * (1 - f) * -.0, 1, 0, 0);       // wing foreshortens as it beats
            ctx.rotate(-(1 - f) * lift * side * side);                  // and rises
            const g = ctx.createLinearGradient(0, 0, 1, -.7);
            g.addColorStop(0, '#fffdf7f5'); g.addColorStop(.5, '#ffefd2c4'); g.addColorStop(1, '#ffd49a88');
            ctx.fillStyle = g;
            shape(); ctx.fill();
            ctx.strokeStyle = '#fff6e6'; ctx.lineWidth = .018; ctx.stroke();
            ctx.save(); shape(); ctx.clip(); veins(vein); ctx.restore();
            // soft margin spots
            ctx.fillStyle = '#ffe2b0aa';
            for (const [x, y, r] of (shape === fore ? [[.9, -.78, .035], [.97, -.58, .03], [.82, -.38, .028]] : [[.68, .5, .035], [.52, .68, .03]])) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
            ctx.restore();
          }
        };
        paint(hind, .25, .1, [[.8, .3], [.6, .65], [.35, .85], [.95, .05]]);
        paint(fore, .35, 0, [[1, -.85], [.95, -.55], [.75, -.3], [.55, -.9], [.3, -.8]]);

        // body + antennae
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff3dc';
        ctx.beginPath(); ctx.ellipse(0, .3 * s, s * .05, s * .3, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -.06 * s, s * .075, s * .15, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -.26 * s, s * .065, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#fff3dc'; ctx.lineWidth = Math.max(1, s * .02); ctx.lineCap = 'round';
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * s * .02, -.3 * s); ctx.quadraticCurveTo(sd * s * .12, -.6 * s, sd * s * .3, -.68 * s + Math.sin(ph * .5) * s * .03); ctx.stroke(); }
        ctx.restore();
      }
    }
    function ambientStep(dt) {
      if (reduce || !amb || document.hidden) return;
      acc.a += dt / 60; acc.b += dt / 60; acc.c += dt / 60;
      const k = Math.max(.4, quality) * (scrolling ? .5 : 1);     // spawn gaps stretch when the device is struggling or the page is scrolling
      if (amb === 'stage') {
        // Falling golden sparkles & glitters across the video
        while (acc.a > .14 / k) { acc.a -= .14 / k; add({ type: Math.random() < .65 ? 'star' : 'dot', x: rnd(0, W), y: -12, vx: rnd(-.25, .25), vy: rnd(.65, 1.55), g: .003, size: rnd(2.2, 6.5), color: pick(GOLD), max: rnd(5, 9), vt: rnd(.08, .18), sway: rnd(.25, .65), sw: rnd(1.2, 2.4), a: .92 }); }
        while (acc.b > .95 / k) { acc.b -= .95 / k; petal(rnd(0, W), -20); }
      } else {
        // Rich engagement party theme: continuous golden glitters + periodic party poppers
        while (acc.a > .18 / k) { acc.a -= .18 / k; add({ type: 'star', x: rnd(0, W), y: rnd(0, H), vx: rnd(-.2, .2), vy: rnd(.35, 1.05), size: rnd(3, 7.5), color: pick(GOLD), max: rnd(2.2, 4), vt: rnd(.08, .18), a: .9 }); }
        while (acc.b > .65 / k) { acc.b -= .65 / k; add({ type: pick(['rect', 'star', 'dot']), x: rnd(0, W), y: -10, vx: rnd(-.55, .55), vy: rnd(1.1, 2.2), g: .004, size: rnd(4, 8), color: pick(MIX), rot: rnd(0, 6), vr: rnd(-.09, .09), vt: .14, sway: .5, sw: 2, max: 10, a: .92 }); }
        while (!scrolling && acc.c > 7.5) { acc.c -= 7.5; cannons(); }
      }
    }

    function draw(p) {
      const a = p.a * Math.max(0, Math.min(1, (p.max - p.life) / (p.max * .3)));
      if (a <= 0.01) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = ctx.strokeStyle = p.color;
      switch (p.type) {
        case 'rect': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.tw)); ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .6); ctx.restore(); break;
        case 'petal': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, .5 + .5 * Math.abs(Math.cos(p.tw))); ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * .55, 0, 0, 6.283); ctx.fill(); ctx.restore(); break;
        case 'star': { const s = p.size * (.65 + .35 * Math.sin(p.tw)); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .14, -s * .14, s, 0); ctx.quadraticCurveTo(s * .14, s * .14, 0, s); ctx.quadraticCurveTo(-s * .14, s * .14, -s, 0); ctx.quadraticCurveTo(-s * .14, -s * .14, 0, -s); ctx.fill(); ctx.restore(); break; }
        case 'spark': ctx.lineWidth = p.size; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); ctx.lineTo(p.x, p.y); ctx.stroke(); break;
        default: ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 6.283); ctx.fill();
      }
    }

    function frame(t) {
      const raw = Math.min(60, t - last || 16.7); const dt = Math.min(3, raw / 16.667 || 1); last = t;
      ema += (raw - ema) * .06;
      if (++nF % 30 === 0) quality = ema > 25 ? Math.max(.35, quality - .15) : ema < 19 ? Math.min(1, quality + .05) : quality;
      ctx.clearRect(0, 0, W, H);
      ambientStep(dt); bfStep(dt);
      for (const p of parts) {
        p.life += dt / 60;
        const dr = Math.pow(p.drag, dt);
        p.vx *= dr; p.vy = p.vy * dr + p.g * dt;
        p.x += p.vx * dt + (p.sway ? Math.sin(p.life * p.sw) * p.sway * dt : 0);
        p.y += p.vy * dt; p.rot += p.vr * dt; p.tw += p.vt * dt;
      }
      parts = parts.filter(p => p.life < p.max && p.y < H + 40 && p.y > -80);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) if (p.type === 'spark' || p.type === 'star') draw(p);
      ctx.globalCompositeOperation = 'source-over';
      for (const p of parts) if (p.type !== 'spark' && p.type !== 'star') draw(p);
      drawBf(); ctx.globalAlpha = 1;
      raf = (parts.length || amb || bfs.length) ? requestAnimationFrame(frame) : 0;
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function mode(m) { amb = m; kick(); }
    return { butterfly, confetti, fireworks, cannons, glints, petals, mode, get W() { return W; }, get H() { return H; } };
  })();

  /* ================= decorative builders ================= */
  (function buildStars() {
    const box = $('stars'); let h = '';
    const n = innerWidth < 700 ? 55 : 80;
    for (let i = 0; i < n; i++) {
      const big = Math.random() < .12, s = big ? rnd(2.2, 3.4) : rnd(1, 2);
      h += `<i class="${big ? 'big' : ''}" style="left:${rnd(0, 100).toFixed(1)}%;top:${rnd(0, 100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--d:${rnd(2, 5).toFixed(1)}s;animation-delay:${rnd(0, 4).toFixed(1)}s"></i>`;
    }
    box.innerHTML = h;
  })();

  (function buildLights() {
    const box = $('lights'), n = innerWidth < 600 ? 14 : 22, sag = 26;
    let html = '';
    [0, 1].forEach(row => {
      const y0 = 2 + row * 0, c = y0 + 2 * sag * (row ? .55 : 1);
      html += `<svg viewBox="0 0 100 60" preserveAspectRatio="none" style="opacity:${row ? .5 : 1}"><path d="M0 ${y0} Q50 ${c} 100 ${y0}"/></svg>`;
      const s = sag * (row ? .55 : 1);
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, y = y0 + 4 * s * t * (1 - t);
        html += `<span class="bulb" style="left:${t * 100}%;top:${y}px;animation-delay:${((i * 0.37 + row * .9) % 2.6).toFixed(2)}s;${row ? 'transform:scale(.8)' : ''}"></span>`;
      }
    });
    box.innerHTML = html;
  })();

  (function buildBunting() {
    const box = $('bunting'), arches = Math.max(4, Math.round(innerWidth / 150));
    let html = '<svg viewBox="0 0 100 66" preserveAspectRatio="none">';
    let drops = '';
    for (let a = 0; a < arches; a++) {
      const x0 = (a / arches) * 100, x1 = ((a + 1) / arches) * 100, xm = (x0 + x1) / 2;
      html += `<path d="M${x0.toFixed(2)} 2 Q${xm.toFixed(2)} 54 ${x1.toFixed(2)} 2"/>`;
      html += `<path d="M${x0.toFixed(2)} 2 Q${xm.toFixed(2)} 34 ${x1.toFixed(2)} 2" style="opacity:.45"/>`;
      const pts = 5;
      for (let j = 1; j < pts; j++) {
        const t = j / pts, x = x0 + (x1 - x0) * t, y = 2 + 4 * 26 * t * (1 - t);
        const lg = j === 2 || j === 3 ? ' lg' : '';
        drops += `<span class="gdrop${lg}" style="left:${x.toFixed(2)}%;top:${y.toFixed(1)}px;animation-delay:${(((a * pts + j) * 0.31) % 2.8).toFixed(2)}s"></span>`;
      }
    }
    html += '</svg>' + drops;
    box.innerHTML = html;
  })();

  /* ================= story engine ================= */
  const frame = $('frame');
  const scenes = [...document.querySelectorAll('.scene')];
  const progress = $('progress');
  const dance = $('danceVideo');
  const LAST = scenes.length - 1;
  let cur = -1, timer = null, fxTimer = null;

  const segs = scenes.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'seg'; b.setAttribute('aria-label', `Go to part ${i + 1}`);
    b.innerHTML = '<i></i>'; b.addEventListener('click', e => { e.stopPropagation(); go(i); });
    progress.appendChild(b); return b;
  });

  const at = (u, v) => { const r = frame.getBoundingClientRect(); return [r.left + r.width * u, r.top + r.height * v]; };
  function sceneFx(i) {
    clearTimeout(fxTimer);
    fxTimer = setTimeout(() => {
      if (!body.classList.contains('mode-stage')) return;
      switch (i) {
        case 0: FX.glints(...at(.5, .55), 26); FX.fireworks(...at(.12, .3)); setTimeout(() => FX.fireworks(...at(.88, .34)), 600); break;
        case 1: FX.confetti(...at(.5, .3), 60, { angle: Math.PI / 2, spread: 2.6, speed: [1, 5], g: .08 }); FX.fireworks(...at(.85, .25)); break;
        case 2: FX.glints(...at(.5, .55), 22); FX.fireworks(...at(.1, .3)); break;
        case 3: FX.glints(...at(.5, .55), 22); break;
        case 4: case 5: FX.petals(12); FX.glints(...at(.5, .55), 14); break;
        case 6: FX.cannons(); setTimeout(() => FX.fireworks(...at(.2, .3)), 300); setTimeout(() => FX.fireworks(...at(.8, .28)), 700); setTimeout(() => FX.fireworks(...at(.5, .22)), 1200); break;
      }
    }, 650);
  }

  let stateEndTimer = null, endFxFired = false;
  function endStateTransition(stateIdx) {
    if (endFxFired || reduce || !body.classList.contains('mode-stage')) return;
    endFxFired = true;
    const r = frame.getBoundingClientRect(), P = (u, v) => [r.left + r.width * u, r.top + r.height * v];
    const sz = Math.max(18, r.width * .072);
    frame.classList.remove('loop-pulse');
    void frame.offsetWidth;
    frame.classList.add('loop-pulse');
    setTimeout(() => frame.classList.remove('loop-pulse'), 1900);

    switch (stateIdx) {
      case 0: // Engagement (Ring Ceremony) -> twin butterflies + ring-halo glints
        FX.glints(...P(.5, .48), 32);
        FX.butterfly([...P(-.1, .75), ...P(.35, .28), ...P(.65, .6), ...P(1.1, .25)], sz, 5200);
        setTimeout(() => FX.butterfly([...P(1.1, .72), ...P(.65, .28), ...P(.35, .6), ...P(-.1, .25)], sz * .9, 5200), 160);
        break;
      case 1: // Save the Date -> starlight cascade + date sparkles
        FX.confetti(...P(.5, .15), 55, { angle: Math.PI / 2, spread: 2.4, speed: [1.5, 5.5], g: .07 });
        FX.glints(...P(.5, .52), 26);
        FX.fireworks(...P(.82, .28));
        break;
      case 2: // The Place (Mayfair Lagoon) -> golden venue fireworks + sweeping butterfly
        FX.fireworks(...P(.22, .3));
        setTimeout(() => FX.fireworks(...P(.78, .3)), 280);
        FX.butterfly([...P(-.08, .82), ...P(.42, .2), ...P(.6, .58), ...P(1.08, .22)], sz, 5400);
        break;
      case 3: // Dress with Joy (Festive & Fabulous) -> festive party poppers + glitters
        FX.confetti(...P(0, .95), 45, { angle: -Math.PI * .35, spread: .55, speed: [9, 17], g: .22 });
        FX.confetti(...P(1, .95), 45, { angle: -Math.PI * .65, spread: .55, speed: [9, 17], g: .22 });
        FX.glints(...P(.5, .5), 28);
        break;
      case 4: // The Bride -> rose-gold petals + graceful butterfly
        FX.petals(24);
        FX.butterfly([...P(-.08, .68), ...P(.38, .22), ...P(.68, .54), ...P(1.08, .24)], sz * 1.05, 5600);
        FX.glints(...P(.5, .52), 22);
        break;
      case 5: // The Groom -> royal golden fireworks + ascending butterflies into finale
        FX.fireworks(...P(.5, .26));
        FX.butterfly([...P(.2, 1.06), ...P(.35, .62), ...P(.55, .38), ...P(.85, -.06)], sz * .88, 5200);
        setTimeout(() => FX.butterfly([...P(.8, 1.06), ...P(.65, .62), ...P(.45, .38), ...P(.15, -.06)], sz * .85, 5200), 200);
        FX.glints(...P(.5, .5), 26);
        break;
    }
  }

  function go(i) {
    i = Math.max(0, Math.min(LAST, i));
    if (i === cur) return;
    const prevIdx = cur;
    cur = i;
    clearTimeout(timer); clearTimeout(stateEndTimer);
    if (prevIdx !== -1 && !endFxFired) endStateTransition(prevIdx);
    endFxFired = false;

    // Play the dance video from the start for each state (keep continuous from intro on initial State 1)
    if (prevIdx !== -1 || i !== 0) {
      try {
        dance.currentTime = 0;
        dance.play().catch(() => {});
      } catch (e) {}
    } else if (dance.paused) {
      dance.play().catch(() => {});
    }
    loopTriggered = false;

    scenes.forEach((s, k) => s.classList.toggle('on', k === i));
    segs.forEach((s, k) => { s.classList.toggle('done', k < i); s.classList.toggle('cur', k === i); s.classList.toggle('static', k === i && i === LAST); s.style.removeProperty('--d'); });
    frame.classList.toggle('last', i === LAST);
    if (i < LAST) {
      const d = +scenes[i].dataset.dur || 6500;
      void segs[i].offsetWidth;
      segs[i].style.setProperty('--d', d + 'ms');
      stateEndTimer = setTimeout(() => endStateTransition(i), Math.max(500, d - 580));
      timer = setTimeout(() => go(cur + 1), d);
    }
    sceneFx(i);
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);
  $('nextBtn').addEventListener('click', e => { e.stopPropagation(); next(); });
  $('prevBtn').addEventListener('click', e => { e.stopPropagation(); prev(); });
  frame.addEventListener('click', e => { if (body.classList.contains('mode-stage') && cur >= 0 && !e.target.closest('button') && cur < LAST) next(); });
  addEventListener('keydown', e => {
    if (!body.classList.contains('mode-stage')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') prev();
  });

  // days-to-go line on the closing scene
  (function () {
    const d = Math.ceil((TARGET - Date.now()) / 86400000);
    $('daysLeft').textContent = d > 1 ? `${d} DAYS TO GO · 06 · 12 · 2026` : d === 1 ? 'TOMORROW · 7 PM ONWARDS' : d === 0 ? 'TODAY · 7 PM ONWARDS' : '06 · 12 · 2026';
  })();

  /* ================= mode switching ================= */
  // The intro is a timeline of class changes (CSS does the animating on the GPU); nothing writes styles every frame.
  const stage = $('stage'), curtain = $('curtainVideo'), site = $('site');
  let entered = false, introStarted = false, booted = false;
  const T = [];
  const later = (fn, ms) => T.push(setTimeout(fn, ms));
  const setMode = m => { body.className = 'mode-' + m; };
  const mark = (...c) => frame.classList.add(...c);
  function parting() { mark('parting'); stage.classList.add('parting'); }
  function hideCurtain() {
    if (curtain.classList.contains('gone')) return;
    curtain.classList.add('gone');                                  // fade out, then stop decoding + blending it
    setTimeout(() => { curtain.pause(); curtain.style.display = 'none'; }, 1300);
  }
  function flyButterfly() {
    const r = frame.getBoundingClientRect(), P = (u, v) => [r.left + r.width * u, r.top + r.height * v];
    FX.butterfly([...P(-.08, .86), ...P(.5, .12), ...P(.1, .72), ...P(1.08, .36)], Math.max(20, r.width * .08));
  }

  /* ---- seamless video-loop transition: unique butterfly/sparkle effect each time final.mp4 restarts ---- */
  let loopCycle = 0, loopTriggered = false;
  function runLoopTransition(cycle) {
    if (reduce || body.classList.contains('mode-site') || !body.classList.contains('mode-stage')) return;
    const r = frame.getBoundingClientRect(), P = (u, v) => [r.left + r.width * u, r.top + r.height * v];
    const sz = Math.max(18, r.width * .072);
    frame.classList.remove('loop-pulse');
    void frame.offsetWidth;
    frame.classList.add('loop-pulse');
    setTimeout(() => frame.classList.remove('loop-pulse'), 1900);

    switch (cycle % 5) {
      case 0: // Golden butterfly flock swooping across the restart seam
        FX.butterfly([...P(-.1, .78), ...P(.35, .28), ...P(.65, .62), ...P(1.1, .22)], sz, 5600);
        setTimeout(() => FX.butterfly([...P(1.1, .72), ...P(.62, .25), ...P(.32, .58), ...P(-.1, .3)], sz * .85, 5400), 180);
        setTimeout(() => FX.butterfly([...P(.15, 1.08), ...P(.45, .52), ...P(.72, .35), ...P(.95, -.08)], sz * .75, 5000), 340);
        FX.glints(...P(.5, .48), 26);
        break;
      case 1: // Starlight cascade + hero butterfly
        FX.confetti(...P(.5, .12), 45, { angle: Math.PI / 2, spread: 2.2, speed: [1.5, 5.5], g: .06 });
        FX.butterfly([...P(-.08, .88), ...P(.4, .18), ...P(.25, .68), ...P(1.08, .28)], sz * 1.1, 6200);
        FX.glints(...P(.5, .52), 28);
        break;
      case 2: // Rose-gold petal whirl + twin synchronized butterflies
        FX.petals(22);
        FX.butterfly([...P(-.08, .35), ...P(.4, .65), ...P(.65, .25), ...P(1.08, .55)], sz * .9, 5500);
        setTimeout(() => FX.butterfly([...P(1.08, .4), ...P(.6, .7), ...P(.35, .25), ...P(-.08, .55)], sz * .9, 5500), 150);
        break;
      case 3: // Celebration poppers + sparkle halo
        FX.confetti(...P(0, .95), 40, { angle: -Math.PI * .35, spread: .55, speed: [8, 16], g: .22 });
        FX.confetti(...P(1, .95), 40, { angle: -Math.PI * .65, spread: .55, speed: [8, 16], g: .22 });
        FX.glints(...P(.5, .5), 32);
        break;
      case 4: // Enchanted fireworks + ascending butterfly trio
        FX.fireworks(...P(.22, .32));
        setTimeout(() => FX.fireworks(...P(.78, .28)), 350);
        FX.butterfly([...P(.2, 1.06), ...P(.35, .65), ...P(.55, .42), ...P(.85, -.06)], sz * .85, 5200);
        setTimeout(() => FX.butterfly([...P(.8, 1.06), ...P(.65, .62), ...P(.45, .38), ...P(.15, -.06)], sz * .8, 5200), 220);
        break;
    }
  }
  function watchDanceLoop() {
    if (cur === LAST && dance && dance.duration && !dance.paused && body.classList.contains('mode-stage')) {
      const rem = dance.duration - dance.currentTime;
      if (rem <= 0.75 && !loopTriggered) {
        loopTriggered = true;
        runLoopTransition(loopCycle++);
      } else if (dance.currentTime > 1.2 && rem > 1.5) {
        loopTriggered = false;
      }
    }
    requestAnimationFrame(watchDanceLoop);
  }
  requestAnimationFrame(watchDanceLoop);

  // The dance starts when the curtain parts and plays continuously through the intro and State 1.
  function startIntro() {
    if (introStarted) return; introStarted = true;
    try {
      if (dance.currentTime > 0.05) dance.currentTime = 0;
      dance.play().catch(() => {});
    } catch (e) {}
    parting(); mark('invited');
    later(() => { mark('hideIntro', 'titleOn'); FX.mode('stage'); }, 3800);
    later(flyButterfly, 5200);
    later(() => enterStage(), 7200);
  }
  function enterStage(fast) {
    if (entered) return;
    if (fast) {
      T.forEach(clearTimeout); T.length = 0;
      parting(); mark('fast', 'hideIntro', 'titleOn'); hideCurtain(); FX.mode('stage');
      dance.play().catch(() => {});
    }
    entered = true;
    setMode('stage');
    later(() => go(0), fast ? 700 : 200);
  }

  // Curtain clock: thresholds are read from the video's own time, so if the video buffers the whole sequence waits with it.
  let lastT = -1, lastMove = 0;
  function curtainLoop(now) {
    if (entered || curtain.classList.contains('gone')) return;
    const t = curtain.currentTime;
    if (t !== lastT) { lastT = t; lastMove = now || performance.now(); }
    else if ((now || performance.now()) - lastMove > (t > 0 ? 4000 : 12000)) { hideCurtain(); startIntro(); return; }   // video stuck: carry on without it
    if (t >= 1.2) parting();
    if (t >= 2.3) startIntro();
    if (t >= 4.4 || curtain.ended) { hideCurtain(); startIntro(); return; }
    requestAnimationFrame(curtainLoop);
  }
  function boot() {
    if (booted) return; booted = true;
    if (entered) { dance.play().catch(() => {}); return; }          // skipped while loading
    const cp = curtain.play();
    lastMove = performance.now();
    if (cp) cp.then(() => requestAnimationFrame(curtainLoop)).catch(() => { hideCurtain(); startIntro(); });
    else requestAnimationFrame(curtainLoop);
  }

  /* Reveal card: guest clicks to reveal the details and start the music */
  const revealGate = $('revealGate');
  const revealBtn = $('revealBtn');
  let revealed = false;

  // Keep curtain and dance strictly paused and closed on initial load
  try {
    curtain.pause(); curtain.currentTime = 0;
    dance.pause(); dance.currentTime = 0;
  } catch (e) {}

  function doReveal() {
    if (revealed) return;
    revealed = true;
    if (revealGate) revealGate.classList.add('hidden');
    if (window.playBgm) window.playBgm();
    // Start curtain opening and dance video
    try { curtain.currentTime = 0; dance.currentTime = 0; } catch (e) {}
    boot();
  }

  if (revealBtn) revealBtn.addEventListener('click', (e) => { e.stopPropagation(); doReveal(); });
  if (revealGate) revealGate.addEventListener('click', (e) => { e.stopPropagation(); doReveal(); });
  $('skipButton').addEventListener('click', () => {
    doReveal();
    introStarted = true;
    enterStage(true);
  });
  curtain.addEventListener('error', () => { hideCurtain(); startIntro(); });
  // Ensure that any key or touch also reveals if not already opened
  ['keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => {
    if (!revealed) doReveal();
    else if (booted && dance.paused && !body.classList.contains('mode-site')) dance.play().catch(() => {});
  }, { passive: true }));

  function openSite() {
    clearTimeout(timer); clearTimeout(stateEndTimer); clearTimeout(fxTimer); T.forEach(clearTimeout); T.length = 0;
    setMode('site'); window.scrollTo(0, 0);
    site.setAttribute('aria-hidden', 'false');
    FX.mode('site');
    setTimeout(() => { FX.cannons(); FX.glints(FX.W * .5, FX.H * .28, 30); FX.fireworks(FX.W * .2, FX.H * .22); FX.fireworks(FX.W * .8, FX.H * .26); }, 350);
    setTimeout(() => { if (body.classList.contains('mode-site')) { dance.pause(); stage.style.display = 'none'; } }, 1000);   // hidden stage: stop decoding + painting
    revealPass();
  }
  function replay() {
    stage.style.display = ''; setMode('stage'); window.scrollTo(0, 0);
    site.setAttribute('aria-hidden', 'true');
    dance.currentTime = 0; dance.play().catch(() => {});
    FX.mode('stage'); cur = -1; go(0);
  }
  $('scrollDownBtn').addEventListener('click', openSite);
  $('skipStory').addEventListener('click', e => { e.stopPropagation(); openSite(); });
  // Scroll down (wheel or touch swipe-up) on the final story state opens all details
  addEventListener('wheel', e => {
    if (body.classList.contains('mode-stage') && cur === LAST && e.deltaY > 18) openSite();
  }, { passive: true });
  let touchStartY = null;
  frame.addEventListener('touchstart', e => {
    if (body.classList.contains('mode-stage') && cur === LAST && e.touches.length === 1) touchStartY = e.touches[0].clientY;
  }, { passive: true });
  frame.addEventListener('touchend', e => {
    if (touchStartY !== null && body.classList.contains('mode-stage') && cur === LAST && e.changedTouches.length) {
      if (touchStartY - e.changedTouches[0].clientY > 40) openSite();
    }
    touchStartY = null;
  }, { passive: true });
  $('replayA').addEventListener('click', e => { e.stopPropagation(); cur = -1; go(0); });
  $('replayB').addEventListener('click', replay);
  $('popBtn').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    FX.confetti(x, y, 70, { speed: [4, 13], g: .2 }); FX.fireworks(FX.W * rnd(.2, .8), FX.H * rnd(.15, .4));
  });


  /* ================= background music ================= */
  // Plays by default on site load; visitors can mute/unmute at any time via the music button
  (function music() {
    const a = $('bgm'), btn = $('musicBtn'), hint = $('musicHint'), VOL = .55;
    let userMuted = false, resume = false;

    if (a) {
      a.muted = false;
      try { a.volume = VOL; } catch (e) {}
    }

    const ui = (playing) => {
      btn.classList.toggle('on', !userMuted);
      btn.setAttribute('aria-pressed', String(userMuted));
      btn.setAttribute('aria-label', userMuted ? 'Play music' : 'Mute music');
      if (hint) hint.textContent = userMuted ? 'Play music' : 'Mute';
    };

    function playBgm() {
      if (userMuted || !a) return;
      a.muted = false;
      try { a.volume = VOL; } catch (e) {}
      const p = a.play();
      if (p !== undefined) {
        p.then(() => {
          btn.classList.remove('nudge');
          ui(true);
          disarm();
        }).catch(() => {
          // If browser policy blocks audio until user activation:
          // Keep a.muted = false so it plays on the first user interaction.
        });
      }
    }

    function toggleMute() {
      if (!userMuted) {
        // User explicitly mutes
        userMuted = true;
        if (a) {
          a.muted = true;
          a.pause();
        }
        btn.classList.remove('nudge', 'quiet');
      } else {
        // User explicitly unmutes
        userMuted = false;
        if (a) {
          a.muted = false;
          try { a.volume = VOL; } catch (e) {}
          a.play().catch(() => {});
        }
        btn.classList.remove('nudge', 'quiet');
      }
      ui();
    }

    // On user's first gesture anywhere on screen, ensure sound starts if browser blocked initial autoplay
    function onGesture(e) {
      if (userMuted || !a) return;
      if (btn && btn.contains(e.target)) return;
      if (a.paused) {
        playBgm();
      }
    }

    // Web Audio unlock for mobile devices
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        let actx;
        const unlock = () => {
          if (!actx) actx = new AudioCtx();
          if (actx.state === 'suspended') actx.resume();
          ['touchstart', 'pointerdown', 'click'].forEach(ev => window.removeEventListener(ev, unlock, true));
        };
        ['touchstart', 'pointerdown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
      }
    } catch (e) {}

    const evs = ['pointerdown', 'touchstart', 'mousedown', 'pointerup', 'touchend', 'click', 'keydown'];
    const disarm = () => evs.forEach(ev => {
      window.removeEventListener(ev, onGesture, true);
      document.removeEventListener(ev, onGesture, true);
    });
    evs.forEach(ev => {
      window.addEventListener(ev, onGesture, { capture: true, passive: true });
      document.addEventListener(ev, onGesture, { capture: true, passive: true });
    });

    window.playBgm = playBgm;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!revealed) {
        doReveal();
      } else {
        toggleMute();
      }
    });

    // Pause when tab/app is hidden, resume when it returns
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !userMuted && a && !a.paused) {
        resume = true;
        a.pause();
      } else if (!document.hidden && resume && !userMuted && a) {
        resume = false;
        playBgm();
      }
    });

    // Start playing immediately on all load events
    playBgm();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', playBgm, { once: true });
    }
    window.addEventListener('load', playBgm, { once: true });
    window.addEventListener('pageshow', playBgm, { once: true });

    // Also trigger if dance or curtain begins
    if (curtain) curtain.addEventListener('play', () => { if (!userMuted) playBgm(); }, { once: true });
    if (dance) dance.addEventListener('play', () => { if (!userMuted) playBgm(); }, { once: true });

    // Initial UI state: ON (playing/unmuted)
    ui();

    // If browser autoplay policy blocked immediate playback without a gesture,
    // pulse the button and prompt the visitor so one tap anywhere starts the sound.
    setTimeout(() => {
      if (!userMuted && a && a.paused) {
        btn.classList.remove('quiet');
        btn.classList.add('nudge');
        if (hint) hint.textContent = 'Tap for music';
      } else if (!userMuted) {
        btn.classList.add('quiet');
      }
    }, 900);
  })();

  /* ================= site: reveal, countdown, calendar ================= */
  const rv = [...document.querySelectorAll('.rv')];
  let io = null;
  function revealPass() {
    if (io) return;
    if (!('IntersectionObserver' in window)) { rv.forEach(el => el.classList.add('in')); return; }
    let closedOnce = false;
    io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in'); io.unobserve(en.target);
      if (!closedOnce && en.target.closest('#closing')) { closedOnce = true; FX.cannons(); setTimeout(() => FX.fireworks(FX.W * .5, FX.H * .3), 400); }
    }), { threshold: .15, rootMargin: '0px 0px -30px 0px' });
    rv.forEach(el => io.observe(el));
  }

  const tf = ['days', 'hours', 'minutes', 'seconds'].map($);
  function tick() {
    const d = Math.max(0, TARGET - Date.now());
    const v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
    tf.forEach((f, i) => f.textContent = String(v[i]).padStart(i ? 2 : 1, '0'));
  }
  tick(); setInterval(tick, 1000);

  /* ---- add to calendar: opens the event in the person's calendar app (Google / Outlook) or the iOS "Add to Calendar" sheet ---- */
  const EV = {
    title: 'Mahamaya & Arindam — Engagement (Ring Ceremony)',
    place: 'Mayfair Lagoon, Mandap Area, Bhubaneswar',
    note: 'Celebrate the engagement of Mahamaya Kashyap and Kumar Arindam. 7:00 pm onwards. Festive dress: best suits / glam sarees or Indo-Western party wear.',
    startLocal: '20261206T190000', endLocal: '20261206T230000',       // IST (UTC+5:30)
    startUtc: '20261206T133000Z', endUtc: '20261206T173000Z',
    tz: 'Asia/Kolkata'
  };
  const enc = encodeURIComponent;
  const googleUrl = () => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(EV.title)}&dates=${EV.startLocal}/${EV.endLocal}&ctz=${EV.tz}&location=${enc(EV.place)}&details=${enc(EV.note)}`;
  const outlookUrl = () => `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${enc(EV.title)}&startdt=2026-12-06T13:30:00Z&enddt=2026-12-06T17:30:00Z&location=${enc(EV.place)}&body=${enc(EV.note)}`;
  function buildIcs() {
    const esc = t => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const alarm = (trig, txt) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${txt}`, `TRIGGER:${trig}`, 'END:VALARM'];
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mahamaya and Arindam//Engagement//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:mahamaya-arindam-engagement-20261206@invitation', `DTSTAMP:${stamp}`,
      `DTSTART:${EV.startUtc}`, `DTEND:${EV.endUtc}`, `SUMMARY:${esc(EV.title)}`, `LOCATION:${esc(EV.place)}`, `DESCRIPTION:${esc(EV.note)}`, 'STATUS:CONFIRMED', 'TRANSP:OPAQUE',
      ...alarm('-P1D', 'Engagement tomorrow, 7 PM at Mayfair Lagoon'), ...alarm('-PT3H', 'Engagement tonight, 7 PM at Mayfair Lagoon'),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const sheet = $('calSheet'), gLink = $('calGoogle'), oLink = $('calOutlook'), aBtn = $('calApple');
  let sheetFrom = null;
  gLink.href = googleUrl(); oLink.href = outlookUrl();
  // put the option that fits this device first
  const list = sheet.querySelector('.calsheet-list');
  const best = isIOS ? aBtn : gLink; best.classList.add('rec'); list.prepend(best);

  function openSheet(from) {
    sheetFrom = from || null;
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('sheet-open');
    setTimeout(() => best.focus({ preventScroll: true }), 60);
  }
  function closeSheet() {
    sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('sheet-open');
    if (sheetFrom) sheetFrom.focus({ preventScroll: true });
  }
  const celebrate = () => { closeSheet(); FX.confetti(FX.W / 2, FX.H * .6, 40, { speed: [4, 10] }); };
  sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet(); });
  gLink.addEventListener('click', () => setTimeout(celebrate, 150));
  oLink.addEventListener('click', () => setTimeout(celebrate, 150));
  aBtn.addEventListener('click', () => {
    const ics = buildIcs();
    if (isIOS) {                                                    // iOS shows its native "Add to Calendar" sheet for a calendar file
      location.href = 'data:text/calendar;charset=utf-8,' + enc(ics);
    } else {                                                        // Mac / desktop: hands the event to the Calendar app
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'mahamaya-and-arindam-engagement.ics';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    celebrate();
  });
  $('calBtn').addEventListener('click', e => openSheet(e.currentTarget));
  $('calBtn2').addEventListener('click', e => openSheet(e.currentTarget));
})();
