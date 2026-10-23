const form = document.querySelector<HTMLFormElement>('.contact-form');
const status = document.querySelector<HTMLDivElement>('#contact-status');
if (form && status) {
  const timestamp = form.elements.namedItem('submittedAt') as HTMLInputElement;
  timestamp.value = String(Date.now());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    button.disabled = true;
    status.hidden = false;
    status.className = 'alert alert-info';
    status.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      status.className = 'alert alert-success';
      status.textContent = result.message;
      form.reset();
      timestamp.value = String(Date.now());
    } catch (error) {
      status.className = 'alert alert-danger';
      status.textContent = error instanceof Error ? error.message : 'Unable to send. Please email contact@alvocor.com directly.';
    } finally {
      button.disabled = false;
    }
  });
}
