(function () {
  var stage = document.getElementById('stage'), slides = [].slice.call(document.querySelectorAll('.slide'));
  var pager = document.getElementById('pager'), black = document.getElementById('black');
  var glow = document.getElementById('glow'), map = document.getElementById('map'), tilesBox = document.getElementById('tiles');
  var corner = document.querySelector('.corner');
  var still = /still/.test(location.search);
  var cur = -1, outT;
  if (still) document.documentElement.classList.add('still');

  function rnd(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // 157 точек-площадок внутри МКАД, гуще к центру; первые 62 — активные
  var ns = 'http://www.w3.org/2000/svg', md = document.getElementById('mapdots'), r1 = rnd(157);
  for (var d = 0; d < 157; d++) {
    var a = r1() * Math.PI * 2, rr = Math.pow(r1(), .75) * 400;
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', (500 + Math.cos(a) * rr * 1.02).toFixed(1));
    c.setAttribute('cy', (500 + Math.sin(a) * rr * 1.05).toFixed(1));
    c.setAttribute('r', 7);
    if (d < 62) c.setAttribute('class', 'gr');
    c.style.setProperty('--d', Math.floor(r1() * 157));
    md.appendChild(c);
  }

  var BADGE = [['g', 'Активная'], ['y', 'Новая'], ['g', 'Активная'], ['s', 'Спящая'], ['y', 'Новая']];
  var T = 28, tiles = [];
  for (var t = 0; t < T; t++) {
    var el = document.createElement('div'), b = BADGE[t % BADGE.length];
    el.className = 'tile';
    el.innerHTML = '<img src="media/tiles/t' + (t % 12 + 1) + '.jpg" alt=""><i class="' + b[0] + '">' + b[1] + '</i>';
    el.style.setProperty('--d', (t * 37 % 23) * 30 + 'ms');
    tilesBox.appendChild(el); tiles.push(el);
  }

  function orbit(o) {
    return function (i, r) {
      var a = i / T * Math.PI * 2 + .3;
      return { x: 960 + Math.cos(a) * 830 - 66, y: 540 + Math.sin(a) * 440 - 46, r: (r() - .5) * 24, s: .95, o: o };
    };
  }
  function base(i, r) {
    return { x: 1135 + (i % 5) * 146, y: 215 + Math.floor(i / 5) * 106, r: 0, s: 1, o: 1, lit: i === 0 || i === 12 || i === 21 };
  }
  function chaos(i, r) { return { x: r() * 1790, y: r() * 990, r: (r() - .5) * 70, s: .8 + r() * .3, o: .5, dim: true }; }
  function away(i, r) {
    var a = r() * Math.PI * 2;
    return { x: 900 + Math.cos(a) * 1500, y: 500 + Math.sin(a) * 1000, r: (r() - .5) * 90, s: .7, o: 0 };
  }
  function dim(i, r) { return { x: r() * 1790, y: r() * 990, r: (r() - .5) * 40, s: .6, o: .12 }; }
  var LAYOUT = [orbit(.95), base, chaos, away, away, dim, dim, dim, dim, dim, orbit(.2)];

  function place(k) {
    var r = rnd(k * 101 + 7);
    tiles.forEach(function (el, i) {
      var p = LAYOUT[k](i, r);
      el.style.setProperty('--x', p.x + 'px'); el.style.setProperty('--y', p.y + 'px');
      el.style.setProperty('--r', p.r + 'deg'); el.style.setProperty('--s', p.s); el.style.setProperty('--o', p.o);
      el.classList.toggle('dim', !!p.dim); el.classList.toggle('lit', !!p.lit);
    });
  }

  var MAP = { 0: [460, 40, 1, .45, false], 4: [990, 563, .44, 1, true] };
  var GLOW = [[260, -160, 1.1], [600, -400, 1], [-300, 200, .9], [900, -500, .8], [700, 200, 1], [-400, -400, 1], [300, 300, 1.1], [900, 100, .9], [-200, 300, 1], [600, -300, 1], [260, -160, 1.2]];
  function scene(k) {
    place(k);
    var m = MAP[k];
    map.classList.toggle('show', !!m);
    map.classList.toggle('green', !!(m && m[4]));
    if (m) { map.style.setProperty('--x', m[0] + 'px'); map.style.setProperty('--y', m[1] + 'px'); map.style.setProperty('--s', m[2]); map.style.setProperty('--o', m[3]); }
    var g = GLOW[k % GLOW.length];
    glow.style.setProperty('--x', g[0] + 'px'); glow.style.setProperty('--y', g[1] + 'px'); glow.style.setProperty('--s', g[2]);
    corner.classList.toggle('off', k < 2);
  }

  function fmt(v, f) {
    if (f === 'hm') return (v >= 60 ? Math.floor(v / 60) + ' ч ' : '') + (v % 60) + ' мин';
    return String(v);
  }
  function count(slide) {
    if (still) return;
    [].forEach.call(slide.querySelectorAll('.cnt'), function (el) {
      var to = +el.dataset.to, f = el.dataset.fmt, t0 = performance.now() + 900;
      el.textContent = fmt(0, f);
      (function tick(now) {
        var p = Math.max(0, Math.min(1, (now - t0) / 1500));
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))), f);
        if (p < 1 && slide.classList.contains('on')) requestAnimationFrame(tick); else el.textContent = fmt(to, f);
      })(performance.now());
    });
  }

  var people = document.getElementById('people'), lit = [2, 5, 9, 14, 18, 22, 27, 31, 35];
  for (var q = 0; q < 37; q++) {
    var pi = document.createElement('i'), li = lit.indexOf(q);
    if (li >= 0) { pi.className = 'lit'; pi.style.setProperty('--k', li); }
    people.appendChild(pi);
  }

  // тур по скриншотам: картинка, подсветка [x1, y1, x2, y2] и курсор [x, y] в пикселях скриншота 1512×809, шаг справа, наезд камеры
  var W = 1512, H = 809;
  var TOUR = [
    [0, [179, 113, 1321, 191], [225, 160], 0, 1],
    [0, [208, 227, 1292, 257], [520, 242], 0, 1.08],
    [0, [180, 303, 1321, 351], [290, 333], 0, 1.12],
    [1, [340, 110, 1172, 330], [560, 230], 1, 1.06],
    [1, [340, 380, 830, 522], [470, 455], 1, 1.12],
    [1, [338, 548, 1172, 606], [720, 585], 1, 1.12],
    [2, [1010, 136, 1130, 166], [1075, 155], 2, 1.12],
    [2, [370, 228, 1130, 300], [1097, 265], 2, 1.08],
    [3, [347, 133, 1165, 165], [600, 150], 3, 1.1],
    [3, [1049, 87, 1165, 117], [1110, 104], 3, 1.12]
  ];
  var shots = document.querySelectorAll('#cam img'), hl = document.getElementById('hl'), ptr = document.getElementById('ptr');
  var cam = document.getElementById('cam'), steps = document.querySelectorAll('.s3 .step');
  var tourI = 0, tourT, lastImg = 0;
  function pct(v, of) { return (v / of * 100).toFixed(2) + '%'; }
  function tourStep(i) {
    var s = TOUR[i];
    [].forEach.call(shots, function (im, k) { im.classList.toggle('on', k === s[0]); });
    hl.style.left = pct(s[1][0], W); hl.style.top = pct(s[1][1], H);
    hl.style.width = pct(s[1][2] - s[1][0], W); hl.style.height = pct(s[1][3] - s[1][1], H);
    hl.classList.add('on');
    ptr.style.left = pct(s[2][0], W); ptr.style.top = pct(s[2][1], H);
    cam.style.setProperty('--ox', pct((s[1][0] + s[1][2]) / 2, W)); cam.style.setProperty('--oy', pct((s[1][1] + s[1][3]) / 2, H));
    cam.style.setProperty('--z', s[4]);
    [].forEach.call(steps, function (st, k) { st.classList.toggle('on', k === s[3]); });
    if (s[0] !== lastImg || i === 2) { ptr.classList.remove('click'); void ptr.offsetWidth; ptr.classList.add('click'); }
    lastImg = s[0];
  }
  function tour(on) {
    clearInterval(tourT);
    if (!on) return;
    tourI = 0; tourStep(0);
    if (still) return;
    tourT = setInterval(function () { tourI = (tourI + 1) % TOUR.length; tourStep(tourI); }, 2700);
  }

  function fit() {
    var k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = 'scale(' + k + ') translate(-50%, -50%)';
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur) return;
    var first = cur < 0;
    if (cur >= 0) {
      var old = slides[cur];
      old.classList.remove('on'); old.classList.add('out');
      clearTimeout(outT);
      outT = setTimeout(function () { slides.forEach(function (s) { if (!s.classList.contains('on')) s.classList.remove('out'); }); }, 1300);
    }
    cur = i;
    slides[i].classList.remove('out');
    scene(i);
    tour(i === 3);
    setTimeout(function () { if (cur === i) { slides[i].classList.add('on'); count(slides[i]); } }, first ? 0 : 350);
    [].forEach.call(pager.children, function (d, k) { d.classList.toggle('on', k === i); });
    history.replaceState(null, '', '#' + (i + 1));
  }

  // кликер шлёт PageDown/PageUp или стрелки; F — во весь экран, B или точка — чёрный экран
  // музыка стартует с первого нажатия — браузер не даёт играть без него; M — включить/выключить
  var music = document.getElementById('music'), musicOn = true;
  music.volume = .4;
  function playMusic() { if (musicOn && black.hidden && music.paused) music.play().catch(function () {}); }
  addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'm' || k === 'M' || k === 'ь' || k === 'Ь') { musicOn = music.paused; if (musicOn) music.play().catch(function () {}); else music.pause(); return; }
    if (k === 'b' || k === 'B' || k === 'и' || k === 'И' || k === '.' || k === 'ю') { black.hidden = !black.hidden; if (black.hidden) playMusic(); else music.pause(); return; }
    if (k === 'F5' || k === 'f' || k === 'F' || k === 'а' || k === 'А') {
      e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen();
      return;
    }
    if (!black.hidden) black.hidden = true;
    playMusic();
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].indexOf(k) >= 0) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(k) >= 0) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
  });
  addEventListener('click', function () {
    if (!black.hidden) { black.hidden = true; playMusic(); return; }
    playMusic(); go(cur + 1);
  });

  var hideT;
  addEventListener('mousemove', function () {
    document.body.classList.add('mouse');
    clearTimeout(hideT); hideT = setTimeout(function () { document.body.classList.remove('mouse'); }, 1500);
  });
  addEventListener('resize', fit);
  fit();
  slides.forEach(function (s, si) {
    pager.appendChild(document.createElement('i'));
    var r = rnd(si * 13 + 3);
    [].forEach.call(s.querySelectorAll('.c'), function (c, i) {
      c.style.setProperty('--i', i);
      c.style.setProperty('--dx', Math.round((r() - .5) * 360) + 'px');
      c.style.setProperty('--dy', Math.round(60 + r() * 160) + 'px');
      c.style.setProperty('--dr', ((r() - .5) * 8).toFixed(1) + 'deg');
    });
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    go((parseInt(location.hash.slice(1), 10) || 1) - 1);
  });
})();
