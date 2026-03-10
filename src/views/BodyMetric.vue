<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="header">
          <div class="title">身体指标追踪</div>
          <div class="sub">每周/每月记录一次也可以，趋势图会自动更新</div>
        </div>
      </template>

      <el-form :model="form" label-width="110px" class="form" @submit.prevent>
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="记录日期">
              <el-date-picker
                v-model="form.recordDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="体重(kg)">
              <el-input-number
                v-model="form.weightKg"
                :min="0"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="例如 70.5"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="体脂率(%)">
              <el-input-number
                v-model="form.bodyFatPct"
                :min="0"
                :max="100"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="例如 18.2"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="胸围(cm)">
              <el-input-number
                v-model="form.chestCm"
                :min="0"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="例如 96.5"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="腰围(cm)">
              <el-input-number
                v-model="form.waistCm"
                :min="0"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="例如 82.0"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="臀围(cm)">
              <el-input-number
                v-model="form.hipCm"
                :min="0"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="例如 98.0"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="16">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="可选" clearable />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="8" class="btns">
            <el-button type="primary" :loading="saving" @click="onSave">
              保存/覆盖
            </el-button>
            <el-button :loading="loading" @click="reloadAll">刷新</el-button>
            <el-button
              type="danger"
              plain
              :disabled="!latest?.id"
              @click="onDeleteLatest"
            >
              删除最新
            </el-button>
          </el-col>
        </el-row>
      </el-form>

      <el-divider />

      <el-row :gutter="12">
        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="mini">
            <template #header>
              <div class="mini-title">最新 BMI & 评估</div>
            </template>

            <div v-if="latest" class="bmi-box">
              <div class="bmi-row">
                <span class="label">日期：</span>
                <span>{{ latest.recordDate }}</span>
              </div>
              <div class="bmi-row">
                <span class="label">体重：</span>
                <span>{{ latest.weightKg ?? "-" }} kg</span>
              </div>
              <div class="bmi-row">
                <span class="label">体脂率：</span>
                <span>{{ latest.bodyFatPct ?? "-" }} %</span>
              </div>
              <div class="bmi-row">
                <span class="label">胸围：</span>
                <span>{{ latest.chestCm ?? "-" }} cm</span>
              </div>
              <div class="bmi-row">
                <span class="label">腰围：</span>
                <span>{{ latest.waistCm ?? "-" }} cm</span>
              </div>
              <div class="bmi-row">
                <span class="label">臀围：</span>
                <span>{{ latest.hipCm ?? "-" }} cm</span>
              </div>
              <div class="bmi-row">
                <span class="label">BMI：</span>
                <span>{{ latest.bmi ?? "-" }}</span>
              </div>
              <div class="bmi-row">
                <span class="label">评估：</span>
                <span>{{ latest.bmiLevel ?? "-" }}</span>
              </div>

              <el-alert
                v-if="latest.bmiAdvice"
                :title="latest.bmiAdvice"
                type="info"
                show-icon
                :closable="false"
                style="margin-top: 10px"
              />
              <el-alert
                v-else
                title="提示：如果 BMI 显示为空，请先在“个人中心”完善身高(heightCm)。"
                type="warning"
                show-icon
                :closable="false"
                style="margin-top: 10px"
              />
            </div>

            <el-empty v-else description="暂无身体指标记录，请先新增一次" />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="14">
          <el-card shadow="never" class="mini">
            <template #header>
              <div class="mini-title">
                趋势图（ECharts）
                <span class="range"> {{ range.start }} ~ {{ range.end }} </span>
              </div>
            </template>

            <div class="chart-tools">
              <el-date-picker
                v-model="range.start"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="开始日期"
              />
              <el-date-picker
                v-model="range.end"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="结束日期"
              />
              <el-button type="primary" @click="loadTrend">查询趋势</el-button>

              <el-checkbox-group v-model="checkedLines" class="checks">
                <el-checkbox label="weightKg">体重</el-checkbox>
                <el-checkbox label="bodyFatPct">体脂率</el-checkbox>
                <el-checkbox label="chestCm">胸围</el-checkbox>
                <el-checkbox label="waistCm">腰围</el-checkbox>
                <el-checkbox label="hipCm">臀围</el-checkbox>
                <el-checkbox label="bmi">BMI</el-checkbox>
              </el-checkbox-group>
            </div>

            <div ref="chartRef" class="chart" />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import * as echarts from "echarts";
import {
  deleteBodyMetric,
  getLatestBodyMetric,
  getBodyMetricTrend,
  upsertBodyMetric,
  type BodyMetricResp,
  type UpsertBodyMetricReq,
  type BodyMetricTrendResp,
} from "@/api/bodyMetric";

type MetricLineKey =
  | "weightKg"
  | "bodyFatPct"
  | "chestCm"
  | "waistCm"
  | "hipCm"
  | "bmi";

const loading = ref(false);
const saving = ref(false);

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const form = reactive<UpsertBodyMetricReq>({
  recordDate: today(),
  weightKg: null,
  bodyFatPct: null,
  chestCm: null,
  waistCm: null,
  hipCm: null,
  remark: "",
});

const latest = ref<BodyMetricResp | null>(null);

const range = reactive({
  start: "",
  end: "",
});

const checkedLines = ref<MetricLineKey[]>([
  "weightKg",
  "waistCm",
  "bodyFatPct",
  "bmi",
]);

const trendData = ref<BodyMetricTrendResp>({
  dates: [],
  weightKg: [],
  bodyFatPct: [],
  waistCm: [],
  hipCm: [],
  chestCm: [],
  bmi: [],
});

// ------ chart ------
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function initChart() {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart(trendData.value);
  window.addEventListener("resize", onResize);
}

function onResize() {
  chart?.resize();
}

function renderChart(data: BodyMetricTrendResp) {
  if (!chart) return;

  const series: echarts.SeriesOption[] = [];

  const addLine = (name: string, arr: (number | null)[], yAxisIndex = 0) => {
    series.push({
      name,
      type: "line",
      data: arr,
      connectNulls: false,
      smooth: true,
      yAxisIndex,
    });
  };

  // 左轴：体重 / 围度 / BMI
  if (checkedLines.value.includes("weightKg")) {
    addLine("体重(kg)", data.weightKg, 0);
  }
  if (checkedLines.value.includes("chestCm")) {
    addLine("胸围(cm)", data.chestCm, 0);
  }
  if (checkedLines.value.includes("waistCm")) {
    addLine("腰围(cm)", data.waistCm, 0);
  }
  if (checkedLines.value.includes("hipCm")) {
    addLine("臀围(cm)", data.hipCm, 0);
  }
  if (checkedLines.value.includes("bmi")) {
    addLine("BMI", data.bmi, 0);
  }

  // 右轴：体脂率
  if (checkedLines.value.includes("bodyFatPct")) {
    addLine("体脂率(%)", data.bodyFatPct, 1);
  }

  chart.setOption(
    {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { top: 40, left: 40, right: 55, bottom: 40 },
      xAxis: { type: "category", data: data.dates },
      yAxis: [
        { type: "value", name: "体重/围度/BMI" },
        { type: "value", name: "体脂率(%)", position: "right" },
      ],
      series,
    },
    true
  );
}

async function reloadAll() {
  loading.value = true;
  try {
    const res = await getLatestBodyMetric();
    if (res.code === 0) {
      latest.value = res.data;
      if (latest.value?.recordDate) {
        form.recordDate = latest.value.recordDate;
      }
    } else {
      latest.value = null;
    }
  } finally {
    loading.value = false;
  }
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  range.start = fmt(start);
  range.end = fmt(end);
}

async function loadTrend() {
  if (!range.start || !range.end) {
    ElMessage.warning("请先选择开始/结束日期");
    return;
  }

  const res = await getBodyMetricTrend(range.start, range.end);
  if (res.code === 0) {
    trendData.value = res.data;
    renderChart(trendData.value);
  } else {
    ElMessage.error(res.message || "查询失败");
  }
}

watch(
  checkedLines,
  () => {
    renderChart(trendData.value);
  },
  { deep: true }
);

async function onSave() {
  if (!form.recordDate) {
    ElMessage.warning("请选择记录日期");
    return;
  }

  saving.value = true;
  try {
    const res = await upsertBodyMetric(form);
    if (res.code === 0) {
      ElMessage.success("保存成功");
      latest.value = res.data;
      await loadTrend();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } finally {
    saving.value = false;
  }
}

async function onDeleteLatest() {
  if (!latest.value?.id) return;

  await ElMessageBox.confirm(
    `确认删除最新记录？（${latest.value.recordDate}）`,
    "提示",
    { type: "warning" }
  );

  const res = await deleteBodyMetric(latest.value.id);
  if (res.code === 0) {
    ElMessage.success("删除成功");
    latest.value = null;
    await reloadAll();
    await loadTrend();
  } else {
    ElMessage.error(res.message || "删除失败");
  }
}

onMounted(async () => {
  defaultRange();
  initChart();
  await reloadAll();
  await loadTrend();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  chart?.dispose();
  chart = null;
});
</script>

<style scoped>
.page {
  padding: 12px;
}
.card {
  border-radius: 10px;
}
.header .title {
  font-size: 18px;
  font-weight: 700;
}
.header .sub {
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}
.form {
  margin-top: 10px;
}
.btns {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mini {
  border-radius: 10px;
}
.mini-title {
  font-weight: 700;
}
.bmi-box .bmi-row {
  margin: 6px 0;
}
.bmi-box .label {
  color: #666;
  display: inline-block;
  width: 70px;
}
.chart {
  width: 100%;
  height: 360px;
}
.chart-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.checks {
  margin-left: auto;
}
.range {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
  font-weight: 400;
}
</style>
