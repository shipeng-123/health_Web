<!-- src/views/plan/PlanToday.vue -->
<template>
  <div class="page">
    <el-card class="card" v-loading="loading">
      <template #header>
        <div class="header">
          <div class="title">今日计划</div>
          <div class="ops">
            <el-button @click="reload">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="toolbar">
        <div class="row">
          <div class="label">日期：</div>
          <el-date-picker
            v-model="date"
            type="date"
            value-format="YYYY-MM-DD"
            @change="reload"
          />
        </div>

        <div class="row" v-if="today">
          <el-tag v-if="today.planId">计划：{{ today.planName }}</el-tag>
          <el-tag type="info"
            >完成率：{{ (today.completionRate * 100).toFixed(0) }}%</el-tag
          >
          <el-tag type="success"
            >已完成：{{ today.doneCount }}/{{ today.totalCount }}</el-tag
          >
        </div>
      </div>

      <el-empty
        v-if="today && !today.planId"
        description="本周还没有计划，可去“模板计划”或“周计划”创建"
      ></el-empty>

      <el-table v-else :data="today?.items || []" style="width: 100%">
        <el-table-column label="运动" width="180">
          <template #default="{ row }">
            {{ sportLabel(row.sportType) }}
          </template>
        </el-table-column>
        <el-table-column
          label="时长(分钟)"
          prop="targetDurationMin"
          width="120"
        />
        <el-table-column label="距离(km)" prop="targetDistanceKm" width="100" />
        <el-table-column label="提醒" prop="remindTime" width="100" />
        <el-table-column label="备注" prop="remark" min-width="200" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.done === 1" type="success">已完成</el-tag>
            <el-tag v-else type="warning">未完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button
              v-if="row.done === 0"
              type="primary"
              @click="doCheckin(row)"
              >打卡</el-button
            >
            <el-button v-else @click="undoCheckin(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="stat-wrap">
        <el-card class="stat">
          <div class="stat-title">本周完成率</div>
          <div class="stat-val">{{ weekStatText }}</div>
        </el-card>
        <el-card class="stat">
          <div class="stat-title">本月完成率</div>
          <div class="stat-val">{{ monthStatText }}</div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  getTodayPlan,
  checkinPlan,
  statWeek,
  statMonth,
  type TodayPlanResp,
  type TodayPlanItemResp,
  type PlanStatResp,
} from "@/api/plan";
const sportLabelMap: Record<string, string> = {
  RUNNING: "跑步",
  CYCLING: "骑行",
  SWIMMING: "游泳",
  STRENGTH_TRAINING: "力量训练",
  WALKING: "步行",
  JUMP_ROPE: "跳绳",
  BADMINTON: "羽毛球",
};

function sportLabel(code?: string) {
  if (!code) return "";
  return sportLabelMap[code] || code;
}
const loading = ref(false);
const date = ref<string>("");

const today = ref<TodayPlanResp | null>(null);
const weekStat = ref<PlanStatResp | null>(null);
const monthStat = ref<PlanStatResp | null>(null);

let remindTimer: any = null;

function formatLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// date(yyyy-mm-dd) -> weekStartDate(周一)
function weekStartOf(dateStr: string) {
  const dt = new Date(dateStr + "T00:00:00");
  const day = dt.getDay(); // 0..6, 1=Monday
  const diffToMonday = (day + 6) % 7;
  dt.setDate(dt.getDate() - diffToMonday);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const weekStatText = computed(() => {
  if (!weekStat.value) return "-";
  return `${(weekStat.value.completionRate * 100).toFixed(0)}%（${
    weekStat.value.doneItems
  }/${weekStat.value.totalItems}）`;
});
const monthStatText = computed(() => {
  if (!monthStat.value) return "-";
  return `${(monthStat.value.completionRate * 100).toFixed(0)}%（${
    monthStat.value.doneItems
  }/${monthStat.value.totalItems}）`;
});

async function reload() {
  if (!date.value) return;
  loading.value = true;
  try {
    const res = await getTodayPlan(date.value);
    today.value = res.data ?? null;

    // 刷新统计
    const ws = weekStartOf(date.value);
    const [w, m] = await Promise.all([
      statWeek(ws),
      statMonth(Number(date.value.slice(0, 4)), Number(date.value.slice(5, 7))),
    ]);
    weekStat.value = w.data ?? null;
    monthStat.value = m.data ?? null;

    resetReminder();
  } catch (e: any) {
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

async function doCheckin(row: TodayPlanItemResp) {
  try {
    await checkinPlan({ planItemId: row.id, done: true });
    ElMessage.success("打卡成功");
    await reload();
  } catch (e: any) {
    ElMessage.error(e?.message || "打卡失败");
  }
}

async function undoCheckin(row: TodayPlanItemResp) {
  try {
    await checkinPlan({ planItemId: row.id, done: false });
    ElMessage.success("已取消打卡");
    await reload();
  } catch (e: any) {
    ElMessage.error(e?.message || "取消失败");
  }
}

// 简单提醒：每30秒检查一次是否到点（当天的 remindTime）
function resetReminder() {
  if (remindTimer) {
    clearInterval(remindTimer);
    remindTimer = null;
  }

  const data = today.value;
  if (!data || !data.items || data.items.length === 0) return;

  const fired = new Set<string>();

  remindTimer = setInterval(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const cur = `${hh}:${mm}`;

    data.items.forEach((it) => {
      if (it.done === 1) return;
      if (!it.remindTime) return;
      if (it.remindTime !== cur) return;

      const key = `${data.date}-${it.id}-${cur}`;
      if (fired.has(key)) return;
      fired.add(key);

      ElMessage.warning(
        `提醒：该运动该做了（${it.sportType}，${it.targetDurationMin}分钟）`
      );
    });
  }, 30 * 1000);
}

onMounted(() => {
  date.value = formatLocalDate();
  reload();
});

onBeforeUnmount(() => {
  if (remindTimer) clearInterval(remindTimer);
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
}
.title {
  font-weight: 700;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  color: #666;
}
.stat-wrap {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat {
  width: 260px;
  border-radius: 12px;
}
.stat-title {
  color: #666;
  font-size: 13px;
  margin-bottom: 6px;
}
.stat-val {
  font-size: 20px;
  font-weight: 700;
}
</style>
