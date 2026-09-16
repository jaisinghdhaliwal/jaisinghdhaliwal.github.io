(() => {
  const section = document.querySelector('.experiment');
  const stage = section.querySelector('.stage');
  const composition = section.querySelector('.composition');
  const viewer = document.querySelector('.lab-viewer');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const captions = [
    ['A different setting', 'A full-height GadJet stand placed on an outdoor path.'],
    ['Smaller footprint', 'A countertop GadJet display viewed on a brick ledge.'],
    ['See the whole range', 'A stocked GadJet stand explored outside the showroom.'],
    ['Find a place for it', 'A Goodiz sunglasses display placed in an indoor seating area.'],
    ['Alongside the real thing', 'A virtual Goodiz fan display beside physical retail displays.'],
    ['Physical meets digital', 'Physical and virtual Goodiz stands viewed side by side.']
  ];
  const sizes = [[1290,1934],[1290,1934],[1290,1934],[1290,1934],[1278,1795],[1288,1898]];
  const shots = captions.map(([title, caption], i) => {
    const button = document.createElement('button');
    button.className = 'shot';
    button.type = 'button';
    button.setAttribute('aria-label', `Enlarge: ${caption}`);
    const img = new Image();
    img.src = `../../../media/projects/gadjet-displays/case-study/AR-${i + 1}.AVIF`;
    img.alt = caption;
    [img.width, img.height] = sizes[i];
    img.loading = 'lazy';
    img.decoding = 'async';
    button.append(img);
    button.addEventListener('click', () => {
      viewer.querySelector('img').src = img.src;
      viewer.querySelector('img').alt = caption;
      viewer.querySelector('p').textContent = caption;
      viewer.showModal();
    });
    composition.append(button);
    return button;
  });
  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
  let mode = 'bento', start = 0, travel = 1, queued = false, previous = -1;
  const clamp = x => Math.max(0, Math.min(1, x));
  function render() {
    queued = false;
    if (reduced.matches) return;
    const p = clamp((scrollY - start) / travel);
    section.querySelector('.progress span').style.transform = `scaleX(${p})`;
    const index = Math.min(5, Math.floor(p * (mode === 'stack' ? 5 : 6)));
    section.querySelector('.progress-count').textContent = `${String(index + 1).padStart(2, '0')} — 06`;
    if (mode === 'bento') {
      composition.style.transform = `scale(${2.65 - 1.65 * p})`;
    } else if (mode === 'stack') {
      shots.forEach((shot, i) => {
        const exit = clamp(p * 5 - i);
        const angle = (i - 2.5) * 3;
        shot.style.transform = `translate(calc(-50% - ${exit * 115}vw), -50%) rotate(${angle - exit * 28}deg)`;
        shot.style.opacity = String(1 - exit);
        shot.style.zIndex = String(6 - i);
        shot.style.pointerEvents = i === index || (p === 1 && i === 5) ? 'auto' : 'none';
        shot.tabIndex = i === index ? 0 : -1;
      });
    } else {
      shots.forEach((shot, i) => {
        shot.style.opacity = i === index ? '1' : '0';
        shot.style.pointerEvents = i === index ? 'auto' : 'none';
        shot.tabIndex = i === index ? 0 : -1;
        shot.style.transform = i === index ? 'translateY(0)' : 'translateY(20px)';
      });
      if (index !== previous) {
        const copy = section.querySelector('.editorial-copy');
        copy.querySelector('.eyebrow').textContent = `In the field / 0${index + 1}`;
        copy.querySelector('h2').textContent = captions[index][0];
        copy.querySelector('p').textContent = captions[index][1];
      }
    }
    previous = index;
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(render); } }
  function measure() {
    start = section.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
    schedule();
  }
  const descriptions = {
    bento: 'A close-up expands into a mosaic of six real-world placements as you scroll.',
    stack: 'A stack of photographs peels away with each scroll, revealing the next placement underneath.',
    editorial: 'One photograph at a time, paired with a short field note. A quieter, more editorial treatment.'
  };
  document.querySelectorAll('.lab-options button').forEach(button => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      section.dataset.mode = mode;
      previous = -1;
      composition.style.transform = '';
      shots.forEach(shot => { shot.removeAttribute('style'); shot.tabIndex = 0; });
      document.querySelectorAll('.lab-options button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelector('#description').textContent = descriptions[mode];
      measure();
    });
  });
  document.querySelector('.try-again').addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('.lab-options').scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth', block: 'center'});
  });
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', measure, {passive: true});
  reduced.addEventListener('change', () => {
    shots.forEach(shot => { shot.tabIndex = 0; shot.style.pointerEvents = ''; });
    measure();
  });
  measure();
})();
