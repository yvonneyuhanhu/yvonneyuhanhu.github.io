const siteRoot = new URL('.', window.location.href);
const form = document.getElementById('unlock-form');
const passwordField = document.getElementById('access-password');
const unlockButton = document.getElementById('unlock-button');
const status = document.getElementById('unlock-status');
const gate = document.getElementById('gate');
const viewer = document.getElementById('portfolio');
const lockButton = document.getElementById('lock-button');
const decoder = new TextDecoder();

let encrypted;
let fileIndex;
let contents;
const objectURLs = new Map();

function report(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

async function loadPackage() {
  const response = await fetch(new URL('portfolio.enc', siteRoot));
  if (!response.ok) throw new Error('Download unavailable');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 48 || decoder.decode(bytes.subarray(0, 4)) !== 'YHP1') {
    throw new Error('Unrecognized package');
  }
  return bytes;
}

async function unlockPackage(password) {
  const header = encrypted.subarray(0, 32);
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: header.subarray(4, 20), iterations: 600_000, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: header.subarray(20, 32), additionalData: header, tagLength: 128 },
    key, encrypted.subarray(32)
  );
}

function installPackage(buffer) {
  const manifestSize = new DataView(buffer).getUint32(0);
  if (manifestSize === 0 || manifestSize > buffer.byteLength - 4) {
    throw new Error('Invalid portfolio index');
  }
  const manifest = new Uint8Array(buffer, 4, manifestSize);
  fileIndex = new Map(Object.entries(JSON.parse(decoder.decode(manifest))));
  contents = new Uint8Array(buffer, 4 + manifestSize);
  if (!isPage('index.html')) throw new Error('Missing portfolio homepage');
}

function isPage(path) {
  return path.endsWith('.html') && fileIndex.has(path);
}

function fileBytes(path) {
  const [start, length] = fileIndex.get(path);
  return contents.subarray(start, start + length);
}

function fileURL(path) {
  if (!objectURLs.has(path)) {
    const type = fileIndex.get(path)[2];
    objectURLs.set(path, URL.createObjectURL(new Blob([fileBytes(path)], { type })));
  }
  return objectURLs.get(path);
}

function localPath(url) {
  return url.origin === siteRoot.origin && url.pathname.startsWith(siteRoot.pathname)
    ? url.pathname.slice(siteRoot.pathname.length)
    : null;
}

function renderPage(path) {
  const pageURL = new URL(path, siteRoot);
  const page = new DOMParser().parseFromString(decoder.decode(fileBytes(path)), 'text/html');
  page.documentElement.dataset.portfolioPage = path;

  for (const attribute of ['href', 'src']) {
    for (const element of page.querySelectorAll('[' + attribute + ']')) {
      const address = new URL(element.getAttribute(attribute), pageURL);
      const target = localPath(address);
      if (target === null) continue;
      if (isPage(target) && attribute === 'href' && element.localName === 'a') {
        element.dataset.portfolioLink = '';
        element.setAttribute(attribute, address.href);
      } else if (fileIndex.has(target)) {
        element.setAttribute(attribute, fileURL(target) + address.hash);
      } else {
        element.removeAttribute(attribute);
      }
    }
  }

  for (const image of page.querySelectorAll('[srcset]')) {
    const candidates = image.getAttribute('srcset').split(',').flatMap(candidate => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      const path = localPath(new URL(url, pageURL));
      return fileIndex.has(path) ? [[fileURL(path), ...descriptor].join(' ')] : [];
    });
    image.setAttribute('srcset', candidates.join(', '));
  }

  viewer.srcdoc = '<!doctype html>\n' + page.documentElement.outerHTML;
}

function currentPage() {
  const path = localPath(new URL(window.location.href)) || 'index.html';
  return isPage(path) ? path : 'index.html';
}

function scrollToCurrentAnchor() {
  const hash = window.location.hash.slice(1);
  const target = hash && viewer.contentDocument.getElementById(hash);
  if (target) target.scrollIntoView();
  else viewer.contentWindow.scrollTo(0, 0);
}

function showRoute() {
  const path = currentPage();
  if (viewer.contentDocument?.documentElement.dataset.portfolioPage === path) {
    scrollToCurrentAnchor();
  } else {
    renderPage(path);
  }
}

viewer.addEventListener('load', () => {
  const page = viewer.contentDocument;
  if (!fileIndex || page.documentElement.dataset.portfolioPage !== currentPage()) return;
  document.title = page.title;
  page.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[data-portfolio-link]');
    if (!link) return;
    event.preventDefault();
    if (link.href !== window.location.href) window.history.pushState(null, '', link.href);
    showRoute();
  });
  scrollToCurrentAnchor();
});

window.addEventListener('popstate', () => {
  if (fileIndex) showRoute();
});
lockButton.addEventListener('click', () => {
  for (const url of objectURLs.values()) URL.revokeObjectURL(url);
  window.location.reload();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!crypto.subtle || unlockButton.disabled) return;
  const password = passwordField.value.trim();
  if (!password) return;
  passwordField.value = '';
  unlockButton.disabled = true;
  report('Unlocking…');

  try {
    encrypted ??= await loadPackage();
  } catch {
    report('The portfolio couldn’t load. Please try again.', true);
    unlockButton.disabled = false;
    passwordField.focus();
    return;
  }

  let unlocked;
  try {
    unlocked = await unlockPackage(password);
  } catch {
    report('That password didn’t unlock the portfolio. Try again.', true);
    unlockButton.disabled = false;
    passwordField.focus();
    return;
  }

  try {
    installPackage(unlocked);
    showRoute();
    gate.hidden = true;
    viewer.hidden = false;
    lockButton.hidden = false;
  } catch {
    fileIndex = undefined;
    contents = undefined;
    report('The portfolio couldn’t open. Please reload and try again.', true);
    unlockButton.disabled = false;
  }
});

if (globalThis.crypto?.subtle) {
  unlockButton.disabled = false;
} else {
  report('Open the HTTPS portfolio link in a modern browser to unlock it.', true);
}
