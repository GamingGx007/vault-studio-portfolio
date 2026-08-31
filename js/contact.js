// =========================================================
// Contact Form — Submit to Supabase
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const successMessage = document.getElementById('contact-success');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.contact__submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      budget: formData.get('budget'),
      project_description: formData.get('project_description'),
    };

    try {
      const { error } = await db
        .from('vault_contact_submissions')
        .insert([payload]);

      if (error) {
        console.error('Submission error:', error);
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.disabled = false;
        setTimeout(() => {
          submitBtn.textContent = originalText;
        }, 3000);
        return;
      }

      // Success
      form.style.display = 'none';
      successMessage.classList.add('active');
    } catch (err) {
      console.error('Failed to submit:', err);
      submitBtn.textContent = 'Error — Try Again';
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = originalText;
      }, 3000);
    }
  });
});
