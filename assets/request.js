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
const prevStepBtn = document.getElementById("prevStepBtn");
const stageOneEl = document.querySelector('[data-stage="1"]');
const stageTwoEl = document.querySelector('[data-stage="2"]');
const requestProgressFill = document.getElementById("requestProgressFill");

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

function setStep(step) {
  const isStepOne = step === 1;

  if (isStepOne) {
    stageOneEl.hidden = false;
    stageOneEl.style.display = "grid";

    stageTwoEl.hidden = true;
    stageTwoEl.style.display = "none";
  } else {
    stageOneEl.hidden = true;
    stageOneEl.style.display = "none";

    stageTwoEl.hidden = false;
    stageTwoEl.style.display = "grid";
  }

  if (requestProgressFill) {
    requestProgressFill.style.width = isStepOne ? "50%" : "100%";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStepOne() {
  if (!packageEl.value) throw "اختر الباقة";
  if (!cycleEl.value) throw "اختر نوع الاشتراك";
  if (!templateEl.value) throw "اختر النموذج";
}

/* =========================
   UI events
========================= */
activityTypeEl.onchange = () => {
  customTypeEl.style.display = activityTypeEl.value === "أخرى" ? "block" : "none";
};

togglePasswordBtn.addEventListener("click", () => {
  passwordEl.type = passwordEl.type === "password" ? "text" : "password";
});

packageEl.addEventListener("change", updatePlanNote);
cycleEl.addEventListener("change", updatePlanNote);

nextStepBtn.addEventListener("click", () => {
  try {
    validateStepOne();
    setStep(2);
  } catch (error) {
    alert(error.message || error);
  }
});

prevStepBtn.addEventListener("click", () => {
  setStep(1);
});

/* =========================
   Query params
========================= */
(function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const modelParam = (params.get("model") || params.get("template") || "").trim();
  const planParam = normalizePlanParam((params.get("plan") || "").trim().toLowerCase());
  const cycleParam = normalizeCycleParam((params.get("cycle") || "").trim().toLowerCase());

  if (modelParam) {
    for (const option of templateEl.options) {
      if (option.value === modelParam) {
        templateEl.value = modelParam;
        break;
      }
    }
  }

  if (planParam) {
    for (const option of packageEl.options) {
      if (option.value === planParam) {
        packageEl.value = planParam;
        break;
      }
    }
  }

  if (cycleParam) {
    for (const option of cycleEl.options) {
      if (option.value === cycleParam) {
        cycleEl.value = cycleParam;
        break;
      }
    }
  }

  updatePlanNote();
  setStep(1);
})();

/* =========================
   Submit request
========================= */
submitBtn.onclick = async () => {
  submitBtn.innerText = "جاري الإرسال...";
  submitBtn.disabled = true;

  try {
    const name = document.getElementById("name").value.trim();
    const activityName = document.getElementById("activityName").value.trim();
    let activityType = activityTypeEl.value;
    const customTypeVal = customTypeEl.value.trim();
    const selectedPackage = packageEl.value;
    const cycle = cycleEl.value;
    const template = templateEl.value;
    const phone = document.getElementById("phone").value.trim();
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
    if (!/^\d{10}$/.test(phone)) throw "رقم الجوال غير صحيح";
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
      createdAt: serverTimestamp()
    };

    if (!orderSnap.exists()) {
      await setDoc(orderRef, orderData);
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