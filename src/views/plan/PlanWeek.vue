<!-- src/views/plan/PlanWeek.vue -->
<template>
  <div class="page">
    <el-card class="card" v-loading="loading">
      <template #header>
        <div class="header">
          <div class="title">周运动计划</div>
          <div class="ops">
            <el-button @click="reload">刷新</el-button>
            <el-button type="primary" @click="save"
              >保存/覆盖本周计划</el-button
            >
          </div>
        </div>
      </template>

      <div class="toolbar">
        <div class="row">
          <div class="label">选择周一：</div>
          <el-date-picker
            v-model="weekStart"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledNotMonday"
            @change="reload"
          />
        </div>

        <div class="row">
          <div class="label">计划名称：</div>
          <el-input
            v-model="planName"
            style="max-width: 320px"
            placeholder="例如：我的周计划"
          />
        </div>

        <div class="row stat" v-if="weekResp">
          <el-tag>总计划：{{ weekResp.totalCount }}</el-tag>
          <el-tag type="success">已完成：{{ weekResp.doneCount }}</el-tag>
          <el-tag type="warning"
            >完成率：{{ (weekResp.completionRate * 100).toFixed(0) }}%</el-tag
          >
        </div>
      </div>

      <el-table :data="rows" style="width: 100%">
        <el-table-column prop="dayOfWeek" label="周几" width="90">
          <template #default="{ row }">{{ dayText(row.dayOfWeek) }}</template>
        </el-table-column>

        <el-table-column label="运动类型" min-width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.sportType"
              placeholder="选择运动"
              style="width: 100%"
            >
              <el-option
                v-for="s in sportOptions"
                :key="s"
                :label="sportLabelMap[s] || s"
                :value="s"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="时长(分钟)" width="130">
          <template #default="{ row }">
            <el-input-number
              v-model="row.targetDurationMin"
              :min="1"
              :max="300"
              style="width: 100%"
            />
          </template>
        </el-table-column>

        <el-table-column label="距离(km)" width="120">
          <template #default="{ row }">
            <el-input-number
              v-model="row.targetDistanceKm"
              :min="0"
              :max="200"
              :step="0.5"
              style="width: 100%"
            />
          </template>
        </el-table-column>

        <el-table-column label="提醒时间" width="140">
          <template #default="{ row }">
            <el-time-picker
              v-model="row.remindTime"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="可选"
              style="width: 100%"
            />
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="可选" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" link @click="clearRow(row)"
              >清空</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="hint">
        提示：保存后会覆盖本周已有计划；若某天不想安排，直接点“清空”。
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import {
  getWeekPlan,
  saveWeekPlan,
  type WeekPlanResp,
  type WeekPlanItemReq,
} from "@/api/plan";

const route = useRoute();
const loading = ref(false);

const weekStart = ref<string>("");
const planName = ref<string>("我的周计划");
const weekResp = ref<WeekPlanResp | null>(null);

// 你项目里已有的运动类型就用这个；不够再加
const sportOptions = [
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "STRENGTH_TRAINING",
  "WALKING",
  "JUMP_ROPE",
  "BADMINTON",
];
const sportLabelMap: Record<string, string> = {
  RUNNING: "跑步",
  CYCLING: "骑行",
  SWIMMING: "游泳",
  STRENGTH_TRAINING: "力量训练",
  WALKING: "步行",
  JUMP_ROPE: "跳绳",
  BADMINTON: "羽毛球",
};
type Row = WeekPlanItemReq & { dayOfWeek: number };
const rows = ref<Row[]>([]);

function dayText(d: number) {
  const map: Record<number, string> = {
    1: "周一",
    2: "周二",
    3: "周三",
    4: "周四",
    5: "周五",
    6: "周六",
    7: "周日",
  };
  return map[d] || String(d);
}

function disabledNotMonday(date: Date) {
  return date.getDay() !== 1;
}

function getThisWeekMondayStr() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeEmptyRows() {
  rows.value = Array.from({ length: 7 }).map((_, idx) => ({
    dayOfWeek: idx + 1,
    sportType: "",
    targetDurationMin: 30,
    targetDistanceKm: null,
    remindTime: null,
    remark: "",
  }));
}

function clearRow(row: Row) {
  row.sportType = "";
  row.targetDurationMin = 30;
  row.targetDistanceKm = null;
  row.remindTime = null;
  row.remark = "";
}

async function reload() {
  if (!weekStart.value) return;
  loading.value = true;
  try {
    const res = await getWeekPlan(weekStart.value);
    const data: WeekPlanResp = res.data;
    weekResp.value = data;

    planName.value = data?.planName || "我的周计划";

    // 初始化7天空行
    makeEmptyRows();

    // 回显：把后端 items 填进去
    const map = new Map<number, any>();
    (data?.items || []).forEach((it) => map.set(it.dayOfWeek, it));
    rows.value.forEach((r) => {
      const it = map.get(r.dayOfWeek);
      if (it) {
        r.sportType = it.sportType || "";
        r.targetDurationMin = it.targetDurationMin || 30;
        r.targetDistanceKm = it.targetDistanceKm ?? null;
        r.remindTime = it.remindTime ?? null;
        r.remark = it.remark ?? "";
      }
    });
  } catch (e: any) {
    ElMessage.error(e?.message || "加载周计划失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!weekStart.value) {
    ElMessage.warning("请先选择周一日期");
    return;
  }

  // 过滤：sportType 为空视为当天不安排
  const items = rows.value
    .filter((r) => r.sportType && r.sportType.trim().length > 0)
    .map((r) => ({
      dayOfWeek: r.dayOfWeek,
      sportType: r.sportType.trim(),
      targetDurationMin: r.targetDurationMin,
      targetDistanceKm: r.targetDistanceKm ?? null,
      remindTime: r.remindTime ?? null,
      remark: r.remark ?? null,
    }));

  try {
    await saveWeekPlan({
      weekStartDate: weekStart.value,
      name: planName.value,
      items,
    });
    ElMessage.success("保存成功");
    await reload();
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  }
}

onMounted(() => {
  weekStart.value =
    (route.query.weekStartDate as string) || getThisWeekMondayStr();
  makeEmptyRows();
  reload();
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
.ops {
  display: flex;
  gap: 8px;
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
.stat {
  gap: 8px;
}
.hint {
  margin-top: 12px;
  color: #888;
  font-size: 13px;
}
</style>
