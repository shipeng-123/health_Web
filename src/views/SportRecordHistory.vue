<template>
  <div class="sport-page">
    <!-- 运动日历视图 -->
    <el-card class="card-block">
      <template #header>
        <div class="card-title">运动记录日历视图</div>
      </template>

      <div class="calendar-toolbar">
        <div class="toolbar-left">
          <el-button @click="goPrevMonth">上个月</el-button>
          <el-button @click="goTodayMonth">本月</el-button>
          <el-button @click="goNextMonth">下个月</el-button>

          <el-date-picker
            v-model="monthPickerValue"
            type="month"
            value-format="YYYY-MM"
            format="YYYY年MM月"
            placeholder="选择年月"
            style="width: 150px"
            @change="handleMonthPickerChange"
          />
        </div>
        <div class="toolbar-title">{{ currentYear }}年{{ currentMonth }}月</div>
      </div>

      <div class="calendar-grid-wrap" v-loading="calendarLoading">
        <div class="week-header">
          <div v-for="w in weekLabels" :key="w" class="week-cell">{{ w }}</div>
        </div>

        <div class="day-grid">
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="day-cell"
            :class="{
              'is-other-month': !cell.isCurrentMonth,
              'is-today': cell.dateStr === todayStr,
              'is-selected': cell.dateStr === selectedDate,
              'has-record': !!calendarMap[cell.dateStr],
            }"
            @click="handleClickDate(cell)"
          >
            <div class="day-num">{{ cell.day }}</div>

            <div
              v-if="calendarMap[cell.dateStr]"
              class="day-kcal"
              :title="`总热量：${calendarMap[cell.dateStr].totalCalories} kcal`"
            >
              {{ formatDayCalories(calendarMap[cell.dateStr].totalCalories) }}
            </div>

            <div
              v-if="calendarMap[cell.dateStr]"
              class="day-dot"
              :title="`记录数：${calendarMap[cell.dateStr].recordCount}`"
            ></div>
          </div>
        </div>
      </div>

      <div class="month-summary-tip">
        已加载 {{ currentYear }}年{{
          currentMonth
        }}月日历数据（仅显示有记录日期的热量）
      </div>
    </el-card>

    <!-- 按日期查看历史记录 -->
    <el-card class="card-block">
      <template #header>
        <div class="card-title">按日期查看历史记录</div>
      </template>

      <div class="query-toolbar">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY/MM/DD"
          placeholder="选择日期"
          style="width: 180px"
        />
        <el-button
          type="primary"
          :loading="dateLoading"
          @click="loadDateRecords"
        >
          查询
        </el-button>
      </div>

      <div v-if="dateSummary" class="date-summary">
        <div class="summary-item">
          <span class="label">日期</span>
          <span class="value">{{ dateSummary.date }}</span>
        </div>
        <div class="summary-item">
          <span class="label">记录数</span>
          <span class="value">{{ dateSummary.recordCount }}</span>
        </div>
        <div class="summary-item">
          <span class="label">总时长</span>
          <span class="value">{{ dateSummary.totalDurationMin }} 分钟</span>
        </div>
        <div class="summary-item">
          <span class="label">总热量</span>
          <span class="value">{{ dateSummary.totalCalories }} kcal</span>
        </div>
      </div>

      <el-table
        v-loading="dateLoading"
        :data="dateRecords"
        stripe
        border
        style="width: 100%; margin-top: 12px"
        empty-text="当天暂无运动记录"
      >
        <el-table-column prop="sportType" label="运动类型" min-width="130">
          <template #default="{ row }">
            {{ sportTypeText(row.sportType) }}
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="记录时间" width="110">
          <template #default="{ row }">
            {{ formatRecordTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="durationMin" label="时长(分钟)" width="110" />

        <el-table-column prop="distanceKm" label="距离(km)" width="110">
          <template #default="{ row }">
            {{ row.distanceKm ?? "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="metValue" label="MET" width="90" />
        <el-table-column prop="calories" label="热量(kcal)" width="120" />

        <el-table-column prop="remark" label="备注" min-width="180">
          <template #default="{ row }">
            {{ row.remark || "-" }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getSportTypeListLocal,
  getSportRecordsByDate,
  getSportCalendar,
} from "@/api/sport";

type SportTypeOption = {
  label: string;
  value: string;
  met: number;
};

type CalendarDayAgg = {
  date: string;
  recordCount: number;
  totalDurationMin: number;
  totalCalories: number;
};

type DateRecordItem = {
  id: number;
  sportType: string;
  durationMin: number;
  distanceKm: number | null;
  metValue: number;
  calories: number;
  recordDate: string;
  remark: string;
  createTime?: string;
};

type DateSummaryResp = {
  date: string;
  recordCount: number;
  totalDurationMin: number;
  totalCalories: number;
  records: DateRecordItem[];
};

const sportTypeOptions = getSportTypeListLocal() as SportTypeOption[];

const today = new Date();
const todayStr = formatDateToYMD(today);

// =========================
// 日历视图（月聚合）
// =========================
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1);
const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];
const calendarDays = ref<CalendarDayAgg[]>([]);
const calendarLoading = ref(false);
const monthPickerValue = ref("");

watch(
  [currentYear, currentMonth],
  () => {
    monthPickerValue.value = `${currentYear.value}-${String(
      currentMonth.value
    ).padStart(2, "0")}`;
  },
  { immediate: true }
);

const calendarMap = computed<Record<string, CalendarDayAgg>>(() => {
  const map: Record<string, CalendarDayAgg> = {};
  for (const item of calendarDays.value) {
    map[item.date] = item;
  }
  return map;
});

type CalendarCell = {
  key: string;
  year: number;
  month: number;
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
};

const calendarCells = computed<CalendarCell[]>(() => {
  const y = currentYear.value;
  const m = currentMonth.value;

  const firstDay = new Date(y, m - 1, 1);
  const firstWeekday = firstDay.getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const daysInCurrentMonth = new Date(y, m, 0).getDate();
  const daysInPrevMonth = new Date(y, m - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < offset; i++) {
    const day = daysInPrevMonth - offset + i + 1;
    const d = new Date(y, m - 2, day);
    cells.push(makeCell(d, false));
  }

  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(y, m - 1, day);
    cells.push(makeCell(d, true));
  }

  while (cells.length < 42) {
    const idx = cells.length - (offset + daysInCurrentMonth) + 1;
    const d = new Date(y, m, idx);
    cells.push(makeCell(d, false));
  }

  return cells;
});

function makeCell(d: Date, isCurrentMonth: boolean): CalendarCell {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dateStr = formatDateToYMD(d);
  return {
    key: `${dateStr}-${isCurrentMonth ? "c" : "o"}`,
    year: y,
    month: m,
    day,
    dateStr,
    isCurrentMonth,
  };
}

async function loadCalendarData() {
  calendarLoading.value = true;
  try {
    const res: any = await getSportCalendar(
      currentYear.value,
      currentMonth.value
    );
    if (res?.code === 0) {
      calendarDays.value = res?.data?.days || [];
    } else {
      ElMessage.error(res?.message || "加载月历数据失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("加载月历数据失败");
  } finally {
    calendarLoading.value = false;
  }
}

function goPrevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value -= 1;
    currentMonth.value = 12;
  } else {
    currentMonth.value -= 1;
  }
  loadCalendarData();
}

function goNextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value += 1;
    currentMonth.value = 1;
  } else {
    currentMonth.value += 1;
  }
  loadCalendarData();
}

function goTodayMonth() {
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
  loadCalendarData();
}

function handleMonthPickerChange(val: string | null) {
  if (!val) return;
  const [y, m] = val.split("-").map(Number);
  if (!y || !m) return;
  currentYear.value = y;
  currentMonth.value = m;
  loadCalendarData();
}

function formatDayCalories(v: number | string) {
  const num = Number(v);
  if (Number.isNaN(num)) return "";
  return `${Math.round(num)} kcal`;
}

function handleClickDate(cell: CalendarCell) {
  selectedDate.value = cell.dateStr;

  if (!cell.isCurrentMonth) {
    currentYear.value = cell.year;
    currentMonth.value = cell.month;
    loadCalendarData();
  }

  loadDateRecords();
}

// =========================
// 按日期查看历史记录
// =========================
const selectedDate = ref(todayStr);
const dateLoading = ref(false);
const dateSummary = ref<Omit<DateSummaryResp, "records"> | null>(null);
const dateRecords = ref<DateRecordItem[]>([]);

async function loadDateRecords() {
  if (!selectedDate.value) {
    ElMessage.warning("请先选择日期");
    return;
  }

  dateLoading.value = true;
  try {
    const res: any = await getSportRecordsByDate(selectedDate.value);
    if (res?.code === 0) {
      const data = res?.data;
      dateSummary.value = {
        date: data?.date,
        recordCount: data?.recordCount ?? 0,
        totalDurationMin: data?.totalDurationMin ?? 0,
        totalCalories: data?.totalCalories ?? 0,
      };
      dateRecords.value = data?.records || [];
    } else {
      ElMessage.error(res?.message || "查询失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("查询失败");
  } finally {
    dateLoading.value = false;
  }
}

// =========================
// 工具函数
// =========================
function sportTypeText(value: string) {
  const hit = sportTypeOptions.find((x) => x.value === value);
  return hit?.label || value || "-";
}

function formatRecordTime(val?: string) {
  if (!val) return "-";
  const s = String(val).replace("T", " ");
  return s.length >= 19 ? s.slice(11, 19) : s;
}

function formatDateToYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

onMounted(async () => {
  await Promise.all([loadCalendarData(), loadDateRecords()]);
});
</script>

<style scoped>
.sport-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-block {
  border-radius: 14px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
}

/* 日历工具栏 */
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-title {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

/* 日历网格 */
.calendar-grid-wrap {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.week-cell {
  text-align: center;
  padding: 10px 0;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-cell {
  position: relative;
  min-height: 84px;
  border-right: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
  padding: 8px 8px 6px 8px;
  cursor: pointer;
  background: #fff;
  transition: background-color 0.15s ease;
}

.day-cell:hover {
  background: #f8fbff;
}

.day-grid .day-cell:nth-child(7n) {
  border-right: none;
}

.day-num {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.day-kcal {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.2;
  color: #67c23a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-dot {
  position: absolute;
  right: 8px;
  bottom: 6px;
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
  opacity: 0.9;
}

.is-other-month .day-num {
  color: #c0c4cc;
}

.is-other-month .day-kcal {
  color: #b7e1b0;
}

.is-today {
  background: #f0f9ff;
}

.is-today .day-num {
  color: #409eff;
}

.is-selected {
  box-shadow: inset 0 0 0 2px #409eff;
  z-index: 1;
}

.has-record {
  background: #fcfffa;
}

.month-summary-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

/* 日期查询区域 */
.query-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.date-summary {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
}

.summary-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fafafa;
}

.summary-item .label {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item .value {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

@media (max-width: 768px) {
  .day-cell {
    min-height: 68px;
    padding: 6px;
  }

  .day-num {
    font-size: 13px;
  }

  .day-kcal {
    margin-top: 6px;
    font-size: 10px;
  }

  .date-summary {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .toolbar-title {
    width: 100%;
    text-align: left;
    font-size: 16px;
  }
}
</style>
