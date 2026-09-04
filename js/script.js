'use strict';

const GITHUB_USERNAME = 'vivleon';
const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;
const THEME_KEY = 'vivleon-theme';
const SCROLL_HEADER_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const OBSERVER_THRESHOLD = 0.2;

const elements = {
  root: document.documentElement,
  body: document.body,
  header: document.querySelector('#site-header'),
  menuToggle: document.querySelector('#menu-toggle'),
  navLinks: document.querySelector('#nav-links'),
  themeToggle: document.querySelector('#theme-toggle'),
  scrollTop: document.querySelector('#scroll-top'),
  typingText: document.querySelector('#typing-text'),
  projectFilters: document.querySelector('#project-filters'),
  projectStatus: document.querySelector('#project-status'),
  projectGrid: document.querySelector('#project-grid'),
  projectCount: document.querySelector('#project-count'),
  contactForm: document.querySelector('#contact-form'),
  formResult: document.querySelector('#form-result'),
  year: document.querySelector('#current-year')
};

const projectState = {
  status: 'idle',
  projects: [],
  filter: 'All',
  error: ''
};

const typingPhrases = [
  'AI를 배우고 있습니다.',
  '비즈니스를 이해합니다.',
  '아이디어를 제품으로 연결합니다.'
];

const readSavedTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    console.warn('테마 설정을 읽을 수 없습니다.', error);
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn('테마 설정을 저장할 수 없습니다.', error);
  }
};

const applyTheme = (theme, persist = false) => {
  const isDark = theme === 'dark';
  elements.root.dataset.theme = theme;
  elements.themeToggle.setAttribute('aria-pressed', String(isDark));
  elements.themeToggle.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  themeMeta.setAttribute('content', isDark ? '#0c0d0f' : '#f4f2ed');

  if (persist) {
    saveTheme(theme);
  }
};

const initializeTheme = () => {
  const savedTheme = readSavedTheme();
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
};

const closeMenu = () => {
  elements.navLinks.classList.remove('active');
  elements.menuToggle.classList.remove('active');
  elements.body.classList.remove('menu-open');
  elements.menuToggle.setAttribute('aria-expanded', 'false');
  elements.menuToggle.setAttribute('aria-label', '메뉴 열기');
};

const toggleMenu = () => {
  const isOpen = elements.navLinks.classList.toggle('active');
  elements.menuToggle.classList.toggle('active', isOpen);
  elements.body.classList.toggle('menu-open', isOpen);
  elements.menuToggle.setAttribute('aria-expanded', String(isOpen));
  elements.menuToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
};

const handleAnchorClick = (event) => {
  const anchor = event.currentTarget;
  const targetId = anchor.getAttribute('href');

  if (!targetId || !targetId.startsWith('#')) {
    return;
  }

  const target = document.querySelector(targetId);
  if (!target) {
    return;
  }

  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeMenu();
};

const handleScroll = () => {
  const scrollY = window.scrollY;
  elements.header.classList.toggle('scrolled', scrollY >= SCROLL_HEADER_THRESHOLD);
  elements.scrollTop.classList.toggle('visible', scrollY >= SCROLL_TOP_THRESHOLD);
};

const initializeRevealAnimation = () => {
  const revealElements = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, revealObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: OBSERVER_THRESHOLD });

  revealElements.forEach((element) => observer.observe(element));
};

const runTypingEffect = () => {
  let phraseIndex = 0;
  let characterIndex = 0;
  let isDeleting = false;

  const type = () => {
    const phrase = typingPhrases[phraseIndex];
    characterIndex += isDeleting ? -1 : 1;
    elements.typingText.textContent = phrase.slice(0, characterIndex);

    let delay = isDeleting ? 42 : 78;

    if (!isDeleting && characterIndex === phrase.length) {
      isDeleting = true;
      delay = 2800;
    } else if (isDeleting && characterIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % typingPhrases.length;
      delay = 320;
    }

    window.setTimeout(type, delay);
  };

  type();
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (dateValue) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short'
}).format(new Date(dateValue));

const renderProjectStatus = () => {
  const statusViews = {
    loading: `
      <div class="status-panel">
        <span class="spinner" aria-hidden="true"></span>
        <p>GitHub 프로젝트를 불러오는 중입니다.</p>
      </div>
    `,
    error: `
      <div class="status-panel">
        <p>${escapeHtml(projectState.error)}</p>
        <button class="retry-button" id="retry-projects" type="button">다시 시도</button>
      </div>
    `,
    empty: `
      <div class="status-panel">
        <p>표시할 프로젝트가 없습니다.</p>
      </div>
    `
  };

  elements.projectStatus.innerHTML = statusViews[projectState.status] || '';
};

const getFilteredProjects = () => projectState.projects.filter(({ language }) => (
  projectState.filter === 'All' || (language || 'Other') === projectState.filter
));

const renderProjectFilters = () => {
  const languages = [...new Set(projectState.projects.map(({ language }) => language || 'Other'))]
    .sort((first, second) => first.localeCompare(second));
  const filterOptions = ['All', ...languages];

  elements.projectFilters.innerHTML = filterOptions.map((language) => `
    <button
      class="filter-button${projectState.filter === language ? ' active' : ''}"
      type="button"
      data-language="${escapeHtml(language)}"
      aria-pressed="${projectState.filter === language}"
    >${escapeHtml(language)}</button>
  `).join('');
};

const renderProjects = () => {
  if (projectState.status !== 'success') {
    elements.projectGrid.innerHTML = '';
    elements.projectCount.textContent = '';
    renderProjectStatus();
    return;
  }

  const filteredProjects = getFilteredProjects();
  const visibleProjects = filteredProjects.slice(0, 9);
  elements.projectCount.textContent = visibleProjects.length === filteredProjects.length
    ? `${filteredProjects.length} projects`
    : `${visibleProjects.length} of ${filteredProjects.length} projects`;
  renderProjectFilters();

  if (filteredProjects.length === 0) {
    projectState.status = 'empty';
    elements.projectGrid.innerHTML = '';
    renderProjectStatus();
    projectState.status = 'success';
    return;
  }

  elements.projectStatus.innerHTML = '';
  elements.projectGrid.innerHTML = visibleProjects.map((project, index) => {
    const { name, description, html_url: projectUrl, language, stargazers_count: stars, updated_at: updatedAt } = project;
    return `
      <article class="project-card">
        <div class="project-card-top">
          <span class="project-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="project-language"><span class="language-dot" aria-hidden="true"></span>${escapeHtml(language || 'Other')}</span>
        </div>
        <h3>${escapeHtml(name)}</h3>
        <p class="project-description">${escapeHtml(description || '코드와 기록으로 성장 과정을 남긴 GitHub 프로젝트입니다.')}</p>
        <div class="project-card-meta">
          <span>★ ${stars}</span>
          <span>Updated ${formatDate(updatedAt)}</span>
        </div>
        <a class="project-card-link" href="${escapeHtml(projectUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(name)} GitHub 저장소 열기"></a>
      </article>
    `;
  }).join('');
};

const loadProjects = async () => {
  projectState.status = 'loading';
  projectState.error = '';
  renderProjects();

  try {
    const response = await fetch(GITHUB_REPOS_URL, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.');
      }
      throw new Error('프로젝트를 불러올 수 없습니다.');
    }

    const repositories = await response.json();
    projectState.projects = repositories
      .filter(({ fork, archived }) => !fork && !archived)
      .sort((first, second) => new Date(second.updated_at) - new Date(first.updated_at));
    projectState.status = projectState.projects.length > 0 ? 'success' : 'empty';
  } catch (error) {
    projectState.status = 'error';
    projectState.error = error.message || '프로젝트를 불러올 수 없습니다.';
  }

  renderProjects();
};

const handleProjectFilter = (event) => {
  const button = event.target.closest('[data-language]');
  if (!button) {
    return;
  }

  projectState.filter = button.dataset.language;
  projectState.status = 'success';
  renderProjects();
};

const validationMessages = {
  name: '이름을 입력해 주세요.',
  email: '올바른 이메일 주소를 입력해 주세요.',
  message: '메시지를 입력해 주세요.'
};

const validateField = (field) => {
  const value = field.value.trim();
  const isEmail = field.type === 'email';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = value.length > 0 && (!isEmail || emailPattern.test(value));
  const errorElement = document.querySelector(`#${field.id}-error`);

  field.classList.toggle('invalid', !isValid);
  field.setAttribute('aria-invalid', String(!isValid));
  errorElement.textContent = isValid ? '' : validationMessages[field.id];
  return isValid;
};

const setSubmitting = (isSubmitting) => {
  const submitButton = elements.contactForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector('.submit-label');
  submitButton.disabled = isSubmitting;
  submitLabel.textContent = isSubmitting ? '전송 중…' : '메시지 보내기';
};

const submitContactForm = async (event) => {
  event.preventDefault();
  const fields = [...elements.contactForm.querySelectorAll('input:not([type="hidden"]), textarea')];
  const formIsValid = fields.map(validateField).every(Boolean);

  elements.formResult.classList.remove('success', 'error');
  elements.formResult.textContent = '';

  if (!formIsValid) {
    elements.formResult.classList.add('error');
    elements.formResult.textContent = '입력한 내용을 다시 확인해 주세요.';
    fields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
    return;
  }

  const endpoint = elements.contactForm.getAttribute('action')?.trim();
  setSubmitting(true);

  try {
    if (!endpoint) {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      elements.formResult.classList.add('success');
      elements.formResult.textContent = '전송 주소가 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.';
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(elements.contactForm),
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }

    elements.formResult.classList.add('success');
    elements.formResult.textContent = '메시지가 전송되었습니다. 감사합니다.';
    elements.contactForm.reset();
    fields.forEach((field) => {
      field.classList.remove('invalid');
      field.setAttribute('aria-invalid', 'false');
    });
  } catch (error) {
    elements.formResult.classList.add('error');
    elements.formResult.textContent = error.message;
  } finally {
    setSubmitting(false);
  }
};

const initializeEvents = () => {
  elements.menuToggle.addEventListener('click', toggleMenu);
  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = elements.root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', handleAnchorClick);
  });

  elements.scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMenu();
    }
  });

  elements.projectFilters.addEventListener('click', handleProjectFilter);
  elements.projectStatus.addEventListener('click', (event) => {
    if (event.target.closest('#retry-projects')) {
      loadProjects();
    }
  });

  elements.contactForm.addEventListener('submit', submitContactForm);
  elements.contactForm.querySelectorAll('input:not([type="hidden"]), textarea').forEach((field) => {
    field.addEventListener('input', () => {
      validateField(field);
      elements.formResult.classList.remove('success', 'error');
      elements.formResult.textContent = '';
    });
  });

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener('change', (event) => {
    if (!readSavedTheme()) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });
};

const initialize = () => {
  initializeTheme();
  initializeEvents();
  initializeRevealAnimation();
  runTypingEffect();
  loadProjects();
  handleScroll();
  elements.year.textContent = new Date().getFullYear();
};

initialize();
