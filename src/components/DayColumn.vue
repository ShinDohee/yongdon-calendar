<script setup>
import { computed } from "vue";
import ItemCard from "./ItemCard.vue";
import { useLedger } from "../composables/useLedger.js";
import { DOW, HOLIDAYS, fmt } from "../constants.js";

const props = defineProps({
  dateStr: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
});

const { currentDays, addItem, dayTotal } = useLedger();

const day = computed(() => Number(props.dateStr.slice(-2)));
const colIdx = computed(() => {
  const jsDow = new Date(props.year, props.month - 1, day.value).getDay(); // 0=Sun..6=Sat
  return (jsDow + 6) % 7; // 0=Mon..6=Sun
});
const holidayName = computed(() => HOLIDAYS[props.dateStr]);
const headerClass = computed(() => {
  if (holidayName.value) return "holiday";
  if (colIdx.value === 5) return "sat";
  if (colIdx.value === 6) return "sun";
  return "";
});
const items = computed(() => currentDays.value[props.dateStr] || []);
const total = computed(() => dayTotal(props.dateStr));
</script>

<template>
  <div class="day-col">
    <div class="day-header" :class="headerClass">
      {{ month }}/{{ day }} ({{ DOW[colIdx] }})
      <span v-if="holidayName" class="holiday-name">{{ holidayName }}</span>
    </div>
    <div class="item-list">
      <ItemCard v-for="item in items" :key="item.id" :date-str="dateStr" :item="item" />
    </div>
    <button type="button" class="add-btn" @click="addItem(dateStr)">+ 항목 추가</button>
    <div class="day-total">{{ fmt(total) }}</div>
  </div>
</template>
