<!-- src/views/plan/PlanTemplate.vue -->
<template>
  <div class="page">
    <el-card class="card">
      <template #header>
        <div class="title">运动计划模板</div>
      </template>

      <div class="toolbar">
        <div class="left">
          <div class="label">选择周一：</div>
          <el-date-picker
            v-model="weekStart"
            type="date"
            placeholder="选择周一"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledNotMonday"
          />
        </div>

        <div class="right">
          <el-button @click="refresh" :loading="loading">刷新</el-button>
        </div>
      </div>

      <el-table :data="templates" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="280" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" @click="apply(row)">应用到本周</el-button>
            <el-button @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="模板详情" width="720px">
      <div v-if="detail">
        <div style="font-weight: 600; margin-bottom: 8px">
          {{ detail.name }}
        </div>
        <div style="color: #666; margin-bottom: 12px">
          {{ detail.description }}
        </div>

        <el-table :data="detail.items" style="width: 100%">
          <el-table-column prop="dayOfWeek" label="周几" width="80">
            <template #default="{ row }">{{ dayText(row.dayOfWeek) }}</template>
          </el-table-column>
          <el-table-column label="运动" width="160">
            <template #default="{ row }">
              {{ sportLabel(row.sportType) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="targetDurationMin"
            label="时长(分钟)"
            width="120"
          />
          <el-table-column
            prop="targetDistanceKm"
            label="距离(km)"
            width="100"
          />
          <el-table-column prop="remindTime" label="提醒" width="100" />
          <el-table-column prop="remark" label="备注" min-width="180" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import {
  listPlanTemplates,
  getPlanTemplateDetail,
  applyTemplateToWeek,
  type PlanTemplateResp,
  type PlanTemplateDetailResp,
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
const router = useRouter();

const loading = ref(false);
const templates = ref<PlanTemplateResp[]>([]);
const weekStart = ref<string>("");

const detailVisible = ref(false);
const detail = ref<PlanTemplateDetailResp | null>(null);

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

// 只允许选周一
function disabledNotMonday(date: Date) {
  // JS: 0=Sunday ... 1=Monday
  return date.getDay() !== 1;
}

function getThisWeekMondayStr() {
  const now = new Date();
  const day = now.getDay(); // 0..6
  const diffToMonday = (day + 6) % 7; // Monday->0, Sunday->6
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function refresh() {
  loading.value = true;
  try {
    const res = await listPlanTemplates();
    templates.value = res.data ?? [];
  } catch (e: any) {
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

async function viewDetail(row: PlanTemplateResp) {
  try {
    const res = await getPlanTemplateDetail(row.id);
    detail.value = res.data ?? null;
    detailVisible.value = true;
  } catch (e: any) {
    ElMessage.error(e?.message || "加载模板详情失败");
  }
}

async function apply(row: PlanTemplateResp) {
  if (!weekStart.value) {
    ElMessage.warning("请先选择周一日期");
    return;
  }
  try {
    const res = await applyTemplateToWeek({
      templateId: row.id,
      weekStartDate: weekStart.value,
      name: `本周${row.name}`,
    });

    const planId = res.data?.planId;
    ElMessage.success("已生成周计划");
    // 跳转到周计划页（编辑/查看）
    router.push({
      path: "/plan-week",
      query: { weekStartDate: weekStart.value, planId },
    });
  } catch (e: any) {
    ElMessage.error(e?.message || "应用模板失败");
  }
}

onMounted(() => {
  weekStart.value = getThisWeekMondayStr();
  refresh();
});
</script>

<style scoped>
.page {
  padding: 12px;
}
.card {
  border-radius: 12px;
}
.title {
  font-weight: 700;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  color: #666;
}
</style>
