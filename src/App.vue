<script setup>
import { ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import GroupPanel from "./components/GroupPanel.vue";
import CalendarGrid from "./components/CalendarGrid.vue";
import CategorySummary from "./components/CategorySummary.vue";
import PaymentSummary from "./components/PaymentSummary.vue";
import { useLedger } from "./composables/useLedger.js";

const { lastError } = useLedger();

const showCatPanel = ref(false);
const showPayPanel = ref(false);
</script>

<template>
  <div class="page">
    <header class="app-head">
      <div class="brand">
        <span class="brand-mark">💰</span>
        <h1>용돈 캘린더</h1>
      </div>
      <span class="storage-note">이 브라우저에 저장됨</span>
    </header>

    <Toolbar
      :show-cat="showCatPanel"
      :show-pay="showPayPanel"
      @toggle-cat="showCatPanel = !showCatPanel"
      @toggle-pay="showPayPanel = !showPayPanel"
    />

    <GroupPanel v-if="showCatPanel" kind="category" />
    <GroupPanel v-if="showPayPanel" kind="payment" />

    <CalendarGrid />

    <div class="summary-section">
      <CategorySummary />
      <PaymentSummary />
    </div>

    <div class="status">{{ lastError.value }}</div>
  </div>
</template>
