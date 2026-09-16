(() => {
  const root = document.querySelector('[data-stand-viewer]');
  if (!root) return;
  const launch = root.querySelector('.stand-launch');
  const button = launch.querySelector('button');
  const status = root.querySelector('.stand-status');
  const stage = root.querySelector('.stand-stage');
  const sticky = document.createElement('div');
  sticky.className = 'stand-sticky';
  sticky.append(...root.children);
  root.append(sticky);
  root.querySelector('.stand-hint').textContent = 'On supported phones, view it in your space using AR.';
  let viewer, loading = false, ready = false, frame = 0, start = 0, distance = 1, lastAngle;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function updateRotation() {
    frame = 0;
    if (!ready || motion.matches) return;
    const progress = Math.max(0, Math.min(1, (scrollY - start) / distance));
    const angle = -80 + progress * 160;
    if (angle === lastAngle) return;
    lastAngle = angle;
    viewer.cameraOrbit = `${angle}deg 85deg auto`;
    viewer.jumpCameraToGoal();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(updateRotation);
  }
  function measure() {
    root.classList.toggle('is-scroll-stand', ready && !motion.matches);
    if (viewer) viewer.cameraControls = motion.matches;
    start = root.getBoundingClientRect().top + scrollY;
    distance = Math.max(1, root.offsetHeight - sticky.offsetHeight);
    lastAngle = undefined;
    schedule();
  }
  async function load() {
    if (loading || viewer) return;
    loading = true;
    button.disabled = true;
    status.textContent = 'Loading interactive stand…';
    try {
      await import('./model-viewer.min.js');
      await customElements.whenDefined('model-viewer');
      viewer = document.createElement('model-viewer');
      const media = '../../media/projects/gadjet-displays/case-study/';
      const attributes = {
        src:media+'ultimate-slim.glb', 'ios-src':media+'ultimate-slim.usdz',
        'environment-image':media+'stand-environment.png',
        alt:'GadJet Ultimate Slim retail display, rotating from its left side through the front to its right side as the page scrolls.',
        'disable-zoom':'', 'disable-pan':'',
        'camera-orbit':'-80deg 85deg auto', 'field-of-view':'28deg',
        'min-camera-orbit':'auto 85deg 3m', 'max-camera-orbit':'auto 85deg 6m',
        'camera-target':'0m 0.84m 0m', 'tone-mapping':'neutral', exposure:'0.95',
        'shadow-intensity':'0.75','shadow-softness':'0', ar:'',
        'ar-modes':'scene-viewer quick-look', 'ar-scale':'fixed', 'ar-placement':'floor',
        'touch-action':'pan-y', 'interaction-prompt':'none'
      };
      Object.entries(attributes).forEach(([key,value])=>viewer.setAttribute(key,value));
      viewer.addEventListener('load',()=>{
        launch.hidden = true;
        status.textContent = '';
        loading = false;
        ready = true;
        measure();
      },{once:true});
      viewer.addEventListener('error', fail, {once:true});
      stage.append(viewer);
    } catch { fail(); }
  }
  button.addEventListener('click', load);
  const preload = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { preload.disconnect(); load(); }
  }, {rootMargin:'1200px 0px'});
  preload.observe(root);
  motion.addEventListener('change', measure);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', measure, {passive:true});
  addEventListener('load', measure, {once:true});
  new ResizeObserver(measure).observe(document.querySelector('.case-body') || root.parentElement);
  function fail() {
    viewer?.remove();
    viewer = null;
    loading = false;
    ready = false;
    measure();
    launch.hidden = false;
    button.disabled = false;
    status.textContent = 'The stand could not load. Please try again.';
  }
})();
