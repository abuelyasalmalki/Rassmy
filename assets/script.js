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
   Shared helpers
========================= */
const imageExtensions = ["webp", "jpg", "png", "jpeg"];
const imageCache = new Map();

const categoryLabels = {
  all: "كل النماذج",
  services: "نماذج موقع خدمات",
  products: "نماذج موقع عرض المنتجات",
  profile: "نماذج المواقع التعريفية"
};

const storageKeys = {
  model: "rassmy_selected_model",
  type: "rassmy_selected_type"
};

function normalizeFilter(value) {
  if (!value) return "all";

  const cleaned = value.toLowerCase().trim();

  if (["services", "service"].includes(cleaned)) return "services";
  if (["products", "product"].includes(cleaned)) return "products";
  if (["profile", "profiles", "intro", "informational"].includes(cleaned)) return "profile";

  return "all";
}

function buildImageCandidates(name) {
  const encodedName = encodeURIComponent(name);
  return imageExtensions.map((ext) => `assets/models/${encodedName}.${ext}`);
}

function tryLoadImage(src) {
  return new Promise((resolve) => {
    const testImage = new Image();
    testImage.onload = () => resolve(src);
    testImage.onerror = () => resolve(null);
    testImage.src = src;
  });
}

async function resolveModelImage(name) {
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
}

function buildPricingUrl(name, type) {
  const params = new URLSearchParams();
  params.set("model", name);
  params.set("type", type);
  return `pricing.html?${params.toString()}`;
}

function buildRequestUrl({ model, type, plan, cycle }) {
  const params = new URLSearchParams();

  if (model) params.set("model", model);
  if (type) params.set("type", type);
  if (plan) params.set("plan", plan);
  if (cycle) params.set("cycle", cycle);

  return `request.html?${params.toString()}`;
}

function saveSelectedModel(model, type) {
  try {
    sessionStorage.setItem(storageKeys.model, model || "");
    sessionStorage.setItem(storageKeys.type, type || "");
  } catch (error) {
    /* تجاهل أي مشكلة تخزين */
  }
}

function getSavedSelectedModel() {
  try {
    return {
      model: sessionStorage.getItem(storageKeys.model) || "",
      type: sessionStorage.getItem(storageKeys.type) || ""
    };
  } catch (error) {
    return { model: "", type: "" };
  }
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
  const previewButtons = Array.from(document.querySelectorAll("[data-model-preview]"));
  const selectButtons = Array.from(document.querySelectorAll(".model-select-btn"));

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

  selectButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const card = button.closest(".model-card-simple");
      if (!card) return;

      const modelName = card.dataset.modelName || "";
      const modelType = normalizeFilter(card.dataset.modelCategory || "");

      saveSelectedModel(modelName, modelType);

      const correctHref = buildPricingUrl(modelName, modelType);
      button.setAttribute("href", correctHref);
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

/* =========================
   Pricing page
========================= */
const pricingPage = document.querySelector("[data-pricing-page]");

if (pricingPage) {
  const params = new URLSearchParams(window.location.search);
  const savedSelection = getSavedSelectedModel();

  const selectedModelName =
    params.get("model") ||
    savedSelection.model ||
    "لم يتم تحديد نموذج بعد";

  const selectedType = normalizeFilter(
    params.get("type") ||
    savedSelection.type ||
    "all"
  );

  const initialCycle = params.get("cycle") === "monthly" ? "monthly" : "yearly";

  const selectedModelNameNode = document.querySelector("[data-selected-model-name]");
  const changeModelLink = document.querySelector("[data-change-model-link]");

  const billingSwitch = document.querySelector("[data-billing-switch]");
  const tabs = billingSwitch ? Array.from(billingSwitch.querySelectorAll("[data-billing-tab]")) : [];
  const cards = Array.from(document.querySelectorAll("[data-plan-card]"));

  if (selectedModelNameNode) {
    selectedModelNameNode.textContent = selectedModelName;
  }

  if (changeModelLink) {
    if (selectedType === "all") {
      changeModelLink.href = "models.html";
    } else {
      changeModelLink.href = `models.html?type=${selectedType}`;
    }
  }

  const formatPlans = (mode) => {
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.billingTab === mode);
    });

    cards.forEach((card) => {
      const priceNode = card.querySelector(".pricing-price-value");
      const cycleLabel = card.querySelector("[data-cycle-label]");
      const subnote = card.querySelector("[data-plan-subnote]");
      const saving = card.querySelector("[data-plan-saving]");
      const link = card.querySelector("[data-plan-link]");
      const plan = card.dataset.planCard;

      if (!priceNode || !cycleLabel || !subnote || !saving || !link || !plan) return;

      if (mode === "monthly") {
        priceNode.textContent = priceNode.dataset.priceMonthly || "";
        cycleLabel.textContent = "ريال شهريًا";
        subnote.textContent = plan === "plus" ? "رسوم تخصيص أولية 200 ريال" : "رسوم تخصيص أولية 350 ريال";
        saving.textContent = "";
      } else {
        priceNode.textContent = priceNode.dataset.priceYearly || "";
        cycleLabel.textContent = "ريال سنويًا";
        subnote.textContent = "التخصيص مجاني";
        saving.textContent = plan === "plus" ? "مقدار التوفير 398 ريال" : "مقدار التوفير 959 ريال";
      }

      link.href = buildRequestUrl({
        model: selectedModelName,
        type: selectedType,
        plan,
        cycle: mode
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedMode = tab.dataset.billingTab || "yearly";
      formatPlans(selectedMode);

      const url = new URL(window.location.href);
      url.searchParams.set("cycle", selectedMode);
      if (selectedModelName && selectedModelName !== "لم يتم تحديد نموذج بعد") {
        url.searchParams.set("model", selectedModelName);
      }
      if (selectedType && selectedType !== "all") {
        url.searchParams.set("type", selectedType);
      }
      window.history.replaceState({}, "", url);
    });
  });

  formatPlans(initialCycle);
}