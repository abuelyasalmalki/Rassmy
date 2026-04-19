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
   Models page
========================= */
const modelsPage = document.querySelector("[data-models-page]");

if (modelsPage) {
  const filterButtons = Array.from(document.querySelectorAll("[data-model-filter]"));
  const modelCards = Array.from(document.querySelectorAll(".model-card-simple"));
  const currentLabel = document.querySelector("[data-models-current]");

  const previewModal = document.querySelector("[data-preview-modal]");
  const previewImage = document.querySelector("[data-preview-image]");
  const previewTitle = document.querySelector("[data-preview-title]");
  const previewPlaceholder = document.querySelector("[data-preview-placeholder]");
  const previewPlaceholderName = document.querySelector("[data-preview-placeholder-name]");
  const previewCloseButtons = Array.from(document.querySelectorAll("[data-preview-close]"));

  const imageBlocks = Array.from(document.querySelectorAll("[data-model-image]"));
  const selectLinks = Array.from(document.querySelectorAll("[data-model-select]"));
  const previewButtons = Array.from(document.querySelectorAll("[data-model-preview]"));

  const categoryLabels = {
    all: "كل النماذج",
    services: "نماذج موقع خدمات",
    products: "نماذج موقع عرض المنتجات",
    profile: "نماذج المواقع التعريفية"
  };

  const imageCache = new Map();
  const imageExtensions = ["webp", "jpg", "png", "jpeg"];

  const normalizeFilter = (value) => {
    if (!value) return "all";

    const cleaned = value.toLowerCase().trim();

    if (["services", "service"].includes(cleaned)) return "services";
    if (["products", "product"].includes(cleaned)) return "products";
    if (["profile", "profiles", "intro", "informational"].includes(cleaned)) return "profile";

    return "all";
  };

  const buildModelRequestUrl = (name, type) => {
    const params = new URLSearchParams();
    params.set("model", name);
    params.set("type", type);
    return `request.html?${params.toString()}`;
  };

  selectLinks.forEach((link) => {
    const name = link.dataset.modelName || "";
    const type = link.dataset.modelType || "";
    link.href = buildModelRequestUrl(name, type);
  });

  const buildImageCandidates = (name) => {
    const encodedName = encodeURIComponent(name);
    return imageExtensions.map((ext) => `assets/models/${encodedName}.${ext}`);
  };

  const tryLoadImage = (src) => {
    return new Promise((resolve) => {
      const testImage = new Image();

      testImage.onload = () => resolve(src);
      testImage.onerror = () => resolve(null);
      testImage.src = src;
    });
  };

  const resolveModelImage = async (name) => {
    if (imageCache.has(name)) {
      return imageCache.get(name);
    }

    const candidates = buildImageCandidates(name);

    for (const candidate of candidates) {
      const found = await tryLoadImage(candidate);

      if (found) {
        imageCache.set(name, found);
        return found;
      }
    }

    imageCache.set(name, null);
    return null;
  };

  const setupCardImages = async () => {
    for (const block of imageBlocks) {
      const modelName = block.dataset.modelImage || "";
      const imageElement = block.querySelector(".model-thumb-image");
      const placeholder = block.querySelector(".model-thumb-placeholder");

      if (!modelName || !imageElement || !placeholder) continue;

      const resolvedImage = await resolveModelImage(modelName);

      if (resolvedImage) {
        imageElement.src = resolvedImage;
        imageElement.hidden = false;
        placeholder.hidden = true;
        block.dataset.resolvedImage = resolvedImage;
      } else {
        imageElement.hidden = true;
        placeholder.hidden = false;
        block.dataset.resolvedImage = "";
      }
    }
  };

  const updateCurrentLabel = (filter) => {
    if (!currentLabel) return;
    currentLabel.textContent = `يعرض الآن: ${categoryLabels[filter] || categoryLabels.all}`;
  };

  const updateUrlForFilter = (filter) => {
    const url = new URL(window.location.href);

    if (filter === "all") {
      url.searchParams.delete("type");
    } else {
      url.searchParams.set("type", filter);
    }

    window.history.replaceState({}, "", url);
  };

  const applyFilter = (filter, syncUrl = true) => {
    const normalizedFilter = normalizeFilter(filter);

    filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.modelFilter === normalizedFilter);
    });

    modelCards.forEach((card) => {
      const cardCategory = card.dataset.modelCategory || "";
      const shouldShow = normalizedFilter === "all" || cardCategory === normalizedFilter;
      card.hidden = !shouldShow;
    });

    updateCurrentLabel(normalizedFilter);

    if (syncUrl) {
      updateUrlForFilter(normalizedFilter);
    }
  };

  const openPreviewModal = async (modelName) => {
    if (!previewModal || !previewImage || !previewTitle || !previewPlaceholder || !previewPlaceholderName) {
      return;
    }

    previewTitle.textContent = modelName;
    previewPlaceholderName.textContent = modelName;

    const resolvedImage = await resolveModelImage(modelName);

    if (resolvedImage) {
      previewImage.src = resolvedImage;
      previewImage.alt = `معاينة نموذج ${modelName}`;
      previewImage.hidden = false;
      previewPlaceholder.hidden = true;
    } else {
      previewImage.hidden = true;
      previewPlaceholder.hidden = false;
    }

    previewModal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closePreviewModal = () => {
    if (!previewModal || !previewImage || !previewPlaceholder) return;

    previewModal.hidden = true;
    previewImage.hidden = true;
    previewPlaceholder.hidden = false;
    document.body.style.overflow = "";
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.modelFilter || "all");
    });
  });

  previewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modelName = button.dataset.modelPreview || "";
      if (!modelName) return;
      openPreviewModal(modelName);
    });
  });

  previewCloseButtons.forEach((button) => {
    button.addEventListener("click", closePreviewModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && previewModal && !previewModal.hidden) {
      closePreviewModal();
    }
  });

  const initialFilter = normalizeFilter(new URLSearchParams(window.location.search).get("type"));
  applyFilter(initialFilter, false);
  setupCardImages();
}