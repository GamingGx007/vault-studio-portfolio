// =========================================================
// Premium Custom Cursor Logic
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Only enable custom cursor on non-touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  // Create cursor elements
  const dot = document.createElement('div');
  const ring = document.createElement('div');

  dot.className = 'custom-cursor-dot';
  ring.className = 'custom-cursor-ring';

  document.body.appendChild(dot);
  document.body.appendChild(ring);

  // Track mouse coordinates
  let mouseX = 0;
  let mouseY = 0;

  // Actual ring coordinates (for lerping/lag effect)
  let ringX = 0;
  let ringY = 0;

  let isHovered = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Show cursor on first movement
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });

  // Follow loop with linear interpolation (lerp) for smooth trailing
  function updateCursor() {
    // Positioning the center of dot (8px diameter)
    dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;

    // Lerp formula: current + (target - current) * speed
    const lerpSpeed = 0.15;
    ringX += (mouseX - ringX) * lerpSpeed;
    ringY += (mouseY - ringY) * lerpSpeed;

    // Positioning the center of ring (36px diameter)
    ring.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0)`;

    requestAnimationFrame(updateCursor);
  }
  requestAnimationFrame(updateCursor);

  // Handle active states on hover
  const hoverTargets = 'a, button, input, select, textarea, .project-card, .navbar__toggle, [role="button"]';

  const addHoverClass = () => {
    ring.classList.add('hovered');
    dot.classList.add('hovered');
  };

  const removeHoverClass = () => {
    ring.classList.remove('hovered');
    dot.classList.remove('hovered');
  };

  // Delegate mouseover/mouseout events globally
  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest(hoverTargets)) {
      addHoverClass();
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target && e.target.closest(hoverTargets)) {
      removeHoverClass();
    }
  });

  // Mouse down/up click effects
  document.addEventListener('mousedown', () => {
    ring.classList.add('clicked');
    dot.classList.add('clicked');
  });

  document.addEventListener('mouseup', () => {
    ring.classList.remove('clicked');
    dot.classList.remove('clicked');
  });

  // Hide cursor when leaving viewport
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
});
