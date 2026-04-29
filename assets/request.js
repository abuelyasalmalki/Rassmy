import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   Firebase
========================= */
const app = initializeApp({
  apiKey: "AIzaSyAxshsDZ4yWv6TuinFTx1qMComAJYhqUZI",
  authDomain: "site-orders-415e4.firebaseapp.com",
  projectId: "site-orders-415e4"
});

const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   Domain checker
========================= */
const DOMAIN_CHECK_ENDPOINT = "https://api.rasmi.app/domain-check";

/* =========================
   Header account button
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
   Form elements
========================= */
const activityTypeEl = document.getElementById("activityType");
const customTypeEl = document.getElementById("customType");
const packageEl = document.getElementById("package");
const templateEl = document.getElementById("template");
const cycleEl = document.getElementById("cycle");
const passwordEl = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const submitBtn = document.getElementById("submitBtn");
const planNoteEl = document.getElementById("planNote");

const nextStepBtn = document.getElementById("nextStepBtn");
const domainPrevBtn = document.getElementById("domainPrevBtn");
const domainNextBtn = document.getElementById("domainNextBtn");
const prevStepBtn = document.getElementById("prevStepBtn");

const requestProgressFill = document.getElementById("requestProgressFill");
const stageEls = document.querySelectorAll(".request-stage");

const domainInput = document.getElementById("domainInput");
const domainHelpText = document.getElementById("domainHelpText");
const domainNote = document.getElementById("domainNote");
const domainChoiceBtns = document.querySelectorAll(".domain-choice-btn");
const domainCheckBtn = document.getElementById("domainCheckBtn");
const domainCheckResult = document.getElementById("domainCheckResult");

let selectedDomainOption = "new_domain";

let domainAvailabilityState = {
  checked: false,
  domain: "",
  available: null
};

/* =========================
   Helpers
========================= */
function normalizePlanParam(value) {
  const map = {
    plus: "باقة بلس",
    basic: "باقة بلس",
    pro: "باقة برو",
    premium: "باقة برو",
    "باقة بلس": "باقة بلس",
    "باقة برو": "باقة برو"
  };

  return map[value] || value || "";
}

function normalizeCycleParam(value) {
  const map = {
    monthly: "شهري",
    month: "شهري",
    yearly: "سنوي",
    annual: "سنوي",
    year: "سنوي",
    "شهري": "شهري",
    "سنوي": "سنوي"
  };

  return map[value] || value || "";
}

function updatePlanNote() {
  const selectedPlan = packageEl.value;
  const selectedCycle = cycleEl.value;

  if (!selectedPlan) {
    planNoteEl.textContent = "اختر الباقة ونوع الاشتراك ليظهر الملخص هنا.";
    return;
  }

  if (!selectedCycle) {
    planNoteEl.textContent = "اختر نوع الاشتراك ليظهر الملخص هنا.";
    return;
  }

  if (selectedPlan === "باقة بلس" && selectedCycle === "شهري") {
    planNoteEl.textContent = "79 ريال شهريًا + رسوم تخصيص أولية.";
    return;
  }

  if (selectedPlan === "باقة بلس" && selectedCycle === "سنوي") {
    planNoteEl.textContent = "750 ريال سنويًا — التخصيص مجاني.";
    return;
  }

  if (selectedPlan === "باقة برو" && selectedCycle === "شهري") {
    planNoteEl.textContent = "159 ريال شهريًا + رسوم تخصيص أولية.";
    return;
  }

  if (selectedPlan === "باقة برو" && selectedCycle === "سنوي") {
    planNoteEl.textContent = "1299 ريال سنويًا — التخصيص مجاني.";
  }
}

function showStage(stageNumber) {
  stageEls.forEach((stage) => {
    const isTarget = Number(stage.dataset.stage) === stageNumber;
    stage.hidden = !isTarget;
    stage.classList.toggle("is-active", isTarget);
  });

  if (requestProgressFill) {
    const widths = {
      1: "33.33%",
      2: "66.66%",
      3: "100%"
    };

    requestProgressFill.style.width = widths[stageNumber] || "33.33%";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStepOne() {
  if (!packageEl.value) throw "اختر الباقة";
  if (!cycleEl.value) throw "اختر نوع الاشتراك";
  if (!templateEl.value) throw "اختر النموذج";
}

function normalizeDomainInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function normalizePhoneInput(value) {
  let digits = String(value || "")
    .trim()
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/\D/g, "");

  if (digits.startsWith("009665")) {
    digits = "0" + digits.slice(5);
  } else if (digits.startsWith("9665")) {
    digits = "0" + digits.slice(3);
  } else if (digits.startsWith("5") && digits.length === 9) {
    digits = "0" + digits;
  }

  return digits;
}

function isValidDomain(domain) {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
}

function resetDomainCheckState(clearMessage = true) {
  domainAvailabilityState = {
    checked: false,
    domain: "",
    available: null
  };

  if (clearMessage && domainCheckResult) {
    domainCheckResult.hidden = true;
    domainCheckResult.textContent = "";
    domainCheckResult.classList.remove("is-available", "is-unavailable", "is-error");
  }
}

function setDomainCheckResult(type, message) {
  if (!domainCheckResult) return;

  domainCheckResult.hidden = false;
  domainCheckResult.textContent = message;
  domainCheckResult.classList.remove("is-available", "is-unavailable", "is-error");

  if (type === "available") {
    domainCheckResult.classList.add("is-available");
  } else if (type === "unavailable") {
    domainCheckResult.classList.add("is-unavailable");
  } else {
    domainCheckResult.classList.add("is-error");
  }
}

function setDomainCheckLoading(isLoading) {
  if (!domainCheckBtn) return;

  domainCheckBtn.disabled = isLoading;
  domainCheckBtn.textContent = isLoading ? "جاري التحقق..." : "تحقق من التوفر";
}

function updateDomainMode(option) {
  selectedDomainOption = option;
  resetDomainCheckState(true);

  domainChoiceBtns.forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.domainOption === option);
  });

  if (option === "new_domain") {
    domainInput.disabled = false;
    domainInput.placeholder = "example.com";
    domainHelpText.textContent = "اكتب الدومين المطلوب مثل: lamasatalanood.com";
    domainNote.textContent = "ظهور الدومين كمتاح لا يعني حجزه نهائيًا إلا بعد إتمام الحجز من طرفنا.";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = false;
    }

    return;
  }

  if (option === "client_has_domain") {
    domainInput.disabled = false;
    domainInput.placeholder = "example.com";
    domainHelpText.textContent = "اكتب الدومين الحالي الذي تملكه، وسنراجع طريقة ربطه بالموقع.";
    domainNote.textContent = "قد نحتاج منك لاحقًا تعديل إعدادات DNS أو تزويدنا بطريقة الدخول لمزود الدومين.";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = true;
    }

    return;
  }

  if (option === "later") {
    domainInput.value = "";
    domainInput.disabled = true;
    domainInput.placeholder = "سيتم اختياره لاحقًا";
    domainHelpText.textContent = "لا مشكلة، يمكنك إكمال الطلب الآن واختيار الدومين لاحقًا.";
    domainNote.textContent = "سيظهر في حسابك أن الدومين بانتظار الاختيار.";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = true;
    }
  }
}

async function checkDomainAvailability() {
  const domain = normalizeDomainInput(domainInput.value);

  resetDomainCheckState(false);

  if (!domain) {
    setDomainCheckResult("error", "اكتب الدومين أولًا");
    return;
  }

  if (!isValidDomain(domain)) {
    setDomainCheckResult("error", "اكتب الدومين بصيغة صحيحة مثل example.com");
    return;
  }

  setDomainCheckLoading(true);
  setDomainCheckResult("error", "جاري فحص توفر الدومين...");

  try {
    const response = await fetch(DOMAIN_CHECK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "تعذر فحص الدومين حاليًا");
    }

    domainAvailabilityState = {
      checked: true,
      domain: data.domain || domain,
      available: data.available === true
    };

    if (domainAvailabilityState.available) {
      setDomainCheckResult("available", "✓ ممتاز. الدومين متاح تقدر تكمل");
    } else {
      setDomainCheckResult("unavailable", "× الدومين غير متاح جرب اسم ثاني");
    }

  } catch (error) {
    resetDomainCheckState(false);
    setDomainCheckResult(
      "error",
      error.message || "تعذر فحص الدومين حاليًا، حاول مرة أخرى"
    );
  } finally {
    setDomainCheckLoading(false);
  }
}

function validateDomainStep() {
  if (selectedDomainOption === "later") {
    return {
      domainOption: "later",
      domain: null,
      domainStatus: "domain_later",
      domainAvailabilityChecked: false,
      domainAvailable: null
    };
  }

  const domain = normalizeDomainInput(domainInput.value);

  if (!domain) {
    throw "اكتب الدومين";
  }

  if (!isValidDomain(domain)) {
    throw "اكتب الدومين بصيغة صحيحة مثل example.com";
  }

  if (selectedDomainOption === "client_has_domain") {
    return {
      domainOption: "client_has_domain",
      domain,
      domainStatus: "needs_review",
      domainAvailabilityChecked: false,
      domainAvailable: null
    };
  }

  if (!domainAvailabilityState.checked || domainAvailabilityState.domain !== domain) {
    throw "تحقق من توفر الدومين أولًا";
  }

  if (domainAvailabilityState.available !== true) {
    throw "الدومين غير متاح، جرّب اسمًا آخر";
  }

  return {
    domainOption: "new_domain",
    domain,
    domainStatus: "pending_purchase",
    domainAvailabilityChecked: true,
    domainAvailable: true
  };
}

/* =========================
   UI events
========================= */
if (activityTypeEl && customTypeEl) {
  activityTypeEl.onchange = () => {
    customTypeEl.style.display = activityTypeEl.value === "أخرى" ? "block" : "none";
  };
}

if (togglePasswordBtn && passwordEl) {
  togglePasswordBtn.addEventListener("click", () => {
    passwordEl.type = passwordEl.type === "password" ? "text" : "password";
  });
}

if (packageEl) {
  packageEl.addEventListener("change", updatePlanNote);
}

if (cycleEl) {
  cycleEl.addEventListener("change", updatePlanNote);
}

if (nextStepBtn) {
  nextStepBtn.addEventListener("click", () => {
    try {
      validateStepOne();
      showStage(2);
    } catch (error) {
      alert(error.message || error);
    }
  });
}

if (domainPrevBtn) {
  domainPrevBtn.addEventListener("click", () => {
    showStage(1);
  });
}

if (domainNextBtn) {
  domainNextBtn.addEventListener("click", () => {
    try {
      validateDomainStep();
      showStage(3);
    } catch (error) {
      alert(error.message || error);
    }
  });
}

if (prevStepBtn) {
  prevStepBtn.addEventListener("click", () => {
    showStage(2);
  });
}

if (domainCheckBtn) {
  domainCheckBtn.addEventListener("click", checkDomainAvailability);
}

if (domainInput) {
  domainInput.addEventListener("input", () => {
    if (selectedDomainOption === "new_domain") {
      resetDomainCheckState(true);
    }
  });
}

domainChoiceBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const option = btn.dataset.domainOption;

    updateDomainMode(option);

    if (option === "later") {
      showStage(3);
    }
  });
});

/* =========================
   Query params
========================= */
(function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const modelParam = (params.get("model") || params.get("template") || "").trim();
  const planParam = normalizePlanParam((params.get("plan") || "").trim().toLowerCase());
  const cycleParam = normalizeCycleParam((params.get("cycle") || "").trim().toLowerCase());

  if (modelParam && templateEl) {
    for (const option of templateEl.options) {
      if (option.value === modelParam) {
        templateEl.value = modelParam;
        break;
      }
    }
  }

  if (planParam && packageEl) {
    for (const option of packageEl.options) {
      if (option.value === planParam) {
        packageEl.value = planParam;
        break;
      }
    }
  }

  if (cycleParam && cycleEl) {
    for (const option of cycleEl.options) {
      if (option.value === cycleParam) {
        cycleEl.value = cycleParam;
        break;
      }
    }
  }

  updatePlanNote();
  updateDomainMode("new_domain");
  showStage(1);
})();

/* =========================
   Submit request
========================= */
if (submitBtn) {
  submitBtn.onclick = async () => {
    submitBtn.innerText = "جاري الإرسال...";
    submitBtn.disabled = true;

    try {
      const domainInfo = validateDomainStep();

      const name = document.getElementById("name").value.trim();
      const activityName = document.getElementById("activityName").value.trim();
      let activityType = activityTypeEl.value;
      const customTypeVal = customTypeEl.value.trim();
      const selectedPackage = packageEl.value;
      const cycle = cycleEl.value;
      const template = templateEl.value;
      const phoneRaw = document.getElementById("phone").value.trim();
      const phone = normalizePhoneInput(phoneRaw);
      const password = passwordEl.value;

      if (activityType === "أخرى") {
        activityType = customTypeVal;
      }

      if (name.length < 3) throw "اكتب اسم التاجر";
      if (activityName.length < 2) throw "اكتب اسم النشاط";
      if (!activityType) throw "اختر نوع النشاط";
      if (!selectedPackage) throw "اختر الباقة";
      if (!cycle) throw "اختر نوع الاشتراك";
      if (!template) throw "اختر النموذج";

      if (!/^05\d{8}$/.test(phone)) {
        throw "رقم الجوال غير صحيح. اكتب الرقم بصيغة 05xxxxxxxx";
      }

      if (password.length < 6) throw "كلمة المرور ضعيفة";

      const email = phone + "@user.com";

      let user;

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          user = cred.user;
        } else {
          throw err;
        }
      }

      const orderRef = doc(db, "orders", user.uid);
      const orderSnap = await getDoc(orderRef);

      const orderData = {
        name,
        activityName,
        activityType,
        package: selectedPackage,
        billingCycle: cycle,
        template,
        phone,
        status: "تم تقديم الطلب",
        userId: user.uid,
        orderId: "ORD-" + Date.now(),

        domainOption: domainInfo.domainOption,
        domain: domainInfo.domain,
        domainStatus: domainInfo.domainStatus,
        domainAvailabilityChecked: domainInfo.domainAvailabilityChecked,
        domainAvailable: domainInfo.domainAvailable
      };

      if (!orderSnap.exists()) {
        await setDoc(orderRef, {
          ...orderData,
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(orderRef, {
          ...orderData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name,
          phone,
          role: "client",
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          name,
          phone,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      const subRef = doc(db, "subscriptions", user.uid);
      const subSnap = await getDoc(subRef);

      const subscriptionData = {
        userId: user.uid,
        name,
        phone,
        status: "جاري التفعيل",
        plan: selectedPackage,
        billingCycle: cycle,
        template,
        siteUrl: "",
        hostingDate: "",
        domainDate: "",

        domainOption: domainInfo.domainOption,
        domain: domainInfo.domain,
        domainStatus: domainInfo.domainStatus,
        domainAvailabilityChecked: domainInfo.domainAvailabilityChecked,
        domainAvailable: domainInfo.domainAvailable,

        updatedAt: serverTimestamp()
      };

      if (!subSnap.exists()) {
        await setDoc(subRef, {
          subId: "SUB-" + Math.floor(100000 + Math.random() * 900000),
          ...subscriptionData,
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(subRef, subscriptionData, { merge: true });
      }

      const msg = document.createElement("div");
      msg.className = "request-success-toast";
      msg.innerText = "✅ تم إرسال الطلب بنجاح\nجاري تحويلك...";
      document.body.appendChild(msg);

      setTimeout(() => {
        window.location.href = "account.html";
      }, 1200);

    } catch (e) {
      alert(e.message || e);
    } finally {
      submitBtn.innerText = "إتمام طلب الموقع";
      submitBtn.disabled = false;
    }
  };
}
