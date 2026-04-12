<template>
  <div>
    <div class="card-grid">
      <el-card v-for="item in cards" :key="item.label" class="card-item">
        <div class="card-label">{{ item.label }}</div>
        <div class="card-value">{{ item.value }}</div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import request from "../../utils/request";

const summary = reactive({
  userCount: 0,
  todayNewUserCount: 0,
  foodCount: 0,
  planTemplateCount: 0,
  dietRecordCount: 0,
  sportRecordCount: 0,
});

const loadData = async () => {
  const res: any = await request.get("/api/admin/dashboard/summary");
  if (res.code === 0) {
    Object.assign(summary, res.data || {});
  }
};

const cards = computed(() => [
  { label: "用户总数", value: summary.userCount },
  { label: "今日新增用户", value: summary.todayNewUserCount },
  { label: "食物库数量", value: summary.foodCount },
  { label: "计划模板数量", value: summary.planTemplateCount },
  { label: "饮食记录总数", value: summary.dietRecordCount },
  { label: "运动记录总数", value: summary.sportRecordCount },
]);

onMounted(loadData);
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card-item {
  min-height: 120px;
}
.card-label {
  color: #666;
  margin-bottom: 16px;
}
.card-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}
</style>
