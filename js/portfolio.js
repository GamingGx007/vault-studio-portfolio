// =========================================================
// Portfolio — Fetch Projects & Iframe Overlay
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('portfolio-grid');
  const overlay = document.getElementById('iframe-overlay');
  const overlayIframe = document.getElementById('overlay-iframe');
  const overlayClose = document.getElementById('overlay-close');

  if (!grid) return;

  // Fetch projects from Supabase
  async function fetchProjects() {
    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        showEmpty();
        return;
      }

      if (!data || data.length === 0) {
        showEmpty();
        return;
      }

      renderProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      showEmpty();
    }
  }

  function showEmpty() {
    grid.innerHTML = `
      <div class="portfolio__empty">
        <p>Projects coming soon. Stay tuned.</p>
      </div>
    `;
  }

  function renderProjects(projects) {
    grid.innerHTML = projects.map((project, index) => `
      <div class="project-card reveal reveal-delay-${(index % 4) + 1}" data-url="${escapeHtml(project.html_file_url)}">
        <div class="project-card__image">
          <img src="${escapeHtml(project.thumbnail_url)}" alt="${escapeHtml(project.name)}" loading="lazy" />
        </div>
        <div class="project-card__content">
          <span class="project-card__category">${escapeHtml(project.category)}</span>
          <h3 class="project-card__name">${escapeHtml(project.name)}</h3>
          <button class="btn btn--outline btn--small project-card__btn" onclick="openProject('${escapeHtml(project.html_file_url)}')">
            View Project
          </button>
        </div>
      </div>
    `).join('');

    // Re-observe newly added reveal elements
    const revealEls = grid.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => observer.observe(el));
  }

  // Open project in a new tab directly
  window.openProject = function (url) {
    if (!url) return;
    window.open(url, '_blank');
  };

  // Utility: escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial load
  fetchProjects();
});
