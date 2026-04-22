
function openWhatsApp(){
  const num = document.querySelector('[data-whatsapp]')?.getAttribute('data-whatsapp') || '';
  const text = encodeURIComponent('مرحباً، أود الطلب من ورد كافورا.');
  const url = num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url,'_blank');
}


// Copy-to-clipboard for phone/whatsapp numbers
document.addEventListener('click', function(e){
  if(e.target && e.target.classList.contains('copy-btn')){
    const val = e.target.getAttribute('data-copy') || (e.target.previousElementSibling && e.target.previousElementSibling.textContent) || '';
    if(val){
      navigator.clipboard.writeText(val.trim()).then(()=>{
        const old = e.target.textContent;
        e.target.textContent = '✓ نُسخ';
        setTimeout(()=>{ e.target.textContent = old; }, 1200);
      }).catch(()=>{});
    }
  }
});
