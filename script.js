(function () {
  'use strict';
  var PROFILE_ID = 16021128;
  var PROFILE_URL = 'https://osu.ppy.sh/users/' + PROFILE_ID + '/osu';
  var $ = function (id) { return document.getElementById(id); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DEFAULT = { username: 'Archiste alias [Kori]', global_rank: 451089, country_rank: 16300, updated_at: '2026-10-08T00:00:00Z' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function flag(cc) {
    if (!cc || cc.length !== 2) return '';
    return String.fromCodePoint.apply(null, cc.toUpperCase().split('').map(function (c) { return 127397 + c.charCodeAt(0); }));
  }

  function render(p) {
    $('name').textContent = p.username || 'Archiste';
    document.title = (p.username || 'Archiste') + ' | osu! profile';
    $('initial').textContent = (p.username || '').charAt(0).toUpperCase();
    if (p.avatar_url) {
      var img = new Image();
      img.alt = '';
      img.onload = function () { $('avatar').textContent = ''; $('avatar').appendChild(img); };
      img.src = p.avatar_url;
    }
    var cover = $('cover');
    cover.hidden = !p.cover_url;
    if (p.cover_url) {
      cover.onload = function () { cover.classList.add('cover--loaded'); };
      cover.onerror = function () { cover.hidden = true; };
      cover.src = p.cover_url;
    } else {
      cover.removeAttribute('src');
      cover.classList.remove('cover--loaded');
    }
    if (p.country_code) {
      $('country').hidden = false;
      $('country').textContent = flag(p.country_code) + ' ' + p.country_code.toUpperCase();
    }

    var stats = $('stats'); stats.textContent = '';
    var rows = [
      ['Global rank', p.global_rank != null ? '#' + num(p.global_rank) : null, 'stat--pink'],
      ['Country rank', p.country_rank != null ? '#' + num(p.country_rank) : null, 'stat--blue'],
      ['Performance', p.pp != null ? num(Math.round(p.pp)) + 'pp' : null, ''],
      ['Accuracy', p.accuracy != null ? Number(p.accuracy).toFixed(2) + '%' : null, ''],
      ['Play count', p.play_count != null ? num(p.play_count) : null, ''],
      ['Play time', p.play_time_hours != null ? num(p.play_time_hours) + ' h' : null, ''],
      ['Level', p.level != null ? String(p.level) : null, '']
    ];
    var counters = [];
    rows.forEach(function (r) {
      if (r[1] === null) return;
      var card = el('div', 'card stat ' + r[2]);
      card.style.setProperty('--card-index', stats.children.length);
      card.appendChild(el('span', '', r[0]));
      var s = el('strong', '', r[1]);
      card.appendChild(s); stats.appendChild(card);
      if (r[0] === 'Global rank' && p.global_rank != null) counters.push([s, p.global_rank]);
      if (r[0] === 'Country rank' && p.country_rank != null) counters.push([s, p.country_rank]);
    });
    if (!reduced && counters.length) {
      var t0 = performance.now();
      (function step(t) {
        var k = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
        counters.forEach(function (c) { c[0].textContent = '#' + num(Math.round(c[1] * e)); });
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    var g = $('grades');
    if (p.grades) {
      g.hidden = false; g.textContent = '';
      [['ss', 'SS', (p.grades.ss || 0) + (p.grades.ssh || 0)], ['s', 'S', (p.grades.s || 0) + (p.grades.sh || 0)], ['a', 'A', p.grades.a || 0]]
        .forEach(function (x) { var d = el('div', x[0]); d.appendChild(el('b', '', x[1])); d.appendChild(document.createTextNode(num(x[2]))); g.appendChild(d); });
    }

    $('snap').textContent = p.updated_at ? new Date(p.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '--';

    var plays = $('plays');
    if (p.top_plays && p.top_plays.length) {
      plays.textContent = '';
      p.top_plays.forEach(function (t) {
        var a = el('a', 'play'); a.href = t.url || PROFILE_URL; a.target = '_blank'; a.rel = 'noopener';
        a.appendChild(el('span', 'rk', t.rank || ''));
        var m = el('div'); m.appendChild(el('b', '', t.title || ''));
        var sm = el('small', '', (t.artist || '') + ' [' + (t.version || '') + ']' + (t.stars ? ' ' + t.stars.toFixed(2) + '★' : ''));
        (t.mods || []).forEach(function (md) { sm.appendChild(el('span', 'mod', md)); });
        m.appendChild(sm); a.appendChild(m);
        a.appendChild(el('span', 'acc', t.accuracy != null ? t.accuracy.toFixed(2) + '%' : ''));
        a.appendChild(el('span', 'pp', t.pp != null ? Math.round(t.pp) + 'pp' : ''));
        plays.appendChild(a);
      });
    }
  }

  render(DEFAULT);
  fetch('data/profile.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {  });

  var LINKS = [
    { label: 'osu! profile', href: PROFILE_URL },
    { label: 'Discord', href: '' },   
    { label: 'Twitch', href: '' }  
  ];
  LINKS.forEach(function (l) {
    if (!l.href) return;
    var a = el('a', 'btn', l.label); a.href = l.href; a.target = '_blank'; a.rel = 'noopener';
    $('links').appendChild(a);
  });
  var cp = el('button', 'btn ghost', 'Copy profile link'); cp.type = 'button';
  cp.addEventListener('click', function () {
    navigator.clipboard.writeText(PROFILE_URL).then(function () { cp.textContent = 'Copied'; }, function () { cp.textContent = 'Copy failed'; });
  });
  $('links').appendChild(cp);

  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () {
      tabs.forEach(function (x) {
        var on = x === b; x.setAttribute('aria-selected', on);
        $(x.getAttribute('aria-controls')).hidden = !on;
      });
    });
    b.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      var t = tabs[(n + tabs.length) % tabs.length]; t.focus(); t.click();
    });
  });

  var f = $('field'), st = $('start'), cb = $('combo'), ac = $('acc'), bestEl = $('best');
  var track = $('track'), musicButton = $('music'), volumeControl = $('volume'), volumeValue = $('volume-value');
  var BEAT_SECONDS = 0.4, BEAT_OFFSET = 0.05, APPROACH_SECONDS = 0.65;
  var beatStep = 1, hitWindow = 0.14, combo = 0, pts = 0, done = 0, best = null;
  var beatTimes = [], activeCircles = [], nextBeat = 0, isPlaying = false, frame = null;
  var musicEnabled = true;
  track.volume = Number(volumeControl.value);

  volumeControl.addEventListener('input', function () {
    track.volume = Number(volumeControl.value);
    volumeValue.textContent = Math.round(track.volume * 100) + '%';
  });

  function setMusicEnabled(enabled) {
    musicEnabled = enabled;
    track.muted = !enabled;
    musicButton.setAttribute('aria-pressed', enabled);
    musicButton.textContent = enabled ? 'Music: On' : 'Music: Off';
  }

  musicButton.addEventListener('click', function () {
    setMusicEnabled(!musicEnabled);
  });

  [].forEach.call(document.querySelectorAll('#diff button'), function (b) {
    b.addEventListener('click', function () {
      beatStep = +b.dataset.beats;
      [].forEach.call(document.querySelectorAll('#diff button'), function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  });

  function pop(x, y, t, c) {
    var e = el('div', 'judgement', t); e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.color = c;
    f.appendChild(e); setTimeout(function () { e.remove(); }, 600);
  }
  function judge(c, x, y, hit, targetTime, now) {
    if (c.dead) return; c.dead = true; c.remove(); done++;
    var dt = Math.abs(now - targetTime) * 1000;
    var t, s, col;
    if (!hit || dt > hitWindow * 1000) { t = 'MISS'; s = 0; col = '#ff5a5a'; combo = 0; }
    else if (dt < Math.min(60, hitWindow * 300)) { t = '300'; s = 300; col = '#66ccff'; combo++; }
    else if (dt < Math.min(130, hitWindow * 650)) { t = '100'; s = 100; col = '#7be37b'; combo++; }
    else { t = '50'; s = 50; col = '#ffd166'; combo++; }
    pts += s; cb.textContent = combo + 'x';
    ac.textContent = (pts / (done * 300) * 100).toFixed(2) + '%';
    pop(x, y, t, col);
    if (done >= beatTimes.length) finish();
  }
  function spawn(index, targetTime, now) {
    var w = f.clientWidth, h = f.clientHeight;
    var margin = 54, minY = 76;
    var minX = Math.min(margin, w / 2), maxX = Math.max(minX, w - margin);
    var maxY = Math.max(minY, h - margin);
    var x = minX, y = minY, attempts = 0;
    do {
      x = minX + Math.random() * (maxX - minX);
      y = minY + Math.random() * (maxY - minY);
      attempts++;
    } while (attempts < 18 && activeCircles.some(function (circle) {
      var dx = circle.x - x, dy = circle.y - y;
      return dx * dx + dy * dy < 112 * 112;
    }));
    var number = (index % 4) + 1;
    var c = el('button', 'hit' + (index % 2 ? ' hit--alt' : ''), String(number));
    c.type = 'button';
    c.setAttribute('aria-label', 'Cercle ' + number + ', appuyer sur ' + number);
    c.style.left = x + 'px'; c.style.top = y + 'px';
    var ring = el('i', 'ring');
    ring.style.animationDuration = (APPROACH_SECONDS * 1000) + 'ms';
    ring.style.animationDelay = -Math.max(0, (now - (targetTime - APPROACH_SECONDS)) * 1000) + 'ms';
    c.appendChild(ring);
    c.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      judge(c, x, y, true, targetTime, track.currentTime);
    });
    f.appendChild(c);
    activeCircles.push({ element: c, x: x, y: y, targetTime: targetTime, number: number });
  }
  document.addEventListener('keydown', function (e) {
    if (!isPlaying || !/^[1-4]$/.test(e.key)) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var number = Number(e.key);
    var circle = activeCircles.find(function (item) { return item.number === number; });
    if (!circle) return;
    e.preventDefault();
    judge(circle.element, circle.x, circle.y, true, circle.targetTime, track.currentTime);
  });
  function tick() {
    if (!isPlaying) return;
    var now = track.currentTime;
    while (nextBeat < beatTimes.length && beatTimes[nextBeat] - APPROACH_SECONDS <= now) {
      spawn(nextBeat, beatTimes[nextBeat], now);
      nextBeat++;
    }
    activeCircles = activeCircles.filter(function (circle) {
      if (!circle.element.dead && now > circle.targetTime + hitWindow) {
        judge(circle.element, circle.x, circle.y, false, circle.targetTime, now);
      }
      return !circle.element.dead;
    });
    if (isPlaying) frame = requestAnimationFrame(tick);
  }
  function finish() {
    if (!isPlaying) return;
    isPlaying = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    track.pause();
    var a = pts / (beatTimes.length * 300) * 100;
    if (best === null || a > best) { best = a; bestEl.textContent = a.toFixed(2) + '%'; }
    st.querySelector('p').textContent = 'Done: ' + a.toFixed(2) + '% accuracy. Try to beat it.';
    $('play').textContent = 'Play again'; st.style.display = 'flex';
  }

  track.addEventListener('ended', function () {
    if (!isPlaying) return;
    activeCircles.slice().forEach(function (circle) {
      if (circle.element.dead) return;
      circle.element.dead = true;
      circle.element.remove();
      pop(circle.x, circle.y, 'MISS', '#ff5a5a');
    });
    done = beatTimes.length;
    combo = 0;
    cb.textContent = '0x';
    ac.textContent = (pts / (done * 300) * 100).toFixed(2) + '%';
    activeCircles = [];
    finish();
  });
  track.addEventListener('error', function () {
    if (isPlaying) {
      st.querySelector('p').textContent = 'Could not load Shiawase.vip.mp3. Check that the audio file is in the site folder.';
      finish();
    }
  });

  $('play').addEventListener('click', function () {
    $('play').disabled = true;
    track.pause();
    track.currentTime = 0;
    track.muted = !musicEnabled;
    track.play().then(function () {
      beatTimes = [];
      var beatInterval = BEAT_SECONDS * beatStep;
      hitWindow = Math.min(0.2, beatInterval * 0.45);
      var firstBeat = BEAT_OFFSET;
      while (firstBeat < APPROACH_SECONDS + 0.05) firstBeat += beatInterval;
      for (var beat = firstBeat; beat < track.duration - hitWindow; beat += beatInterval) {
        beatTimes.push(beat);
      }
      if (!beatTimes.length) {
        track.pause();
        st.querySelector('p').textContent = 'The audio track is too short to create a beat map.';
        st.style.display = 'flex';
        $('play').disabled = false;
        return;
      }
      combo = 0; pts = 0; done = 0; nextBeat = 0;
      activeCircles = []; isPlaying = true;
      cb.textContent = '0x'; ac.textContent = '100.00%';
      st.style.display = 'none'; $('play').disabled = false;
      tick();
    }).catch(function (error) {
      console.error('Could not play the rhythm-game track.', error);
      st.querySelector('p').textContent = 'Could not play Shiawase.vip.mp3. Check that the audio file is available.';
      st.style.display = 'flex'; $('play').disabled = false;
    });
  });
})();
;
