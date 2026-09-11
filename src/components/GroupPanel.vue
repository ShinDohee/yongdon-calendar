<script setup>
import { ref } from "vue";
import { useLedger } from "../composables/useLedger.js";

// kind: 'category' | 'payment' — 대분류/소분류 구조를 공유하는 카테고리·결제수단 패널
const props = defineProps({
  kind: { type: String, required: true },
});

const { state, categoryOps, paymentOps } = useLedger();

const isCategory = props.kind === "category";
const groups = isCategory ? state.categoryGroups : state.payments;
const ops = isCategory ? categoryOps : paymentOps;
const groupNoun = isCategory ? "대분류" : "그룹";
const childNoun = isCategory ? "소분류" : "결제수단";
const childPlaceholder = isCategory ? " 안에 추가할 소분류" : " 안에 추가할 결제수단";
const newGroupPlaceholder = isCategory ? "새 대분류 이름 (예: 생필품)" : "새 그룹 이름 (예: 간편결제)";
const addGroupLabel = isCategory ? "대분류 추가" : "그룹 추가";

const newGroupName = ref("");
function onAddGroup() {
  if (ops.addGroup(newGroupName.value.trim())) newGroupName.value = "";
  else if (newGroupName.value.trim()) alert("이미 있는 " + groupNoun + "예요.");
}

const newChildName = ref({}); // gIdx -> 입력값
function onAddChild(gIdx) {
  const val = (newChildName.value[gIdx] || "").trim();
  if (!val) return;
  if (ops.addChild(gIdx, val)) newChildName.value[gIdx] = "";
  else alert("이미 있는 " + childNoun + "예요.");
}

function onRenameGroup(gIdx, el) {
  const newName = el.textContent.trim();
  const g = groups[gIdx];
  const oldName = g.name;
  const res = ops.renameGroup(gIdx, newName);
  if (!res.ok) {
    alert("이미 있는 " + groupNoun + " 이름이에요.");
    el.textContent = oldName;
  } else if (!res.changed) {
    el.textContent = oldName;
  }
}
function onRenameChild(gIdx, cIdx, el) {
  const oldName = groups[gIdx].children[cIdx];
  const res = ops.renameChild(gIdx, cIdx, el.textContent.trim());
  if (!res.ok) {
    alert("이미 있는 " + childNoun + "예요.");
    el.textContent = oldName;
  } else if (!res.changed) {
    el.textContent = oldName;
  }
}
function onDeleteGroup(gIdx) {
  if (!ops.deleteGroup(gIdx)) alert(groupNoun + "가 최소 1개는 있어야 해요.");
}
function onDeleteChild(gIdx, cIdx) {
  if (!ops.deleteChild(gIdx, cIdx)) alert(childNoun + "가 최소 1개는 있어야 해요.");
}

/* 드래그 순서 변경 */
const dragGroupIdx = ref(null);
function onGroupDrop(toIdx) {
  if (dragGroupIdx.value === null || dragGroupIdx.value === toIdx) return;
  ops.reorderGroups(dragGroupIdx.value, toIdx);
  dragGroupIdx.value = null;
}
const dragChild = ref(null); // { gIdx, cIdx }
function onChildDrop(gIdx, toIdx) {
  if (!dragChild.value || dragChild.value.gIdx !== gIdx) { dragChild.value = null; return; }
  if (dragChild.value.cIdx === toIdx) { dragChild.value = null; return; }
  ops.reorderChildren(gIdx, dragChild.value.cIdx, toIdx);
  dragChild.value = null;
}
</script>

<template>
  <div class="cat-panel">
    <div class="cat-panel-title">{{ isCategory ? "카테고리" : "결제수단" }} · 이름을 클릭하면 수정, 드래그로 순서 변경</div>
    <div>
      <div
        v-for="(group, gIdx) in groups"
        :key="group.name"
        class="pay-group"
        draggable="true"
        @dragstart="dragGroupIdx = gIdx"
        @dragover.prevent
        @drop.prevent="onGroupDrop(gIdx)"
      >
        <div class="pay-group-head">
          <span class="drag-handle">⠿</span>
          <span
            class="group-name"
            contenteditable="true"
            spellcheck="false"
            title="클릭해서 이름 수정"
            @blur="onRenameGroup(gIdx, $event.target)"
            @keydown.enter.prevent="$event.target.blur()"
          >{{ group.name }}</span>
          <button type="button" @click="onDeleteGroup(gIdx)">{{ groupNoun }} 삭제</button>
        </div>

        <div class="pay-group-children">
          <div
            v-for="(child, cIdx) in group.children"
            :key="child"
            class="cat-chip"
            draggable="true"
            @dragstart="dragChild = { gIdx, cIdx }"
            @dragover.prevent
            @drop.prevent="onChildDrop(gIdx, cIdx)"
          >
            <span class="drag-handle">⠿</span>
            <span
              class="chip-name"
              contenteditable="true"
              spellcheck="false"
              title="클릭해서 이름 수정"
              @blur="onRenameChild(gIdx, cIdx, $event.target)"
              @keydown.enter.prevent="$event.target.blur()"
            >{{ child }}</span>
            <button type="button" @click="onDeleteChild(gIdx, cIdx)">✕</button>
          </div>
        </div>

        <div class="pay-group-add">
          <input
            type="text"
            v-model="newChildName[gIdx]"
            :placeholder="group.name + childPlaceholder"
            @keydown.enter="onAddChild(gIdx)"
          >
          <button type="button" @click="onAddChild(gIdx)">추가</button>
        </div>
      </div>
    </div>

    <div class="cat-add-row">
      <input type="text" v-model="newGroupName" :placeholder="newGroupPlaceholder" @keydown.enter="onAddGroup">
      <button type="button" @click="onAddGroup">{{ addGroupLabel }}</button>
    </div>
  </div>
</template>
