import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   Firebase
========================= */
const app = initializeApp({
  apiKey: "AIzaSyAxshsDZ4yWv6TuinFTx1qMComAJYhqUZI",
  authDomain: "site-orders-415e4.firebaseapp.com",
  projectId: "site-orders-415e4"
});

const auth = getAuth(app);

/* =========================
   Account button
========================= */
const accountBtn = document.getElementById("accountBtn");

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
   Mobile menu helper
========================= */
const toggleBtn = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

if (toggleBtn && mobileMenu) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = mobileMenu.hasAttribute("hidden");

    if (isHidden) {
      mobileMenu.removeAttribute("hidden");
    } else {
      mobileMenu.setAttribute("hidden", "");
    }
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.setAttribute("hidden", "");
    });
  });
}

/* =========================
   Home header dropdown
========================= */
const homeMenu = document.querySelector("[data-home-menu]");
const homeMenuToggle = document.querySelector("[data-home-menu-toggle]");
const homeMenuDropdown = document.querySelector("[data-home-menu-dropdown]");

if (homeMenu && homeMenuToggle && homeMenuDropdown) {
  const closeHomeMenu = () => {
    homeMenu.classList.remove("is-open");
    homeMenuDropdown.hidden = true;
    homeMenuToggle.setAttribute("aria-expanded", "false");
  };

  const openHomeMenu = () => {
    homeMenu.classList.add("is-open");
    homeMenuDropdown.hidden = false;
    homeMenuToggle.setAttribute("aria-expanded", "true");
  };

  homeMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = homeMenu.classList.contains("is-open");

    if (isOpen) {
      closeHomeMenu();
    } else {
      openHomeMenu();
    }
  });

  homeMenuDropdown.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeHomeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!homeMenu.contains(event.target)) {
      closeHomeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHomeMenu();
    }
  });
}