const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(contactForm);
  const name = fields.get('name').trim();
  const replyEmail = fields.get('email').trim();
  const message = fields.get('message').trim();
  const subject = encodeURIComponent('Portfolio inquiry from ' + name);
  const body = encodeURIComponent(message + '\r\n\r\n' + name + '\r\n' + replyEmail);
  window.location.href = contactForm.action + '?subject=' + subject + '&body=' + body;
});

contactForm.hidden = false;
