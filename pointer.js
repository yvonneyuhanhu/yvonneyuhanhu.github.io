const pointerMedia = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const dot = document.createElement('span');
const ring = document.createElement('span');
dot.className = 'pointer-dot';
ring.className = 'pointer-ring';
dot.setAttribute('aria-hidden', 'true');
ring.setAttribute('aria-hidden', 'true');
document.body.append(ring, dot);

let x = 0;
let y = 0;
let ringX = 0;
let ringY = 0;
let frame = 0;
let visible = false;

function place(element, left, top) {
  element.style.transform = 'translate3d(' + left + 'px, ' + top + 'px, 0) translate(-50%, -50%)';
}

function followPointer() {
  ringX += (x - ringX) * .25;
  ringY += (y - ringY) * .25;
  place(ring, ringX, ringY);
  frame = Math.abs(x - ringX) + Math.abs(y - ringY) > .25
    ? window.requestAnimationFrame(followPointer)
    : 0;
}

function hidePointer() {
  visible = false;
  document.documentElement.classList.remove('has-pointer');
  window.cancelAnimationFrame(frame);
  frame = 0;
}

document.addEventListener('pointermove', event => {
  const target = event.target;
  if (!pointerMedia.matches || event.pointerType !== 'mouse' || !(target instanceof Element) ||
      target.closest('input, textarea, select, [contenteditable], iframe, object')) {
    hidePointer();
    return;
  }

  x = event.clientX;
  y = event.clientY;
  if (!visible) {
    visible = true;
    ringX = x;
    ringY = y;
    place(ring, ringX, ringY);
    document.documentElement.classList.add('has-pointer');
  }

  place(dot, x, y);
  ring.classList.toggle('over-link', Boolean(target.closest('a[href], button:not(:disabled)')));
  if (!frame) frame = window.requestAnimationFrame(followPointer);
}, { passive: true });

document.addEventListener('pointerleave', hidePointer);
document.addEventListener('keydown', hidePointer);
window.addEventListener('blur', hidePointer);
pointerMedia.addEventListener('change', hidePointer);
