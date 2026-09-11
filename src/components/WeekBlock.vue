<script setup>
import { computed } from "vue";
import DayColumn from "./DayColumn.vue";
import { useLedger } from "../composables/useLedger.js";
import { fmt } from "../constants.js";

const props = defineProps({
  weekDates: { type: Array, required: true }, // dateStr | null, always length 7
  weekIndex: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
});

const { currentBudgets, dayTotal, setWeekBudget } = useLedger();

const weekSum = computed(() =>
  props.weekDates.reduce((s, d) => s + (d ? dayTotal(d) : 0), 0)
);
const budget = computed(() => currentBudgets.value[props.weekIndex]);
const remain = computed(() => (budget.value == null || budget.value === "" ? null : Number(budget.value) - weekSum.value));

function onBudgetChange(e) {
  const val = e.target.value === "" ? null : Number(e.target.value);
  setWeekBudget(props.weekIndex, val);
}
</script>

<template>
  <div class="week-block">
    <div class="week-scroll">
      <div class="week-grid">
        <template v-for="(dateStr, i) in weekDates" :key="dateStr ?? 'blank-' + i">
          <div v-if="!dateStr" class="day-col blank"></div>
          <DayColumn v-else :date-str="dateStr" :month="month" :year="year" />
        </template>
      </div>
    </div>
    <div class="week-total-bar">
      <span class="week-tag">{{ weekIndex + 1 }}주차</span>
      <span class="week-sum">주별 합계 {{ fmt(weekSum) }}</span>
      <span class="week-budget-label">예산</span>
      <input
        type="number"
        inputmode="numeric"
        class="week-budget-input"
        placeholder="미설정"
        :value="budget ?? ''"
        @change="onBudgetChange"
      >
      <span v-if="remain != null" class="week-remain" :class="remain >= 0 ? 'ok' : 'over'">
        {{ remain >= 0 ? "남은 " + fmt(remain) : "초과 " + fmt(Math.abs(remain)) }}
      </span>
    </div>
  </div>
</template>
