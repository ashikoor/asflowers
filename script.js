// Smooth scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  
  // Reveal on intersection
  (() => {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(el => obs.observe(el));
  })();
  
// Magnetic buttons and 3D tilt for poster cards
(() => {
  const magnets = document.querySelectorAll('.btn-cut, .menu-link');
  magnets.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 12;
      el.style.transition = 'transform 120ms ease';
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });

  const tilts = document.querySelectorAll('.poster-card, .sticker');
  tilts.forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientX - r.left) / r.width - 0.5) * -10;
      const ry = ((e.clientY - r.top) / r.height - 0.5) * 10;
      el.style.transition = 'transform 80ms ease';
      el.style.transform = `perspective(800px) rotateX(${ry}deg) rotateY(${rx}deg) translateY(-2px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
})();

// Make poster cards clickable (fix Highlights not opening)
(() => {
  document.querySelectorAll('.poster-card').forEach(card => {
    const link = card.querySelector('.poster-link');
    if (!link) return;

    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      window.location.href = link.href;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = link.href;
      }
    });
  });
})();

// REPLACED: html2canvas screenshot export
// ADDED: Real poster composer (Canvas-based, high-resolution, with logo + watermark)
(() => {
  const BRAND = {
    name: 'as flowers',
    pink: '#ff2e88', cyan: '#00e5ff', violet: '#8b5cf6', mango: '#ffb703', rose: '#ff6289',
    stroke: '#000000', paper: '#ffffff'
  };

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  // ADDED: stanza-aware wrapping (preserves line breaks and adds stanza spacing)
  function wrapParagraph(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawPoemText(ctx, poemText, x, yStart, maxWidth, cardBottom) {
    const paragraphs = poemText.replace(/\r/g, '').split(/\n{2,}/); // split on blank lines
    let y = yStart;
    const lineHeight = 60;           // tighter, magazine feel
    const stanzaGap = 28;            // gap between stanzas
    ctx.fillStyle = BRAND.stroke;
    ctx.font = '600 44px Poppins, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    for (const para of paragraphs) {
      const lines = para.split('\n').flatMap(line => wrapParagraph(ctx, line.trim(), maxWidth));
      for (const line of lines) {
        if (y + lineHeight > cardBottom) return; // avoid overflow
        ctx.fillText(line, x, y);
        y += lineHeight;
      }
      y += stanzaGap;
      if (y > cardBottom) break;
    }
  }

  // ADDED: Instagram glyph drawn before the handle
  function drawInstagramGlyph(ctx, x, y, size) {
    const r = size / 6;
    // rounded square
    roundRect(ctx, x, y, size, size, r);
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, BRAND.pink);
    g.addColorStop(0.5, BRAND.mango);
    g.addColorStop(1, BRAND.violet);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    // lens
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.55, size * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    // small flash dot
    ctx.beginPath();
    ctx.arc(x + size * 0.78, y + size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
  }

  function getInstagramHandle() {
    const link = document.querySelector('.poem-meta a[href*="instagram.com"]');
    if (!link) return null;
    try {
      const url = new URL(link.href);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    } catch {
      // Fallback: attempt to read text content like @handle
      const txt = link.textContent?.trim();
      if (txt && txt.startsWith('@')) return txt.slice(1);
      return null;
    }
  }

  // ADDED: helper to mount the secret admin poster page
  // REPLACED: malformed IIFE with a proper async function
  async function composePoster({ admin = false } = {}) {
    // Ensure fonts are ready for canvas
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch {}
    }

    // Gather content
    const title = (document.querySelector('.poem-title')?.textContent || 'Untitled').trim();
    const poet = (document.querySelector('.poem-meta span')?.textContent || '').trim();
    const ig = getInstagramHandle();
    const feature = (document.querySelector('.featured-badge')?.textContent || '').trim();
    const poemRaw = (document.querySelector('.poem-body')?.textContent || '').trim();

    // Instagram 4:5 size when admin mode
    const W = admin ? 2160 : 2400;
    const H = admin ? 2700 : 3200;
    const M = admin ? 80 : 120;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // OPTIONAL: Instagram style page framing when admin
    if (admin) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 36;
      ctx.strokeStyle = '#ffffff';
      roundRect(ctx, 18, 18, W - 36, H - 36, 48);
      ctx.stroke();
      ctx.restore();
    } else {
      // regular background
      ctx.fillStyle = BRAND.paper;
      ctx.fillRect(0, 0, W, H);
    }

    // Soft radial color wash backdrop
    const g1 = ctx.createRadialGradient(W * -0.1, H * 0.1, 0, W * -0.1, H * 0.1, W * 0.8);
    g1.addColorStop(0, 'rgba(255,46,136,0.12)');
    g1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 1.1, H * 0.2, 0, W * 1.1, H * 0.2, W * 0.7);
    g2.addColorStop(0, 'rgba(0,229,255,0.12)');
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Outer frame
    ctx.save();
    roundRect(ctx, M, M, W - M * 2, H - M * 2, admin ? 36 : 40);
    ctx.lineWidth = admin ? 10 : 12;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    ctx.restore();

    // Title
    const titleY = M + (admin ? 180 : 220);
    const titleX = M + (admin ? 120 : 160);
    ctx.save();
    ctx.font = admin ? '800 132px "Bungee", Poppins, sans-serif' : '800 160px "Bungee", Poppins, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = BRAND.stroke;
    const tg = ctx.createLinearGradient(titleX, titleY - 160, titleX + 1000, titleY);
    tg.addColorStop(0, BRAND.pink);
    tg.addColorStop(0.5, BRAND.cyan);
    tg.addColorStop(1, BRAND.violet);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 14;
    ctx.strokeText(title, titleX, titleY);
    ctx.fillStyle = tg;
    ctx.fillText(title, titleX, titleY);
    ctx.restore();

    // Underline ribbon
    ctx.save();
    const ribbonY = titleY + 40;
    const ribbonH = admin ? 24 : 28;
    roundRect(ctx, titleX - 10, ribbonY, W - titleX - M, ribbonH, 12);
    ctx.lineWidth = 8;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    const rg = ctx.createLinearGradient(titleX - 10, ribbonY, titleX + 600, ribbonY);
    rg.addColorStop(0.00, BRAND.pink);
    rg.addColorStop(0.25, BRAND.cyan);
    rg.addColorStop(0.50, BRAND.violet);
    rg.addColorStop(0.75, BRAND.mango);
    rg.addColorStop(1.00, BRAND.rose);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.restore();

    // Poet chip
    ctx.save();
    const poetText = poet || '';
    ctx.font = admin ? '800 48px Poppins, sans-serif' : '800 56px Poppins, sans-serif';
    const pmW = ctx.measureText(poetText).width + 40;
    const pmX = titleX;
    const pmY = ribbonY + 100;
    roundRect(ctx, pmX, pmY, pmW, 68, 14);
    const pg = ctx.createLinearGradient(pmX, pmY, pmX + pmW, pmY + 68);
    pg.addColorStop(0, BRAND.mango);
    pg.addColorStop(1, BRAND.rose);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(poetText, pmX + 20, pmY + 34);
    ctx.restore();

    // Instagram handle chip (with glyph)
    if (ig) {
      ctx.save();
      const igText = '@' + ig;
      ctx.font = admin ? '800 42px Poppins, sans-serif' : '800 48px Poppins, sans-serif';
      const glyphSize = admin ? 36 : 42;
      const padding = 20;
      const igW = ctx.measureText(igText).width + glyphSize + padding * 2 + 12;
      const igX = pmX + pmW + 20;
      const igY = pmY;
      roundRect(ctx, igX, igY, igW, 68, 14);
      const igg = ctx.createLinearGradient(igX, igY, igX + igW, igY + 68);
      igg.addColorStop(0, BRAND.cyan);
      igg.addColorStop(1, BRAND.violet);
      ctx.fillStyle = igg;
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = BRAND.stroke;
      ctx.stroke();
      const gx = igX + padding;
      const gy = igY + (68 - glyphSize) / 2;
      drawInstagramGlyph(ctx, gx, gy, glyphSize);
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(igText, gx + glyphSize + 12, igY + 34);
      ctx.restore();
    }

    // Featured badge (optional)
    if (feature) {
      ctx.save();
      ctx.font = admin ? '800 38px Poppins, sans-serif' : '800 44px Poppins, sans-serif';
      const fbW = ctx.measureText(feature).width + 40;
      const fbX = pmX;
      const fbY = pmY + 88;
      roundRect(ctx, fbX, fbY, fbW, 60, 12);
      const fbg = ctx.createLinearGradient(fbX, fbY, fbX + fbW, fbY + 60);
      fbg.addColorStop(0, BRAND.pink);
      fbg.addColorStop(1, BRAND.cyan);
      ctx.fillStyle = fbg;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = BRAND.stroke;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(feature, fbX + 20, fbY + 30);
      ctx.restore();
    }

    // Poem card
    const cardX = titleX;
    const cardY = (feature ? pmY + 170 : pmY + 120);
    const cardW = W - cardX - M;
    const cardH = H - cardY - (admin ? 320 : 420);
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.setLineDash([28, 20]);
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    ctx.restore();

    // Drop cap
    const firstLetter = poemRaw.charAt(0) || '';
    const restPoem = firstLetter ? poemRaw.slice(1) : poemRaw;
    ctx.save();
    const dcX = cardX + 24;
    const dcY = cardY + 24;
    roundRect(ctx, dcX, dcY, 120, 120, 16);
    const dcg = ctx.createLinearGradient(dcX, dcY, dcX + 120, dcY + 120);
    dcg.addColorStop(0, BRAND.pink);
    dcg.addColorStop(1, BRAND.mango);
    ctx.fillStyle = dcg;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 84px "Bungee", Poppins, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(firstLetter, dcX + 60, dcY + 66);
    ctx.restore();

    // Poem text (multiline support kept)
    const textX = dcX + 120 + 30;
    const textYStart = cardY + 60;
    ctx.save();
    ctx.fillStyle = BRAND.stroke;
    ctx.font = admin ? '600 44px Poppins, sans-serif' : '600 48px Poppins, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const lines = wrapParagraph(ctx, restPoem, cardW - (textX - cardX) - 40);
    let y = textYStart;
    const lineHeight = admin ? 58 : 64;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, y);
      y += lineHeight;
      if (y > cardY + cardH - 40) break;
    }
    ctx.restore();

    // Watermark
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = BRAND.stroke;
    ctx.textAlign = 'center';
    ctx.font = '800 220px Poppins, sans-serif';
    ctx.fillText(BRAND.name, 0, 0);
    ctx.restore();

    // Footer stripe
    ctx.save();
    const footY = H - M - (admin ? 110 : 140);
    roundRect(ctx, M + 40, footY, W - (M + 40) * 2, 32, 12);
    const fg = ctx.createLinearGradient(M, footY, W - M, footY);
    fg.addColorStop(0, BRAND.pink);
    fg.addColorStop(0.25, BRAND.cyan);
    fg.addColorStop(0.5, BRAND.violet);
    fg.addColorStop(0.75, BRAND.mango);
    fg.addColorStop(1, BRAND.rose);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = BRAND.stroke;
    ctx.stroke();
    ctx.restore();

    // Logo bottom-left (no crossOrigin; with fallback)
    async function tryLoadLogo(paths) {
      for (const p of paths) {
        const img = new Image();
        const loaded = await new Promise((res) => {
          img.onload = () => res(true);
          img.onerror = () => res(false);
          img.src = p;
        });
        if (loaded && img.naturalWidth) return img;
      }
      return null;
    }
    const logoCandidates = location.pathname.includes('/poems/')
      ? ['../asflowers.jpg', '../assets/asflowers.jpg', '../asflowers.png']
      : ['asflowers.jpg', './asflowers.jpg', 'assets/asflowers.jpg'];
    const logoImg = await tryLoadLogo(logoCandidates);
    const logoSize = admin ? 150 : 180;
    const lx = M + 40, ly = H - M - logoSize - 40;
    if (logoImg) {
      ctx.save();
      roundRect(ctx, lx - 10, ly - 10, logoSize + 20, logoSize + 20, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = BRAND.stroke;
      ctx.stroke();
      ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
      ctx.restore();
      const smallSize = admin ? 84 : 96;
      const sx = W - M - smallSize - 40;
      const sy = M + 40;
      ctx.save();
      roundRect(ctx, sx - 8, sy - 8, smallSize + 16, smallSize + 16, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = BRAND.stroke;
      ctx.stroke();
      ctx.drawImage(logoImg, sx, sy, smallSize, smallSize);
      ctx.restore();
    } else {
      ctx.save();
      roundRect(ctx, lx - 10, ly - 10, logoSize + 20, logoSize + 20, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = BRAND.stroke;
      ctx.stroke();
      ctx.fillStyle = BRAND.stroke;
      ctx.font = '800 48px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(BRAND.name, lx + logoSize / 2, ly + logoSize / 2);
      ctx.restore();
    }

    // Mount admin page (no download)
    if (admin) {
      const root = ensureAdminPosterPage();
      root.innerHTML = '';
      canvas.style.width = '1080px';
      canvas.style.height = '1350px';
      canvas.style.borderRadius = '36px';
      canvas.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)';
      root.appendChild(canvas);
    }
  }

  // ADDED: secret admin page mount + triggers
  function ensureAdminPosterPage() {
    let root = document.getElementById('admin-poster');
    if (!root) {
      // Make a clean page for the poster view
      document.body.innerHTML = '';
      root = document.createElement('div');
      root.id = 'admin-poster';
      root.style.position = 'fixed';
      root.style.inset = '0';
      root.style.background = '#0f0f12';
      root.style.display = 'grid';
      root.style.placeItems = 'center';
      root.style.padding = '40px';
      document.body.appendChild(root);
    }
    return root;
  }

  // ADD: ensure favicon exists on all pages (handles poems/* relative path)
  document.addEventListener('DOMContentLoaded', () => {
    const head = document.head;
    const href = location.pathname.includes('/poems/') ? '../asflowers.jpg' : 'asflowers.jpg';
  
    // icon
    let icon = head.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/jpeg';
      icon.href = href;
      head.appendChild(icon);
    } else if (!icon.href) {
      icon.type = 'image/jpeg';
      icon.href = href;
    }
  
    // apple touch icon
    if (!head.querySelector('link[rel="apple-touch-icon"]')) {
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = href;
      head.appendChild(apple);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const isPoem = !!document.querySelector('.poem-body');
    const qs = new URLSearchParams(location.search);
    const isAdmin = location.hash.includes('admin-poster') || qs.get('poster') === '1';
    if (isPoem && isAdmin) {
      composePoster({ admin: true });
    }
    // Shortcut: Ctrl+Shift+P
    window.addEventListener('keydown', (e) => {
      if (isPoem && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        composePoster({ admin: true });
      }
    });
  });
})();

// Cartoon flower cursor (DOM-based)
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sticker = document.createElement('div');
  sticker.className = 'cursor-flower';
  sticker.innerHTML = '<span class="cf-face">✿</span>';
  document.body.appendChild(sticker);

  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y;

  function move(e) {
    tx = e.clientX;
    ty = e.clientY;
  }
  window.addEventListener('pointermove', move, { passive: true });

  function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    sticker.style.transform = `translate(${x - 23}px, ${y - 23}px)`;
    if (!prefersReduced) requestAnimationFrame(loop);
  }
  if (!prefersReduced) loop();

  window.addEventListener('click', () => {
    sticker.classList.add('pop');
    sticker.addEventListener('animationend', () => sticker.classList.remove('pop'), { once: true });
  });
})();

// Make poster cards clickable (fix Highlights not opening)
(() => {
  document.querySelectorAll('.poster-card').forEach(card => {
    const link = card.querySelector('.poster-link');
    if (!link) return;

    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      window.location.href = link.href;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = link.href;
      }
    });
  });
})();
