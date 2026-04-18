import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyAxshsDZ4yWv6TuinFTx1qMComAJYhqUZI",
  authDomain: "site-orders-415e4.firebaseapp.com",
  projectId: "site-orders-415e4"
});

const auth = getAuth(app);

const toggleBtn = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const accountBtn = document.getElementById("accountBtn");

if (toggleBtn && mobileMenu) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = mobileMenu.hasAttribute("hidden");
    if (isHidden) mobileMenu.removeAttribute("hidden");
    else mobileMenu.setAttribute("hidden", "");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mobileMenu.setAttribute("hidden", ""));
  });
}

if (accountBtn) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      accountBtn.textContent = "حسابي";
      accountBtn.href = "account.html";
    } else {
      accountBtn.textContent = "دخول";
      accountBtn.href = "login.html";
    }
  });
}

/* =========================
   Portfolio Slider
========================= */
const portfolioSlider = document.querySelector("[data-portfolio-slider]");
if (portfolioSlider) {
  const track = portfolioSlider.querySelector("[data-portfolio-track]");
  const slides = Array.from(portfolioSlider.querySelectorAll(".portfolio-slide"));
  const prevBtn = portfolioSlider.querySelector("[data-portfolio-prev]");
  const nextBtn = portfolioSlider.querySelector("[data-portfolio-next]");
  const dots = Array.from(portfolioSlider.querySelectorAll("[data-portfolio-dot]"));
  let currentIndex = 0;

  const updateSlider = () => {
    if (!track || !slides.length) return;

    const step = 100 / slides.length;
    track.style.transform = `translateX(-${currentIndex * step}%)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const goToSlide = (index) => {
    if (!slides.length) return;

    if (index < 0) currentIndex = slides.length - 1;
    else if (index >= slides.length) currentIndex = 0;
    else currentIndex = index;

    updateSlider();
  };

  prevBtn?.addEventListener("click", () => goToSlide(currentIndex - 1));
  nextBtn?.addEventListener("click", () => goToSlide(currentIndex + 1));
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goToSlide(index));
  });

  updateSlider();
}

/* =========================
   Testimonials Slider
========================= */
const testimonialsSlider = document.querySelector("[data-testimonials-slider]");
if (testimonialsSlider) {
  const track = testimonialsSlider.querySelector("[data-testimonials-track]");
  const slides = Array.from(testimonialsSlider.querySelectorAll(".testimonial-slide"));
  const prevBtn = testimonialsSlider.querySelector("[data-testimonials-prev]");
  const nextBtn = testimonialsSlider.querySelector("[data-testimonials-next]");
  const dots = Array.from(testimonialsSlider.querySelectorAll("[data-testimonials-dot]"));
  let currentIndex = 0;
  let autoPlayTimer;

  slides.forEach((slide) => {
    const storeLink = slide.querySelector("[data-store-link]");
    const storeUrl = (slide.dataset.storeUrl || "").trim();

    if (!storeLink) return;

    if (storeUrl) {
      storeLink.href = storeUrl;
      storeLink.hidden = false;
    } else {
      storeLink.hidden = true;
    }
  });

  const updateSlider = () => {
    if (!track || !slides.length) return;

    const step = 100 / slides.length;
    track.style.transform = `translateX(-${currentIndex * step}%)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const goToSlide = (index) => {
    if (!slides.length) return;

    if (index < 0) currentIndex = slides.length - 1;
    else if (index >= slides.length) currentIndex = 0;
    else currentIndex = index;

    updateSlider();
  };

  const startAutoPlay = () => {
    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5500);
  };

  const stopAutoPlay = () => {
    clearInterval(autoPlayTimer);
  };

  prevBtn?.addEventListener("click", () => goToSlide(currentIndex - 1));
  nextBtn?.addEventListener("click", () => goToSlide(currentIndex + 1));
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goToSlide(index));
  });

  testimonialsSlider.addEventListener("mouseenter", stopAutoPlay);
  testimonialsSlider.addEventListener("mouseleave", startAutoPlay);
  testimonialsSlider.addEventListener("focusin", stopAutoPlay);
  testimonialsSlider.addEventListener("focusout", startAutoPlay);

  updateSlider();
  startAutoPlay();
}

/* =========================
   Arrange Demo
========================= */
const arrangeDemo = document.querySelector("[data-arrange-demo]");
const arrangeToggle = document.querySelector("[data-impression-toggle]");
const impressionGrid = document.querySelector(".impression-grid--interactive");
const trustValue = document.querySelector("[data-trust-value]");
const trustLabel = document.querySelector("[data-trust-label]");
const trustState = document.querySelector("[data-trust-state]");

if (arrangeDemo && arrangeToggle && impressionGrid) {
  let arranged = false;

  const syncState = () => {
    arrangeDemo.classList.toggle("is-arranged", arranged);
    impressionGrid.classList.toggle("is-arranged", arranged);
    arrangeToggle.textContent = arranged ? "شاهد من البداية" : "رتّب الواجهة";

    if (trustValue) trustValue.textContent = arranged ? "84%" : "34%";
    if (trustLabel) trustLabel.textContent = arranged ? "أكثر ثقة" : "متردد";
    if (trustState) trustState.textContent = arranged ? "بعد الترتيب" : "قبل الترتيب";
  };

  arrangeToggle.addEventListener("click", () => {
    arranged = !arranged;
    syncState();
  });

  syncState();
}

/* =========================
   Pricing Billing Toggle
========================= */
const billingSwitch = document.querySelector("[data-billing-switch]");

if (billingSwitch) {
  const tabs = Array.from(billingSwitch.querySelectorAll("[data-billing-tab]"));
  const cards = Array.from(document.querySelectorAll("[data-plan-card]"));

  const formatPlan = (mode) => {
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.billingTab === mode);
    });

    cards.forEach((card) => {
      const priceNode = card.querySelector(".price > span");
      const cycleLabel = card.querySelector("[data-cycle-label]");
      const subnote = card.querySelector("[data-plan-subnote]");
      const saving = card.querySelector("[data-plan-saving]");
      const link = card.querySelector("[data-plan-link]");
      const plan = card.dataset.planCard;

      if (!priceNode || !cycleLabel || !subnote || !saving || !link) return;

      if (mode === "monthly") {
        priceNode.textContent = priceNode.dataset.priceMonthly;
        cycleLabel.textContent = "ريال شهريًا";
        subnote.textContent = plan === "plus" ? "رسوم تخصيص أولية 200 ريال" : "رسوم تخصيص أولية 350 ريال";
        saving.textContent = "";
        link.href = `request.html?plan=${plan}&cycle=monthly`;
      } else {
        priceNode.textContent = priceNode.dataset.priceYearly;
        cycleLabel.textContent = "ريال سنويًا";
        subnote.textContent = "التخصيص مجاني";
        saving.textContent = plan === "plus" ? "مقدار التوفير 398 ريال" : "مقدار التوفير 959 ريال";
        link.href = `request.html?plan=${plan}&cycle=yearly`;
      }
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      formatPlan(tab.dataset.billingTab);
    });
  });

  formatPlan("yearly");
}