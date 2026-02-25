<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight, Search } from "@element-plus/icons-vue";
import { getDietRecordByDateApi } from "@/api/diet";
import { getDailyCalorieSummaryApi } from "@/api/dailyCalorie";

function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const queryDate = ref<string>(formatLocalDate());
const loading = ref(false);

const summary = ref<any>(null); // /api/diet-record/date
const dailySummary = ref<any>(null); // /api/daily-calorie/summary

const mealTypeTextMap: Record<number, string> = {
  1: "早餐",
  2: "午餐",
  3: "晚餐",
  4: "加餐",
};

const grouped = computed(() => {
  const records = (summary.value?.records || []) as any[];
  const map: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const r of records) {
    const k = Number(r.mealType || 0);
    if (map[k]) map[k].push(r);
  }
  return map;
});

async function load() {
  loading.value = true;
  try {
    const [dietRes, dailyRes]: any = await Promise.all([
      getDietRecordByDateApi(queryDate.value),
      getDailyCalorieSummaryApi(queryDate.value),
    ]);

    if (dietRes.code === 0) summary.value = dietRes.data;
    else ElMessage.error(dietRes.message || "加载饮食记录失败");

    if (dailyRes.code === 0) dailySummary.value = dailyRes.data;
  } catch (e) {
    console.error(e);
    ElMessage.error("加载失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

function setToday() {
  queryDate.value = formatLocalDate();
  load();
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="diet-history-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">饮食记录查询</h2>
        <p class="page-desc">按日期查看当天饮食摄入明细与热量平衡汇总</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：查询条件 -->
      <el-col :xs="24" :lg="8">
        <el-card class="card-block" shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">查询条件</span>
              <el-tag effect="light">按日期查询</el-tag>
            </div>
          </template>

          <el-form label-width="80px">
            <el-form-item label="查询日期">
              <el-date-picker
                v-model="queryDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="load"
              >
                查询
              </el-button>
              <el-button @click="setToday">今日</el-button>
              <el-button :icon="RefreshRight" @click="load">刷新</el-button>
            </el-form-item>
          </el-form>

          <div class="help-box">
            <div class="help-title">说明</div>
            <ul class="help-list">
              <li>支持查看某一天的饮食记录明细</li>
              <li>自动统计当天总摄入热量</li>
              <li>展示摄入 vs 消耗 vs 推荐热量对比</li>
              <li>按早餐/午餐/晚餐/加餐分组展示</li>
            </ul>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：查询结果 -->
      <el-col :xs="24" :lg="16">
        <el-card class="card-block" shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">查询结果</span>
              <el-button text type="primary" :icon="RefreshRight" @click="load"
                >刷新</el-button
              >
            </div>
          </template>

          <template v-if="summary">
            <!-- ✅ 热量对比卡片 -->
            <div v-if="dailySummary" class="vs-cards">
              <div class="vs-item">
                <div class="vs-label">摄入</div>
                <div class="vs-value">
                  {{ dailySummary.intakeCalories }} kcal
                </div>
              </div>
              <div class="vs-item">
                <div class="vs-label">消耗</div>
                <div class="vs-value">
                  {{ dailySummary.sportCalories }} kcal
                </div>
              </div>
              <div class="vs-item">
                <div class="vs-label">推荐</div>
                <div class="vs-value">
                  {{ dailySummary.recommendedCalories ?? "--" }} kcal
                </div>
              </div>
              <div class="vs-item">
                <div class="vs-label">净摄入</div>
                <div class="vs-value">{{ dailySummary.netCalories }} kcal</div>
              </div>
            </div>

            <div
              v-if="dailySummary && dailySummary.profileReady === false"
              class="vs-tip"
            >
              {{ dailySummary.profileTip }}
            </div>

            <div
              v-if="dailySummary && dailySummary.profileReady === true"
              class="vs-tip"
            >
              <span v-if="dailySummary.diffVsRecommended > 0">
                已超出推荐 {{ dailySummary.diffVsRecommended }} kcal
              </span>
              <span v-else>
                还可摄入
                {{ (0 - dailySummary.diffVsRecommended).toFixed(2) }} kcal
              </span>
            </div>

            <!-- 顶部三块统计 -->
            <div class="summary-top">
              <div class="summary-stat">
                <div class="summary-label">日期</div>
                <div class="summary-text">{{ summary.date }}</div>
              </div>
              <div class="summary-stat">
                <div class="summary-label">记录条数</div>
                <div class="summary-text">{{ summary.recordCount }}</div>
              </div>
              <div class="summary-stat highlight">
                <div class="summary-label">总摄入热量</div>
                <div class="summary-text">{{ summary.totalCalories }} kcal</div>
              </div>
            </div>

            <!-- 分组展示 -->
            <div class="group-wrap">
              <div class="group-card" v-for="meal in [1, 2, 3, 4]" :key="meal">
                <div class="group-header">
                  <div class="group-title">{{ mealTypeTextMap[meal] }}</div>
                  <el-tag size="small" type="info" effect="light">
                    {{ grouped[meal].length }} 条
                  </el-tag>
                </div>

                <div v-if="grouped[meal].length === 0" class="empty-text">
                  该餐次暂无记录
                </div>

                <div
                  v-for="item in grouped[meal]"
                  :key="item.id"
                  class="record-item"
                >
                  <div class="record-main">
                    <div class="record-name">{{ item.foodName }}</div>
                    <div class="record-cal">{{ item.totalCalories }} kcal</div>
                  </div>
                  <div class="record-sub">
                    <span>{{ item.intakeGram }}g</span>
                    <span>{{ item.caloriePer100g }} kcal/100g</span>
                    <span>记录时间 {{ item.createTime }}</span>
                  </div>
                  <div v-if="item.remark" class="record-remark">
                    备注：{{ item.remark }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <el-empty v-else description="请选择日期后点击查询" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.diet-history-page {
  padding: 16px;
}

.page-header {
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

.help-box {
  margin-top: 14px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
}

.help-title {
  font-weight: 700;
  margin-bottom: 8px;
  color: #111827;
}

.help-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
}

.vs-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.vs-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.vs-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.vs-value {
  font-weight: 700;
  color: #111827;
}

.vs-tip {
  margin-top: 6px;
  font-size: 13px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.summary-top {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 12px;
}

.summary-stat {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.summary-stat.highlight {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-text {
  font-weight: 600;
  color: #111827;
}

.group-wrap {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.group-card {
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.group-title {
  font-weight: 800;
  color: #0f172a;
}

.record-item {
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
  background: #fff;
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.record-name {
  font-weight: 700;
  color: #111827;
}

.record-cal {
  font-weight: 800;
  color: #16a34a;
}

.record-sub {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
}

.record-remark {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.empty-text {
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
  padding: 14px 8px;
}

@media (max-width: 992px) {
  .summary-top {
    grid-template-columns: 1fr;
  }
}
</style>
