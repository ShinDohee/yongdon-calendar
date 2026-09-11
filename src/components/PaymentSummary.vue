<script setup>
import { computed } from "vue";
import { useLedger } from "../composables/useLedger.js";
import { fmt } from "../constants.js";

const { paymentTotals, monthTotal } = useLedger();

const entries = computed(() => Object.entries(paymentTotals.value).sort((a, b) => b[1] - a[1]));
const maxV = computed(() => (entries.value.length ? entries.value[0][1] : 1));
function barWidth(amt) { return Math.max(4, Math.round((amt / maxV.value) * 100)) + "%"; }
function pct(amt) { return monthTotal.value ? Math.round((amt / monthTotal.value) * 100) : 0; }
</script>

<template>
  <div class="summary-box">
    <h3>결제수단별 지출</h3>
    <div v-if="entries.length === 0" class="summary-empty">아직 입력된 지출이 없어요.</div>
    <div v-else>
      <div v-for="[pay, amt] in entries" :key="pay" class="bar-row">
        <div class="bar-label">{{ pay }}</div>
        <div class="bar-track"><div class="bar-fill" :style="{ width: barWidth(amt) }"></div></div>
        <div class="bar-amount">{{ fmt(amt) }} ({{ pct(amt) }}%)</div>
      </div>
    </div>
  </div>
</template>
