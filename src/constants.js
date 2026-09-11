// 달력에 표시할 월 목록. 새 달이 필요하면 여기 한 줄만 추가하면 됨.
export const MONTHS = [
  { key: "2026-09", label: "9월", year: 2026, month: 9 },
  { key: "2026-10", label: "10월", year: 2026, month: 10 },
  { key: "2026-11", label: "11월", year: 2026, month: 11 },
  { key: "2026-12", label: "12월", year: 2026, month: 12 },
  { key: "2027-01", label: "1월", year: 2027, month: 1 },
  { key: "2027-02", label: "2월", year: 2027, month: 2 },
];

export const DOW = ["월", "화", "수", "목", "금", "토", "일"]; // 월요일 시작

export const DEFAULT_PAYMENT_GROUPS = [
  { name: "카드", children: ["BC", "신한", "현대백화점", "삼성", "하나"] },
  { name: "현금", children: ["현금", "카카오페이머니", "토스페이머니", "체크카드"] },
];

export const DEFAULT_CATEGORY_GROUPS = [
  { name: "생필품", children: ["의류", "식대"] },
  { name: "주말생활비", children: ["식대", "여가"] },
  { name: "가족생활비", children: ["식대", "의류비", "병원비"] },
  { name: "기타", children: ["여행", "기타"] },
];

// 공휴일(빨간날): 날짜 => 이름. 필요한 만큼 추가하면 됨.
export const HOLIDAYS = {
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "한글날",
};

export function fmt(n) {
  return Math.round(n || 0).toLocaleString("ko-KR") + "원";
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 카테고리 저장값: "대분류 / 소분류" (같은 소분류명이 여러 대분류에 있어도 구분됨)
export function catValue(groupName, child) {
  return groupName + " / " + child;
}
