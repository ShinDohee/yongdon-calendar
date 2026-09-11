<script setup>
import { ref, computed, watch } from "vue";
import { useLedger } from "../composables/useLedger.js";
import { fmt } from "../constants.js";

const { state, catTotals, monthTotal } = useLedger();

const view = ref(state.catView || "");
watch(view, (v) => { state.catView = v; });
watch(
  () => state.categoryGroups.map((g) => g.name),
  (names) => { if (view.value && !names.includes(view.value)) view.value = ""; }
);

const title = computed(() => (view.value ? view.value + " · 소분류별 지출" : "대분류별 지출"));

const entries = computed(() => {
  if (!view.value) {
    const majorTotals = {};
    Object.entries(catTotals.value).forEach(([cat, amt]) => {
      const major = cat.includes(" / ") ? cat.split(" / ")[0] : cat;
      majorTotals[major] = (majorTotals[major] || 0) + amt;
    });
    const ordered = [];
    state.categoryGroups.forEach((g) => { if (majorTotals[g.name] != null) ordered.push(g.name); });
    Object.keys(majorTotals).forEach((m) => { if (!ordered.includes(m)) ordered.push(m); });
    return ordered.map((m) => [m, majorTotals[m]]);
  }
  const prefix = view.value + " / ";
  const subTotals = {};
  Object.entries(catTotals.value).forEach(([cat, amt]) => {
    if (cat.startsWith(prefix)) {
      const sub = cat.slice(prefix.length);
      subTotals[sub] = (subTotals[sub] || 0) + amt;
    }
  });
  const grp = state.categoryGroups.find((g) => g.name === view.value);
  const ordered = [];
  if (grp) grp.children.forEach((c) => { if (subTotals[c] != null) ordered.push(c); });
  Object.keys(subTotals).forEach((c) => { if (!ordered.includes(c)) ordered.push(c); });
  return ordered.map((c) => [c, subTotals[c]]);
});

const maxV = computed(() => Math.max(1, ...entries.value.map((e) => e[1])));
function barHeight(amt) { return Math.max(3, Math.round((amt / maxV.value) * 90)) + "%"; }
function pct(amt) { return monthTotal.value ? Math.round((amt / monthTotal.value) * 100) : 0; }
</script>

<template>
  <div class="summary-box">
    <div class="summary-box-head">
      <h3>{{ title }}</h3>
      <select v-model="view" class="cat-view-select">
        <option value="">대분류별 보기</option>
        <option v-for="g in state.categoryGroups" :key="g.name" :value="g.name">{{ g.name }} (소분류)</option>
      </select>
    </div>
    <div v-if="entries.length === 0" class="summary-empty">
      {{ view ? "이 대분류에 입력된 지출이 없어요." : "아직 입력된 지출이 없어요." }}
    </div>
    <div v-else class="vbar-chart">
      <div v-for="[label, amt] in entries" :key="label" class="vbar-col">
        <div class="vbar-plot">
          <div class="vbar-fill" :style="{ height: barHeight(amt) }">
            <div class="vbar-amount">{{ fmt(amt) }}</div>
          </div>
        </div>
        <div class="vbar-foot">
          <div class="vbar-label">{{ label }}</div>
          <div class="vbar-pct">{{ pct(amt) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>
