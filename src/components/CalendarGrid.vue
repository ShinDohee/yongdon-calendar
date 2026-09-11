<script setup>
import { computed } from "vue";
import WeekBlock from "./WeekBlock.vue";
import { useLedger } from "../composables/useLedger.js";
import { DOW, daysInMonth, fmt } from "../constants.js";

const { currentMonthInfo, monthTotal, dailyAvg } = useLedger();

const weeks = computed(() => {
  const info = currentMonthInfo.value;
  const numDays = daysInMonth(info.year, info.month);
  const firstJsDow = new Date(info.year, info.month - 1, 1).getDay();
  const leadingBlanks = (firstJsDow + 6) % 7;

  const dates = [];
  for (let i = 0; i < leadingBlanks; i++) dates.push(null);
  for (let day = 1; day <= numDays; day++) dates.push(info.key + "-" + String(day).padStart(2, "0"));
  while (dates.length % 7 !== 0) dates.push(null);

  const out = [];
  for (let i = 0; i < dates.length; i += 7) out.push(dates.slice(i, i + 7));
  return out;
});
</script>

<template>
  <div>
    <div class="summary-cards">
      <div class="card">
        <div class="label">이 달 총 지출</div>
        <div class="value">{{ fmt(monthTotal) }}</div>
      </div>
      <div class="card">
        <div class="label">일평균 (지출일 기준)</div>
        <div class="value">{{ fmt(dailyAvg) }}</div>
      </div>
    </div>

    <div class="calendar-header">
      <div v-for="(d, idx) in DOW" :key="d" :class="idx === 5 ? 'sat' : idx === 6 ? 'sun' : ''">{{ d }}</div>
    </div>

    <WeekBlock
      v-for="(weekDates, wIdx) in weeks"
      :key="wIdx"
      :week-dates="weekDates"
      :week-index="wIdx"
      :month="currentMonthInfo.month"
      :year="currentMonthInfo.year"
    />

    <div class="month-total-bar">{{ currentMonthInfo.label }} 총 합계 {{ fmt(monthTotal) }}</div>
  </div>
</template>
