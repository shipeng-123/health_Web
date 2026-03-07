<template>
  <div class="page">
    <el-card class="card">
      <template #header>
        <div class="header">
          <div class="title">健康报告</div>
          <div class="toolbar">
            <el-radio-group v-model="mode" @change="reloadAll">
              <el-radio-button label="week">周报</el-radio-button>
              <el-radio-button label="month">月报</el-radio-button>
            </el-radio-group>

            <el-date-picker
              v-if="mode === 'week'"
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              @change="reloadAll"
            />

            <el-date-picker
              v-else
              v-model="selectedMonth"
              type="month"
              value-format="YYYY-MM"
              @change="reloadAll"
            />

            <el-button @click="reloadAll" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="summary-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">总摄入热量</div>
            <div class="summary-value">{{ report.totalIntake.toFixed(2) }}</div>
            <div class="summary-unit">kcal</div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">总消耗热量</div>
            <div class="summary-value">{{ report.totalSport.toFixed(2) }}</div>
            <div class="summary-unit">kcal</div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">推荐总热量</div>
            <div class="summary-value">
              {{ report.totalRecommended.toFixed(2) }}
            </div>
            <div class="summary-unit">kcal</div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div
              class="summary-value"
              :class="{
                danger: report.totalDiff > 0,
                ok: report.totalDiff <= 0,
              }"
            >
              {{ report.totalDiff.toFixed(2) }}
            </div>
            <div class="summary-label">热量盈亏</div>
            <div class="summary-unit">kcal</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="summary-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <div class="mini-title">计划完成情况</div>
            <div class="plan-stat-wrap">
              <div class="plan-stat-line">
                完成率：{{ (report.planCompletionRate * 100).toFixed(0) }}%
              </div>
              <div class="plan-stat-line">
                已完成 / 总数：{{ report.planDoneItems }}/{{
                  report.planTotalItems
                }}
              </div>
              <el-progress
                :percentage="
                  Number((report.planCompletionRate * 100).toFixed(0))
                "
              />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <div class="mini-title">报告区间</div>
            <div class="range-text">{{ rangeText }}</div>
            <div class="range-sub">健康报告与数据统计</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <div class="mini-title">热量统计环形图</div>
            <div ref="pieRef" class="chart"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <div class="mini-title">每日热量柱状图</div>
            <div ref="barRef" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :xs="24">
          <el-card shadow="never" class="inner-card">
            <div class="mini-title">身体指标趋势折线图</div>
            <div ref="lineRef" class="chart line-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { getDailyCalorieSummaryApi } from "@/api/dailyCalorie";
import { statWeek, statMonth } from "@/api/plan";
import { getBodyMetricTrend, type BodyMetricTrendResp } from "@/api/bodyMetric";

type DailySummary = {
  date: string;
  intakeCalories: number;
  sportCalories: number;
  recommendedCalories: number;
  diffVsRecommended: number;
};

const loading = ref(false);
const mode = ref<"week" | "month">("week");
const selectedDate = ref(formatLocalDate());
const selectedMonth = ref(formatMonthValue(new Date()));

const pieRef = ref<HTMLDivElement | null>(null);
const barRef = ref<HTMLDivElement | null>(null);
const lineRef = ref<HTMLDivElement | null>(null);

let pieChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;

const dailyList = ref<DailySummary[]>([]);
const bodyTrend = ref<BodyMetricTrendResp | null>(null);

const report = ref({
  totalIntake: 0,
  totalSport: 0,
  totalRecommended: 0,
  totalDiff: 0,
  planCompletionRate: 0,
  planDoneItems: 0,
  planTotalItems: 0,
});

function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getWeekStart(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatLocalDate(date);
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function getMonthRange(monthStr: string) {
  const [y, m] = monthStr.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0);
  const end = formatLocalDate(endDate);
  return { start, end };
}

function getDateRange() {
  if (mode.value === "week") {
    const start = getWeekStart(selectedDate.value);
    const end = addDays(start, 6);
    return { start, end };
  }
  return getMonthRange(selectedMonth.value);
}

function enumerateDates(start: string, end: string) {
  const result: string[] = [];
  let cur = start;
  while (cur <= end) {
    result.push(cur);
    cur = addDays(cur, 1);
  }
  return result;
}

const rangeText = computed(() => {
  const { start, end } = getDateRange();
  return `${start} ~ ${end}`;
});

async function loadDailySummaries(start: string, end: string) {
  const dates = enumerateDates(start, end);
  const list = await Promise.all(
    dates.map(async (date) => {
      const res: any = await getDailyCalorieSummaryApi(date);
      const data = res?.data ?? {};
      return {
        date,
        intakeCalories: Number(data.intakeCalories ?? 0),
        sportCalories: Number(data.sportCalories ?? 0),
        recommendedCalories: Number(data.recommendedCalories ?? 0),
        diffVsRecommended: Number(data.diffVsRecommended ?? 0),
      } as DailySummary;
    })
  );
  dailyList.value = list;
}

async function loadPlanStat(start: string) {
  if (mode.value === "week") {
    const res = await statWeek(start);
    report.value.planCompletionRate = Number(res.data?.completionRate ?? 0);
    report.value.planDoneItems = Number(res.data?.doneItems ?? 0);
    report.value.planTotalItems = Number(res.data?.totalItems ?? 0);
  } else {
    const year = Number(selectedMonth.value.slice(0, 4));
    const month = Number(selectedMonth.value.slice(5, 7));
    const res = await statMonth(year, month);
    report.value.planCompletionRate = Number(res.data?.completionRate ?? 0);
    report.value.planDoneItems = Number(res.data?.doneItems ?? 0);
    report.value.planTotalItems = Number(res.data?.totalItems ?? 0);
  }
}

async function loadBodyTrend(start: string, end: string) {
  const res: any = await getBodyMetricTrend(start, end);
  bodyTrend.value = res?.data ?? null;
}

function calcSummary() {
  report.value.totalIntake = dailyList.value.reduce(
    (sum, x) => sum + x.intakeCalories,
    0
  );
  report.value.totalSport = dailyList.value.reduce(
    (sum, x) => sum + x.sportCalories,
    0
  );
  report.value.totalRecommended = dailyList.value.reduce(
    (sum, x) => sum + x.recommendedCalories,
    0
  );
  report.value.totalDiff = dailyList.value.reduce(
    (sum, x) => sum + x.diffVsRecommended,
    0
  );
}

function renderPie() {
  if (!pieRef.value) return;
  if (!pieChart) pieChart = echarts.init(pieRef.value);

  pieChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const value = Number(params.value ?? 0).toFixed(2);
        const percent = Number(params.percent ?? 0).toFixed(2);
        return `${params.seriesName}<br/>${params.marker}${params.name}：${value} kcal (${percent}%)`;
      },
    },
    legend: { bottom: 0 },
    series: [
      {
        name: "热量统计",
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          { value: report.value.totalIntake, name: "摄入热量" },
          { value: report.value.totalSport, name: "运动消耗" },
          { value: report.value.totalRecommended, name: "推荐热量" },
        ],
        label: { formatter: "{b}\n{d}%" },
      },
    ],
  });
}

function renderBar() {
  if (!barRef.value) return;
  if (!barChart) barChart = echarts.init(barRef.value);

  barChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    xAxis: {
      type: "category",
      data: dailyList.value.map((x) => x.date.slice(5)),
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "摄入热量",
        type: "bar",
        data: dailyList.value.map((x) => x.intakeCalories),
      },
      {
        name: "运动消耗",
        type: "bar",
        data: dailyList.value.map((x) => x.sportCalories),
      },
    ],
  });
}

function renderLine() {
  if (!lineRef.value) return;
  if (!lineChart) lineChart = echarts.init(lineRef.value);

  const dates = bodyTrend.value?.dates ?? [];
  const weightKg = bodyTrend.value?.weightKg ?? [];
  const bodyFatPct = bodyTrend.value?.bodyFatPct ?? [];
  const waistCm = bodyTrend.value?.waistCm ?? [];
  const bmi = bodyTrend.value?.bmi ?? [];

  lineChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    xAxis: {
      type: "category",
      data: dates.map((d) => d.slice(5)),
    },
    yAxis: { type: "value" },
    series: [
      { name: "体重", type: "line", smooth: true, data: weightKg },
      { name: "体脂率", type: "line", smooth: true, data: bodyFatPct },
      { name: "腰围", type: "line", smooth: true, data: waistCm },
      { name: "BMI", type: "line", smooth: true, data: bmi },
    ],
  });
}

async function reloadAll() {
  loading.value = true;
  try {
    const { start, end } = getDateRange();

    await Promise.all([
      loadDailySummaries(start, end),
      loadPlanStat(start),
      loadBodyTrend(start, end),
    ]);

    calcSummary();

    await nextTick();
    renderPie();
    renderBar();
    renderLine();
  } catch (e: any) {
    ElMessage.error(e?.message || "加载健康报告失败");
  } finally {
    loading.value = false;
  }
}

function handleResize() {
  pieChart?.resize();
  barChart?.resize();
  lineChart?.resize();
}

onMounted(() => {
  reloadAll();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  pieChart?.dispose();
  barChart?.dispose();
  lineChart?.dispose();
});
</script>

<style scoped>
.page {
  padding: 12px;
}

.card {
  border-radius: 12px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  font-weight: 700;
  font-size: 18px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-row {
  margin-bottom: 16px;
}

.summary-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  min-height: 116px;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.summary-value.danger {
  color: #dc2626;
}

.summary-value.ok {
  color: #16a34a;
}

.summary-unit {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.inner-card {
  border-radius: 12px;
}

.mini-title {
  font-weight: 700;
  margin-bottom: 12px;
  color: #111827;
}

.plan-stat-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-stat-line {
  color: #475569;
  font-size: 14px;
}

.range-text {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.range-sub {
  font-size: 13px;
  color: #64748b;
}

.chart {
  width: 100%;
  height: 320px;
}

.line-chart {
  height: 380px;
}
</style>
