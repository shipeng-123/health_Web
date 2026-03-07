<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from "vue";
import { RefreshRight } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { getDailyCalorieSummaryApi } from "@/api/dailyCalorie";
import { getTodayPlan, getWeekPlan, type WeekPlanResp } from "@/api/plan";
import { useRouter } from "vue-router";

const router = useRouter();
const go = (path: string) => router.push(path);
const goProfile = () => router.push("/profile");

function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStartDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatLocalDate(date);
}

function formatMonthDay(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

const today = ref(formatLocalDate());
const loading = ref(false);
const daily = ref<any>(null);

const planLoading = ref(false);
const weekPlan = ref<WeekPlanResp | null>(null);

// 近7日趋势
const trendLoading = ref(false);
const trendRef = ref<HTMLDivElement | null>(null);
let trendChart: echarts.ECharts | null = null;

type TrendItem = {
  date: string;
  intakeCalories: number;
  sportCalories: number;
  recommendedCalories: number;
};

const trendList = ref<TrendItem[]>([]);

const sportLabelMap: Record<string, string> = {
  RUNNING: "跑步",
  CYCLING: "骑行",
  SWIMMING: "游泳",
  STRENGTH_TRAINING: "力量训练",
  WALKING: "步行",
  JUMP_ROPE: "跳绳",
  BADMINTON: "羽毛球",
  BASKETBALL: "篮球",
  FOOTBALL: "足球",
  YOGA: "瑜伽",
  AEROBICS: "有氧操",
  HIKING: "徒步",
};

const weekDayMap: Record<number, string> = {
  1: "周一",
  2: "周二",
  3: "周三",
  4: "周四",
  5: "周五",
  6: "周六",
  7: "周日",
};

function sportLabel(code?: string) {
  if (!code) return "";
  return sportLabelMap[code] || code;
}

function weekDayLabel(day?: number) {
  if (!day) return "";
  return weekDayMap[day] || `周${day}`;
}

const remainText = computed(() => {
  if (!daily.value) return "";
  if (daily.value.profileReady === false) {
    return daily.value.profileTip || "请完善个人资料";
  }
  const diff = Number(daily.value.diffVsRecommended ?? 0);
  if (diff > 0) return `已超出推荐 ${diff.toFixed(2)} kcal`;
  return `还可摄入 ${Math.abs(diff).toFixed(2)} kcal`;
});

const todayDoneText = computed(() => {
  if (!weekPlan.value || !weekPlan.value.items?.length) return "今日已完成 0/0";
  const todayItems = weekPlan.value.items.filter(
    (item) => item.planDate === today.value
  );
  const doneCount = todayItems.filter((item) => item.done === 1).length;
  return `今日已完成 ${doneCount}/${todayItems.length}`;
});

const weekDoneText = computed(() => {
  if (!weekPlan.value || !weekPlan.value.planId) return "本周已完成：0/0";
  return `本周已完成：${weekPlan.value.doneCount}/${weekPlan.value.totalCount}`;
});

const weekRateText = computed(() => {
  if (!weekPlan.value || !weekPlan.value.planId) return "本周完成率：0%";
  return `本周完成率：${(weekPlan.value.completionRate * 100).toFixed(0)}%`;
});

const displayPlanName = computed(() => {
  const name = weekPlan.value?.planName;
  if (!name) return "本周计划：未设置";
  return `本周计划：${name}`;
});

async function loadToday() {
  loading.value = true;
  try {
    const result: any = await getDailyCalorieSummaryApi(today.value);
    if (result.code === 0) {
      daily.value = result.data;
    } else {
      ElMessage.error(result.message || "加载今日概览失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("加载今日概览失败");
  } finally {
    loading.value = false;
  }
}

async function loadWeekPlan() {
  planLoading.value = true;
  try {
    const todayRes = await getTodayPlan(today.value);
    const weekStartDate =
      todayRes?.code === 0 && todayRes?.data?.weekStartDate
        ? todayRes.data.weekStartDate
        : getWeekStartDate(today.value);

    const weekRes = await getWeekPlan(weekStartDate);
    if (weekRes.code === 0) {
      weekPlan.value = weekRes.data ?? null;
    } else {
      weekPlan.value = null;
    }
  } catch (e) {
    weekPlan.value = null;
  } finally {
    planLoading.value = false;
  }
}

async function loadTrend() {
  trendLoading.value = true;
  try {
    const dates = Array.from({ length: 7 }, (_, i) =>
      addDays(today.value, i - 6)
    );
    const list = await Promise.all(
      dates.map(async (date) => {
        const res: any = await getDailyCalorieSummaryApi(date);
        const data = res?.data ?? {};
        return {
          date,
          intakeCalories: Number(data.intakeCalories ?? 0),
          sportCalories: Number(data.sportCalories ?? 0),
          recommendedCalories: Number(data.recommendedCalories ?? 0),
        } as TrendItem;
      })
    );
    trendList.value = list;
    await nextTick();
    renderTrendChart();
  } catch (e) {
    console.error(e);
    trendList.value = [];
    ElMessage.error("加载近7日趋势失败");
  } finally {
    trendLoading.value = false;
  }
}

function renderTrendChart() {
  if (!trendRef.value) return;
  if (!trendChart) {
    trendChart = echarts.init(trendRef.value);
  }

  const labels = trendList.value.map((x) => x.date.slice(5));
  const intakeData = trendList.value.map((x) => x.intakeCalories);
  const sportData = trendList.value.map((x) => x.sportCalories);
  const recommendedData = trendList.value.map((x) => x.recommendedCalories);

  trendChart.setOption({
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 0,
      data: ["摄入热量", "运动消耗", "推荐热量"],
    },
    grid: {
      left: 48,
      right: 24,
      top: 48,
      bottom: 36,
    },
    xAxis: {
      type: "category",
      data: labels,
    },
    yAxis: {
      type: "value",
      name: "kcal",
    },
    series: [
      {
        name: "摄入热量",
        type: "bar",
        data: intakeData,
        barMaxWidth: 24,
      },
      {
        name: "运动消耗",
        type: "bar",
        data: sportData,
        barMaxWidth: 24,
      },
      {
        name: "推荐热量",
        type: "line",
        smooth: true,
        data: recommendedData,
      },
    ],
  });
}

function handleResize() {
  trendChart?.resize();
}

async function refreshAll() {
  await Promise.all([loadToday(), loadWeekPlan(), loadTrend()]);
}

onMounted(() => {
  refreshAll();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  trendChart = null;
});
</script>

<template>
  <div class="home-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">首页</h2>
        <p class="page-desc">今日健康概览（热量摄入/消耗/推荐）</p>
      </div>

      <el-button
        type="primary"
        plain
        :icon="RefreshRight"
        :loading="loading || planLoading || trendLoading"
        @click="refreshAll"
      >
        刷新
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card class="card-block" shadow="hover" style="margin-bottom: 12px">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">今日热量概览</span>
              <el-tag effect="light">{{ today }}</el-tag>
            </div>
          </template>

          <template v-if="daily">
            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-label">摄入</div>
                <div class="kpi-value">{{ daily.intakeCalories }} kcal</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">消耗</div>
                <div class="kpi-value">{{ daily.sportCalories }} kcal</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">推荐</div>
                <div class="kpi-value">
                  {{ daily.recommendedCalories ?? "--" }} kcal
                </div>
              </div>
            </div>

            <div
              v-if="daily.profileReady === false"
              class="tip-box warn tip-box-row"
            >
              <span>{{ remainText }}</span>
              <el-button type="primary" size="small" @click="goProfile">
                去完善
              </el-button>
            </div>

            <div v-else class="tip-box">
              {{ remainText }}
            </div>

            <div class="sub-row">
              <div class="sub-item">
                <span class="sub-label">净摄入：</span>
                <span class="sub-value">{{ daily.netCalories }} kcal</span>
              </div>
              <div class="sub-item">
                <span class="sub-label">差值：</span>
                <span class="sub-value"
                  >{{ daily.diffVsRecommended }} kcal</span
                >
              </div>
            </div>
          </template>

          <el-empty v-else description="暂无数据，点击刷新获取今日概览" />
        </el-card>

        <el-card class="card-block" shadow="hover" v-loading="trendLoading">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">近7日热量趋势</span>
              <el-tag effect="light"
                >{{ addDays(today, -6) }} ~ {{ today }}</el-tag
              >
            </div>
          </template>

          <div ref="trendRef" class="trend-chart"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card
          class="card-block"
          shadow="hover"
          style="margin-bottom: 12px"
          v-loading="planLoading"
        >
          <template #header>
            <div class="card-title-row">
              <span class="card-title">今日运动计划</span>
              <div class="header-right">
                <el-tag type="success" effect="light">
                  {{ todayDoneText }}
                </el-tag>
                <el-tag effect="light">{{ today }}</el-tag>
              </div>
            </div>
          </template>

          <el-empty
            v-if="!weekPlan || !weekPlan.planId"
            description="本周还没有运动计划，去模板/周计划创建吧"
          >
            <el-button type="primary" @click="go('/plan-template')">
              去创建
            </el-button>
            <el-button @click="go('/plan-week')">去周计划</el-button>
          </el-empty>

          <div v-else>
            <div class="plan-summary">
              <div class="plan-name">{{ displayPlanName }}</div>
              <div class="plan-kpi">
                <el-tag type="success" effect="light">
                  {{ weekDoneText }}
                </el-tag>
                <el-tag type="warning" effect="light">
                  {{ weekRateText }}
                </el-tag>
                <el-button size="small" @click="go('/plan-week')">
                  去周计划
                </el-button>
              </div>
            </div>

            <el-table :data="weekPlan.items" size="small" style="width: 100%">
              <el-table-column label="日期" width="92">
                <template #default="{ row }">
                  {{ formatMonthDay(row.planDate) }}
                </template>
              </el-table-column>

              <el-table-column label="星期" width="78">
                <template #default="{ row }">
                  {{ weekDayLabel(row.dayOfWeek) }}
                </template>
              </el-table-column>

              <el-table-column label="运动" min-width="110">
                <template #default="{ row }">
                  {{ sportLabel(row.sportType) }}
                </template>
              </el-table-column>

              <el-table-column label="时长" width="88">
                <template #default="{ row }">
                  {{ row.targetDurationMin }} 分钟
                </template>
              </el-table-column>

              <el-table-column label="状态" width="92">
                <template #default="{ row }">
                  <el-tag v-if="row.done === 1" type="success">已完成</el-tag>
                  <el-tag v-else type="info">未完成</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <el-card class="card-block" shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">快捷入口</span>
              <el-tag effect="light">点击跳转</el-tag>
            </div>
          </template>

          <div class="todo-list">
            <div class="todo-item clickable" @click="go('/diet-record-add')">
              ✅ 录入饮食：快速计算摄入热量
            </div>
            <div
              class="todo-item clickable"
              @click="go('/diet-record-history')"
            >
              🔎 饮食查询：按日期查看摄入明细
            </div>
            <div class="todo-item clickable" @click="go('/sport-record-add')">
              ✅ 录入运动：自动统计消耗热量
            </div>
            <div
              class="todo-item clickable"
              @click="go('/sport-record-history')"
            >
              🔎 运动查询：查看运动记录与消耗
            </div>
            <div class="todo-item clickable" @click="go('/plan-template')">
              🗓️ 运动计划：选择模板生成周计划
            </div>
            <div class="todo-item clickable" @click="go('/plan-today')">
              ✅ 今日计划：查看与打卡
            </div>
            <div class="todo-item clickable" @click="go('/plan-week')">
              📅 周计划：查看本周任务
            </div>
            <div class="todo-item clickable" @click="goProfile">
              👤 完善个人资料：计算推荐摄入热量
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home-page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.page-desc {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.card-block {
  border-radius: 12px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.kpi-item {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.kpi-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.kpi-value {
  font-weight: 800;
  color: #111827;
  font-size: 18px;
}

.tip-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  background: #f8fafc;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.tip-box.warn {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.tip-box-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sub-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #64748b;
  font-size: 12px;
}

.sub-label {
  color: #94a3b8;
}

.sub-value {
  font-weight: 700;
  color: #475569;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #334155;
  font-size: 14px;
}

.todo-item {
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable:hover {
  border-color: #c6e2ff;
  background: #f5faff;
}

.plan-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.plan-name {
  font-weight: 800;
  color: #111827;
}

.plan-kpi {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

@media (max-width: 992px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: flex-start;
  }

  .card-title-row {
    align-items: flex-start;
  }

  .header-right {
    justify-content: flex-start;
  }
}
</style>
