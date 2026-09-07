document.querySelectorAll(".case-image-set img").forEach((image) => {
  const setRatio = () => image.closest("figure")?.style.setProperty("--media-ratio", image.naturalWidth / image.naturalHeight);
  if (image.complete && image.naturalWidth) setRatio();
  else image.addEventListener("load", setRatio, { once: true });
});

const caseNav = document.querySelector(".case-local-nav");
if (caseNav) {
  const links = [...caseNav.querySelectorAll("a[href^='#']")];
  const sections = links.map((link) => document.querySelector(link.hash)).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => {
        const active = link.hash === `#${visible.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-18% 0px -65% 0px", threshold: [0, .2, .5, 1] });
    sections.forEach((section) => observer.observe(section));
  }
}
