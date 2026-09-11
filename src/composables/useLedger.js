import { reactive, computed, watch } from "vue";
import {
  MONTHS,
  DEFAULT_CATEGORY_GROUPS,
  DEFAULT_PAYMENT_GROUPS,
  generateId,
  catValue,
} from "../constants.js";

const STORAGE_KEY = "yongdon-calendar:v1";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        categoryGroups: parsed.categoryGroups || JSON.parse(JSON.stringify(DEFAULT_CATEGORY_GROUPS)),
        payments: parsed.payments || JSON.parse(JSON.stringify(DEFAULT_PAYMENT_GROUPS)),
        months: parsed.months || {},
        catView: parsed.catView || "",
        currentMonthKey: parsed.currentMonthKey || MONTHS[0].key,
      };
    }
  } catch (e) {
    /* 저장된 값이 깨졌으면 기본값으로 시작 */
  }
  return {
    categoryGroups: JSON.parse(JSON.stringify(DEFAULT_CATEGORY_GROUPS)),
    payments: JSON.parse(JSON.stringify(DEFAULT_PAYMENT_GROUPS)),
    months: {},
    catView: "",
    currentMonthKey: MONTHS[0].key,
  };
}

// 모듈 최상위에서 한 번만 생성 -> 어느 컴포넌트에서 import 하든 같은 상태를 공유하는
// 아주 단순한 전역 스토어 (Pinia 없이 충분한 규모)
const state = reactive(loadInitial());

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      lastError.value = "저장 실패: 브라우저 저장공간이 꽉 찼을 수 있어요.";
    }
  }, 150);
}
watch(state, persist, { deep: true });

const lastError = reactive({ value: "" });

function ensureMonth(key) {
  if (!state.months[key]) state.months[key] = { days: {}, budgets: {} };
  return state.months[key];
}
ensureMonth(state.currentMonthKey);

/* ---------------- month / day / item ---------------- */

const currentMonthInfo = computed(() => MONTHS.find((m) => m.key === state.currentMonthKey));
const currentMonthData = computed(() => ensureMonth(state.currentMonthKey));
const currentDays = computed(() => currentMonthData.value.days);
const currentBudgets = computed(() => currentMonthData.value.budgets);

function switchMonth(key) {
  ensureMonth(key);
  state.currentMonthKey = key;
}

function itemsFor(dateStr) {
  const days = currentDays.value;
  if (!days[dateStr]) days[dateStr] = [];
  return days[dateStr];
}

function dayTotal(dateStr) {
  return (currentDays.value[dateStr] || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

function addItem(dateStr) {
  itemsFor(dateStr).push({
    id: generateId(),
    item: "",
    amount: 0,
    category: flatCategoryValues.value[0] || "",
    payment: flatPaymentList.value[0] || "",
  });
}
function updateItem(dateStr, id, patch) {
  const items = currentDays.value[dateStr] || [];
  const it = items.find((x) => x.id === id);
  if (it) Object.assign(it, patch);
}
function deleteItem(dateStr, id) {
  const items = currentDays.value[dateStr];
  if (!items) return;
  const idx = items.findIndex((x) => x.id === id);
  if (idx >= 0) items.splice(idx, 1);
}
function setWeekBudget(weekIdx, amount) {
  const budgets = currentBudgets.value;
  if (amount === null || amount === "") delete budgets[weekIdx];
  else budgets[weekIdx] = amount;
}
function resetCurrentMonth() {
  state.months[state.currentMonthKey] = { days: {}, budgets: {} };
}

/* ---------------- category / payment groups ---------------- */

function makeGroupOps(groups, { onGroupRename, onChildRename } = {}) {
  return {
    addGroup(name) {
      if (!name || groups.some((g) => g.name === name)) return false;
      groups.push({ name, children: ["기타"] });
      return true;
    },
    renameGroup(gIdx, newName) {
      const g = groups[gIdx];
      if (!newName || newName === g.name) return { ok: true, changed: false };
      if (groups.some((x, i) => i !== gIdx && x.name === newName)) return { ok: false };
      const oldName = g.name;
      g.name = newName;
      if (onGroupRename) onGroupRename(oldName, newName);
      return { ok: true, changed: true };
    },
    deleteGroup(gIdx) {
      if (groups.length <= 1) return false;
      groups.splice(gIdx, 1);
      return true;
    },
    addChild(gIdx, name) {
      const g = groups[gIdx];
      if (!name || g.children.includes(name)) return false;
      g.children.push(name);
      return true;
    },
    renameChild(gIdx, cIdx, newName) {
      const g = groups[gIdx];
      const oldName = g.children[cIdx];
      if (!newName || newName === oldName) return { ok: true, changed: false };
      if (g.children.some((c, i) => i !== cIdx && c === newName)) return { ok: false };
      g.children[cIdx] = newName;
      if (onChildRename) onChildRename(g.name, oldName, newName);
      return { ok: true, changed: true };
    },
    deleteChild(gIdx, cIdx) {
      const g = groups[gIdx];
      if (g.children.length <= 1) return false;
      g.children.splice(cIdx, 1);
      return true;
    },
    reorderGroups(from, to) {
      const moved = groups.splice(from, 1)[0];
      groups.splice(to, 0, moved);
    },
    reorderChildren(gIdx, from, to) {
      const children = groups[gIdx].children;
      const moved = children.splice(from, 1)[0];
      children.splice(to, 0, moved);
    },
  };
}

// 대분류/소분류 이름이 바뀌면 이미 입력된 모든 달의 기록도 새 이름으로 갱신
function remapField(field, mapFn) {
  Object.values(state.months).forEach((month) => {
    Object.values(month.days || {}).forEach((items) => {
      (items || []).forEach((it) => {
        const nv = mapFn(it[field]);
        if (nv != null && nv !== it[field]) it[field] = nv;
      });
    });
  });
}

const categoryOps = makeGroupOps(state.categoryGroups, {
  onGroupRename: (oldName, newName) => {
    const pre = oldName + " / ";
    remapField("category", (v) => (typeof v === "string" && v.startsWith(pre) ? newName + " / " + v.slice(pre.length) : v));
  },
  onChildRename: (groupName, oldChild, newChild) => {
    remapField("category", (v) => (v === catValue(groupName, oldChild) ? catValue(groupName, newChild) : v));
  },
});
const paymentOps = makeGroupOps(state.payments, {
  onChildRename: (groupName, oldChild, newChild) => {
    remapField("payment", (v) => (v === oldChild ? newChild : v));
  },
});

const flatCategoryValues = computed(() => {
  const flat = [];
  state.categoryGroups.forEach((g) => g.children.forEach((c) => flat.push(catValue(g.name, c))));
  return flat;
});
const flatPaymentList = computed(() => {
  const flat = [];
  state.payments.forEach((g) => g.children.forEach((c) => flat.push(c)));
  return flat;
});

/* ---------------- summaries ---------------- */

const monthTotal = computed(() =>
  Object.values(currentDays.value).reduce(
    (sum, items) => sum + (items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0),
    0
  )
);
const daysWithSpend = computed(
  () => Object.keys(currentDays.value).filter((d) => dayTotal(d) > 0).length
);
const dailyAvg = computed(() => (daysWithSpend.value ? Math.round(monthTotal.value / daysWithSpend.value) : 0));

const catTotals = computed(() => {
  const totals = {};
  Object.values(currentDays.value).forEach((items) => {
    (items || []).forEach((it) => {
      const amt = Number(it.amount) || 0;
      if (!amt) return;
      const cat = it.category || "미분류";
      totals[cat] = (totals[cat] || 0) + amt;
    });
  });
  return totals;
});
const paymentTotals = computed(() => {
  const totals = {};
  Object.values(currentDays.value).forEach((items) => {
    (items || []).forEach((it) => {
      const amt = Number(it.amount) || 0;
      if (!amt) return;
      const pay = it.payment || "미지정";
      totals[pay] = (totals[pay] || 0) + amt;
    });
  });
  return totals;
});

/* ---------------- backup / restore ---------------- */

function exportSnapshot() {
  return {
    app: "용돈캘린더",
    version: 1,
    exportedAt: new Date().toISOString(),
    categoryGroups: state.categoryGroups,
    payments: state.payments,
    months: state.months,
  };
}
function importSnapshot(parsed) {
  if (Array.isArray(parsed.categoryGroups)) state.categoryGroups.splice(0, state.categoryGroups.length, ...parsed.categoryGroups);
  if (Array.isArray(parsed.payments)) state.payments.splice(0, state.payments.length, ...parsed.payments);
  if (parsed.months && typeof parsed.months === "object") {
    Object.entries(parsed.months).forEach(([key, month]) => {
      state.months[key] = { days: month.days || month || {}, budgets: month.budgets || {} };
    });
  }
}

export function useLedger() {
  return {
    state,
    lastError,
    MONTHS,
    currentMonthInfo,
    currentDays,
    currentBudgets,
    switchMonth,
    itemsFor,
    dayTotal,
    addItem,
    updateItem,
    deleteItem,
    setWeekBudget,
    resetCurrentMonth,
    categoryOps,
    paymentOps,
    flatCategoryValues,
    flatPaymentList,
    monthTotal,
    dailyAvg,
    catTotals,
    paymentTotals,
    exportSnapshot,
    importSnapshot,
  };
}
