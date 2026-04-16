function setupMobileMenu(){
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-mobile-menu]');
  if(!toggle || !panel) return;

  toggle.addEventListener('click',()=>{
    panel.hidden = !panel.hidden;
  });
}

function setupContactForm(){
  const form = document.querySelector('[data-contact-form]');
  const success = document.querySelector('[data-success-box]');
  if(!form || !success) return;

  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    success.style.display = 'block';
    form.reset();
    success.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
}

function setupFaqAccordion(){
  const items = document.querySelectorAll('.faq-accordion-item');
  if(!items.length) return;

  items.forEach((item)=>{
    const button = item.querySelector('.faq-question');
    if(!button) return;

    button.addEventListener('click',()=>{
      const isActive = item.classList.contains('active');

      items.forEach((otherItem)=>{
        otherItem.classList.remove('active');
      });

      if(!isActive){
        item.classList.add('active');
      }
    });
  });
}

function setupQuickBookingForm(){
  const form = document.querySelector('[data-quick-booking-form]');
  if(!form) return;

  form.addEventListener('submit',(e)=>{
    e.preventDefault();

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const service = (data.get('service') || '').toString().trim();
    const district = (data.get('district') || '').toString().trim();
    const rooms = (data.get('rooms') || '').toString().trim();
    const date = (data.get('date') || '').toString().trim();
    const notes = (data.get('notes') || '').toString().trim();

    const lines = [
      'السلام عليكم، أرغب في طلب خدمة تنظيف.',
      '',
      `الاسم: ${name || '-'}`,
      `رقم الجوال: ${phone || '-'}`,
      `نوع الخدمة: ${service || '-'}`,
      `الحي / الموقع: ${district || '-'}`,
      `عدد الغرف: ${rooms || '-'}`,
      `الموعد المفضل: ${date || '-'}`
    ];

    if(notes){
      lines.push(`ملاحظات إضافية: ${notes}`);
    }

    const message = encodeURIComponent(lines.join('\n'));
    const whatsappUrl = `https://wa.me/966500000000?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  setupMobileMenu();
  setupContactForm();
  setupFaqAccordion();
  setupQuickBookingForm();
});