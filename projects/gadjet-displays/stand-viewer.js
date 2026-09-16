(() => {
  const root = document.querySelector('[data-stand-viewer]');
  if (!root) return;
  const launch = root.querySelector('.stand-launch');
  const button = launch.querySelector('button');
  const status = root.querySelector('.stand-status');
  const stage = root.querySelector('.stand-stage');
  let viewer, loading = false, visible = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function updateRotation() {
    if (viewer) viewer.autoRotate = visible && !document.hidden && !motion.matches;
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
        alt:'Interactive GadJet Ultimate Slim retail display. Drag horizontally to rotate.',
        'camera-controls':'', 'disable-zoom':'', 'disable-pan':'',
        'camera-orbit':'-20deg 85deg auto', 'field-of-view':'28deg',
        'min-camera-orbit':'auto 85deg 3m', 'max-camera-orbit':'auto 85deg 6m',
        'camera-target':'0m 0.84m 0m', 'tone-mapping':'neutral', exposure:'0.95',
        'shadow-intensity':'0.75','shadow-softness':'0', ar:'',
        'ar-modes':'scene-viewer quick-look', 'ar-scale':'fixed', 'ar-placement':'floor',
        'touch-action':'pan-y', 'interaction-prompt':'none',
        'rotation-per-second':'15deg', 'auto-rotate-delay':'1500'
      };
      Object.entries(attributes).forEach(([key,value])=>viewer.setAttribute(key,value));
      viewer.addEventListener('load',()=>{
        launch.hidden = true;
        status.textContent = '';
        loading = false;
      },{once:true});
      viewer.addEventListener('error', fail, {once:true});
      stage.append(viewer);
      updateRotation();
    } catch { fail(); }
  }
  button.addEventListener('click', load);
  const preload = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { preload.disconnect(); load(); }
  }, {rootMargin:'1200px 0px'});
  preload.observe(root);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updateRotation();
  }).observe(stage);
  motion.addEventListener('change', updateRotation);
  document.addEventListener('visibilitychange', updateRotation);
  function fail() {
    viewer?.remove();
    viewer = null;
    loading = false;
    launch.hidden = false;
    button.disabled = false;
    status.textContent = 'The stand could not load. Please try again.';
  }
})();
