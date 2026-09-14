const list = document.querySelector('#applications');
const form = document.querySelector('#application-form');
const message = document.querySelector('#message');
const search = document.querySelector('#search');
const filterStatus = document.querySelector('#filter-status');
const stats = document.querySelector('#stats');

const escapeHtml = (value = '') => value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function loadApplications() {
  const params = new URLSearchParams({ search: search.value, status: filterStatus.value });
  const res = await fetch(`/api/applications?${params}`);
  const applications = await res.json();
  renderApplications(applications);
  renderStats(applications);
}

function renderStats(applications) {
  const interviews = applications.filter(a => a.status === 'Interview').length;
  const offers = applications.filter(a => a.status === 'Offer').length;
  stats.innerHTML = `
    <div><strong>${applications.length}</strong><span>Shown</span></div>
    <div><strong>${interviews}</strong><span>Interviews</span></div>
    <div><strong>${offers}</strong><span>Offers</span></div>`;
}

function renderApplications(applications) {
  if (!applications.length) {
    list.innerHTML = '<p class="empty">No applications match your filters yet.</p>';
    return;
  }

  list.innerHTML = applications.map(app => `
    <article class="card">
      <div class="card-top">
        <div><h3>${escapeHtml(app.role)}</h3><p>${escapeHtml(app.company)}</p></div>
        <select class="status-select" data-id="${app.id}">
          ${['Applied','Interview','Offer','Rejected','Withdrawn'].map(s => `<option ${s === app.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <p class="meta">${app.date_applied ? `Applied ${escapeHtml(app.date_applied)}` : 'Date not set'}</p>
      ${app.notes ? `<p class="notes">${escapeHtml(app.notes)}</p>` : ''}
      <div class="actions">
        ${app.link ? `<a href="${escapeHtml(app.link)}" target="_blank" rel="noopener">View posting</a>` : '<span></span>'}
        <button class="danger" data-delete="${app.id}">Delete</button>
      </div>
    </article>`).join('');

  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async e => {
      await fetch(`/api/applications/${e.target.dataset.id}`, {
        method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({status: e.target.value})
      });
      loadApplications();
    });
  });

  document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      await fetch(`/api/applications/${button.dataset.delete}`, {method:'DELETE'});
      loadApplications();
    });
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    company: document.querySelector('#company').value,
    role: document.querySelector('#role').value,
    status: document.querySelector('#status').value,
    date_applied: document.querySelector('#date_applied').value,
    link: document.querySelector('#link').value,
    notes: document.querySelector('#notes').value
  };

  const res = await fetch('/api/applications', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json();
    message.textContent = error.error || 'Could not add application.';
    return;
  }
  form.reset();
  message.textContent = 'Application added.';
  setTimeout(() => message.textContent = '', 1800);
  loadApplications();
});

let debounce;
search.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(loadApplications, 200); });
filterStatus.addEventListener('change', loadApplications);
loadApplications();
