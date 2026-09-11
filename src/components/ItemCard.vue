<script setup>
import { computed } from "vue";
import { useLedger } from "../composables/useLedger.js";
import { catValue } from "../constants.js";

const props = defineProps({
  dateStr: { type: String, required: true },
  item: { type: Object, required: true },
});

const { state, updateItem, deleteItem, flatCategoryValues, flatPaymentList } = useLedger();

function onField(field, value) {
  updateItem(props.dateStr, props.item.id, { [field]: field === "amount" ? Number(value) || 0 : value });
}

// select는 v-model(내부적으로 mounted 훅에서 값을 다시 적용)로 바인딩해야
// <option>들이 그려지기 전에 값이 먼저 세팅되는 문제가 없음
const category = computed({
  get: () => props.item.category,
  set: (v) => onField("category", v),
});
const payment = computed({
  get: () => props.item.payment,
  set: (v) => onField("payment", v),
});
</script>

<template>
  <div class="item-card">
    <div class="item-line">
      <select v-model="category">
        <option
          v-if="item.category && !flatCategoryValues.includes(item.category)"
          :value="item.category"
        >{{ item.category }}</option>
        <optgroup v-for="group in state.categoryGroups" :key="group.name" :label="group.name">
          <option v-for="child in group.children" :key="child" :value="catValue(group.name, child)">{{ child }}</option>
        </optgroup>
      </select>
      <select v-model="payment">
        <option
          v-if="item.payment && !flatPaymentList.includes(item.payment)"
          :value="item.payment"
        >{{ item.payment }}</option>
        <optgroup v-for="group in state.payments" :key="group.name" :label="group.name">
          <option v-for="child in group.children" :key="child" :value="child">{{ child }}</option>
        </optgroup>
      </select>
    </div>
    <div class="item-line">
      <input
        class="item-name"
        type="text"
        placeholder="항목"
        :value="item.item"
        @change="onField('item', $event.target.value)"
      >
      <input
        class="item-amount"
        type="number"
        inputmode="numeric"
        placeholder="금액"
        :value="item.amount ? item.amount : ''"
        @change="onField('amount', $event.target.value)"
      >
      <button type="button" class="del-btn" @click="deleteItem(dateStr, item.id)">✕</button>
    </div>
  </div>
</template>
