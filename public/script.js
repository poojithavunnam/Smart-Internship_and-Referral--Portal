const TOKEN_KEY = 'smart_portal_token';
const USER_KEY = 'smart_portal_user';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? '' 
  : 'https://smart-internship-and-referral-portal.onrender.com';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3600);
}

async function fetchJson(path, options = {}) {
  const headers = options.headers || {};
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload.error || 'Something went wrong';
    throw new Error(error);
  }

  return payload;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function queryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function attachLogoutButtons() {
  const logoutButtons = document.querySelectorAll('#logout-button');
  logoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
  });
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
}

function initTheme() {
  const current = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = current;
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', toggleTheme);
}

function buildStatusBadge(status) {
  const safeClass = status.replace(/\s+/g, '-');
  return `<span class="status-badge status-${safeClass}">${status}</span>`;
}

function buildSkillTags(skills) {
  return skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
}

function renderJobCards(jobs, containerId = 'jobs-grid', searchInputId = 'dashboard-search') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const query = document.getElementById(searchInputId)?.value?.toLowerCase() || '';
  const filtered = jobs.filter(job => {
    return [job.title, job.company, job.location, job.description].some(text => text.toLowerCase().includes(query));
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><strong>No internships matched your search.</strong><p>Try a different keyword or refresh the page.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(job => `
    <article class="job-card">
      <img src="${job.image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}" alt="${job.company} internship image" />
      <div class="job-content">
        <div class="job-header-row">
          <p class="eyebrow">${job.company}</p>
          <span class="job-badge">${job.type}</span>
        </div>
        <h2 class="job-title">${job.title}</h2>
        <p class="job-subtitle">${job.location}</p>
        <div class="job-meta">
          <span>${job.stipend}</span>
          <span>${job.duration}</span>
          <span>${job.skills.length} skills</span>
        </div>
        <p class="job-description">${job.description}</p>
        <div class="skill-tags">${buildSkillTags(job.skills)}</div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="window.location.href='apply.html?jobId=${job.id}'">Apply Now</button>
          <button class="btn btn-secondary" onclick="window.location.href='referrals.html?jobId=${job.id}'">Referral</button>
        </div>
      </div>
    </article>
  `).join('');
}

async function loadDashboard() {
  if (!requireAuth()) return;
  attachLogoutButtons();
  initTheme();
  const user = getUser();
  if (!user) return;

  const searchInput = document.getElementById('dashboard-search');
  const summaryContainer = document.getElementById('dashboard-summary');
  let allJobs = [];

  function renderSummary(jobs, applications, referrals) {
    if (!summaryContainer) return;
    summaryContainer.innerHTML = `
      <article class="summary-card">
        <span class="summary-icon">💼</span>
        <div>
          <p>Active internships</p>
          <h3>${jobs.length}</h3>
        </div>
      </article>
      <article class="summary-card">
        <span class="summary-icon">📌</span>
        <div>
          <p>My applications</p>
          <h3>${applications.length}</h3>
        </div>
      </article>
      <article class="summary-card">
        <span class="summary-icon">🤝</span>
        <div>
          <p>Referral requests</p>
          <h3>${referrals.length}</h3>
        </div>
      </article>
      <article class="summary-card">
        <span class="summary-icon">📝</span>
        <div>
          <p>Interviews</p>
          <h3>0</h3>
        </div>
      </article>
    `;
  }

  async function fetchJobs() {
    try {
      const [jobsData, appsData, refData] = await Promise.all([
        fetchJson('/api/internships'),
        fetchJson('/api/applications'),
        fetchJson('/api/referrals'),
      ]);
      allJobs = jobsData.internships || [];
      renderSummary(allJobs, appsData.applications || [], refData.referrals || []);
      renderJobCards(allJobs);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  searchInput?.addEventListener('input', () => renderJobCards(allJobs, 'jobs-grid', 'dashboard-search'));

  await fetchJobs();
}

async function loadInternshipsPage() {
  if (!requireAuth()) return;
  attachLogoutButtons();
  initTheme();
  let allJobs = [];
  const searchInput = document.getElementById('internships-search');

  async function fetchJobs() {
    try {
      const jobsData = await fetchJson('/api/internships');
      allJobs = jobsData.internships || [];
      renderJobCards(allJobs, 'internships-grid', 'internships-search');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  searchInput?.addEventListener('input', () => renderJobCards(allJobs, 'internships-grid', 'internships-search'));
  await fetchJobs();
}

async function loadApplyPage() {
  if (!requireAuth()) return;
  initTheme();
  attachLogoutButtons();
  const user = getUser();
  const jobId = queryParam('jobId');
  if (!jobId) {
    showToast('Missing internship selection', 'error');
    return window.location.href = 'dashboard.html';
  }

  const summary = document.getElementById('job-summary-card');
  const nameInput = document.getElementById('applicant-name');
  const emailInput = document.getElementById('applicant-email');

  nameInput.value = user?.name || '';
  emailInput.value = user?.email || '';

  try {
    const data = await fetchJson('/api/internships');
    const job = data.internships.find(item => item.id === jobId);
    if (!job) {
      throw new Error('Internship not found');
    }

    summary.innerHTML = `
      <h2>${job.title}</h2>
      <p>${job.company} · ${job.location}</p>
      <p>${job.description}</p>
      <div class="skill-tags">${buildSkillTags(job.skills)}</div>
    `;
  } catch (error) {
    showToast(error.message, 'error');
    return window.location.href = 'dashboard.html';
  }

  const form = document.getElementById('apply-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    
    // Convert file to base64 if present
    const resumeFile = formData.get('resume');
    let resumeBase64 = '';
    if (resumeFile && resumeFile.size > 0) {
      resumeBase64 = await fileToBase64(resumeFile);
    }
    
    const body = {
      internshipId: jobId,
      skills: formData.get('skills'),
      coverLetter: formData.get('coverLetter'),
      linkedin: formData.get('linkedin'),
      resume: resumeBase64,
    };

    try {
      await fetchJson('/api/apply', {
        method: 'POST',
        body,
      });
      showToast('Application submitted successfully');
      window.location.href = 'applications.html';
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

async function loadApplicationsPage() {
  if (!requireAuth()) return;
  initTheme();
  attachLogoutButtons();

  try {
    const data = await fetchJson('/api/applications');
    const list = document.getElementById('applications-list');
    if (!data.applications.length) {
      list.innerHTML = '<div class="empty-state"><strong>No applications yet.</strong><p>Submit your first internship application from the dashboard.</p></div>';
      return;
    }

    list.innerHTML = data.applications.map(application => {
      return `
        <article class="application-card">
          <div class="application-content">
            <div class="job-meta">${buildStatusBadge(application.status)} <span>${new Date(application.appliedAt || application.createdAt).toLocaleDateString()}</span></div>
            <h2 class="application-title">${application.internshipTitle}</h2>
            <p class="job-description">${application.company}</p>
            <p>${application.coverLetter.slice(0, 140)}${application.coverLetter.length > 140 ? '...' : ''}</p>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadReferralsPage() {
  if (!requireAuth()) return;
  initTheme();
  attachLogoutButtons();

  const jobId = queryParam('jobId');
  try {
    const [internshipsData, referralsData] = await Promise.all([
      fetchJson('/api/internships'),
      fetchJson('/api/referrals'),
    ]);

    const internships = internshipsData.internships || [];
    const listSelect = document.getElementById('referral-job-select');
    listSelect.innerHTML = internships.map(job => `
      <option value="${job.id}">${job.title} · ${job.company}</option>
    `).join('');

    if (jobId) {
      listSelect.value = jobId;
    }

    const form = document.getElementById('referral-form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(form);
      const body = {
        internshipId: formData.get('internshipId'),
        message: formData.get('message'),
      };

      try {
        await fetchJson('/api/referral', {
          method: 'POST',
          body,
        });
        showToast('Referral request sent');
        window.location.href = 'referrals.html';
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    const referrals = referralsData.referrals || [];
    const list = document.getElementById('referrals-list');
    if (!referrals.length) {
      list.innerHTML = '<div class="empty-state"><strong>No referral requests yet.</strong><p>Request a referral from a company you want to apply to.</p></div>';
      return;
    }

    list.innerHTML = referrals.map(referral => `
      <article class="referral-card">
        <div class="referral-content">
          <div class="job-meta">${buildStatusBadge(referral.status)} <span>${new Date(referral.requestedAt).toLocaleDateString()}</span></div>
          <h2 class="referral-title">${referral.internshipTitle}</h2>
          <p class="job-description">${referral.company}</p>
          <p>${referral.message.slice(0, 160)}${referral.message.length > 160 ? '...' : ''}</p>
        </div>
      </article>
    `).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadProfilePage() {
  if (!requireAuth()) return;
  initTheme();
  attachLogoutButtons();

  try {
    const data = await fetchJson('/api/profile');
    const user = data.user;

    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('mobile').value = user.mobile || '';
    document.getElementById('linkedin').value = user.linkedin || '';
    document.getElementById('github').value = user.github || '';
    document.getElementById('experience').value = user.experience || '';

    if (user.resume) {
      document.getElementById('current-resume').innerHTML = `<a href="/uploads/${user.resume}" target="_blank" download>Download current resume</a>`;
    }

    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(form);
      
      // Convert file to base64 if present
      const resumeFile = formData.get('resume');
      let resumeBase64 = '';
      if (resumeFile && resumeFile.size > 0) {
        resumeBase64 = await fileToBase64(resumeFile);
      }
      
      const body = {
        mobile: formData.get('mobile'),
        linkedin: formData.get('linkedin'),
        github: formData.get('github'),
        experience: formData.get('experience'),
        resume: resumeBase64,
      };

      try {
        await fetchJson('/api/profile', {
          method: 'PUT',
          body,
        });
        showToast('Profile updated successfully');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function initLoginPage() {
  // Tab switching functionality
  const studentTab = document.getElementById('student-tab');
  const adminTab = document.getElementById('admin-tab');
  const studentForm = document.getElementById('student-login-form');
  const adminForm = document.getElementById('admin-login-form');

  if (studentTab && adminTab) {
    studentTab.addEventListener('click', () => {
      studentTab.classList.add('active');
      adminTab.classList.remove('active');
      studentForm.classList.add('active');
      adminForm.classList.remove('active');
    });

    adminTab.addEventListener('click', () => {
      adminTab.classList.add('active');
      studentTab.classList.remove('active');
      adminForm.classList.add('active');
      studentForm.classList.remove('active');
    });
  }

  // Student login form
  const studentLoginForm = document.getElementById('student-login-form');
  if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(studentLoginForm);
      const body = {
        email: formData.get('email'),
        password: formData.get('password'),
      };

      try {
        const data = await fetchJson('/api/login', { method: 'POST', body });
        setSession(data.token, data.user);
        showToast('Welcome back! Redirecting...');
        setTimeout(() => {
          // Redirect based on user role
          if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 800);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }

  // Admin login form
  const adminLoginForm = document.getElementById('admin-login-form');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(adminLoginForm);
      const body = {
        email: formData.get('email'),
        password: formData.get('password'),
      };

      try {
        const data = await fetchJson('/api/login', { method: 'POST', body });
        // Verify admin role
        if (data.user.role !== 'admin') {
          showToast('Access denied. This login is for administrators only.', 'error');
          return;
        }
        setSession(data.token, data.user);
        showToast('Admin login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 800);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }
}

function initRegisterPage() {
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    
    // Convert file to base64 if present
    const resumeFile = formData.get('resume');
    let resumeBase64 = '';
    if (resumeFile && resumeFile.size > 0) {
      resumeBase64 = await fileToBase64(resumeFile);
    }
    
    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      mobile: formData.get('mobile'),
      linkedin: formData.get('linkedin'),
      github: formData.get('github'),
      resume: resumeBase64,
      experience: formData.get('experience'),
    };

    try {
      const data = await fetchJson('/api/register', { method: 'POST', body });
      setSession(data.token, data.user);
      showToast('Account created successfully');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function handleStartExploring() {
  if (getToken()) {
    window.location.href = 'internships.html';
  } else {
    window.location.href = 'login.html';
  }
}

function routePage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  applySavedTheme();
  initTheme();

  if (path === 'login.html') {
    initLoginPage();
  } else if (path === 'register.html') {
    initRegisterPage();
  } else if (path === 'dashboard.html') {
    loadDashboard();
  } else if (path === 'internships.html') {
    loadInternshipsPage();
  } else if (path === 'apply.html') {
    loadApplyPage();
  } else if (path === 'applications.html') {
    loadApplicationsPage();
  } else if (path === 'referrals.html') {
    loadReferralsPage();
  } else if (path === 'profile.html') {
    loadProfilePage();
  } else {
    // Correctly handle redirection from landing page if not logged in
    if (!getToken()) {
      window.location.href = 'login.html';
    }
    const homeLogin = document.querySelector('a[href="login.html"]');
    if (homeLogin) homeLogin.addEventListener('click', () => clearSession());
  }
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = theme;
}

window.addEventListener('DOMContentLoaded', routePage);

internshipsGrid.innerHTML += `
  <div class="job-card">
      <img src="${job.image}" />
      ...
  </div>
`;