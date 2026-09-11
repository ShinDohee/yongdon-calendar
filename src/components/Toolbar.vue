<script setup>
import { computed } from "vue";
import { useLedger } from "../composables/useLedger.js";

defineProps({ showCat: Boolean, showPay: Boolean });
const emit = defineEmits(["toggle-cat", "toggle-pay"]);

const { state, MONTHS, switchMonth, resetCurrentMonth, exportSnapshot, importSnapshot } = useLedger();

const monthKey = computed({
  get: () => state.currentMonthKey,
  set: (v) => switchMonth(v),
});

function onExport() {
  const json = JSON.stringify(exportSnapshot(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "용돈캘린더_백업_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function onImportChange(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try { parsed = JSON.parse(reader.result); }
    catch (err) { alert("JSON 파일이 아니에요."); return; }
    if (!confirm("가져오면 지금 데이터에 덮어써져요. 계속할까요?")) return;
    importSnapshot(parsed);
    alert("가져오기 완료!");
  };
  reader.readAsText(file);
}

function onReset() {
  if (confirm("이 달의 모든 기록을 지울까요?")) resetCurrentMonth();
}
</script>

<template>
  <div class="toolbar">
    <label class="field" for="monthSelect"><span>월</span></label>
    <select id="monthSelect" class="month-select" v-model="monthKey">
      <option v-for="m in MONTHS" :key="m.key" :value="m.key">{{ m.label }}</option>
    </select>
    <button class="btn ghost" type="button" @click="emit('toggle-cat')">카테고리</button>
    <button class="btn ghost" type="button" @click="emit('toggle-pay')">결제수단</button>
    <details class="backup">
      <summary class="btn ghost">백업</summary>
      <div class="backup-body">
        <button class="btn ghost" type="button" @click="onExport">JSON 내보내기</button>
        <label class="btn ghost" for="importFile">JSON 가져오기</label>
        <input id="importFile" type="file" accept="application/json,.json" hidden @change="onImportChange">
        <p class="hint">다른 기기·브라우저로 옮길 때 사용. 가져오면 현재 데이터에 덮어써져요.</p>
      </div>
    </details>
    <button class="btn danger" type="button" @click="onReset">이 달 비우기</button>
  </div>
</template>
