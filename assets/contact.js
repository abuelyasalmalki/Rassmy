const contactForm = document.getElementById("contactForm");
const contactTypeEl = document.getElementById("contactType");
const contactHelpTextEl = document.getElementById("contactHelpText");

const contactTypeHelpMap = {
  "استفسار": "تذهب رسالتك إلى خدمة العملاء.",
  "مساعدة فنية": "تذهب رسالتك إلى الدعم الفني.",
  "شكوى": "تذهب رسالتك إلى الإدارة."
};

function updateContactHelpText() {
  const selectedType = contactTypeEl.value;
  contactHelpTextEl.textContent = contactTypeHelpMap[selectedType] || "اختر نوع الرسالة لتحديد الجهة المناسبة.";
}

if (contactTypeEl) {
  contactTypeEl.addEventListener("change", updateContactHelpText);
}

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const type = document.getElementById("contactType").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (name.length < 2) {
      alert("اكتب الاسم");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("رقم الجوال غير صحيح");
      return;
    }

    if (!type) {
      alert("اختر نوع الرسالة");
      return;
    }

    if (subject.length < 3) {
      alert("اكتب عنوان الرسالة");
      return;
    }

    if (message.length < 10) {
      alert("اكتب تفاصيل الرسالة");
      return;
    }

    const departmentMap = {
      "استفسار": "خدمة العملاء",
      "مساعدة فنية": "الدعم الفني",
      "شكوى": "الإدارة"
    };

    const emailSubject = `[${departmentMap[type]}] ${subject}`;
    const emailBody =
`الاسم: ${name}
رقم الجوال: ${phone}
نوع الرسالة: ${type}

تفاصيل الرسالة:
${message}`;

    window.location.href = `mailto:care@rasmi.app?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    const toast = document.createElement("div");
    toast.className = "contact-success-toast";
    toast.textContent = "تم تجهيز رسالتك للبريد.";
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 1800);
  });
}

updateContactHelpText();