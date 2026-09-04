// Tiny fetch wrapper with CSRF + session cookies. Same-origin, no CORS *.
let csrf = '';

export async function getCsrf() {
  if (csrf) return csrf;
  try {
    const r = await fetch('/api/csrf', { credentials: 'same-origin' });
    const j = await r.json();
    csrf = j.token || '';
  } catch { csrf = ''; }
  return csrf;
}

async function req(path, opts = {}, retried = false) {
  const headers = { ...(opts.headers || {}) };
  let body = opts.body;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isForm && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  if ((opts.method || 'GET').toUpperCase() !== 'GET' && !isForm) {
    headers['X-CSRF-Token'] = await getCsrf();
  }
  const r = await fetch(path, { credentials: 'same-origin', ...opts, headers, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    // Session died (logout, server restart, expiry) while the page stayed open:
    // the cached token is stale. Refresh once and retry instead of locking the user out.
    if (j.error === 'bad_csrf' && !retried) {
      csrf = '';
      await getCsrf();
      return req(path, opts, true);
    }
    const e = new Error(j.error || ('http_' + r.status));
    e.code = j.error;
    e.status = r.status;
    e.data = j;
    throw e;
  }
  return j;
}

async function uploadFile(path, file, retried = false) {
  await getCsrf();
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.error === 'bad_csrf' && !retried) {
      csrf = '';
      return uploadFile(path, file, true);
    }
    throw new Error(j.error || 'upload_failed');
  }
  return j;
}

export const api = {
  health: () => req('/api/health'),
  projects: (p = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') q.set(k, v);
    return req('/api/projects?' + q.toString());
  },
  project: (id) => req('/api/projects/' + encodeURIComponent(id)),
  like: (projectId, visitorId, liked) =>
    req('/api/likes', { method: 'POST', body: { projectId, visitorId, liked } }),
  myLikes: (visitorId) => req('/api/me/likes?visitorId=' + encodeURIComponent(visitorId)),
  content: () => req('/api/content'),
  saveContent: (obj) => req('/api/content', { method: 'POST', body: obj }),
  getAbout: () => req('/api/about'),
  saveAbout: (obj) => req('/api/about', { method: 'PUT', body: obj }),
  getContact: () => req('/api/contact'),
  saveContact: (obj) => req('/api/contact', { method: 'PUT', body: obj }),
  getHero: () => req('/api/hero'),
  saveHero: (obj) => req('/api/hero', { method: 'PUT', body: obj }),
  login: (username, password) => req('/api/admin/login', { method: 'POST', body: { username, password } }),
  logout: () => req('/api/admin/logout', { method: 'POST', body: {} }),
  status: () => req('/api/admin/status'),
  changePassword: (currentPassword, newPassword) =>
    req('/api/admin/password', { method: 'POST', body: { currentPassword, newPassword } }),
  createProject: (obj) => req('/api/admin/projects', { method: 'POST', body: obj }),
  updateProject: (id, obj) => req('/api/admin/projects/' + encodeURIComponent(id), { method: 'PUT', body: obj }),
  deleteProject: (id) => req('/api/admin/projects/' + encodeURIComponent(id), { method: 'DELETE' }),
  reorder: (orders) => req('/api/admin/reorder', { method: 'POST', body: { orders } }),
  renameCategory: (from, to) => req('/api/admin/categories/rename', { method: 'POST', body: { from, to } }),
  deleteCategory: (name) => req('/api/admin/categories', { method: 'DELETE', body: { name } }),
  uploadImage: (file) => uploadFile('/api/upload', file),
  uploadFont: (file) => uploadFile('/api/upload-font', file),
  deleteFont: (url) => req('/api/admin/fonts', { method: 'DELETE', body: { url } }),
};
