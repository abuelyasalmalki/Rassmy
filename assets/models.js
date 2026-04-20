const filterButtons = Array.from(document.querySelectorAll("[data-model-filter]"));
const modelCards = Array.from(document.querySelectorAll(".model-card-simple"));
const currentLabelEl = document.querySelector("[data-models-current]");

const previewModal = document.querySelector("[data-preview-modal]");
const previewTitle = document.querySelector("[data-preview-title]");
const previewImage = document.querySelector("[data-preview-image]");
const previewPlaceholder = document.querySelector("[data-preview-placeholder]");
const previewPlaceholderName = document.querySelector("[data-preview-placeholder-name]");
const previewCloseTargets = Array.from(document.querySelectorAll("[data-preview-close]"));
const previewButtons = Array.from(document.querySelectorAll("[data-model-preview]"));
const thumbWrappers = Array.from(document.querySelectorAll("[data-model-image]"));

const filterLabelMap = {
  all: "كل النماذج",
  services: "نماذج الخدمات",
  products: "نماذج عرض المنتجات",
  profile: "نماذج المواقع التعريفية"
};

function buildImageCandidates(modelName) {
  const extensions = ["webp", "png", "jpg", "jpeg"];
  const bases = [
    `images/models/${modelName}`,
    `images/${modelName}`,
    `assets/images/models/${modelName}`,
    `assets/images/${modelName}`,
    `${modelName}`
  ];

  return bases.flatMap((base) => extensions.map((ext) => `${base}.${ext}`));
}

function loadFirstExistingImage(candidates) {
  return new Promise((resolve) => {
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        resolve(null);
        return;
      }

      const src = candidates[index++];
      const img = new Image();

      img.onload = () => resolve(src);
      img.onerror = tryNext;
      img.src = src;
    };

    tryNext();
  });
}

async function applyCardImage(modelName, imageEl, placeholderEl) {
  const src = await loadFirstExistingImage(buildImageCandidates(modelName));

  if (src) {
    imageEl.src = src;
    imageEl.hidden = false;
    if (placeholderEl) {
      placeholderEl.hidden = true;
    }
  } else {
    imageEl.removeAttribute("src");
    imageEl.hidden = true;
    if (placeholderEl) {
      placeholderEl.hidden = false;
    }
  }
}

function setFilter(filterKey) {
  const validFilter = filterLabelMap[filterKey] ? filterKey : "all";

  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modelFilter === validFilter);
  });

  modelCards.forEach((card) => {
    const category = card.dataset.modelCategory;
    const shouldShow = validFilter === "all" || category === validFilter;
    card.hidden = !shouldShow;
  });

  if (currentLabelEl) {
    currentLabelEl.textContent = `يعرض الآن: ${filterLabelMap[validFilter]}`;
  }

  const url = new URL(window.location.href);
  if (validFilter === "all") {
    url.searchParams.delete("type");
  } else {
    url.searchParams.set("type", validFilter);
  }
  window.history.replaceState({}, "", url);
}

async function openPreview(modelName) {
  if (!previewModal) return;

  if (previewTitle) {
    previewTitle.textContent = modelName;
  }

  if (previewPlaceholderName) {
    previewPlaceholderName.textContent = modelName;
  }

  if (previewImage) {
    const src = await loadFirstExistingImage(buildImageCandidates(modelName));

    if (src) {
      previewImage.src = src;
      previewImage.alt = `معاينة نموذج ${modelName}`;
      previewImage.hidden = false;
      if (previewPlaceholder) {
        previewPlaceholder.hidden = true;
      }
    } else {
      previewImage.removeAttribute("src");
      previewImage.hidden = true;
      if (previewPlaceholder) {
        previewPlaceholder.hidden = false;
      }
    }
  }

  previewModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePreview() {
  if (!previewModal) return;

  previewModal.hidden = true;
  document.body.style.overflow = "";
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.modelFilter || "all");
  });
});

previewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPreview(button.dataset.modelPreview || "");
  });
});

previewCloseTargets.forEach((element) => {
  element.addEventListener("click", closePreview);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePreview();
  }
});

thumbWrappers.forEach((wrapper) => {
  const modelName = wrapper.dataset.modelImage || "";
  const imageEl = wrapper.querySelector(".model-thumb-image");
  const placeholderEl = wrapper.querySelector(".model-thumb-placeholder");

  if (modelName && imageEl) {
    applyCardImage(modelName, imageEl, placeholderEl);
  }
});

const initialParams = new URLSearchParams(window.location.search);
const initialType = (initialParams.get("type") || "all").trim();
setFilter(initialType);
