// Default SHA-256 hash of fallback password "vault2026"
const DEFAULT_ADMIN_PASSWORD_HASH = '8d7fba82db5554e0fd500b3aa0f72bab3d0fe39cad2cbdc77721345076a866ef';

// Helper function to calculate SHA-256 hash
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('admin-gate');
  const panel = document.getElementById('admin-panel');
  const passwordInput = document.getElementById('admin-password');
  const loginBtn = document.getElementById('admin-login-btn');
  const errorMsg = document.getElementById('admin-error');
  const addForm = document.getElementById('add-project-form');
  const projectsList = document.getElementById('projects-list');
  const logoutBtn = document.getElementById('admin-logout');
  const toastEl = document.getElementById('admin-toast');

  // Fetch active password hash from Supabase DB or fallback
  async function getActivePasswordHash() {
    try {
      const { data, error } = await db
        .from('vault_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();

      if (data && data.value) {
        return data.value;
      }
    } catch (e) {
      console.warn('Could not fetch password hash from vault_settings, using fallback.', e);
    }
    return DEFAULT_ADMIN_PASSWORD_HASH;
  }

  // Check session
  if (sessionStorage.getItem('vault_admin') === 'true') {
    showPanel();
  }

  // Login
  loginBtn.addEventListener('click', attemptLogin);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  async function attemptLogin() {
    const value = passwordInput.value.trim();
    if (!value) return;

    loginBtn.textContent = 'Verifying...';
    loginBtn.disabled = true;

    try {
      const targetHash = await getActivePasswordHash();
      const inputHash = await sha256(value);

      if (inputHash === targetHash) {
        sessionStorage.setItem('vault_admin', 'true');
        showPanel();
      } else {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Incorrect password. Try again.';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (err) {
      console.error(err);
      errorMsg.style.display = 'block';
      errorMsg.textContent = 'Login error. Please try again.';
    } finally {
      loginBtn.textContent = 'Enter';
      loginBtn.disabled = false;
    }
  }

  function showPanel() {
    gate.style.display = 'none';
    panel.classList.add('active');
    loadProjects();
    loadResponses();
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('vault_admin');
      gate.style.display = '';
      panel.classList.remove('active');
      passwordInput.value = '';
    });
  }

  // Change Password Modal setup
  const changePwdBtn = document.getElementById('change-pwd-btn');
  const changePwdModal = document.getElementById('change-pwd-modal');
  const changePwdClose = document.getElementById('change-pwd-modal-close');
  const changePwdCancel = document.getElementById('change-pwd-modal-cancel');
  const changePwdForm = document.getElementById('change-pwd-form');

  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      changePwdForm.reset();
      changePwdModal.classList.add('active');
    });
  }

  function closeChangePwdModal() {
    if (changePwdModal) changePwdModal.classList.remove('active');
  }

  if (changePwdClose) changePwdClose.addEventListener('click', closeChangePwdModal);
  if (changePwdCancel) changePwdCancel.addEventListener('click', closeChangePwdModal);

  if (changePwdForm) {
    changePwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('current-pwd').value.trim();
      const newPwd = document.getElementById('new-pwd').value.trim();
      const confirmPwd = document.getElementById('confirm-pwd').value.trim();
      const submitBtn = changePwdForm.querySelector('button[type="submit"]');

      if (newPwd !== confirmPwd) {
        toast('New passwords do not match!');
        return;
      }

      if (newPwd.length < 6) {
        toast('New password must be at least 6 characters.');
        return;
      }

      submitBtn.textContent = 'Updating...';
      submitBtn.disabled = true;

      try {
        const activeHash = await getActivePasswordHash();
        const currentInputHash = await sha256(currentPwd);

        if (currentInputHash !== activeHash) {
          toast('Current password is incorrect.');
          submitBtn.textContent = 'Update Password';
          submitBtn.disabled = false;
          return;
        }

        const newHash = await sha256(newPwd);

        const { error } = await db
          .from('vault_settings')
          .upsert({
            key: 'admin_password_hash',
            value: newHash,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error updating password:', error);
          toast('Failed to update password in database: ' + error.message);
        } else {
          toast('Password updated successfully!');
          closeChangePwdModal();
        }
      } catch (err) {
        console.error(err);
        toast('An error occurred while updating password.');
      } finally {
        submitBtn.textContent = 'Update Password';
        submitBtn.disabled = false;
      }
    });
  }

  // Load existing projects
  async function loadProjects() {
    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      renderProjectsList(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }

  // Load form responses
  async function loadResponses() {
    const responsesList = document.getElementById('responses-list');
    if (!responsesList) return;

    try {
      const { data, error } = await db
        .from('vault_contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading responses:', error);
        responsesList.innerHTML = `<p style="color: #C0392B; text-align: center; padding: 2rem 0;">Error: ${error.message}</p>`;
        return;
      }

      renderResponsesList(data || []);
    } catch (err) {
      console.error('Failed to load responses:', err);
      responsesList.innerHTML = `<p style="color: #C0392B; text-align: center; padding: 2rem 0;">Failed to load data.</p>`;
    }
  }

  function renderResponsesList(responses) {
    const responsesList = document.getElementById('responses-list');
    if (!responsesList) return;

    if (responses.length === 0) {
      responsesList.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 2rem 0;">No form submissions yet.</p>';
      return;
    }

    responsesList.innerHTML = responses.map(r => {
      const date = new Date(r.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="admin-project-item" data-response-id="${r.id}" style="align-items: flex-start; padding: 1.2rem 0; gap: 1.5rem;">
          <div style="flex-grow: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <span class="admin-project-item__name" style="font-size: 1.1rem;">${escapeHtml(r.name)}</span>
              <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${date}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
              <strong>Email:</strong> <a href="mailto:${escapeHtml(r.email)}" style="text-decoration: underline; color: inherit;">${escapeHtml(r.email)}</a> 
              ${r.budget ? `· <strong>Budget:</strong> ${escapeHtml(r.budget)}` : ''}
            </div>
            ${r.project_description ? `
              <div style="font-size: 0.9rem; background: var(--color-bg-alternate); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid var(--color-text-primary); margin-top: 0.5rem; white-space: pre-wrap;">${escapeHtml(r.project_description)}</div>
            ` : ''}
          </div>
          <button class="btn--danger" onclick="deleteResponse('${r.id}')" style="align-self: flex-start; margin-top: 0.2rem;">Delete</button>
        </div>
      `;
    }).join('');
  }

  // Delete Response
  window.deleteResponse = async function (id) {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const { error } = await db
        .from('vault_contact_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete response error:', error);
        toast('Failed to delete response.');
        return;
      }

      toast('Response deleted.');
      loadResponses();
    } catch (err) {
      console.error('Delete response failed:', err);
    }
  };

  function renderProjectsList(projects) {
    if (projects.length === 0) {
      projectsList.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 2rem 0;">No projects yet. Add your first one above.</p>';
      return;
    }

    projectsList.innerHTML = projects.map(p => `
      <div class="admin-project-item" data-id="${p.id}">
        <div class="admin-project-item__info">
          <img class="admin-project-item__thumb" src="${escapeHtml(p.thumbnail_url)}" alt="${escapeHtml(p.name)}" />
          <div>
            <div class="admin-project-item__name">${escapeHtml(p.name)}</div>
            <div class="admin-project-item__category">${escapeHtml(p.category)} · Order: ${p.order}</div>
          </div>
        </div>
        <div class="admin-project-item__actions">
          <button class="btn--edit" onclick="editProject('${p.id}')">Edit</button>
          <button class="btn--danger" onclick="deleteProject('${p.id}')">Delete</button>
        </div>
      </div>
    `).join('');

    // Store projects data for edit lookups
    window.__projectsCache = projects;
  }

  // Add project
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = addForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Uploading...';
    submitBtn.disabled = true;

    try {
      const name = document.getElementById('project-name').value.trim();
      const category = document.getElementById('project-category').value.trim();
      const order = parseInt(document.getElementById('project-order').value) || 0;
      const thumbnailFile = document.getElementById('project-thumbnail').files[0];
      const sourceType = addForm.querySelector('input[name="add-source-type"]:checked').value;
      const htmlFile = document.getElementById('project-html').files[0];
      const htmlUrlVal = document.getElementById('project-url').value.trim();

      if (!name || !category || !thumbnailFile || (sourceType === 'file' && !htmlFile) || (sourceType === 'url' && !htmlUrlVal)) {
        toast('Please fill in all fields.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      // Generate unique filenames
      const timestamp = Date.now();
      const thumbFileName = `${timestamp}_${sanitizeFilename(thumbnailFile.name)}`;
      let finalHtmlUrl = '';

      // Upload thumbnail
      const { error: thumbError } = await db.storage
        .from('projects')
        .upload(thumbFileName, thumbnailFile, {
          cacheControl: '3600',
          contentType: thumbnailFile.type || 'image/png',
          upsert: true,
        });

      if (thumbError) {
        console.error('Thumbnail upload error:', thumbError);
        toast('Failed to upload thumbnail. ' + thumbError.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      if (sourceType === 'file') {
        const htmlFileName = `html/${timestamp}_${sanitizeFilename(htmlFile.name)}`;
        // Upload HTML file
        const { error: htmlError } = await db.storage
          .from('projects')
          .upload(htmlFileName, htmlFile, {
            cacheControl: '3600',
            contentType: 'text/html',
            upsert: true
          });

        if (htmlError) {
          console.error('HTML upload error:', htmlError);
          toast('Failed to upload HTML file. ' + htmlError.message);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
        }

        const { data: htmlUrl } = db.storage
          .from('projects')
          .getPublicUrl(htmlFileName);
        finalHtmlUrl = htmlUrl.publicUrl;
      } else {
        finalHtmlUrl = htmlUrlVal;
      }

      // Get public URLs
      const { data: thumbUrl } = db.storage
        .from('projects')
        .getPublicUrl(thumbFileName);

      // Insert project record
      const { error: insertError } = await db
        .from('projects')
        .insert([{
          name,
          category,
          thumbnail_url: thumbUrl.publicUrl,
          html_file_url: finalHtmlUrl,
          order,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        toast('Failed to save project. ' + insertError.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      toast('Project added successfully!');
      addForm.reset();
      loadProjects();
    } catch (err) {
      console.error('Add project failed:', err);
      toast('Something went wrong. Check the console.');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });

  // Delete project
  window.deleteProject = async function (id) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await db
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        toast('Failed to delete project.');
        return;
      }

      toast('Project deleted.');
      loadProjects();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // =========================================================
  // Edit Project — Modal logic
  // =========================================================

  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-project-form');
  const editCloseBtn = document.getElementById('edit-modal-close');
  const editCancelBtn = document.getElementById('edit-modal-cancel');

  function openEditModal() {
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editForm.reset();
  }

  if (editCloseBtn) editCloseBtn.addEventListener('click', closeEditModal);
  if (editCancelBtn) editCancelBtn.addEventListener('click', closeEditModal);

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) closeEditModal();
  });

  // Open edit modal with project data
  window.editProject = function (id) {
    const project = (window.__projectsCache || []).find(p => p.id === id);
    if (!project) {
      toast('Project not found.');
      return;
    }

    document.getElementById('edit-project-id').value = project.id;
    document.getElementById('edit-project-name').value = project.name;
    document.getElementById('edit-project-category').value = project.category;
    document.getElementById('edit-project-order').value = project.order;

    const isStorageUrl = project.html_file_url && project.html_file_url.includes('/projects/html/');
    const fileRadio = editForm.querySelector('input[name="edit-source-type"][value="file"]');
    const urlRadio = editForm.querySelector('input[name="edit-source-type"][value="url"]');

    if (isStorageUrl || !project.html_file_url) {
      if (fileRadio) fileRadio.checked = true;
      document.getElementById('edit-file-input').style.display = 'block';
      document.getElementById('edit-url-input').style.display = 'none';
      document.getElementById('edit-project-url').value = '';
    } else {
      if (urlRadio) urlRadio.checked = true;
      document.getElementById('edit-file-input').style.display = 'none';
      document.getElementById('edit-url-input').style.display = 'block';
      document.getElementById('edit-project-url').value = project.html_file_url;
    }

    openEditModal();
  };

  // Save edited project
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = editForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
      const id = document.getElementById('edit-project-id').value;
      const name = document.getElementById('edit-project-name').value.trim();
      const category = document.getElementById('edit-project-category').value.trim();
      const order = parseInt(document.getElementById('edit-project-order').value) || 0;
      const thumbnailFile = document.getElementById('edit-project-thumbnail').files[0];
      const htmlFile = document.getElementById('edit-project-html').files[0];

      if (!name || !category) {
        toast('Name and category are required.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const updates = { name, category, order };

      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const timestamp = Date.now();
        const thumbFileName = `${timestamp}_${sanitizeFilename(thumbnailFile.name)}`;

        const { error: thumbError } = await db.storage
          .from('projects')
          .upload(thumbFileName, thumbnailFile, {
            cacheControl: '3600',
            contentType: thumbnailFile.type || 'image/png',
            upsert: true,
          });

        if (thumbError) {
          toast('Failed to upload new thumbnail. ' + thumbError.message);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
        }

        const { data: thumbUrl } = db.storage
          .from('projects')
          .getPublicUrl(thumbFileName);

        updates.thumbnail_url = thumbUrl.publicUrl;
      }

      const editSourceType = editForm.querySelector('input[name="edit-source-type"]:checked').value;
      const htmlUrlVal = document.getElementById('edit-project-url').value.trim();

      // Upload new HTML file if provided
      if (editSourceType === 'file' && htmlFile) {
        const timestamp = Date.now();
        const htmlFileName = `html/${timestamp}_${sanitizeFilename(htmlFile.name)}`;

        const { error: htmlError } = await db.storage
          .from('projects')
          .upload(htmlFileName, htmlFile, {
            cacheControl: '3600',
            contentType: 'text/html',
            upsert: true
          });

        if (htmlError) {
          toast('Failed to upload new HTML file. ' + htmlError.message);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
        }

        const { data: htmlUrl } = db.storage
          .from('projects')
          .getPublicUrl(htmlFileName);

        updates.html_file_url = htmlUrl.publicUrl;
      } else if (editSourceType === 'url' && htmlUrlVal) {
        updates.html_file_url = htmlUrlVal;
      }

      // Update project record
      const { error: updateError } = await db
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        toast('Failed to update project. ' + updateError.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      toast('Project updated successfully!');
      closeEditModal();
      loadProjects();
    } catch (err) {
      console.error('Edit project failed:', err);
      toast('Something went wrong. Check the console.');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });

  // Utility: toast notification
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    setTimeout(() => {
      toastEl.classList.remove('visible');
    }, 3500);
  }

  // Utility: sanitize filename
  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // Utility: escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
