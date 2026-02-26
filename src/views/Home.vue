<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RefreshRight } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getDailyCalorieSummaryApi } from "@/api/dailyCalorie";
import { useRouter } from "vue-router";

const router = useRouter();
const go = (path: string) => router.push(path);

// ✅ 资料不完整时：跳去个人中心
const goProfile = () => router.push("/profile");
// 如果你想跳过去自动定位到“身体资料”，把上面改成：router.push("/profile#body")

function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const today = ref(formatLocalDate());
const loading = ref(false);
const daily = ref<any>(null);

const remainText = computed(() => {
  if (!daily.value) return "";
  if (daily.value.profileReady === false)
    return daily.value.profileTip || "请完善个人资料";
  const diff = Number(daily.value.diffVsRecommended ?? 0);
  if (diff > 0) return `已超出推荐 ${diff.toFixed(2)} kcal`;
  return `还可摄入 ${Math.abs(diff).toFixed(2)} kcal`;
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

onMounted(() => {
  loadToday();
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
        :loading="loading"
        @click="loadToday"
      >
        刷新
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card class="card-block" shadow="hover">
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

            <!-- ✅ 资料不完整：显示按钮跳转 -->
            <div
              v-if="daily.profileReady === false"
              class="tip-box warn tip-box-row"
            >
              <span>{{ remainText }}</span>
              <el-button type="primary" size="small" @click="goProfile">
                去完善
              </el-button>
            </div>

            <!-- ✅ 资料完整：正常显示 -->
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
      </el-col>

      <el-col :xs="24" :lg="10">
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

/* ✅ 提示 + 按钮横向排列 */
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

@media (max-width: 992px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    align-items: flex-start;
  }
}

.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable:hover {
  border-color: #c6e2ff;
  background: #f5faff;
}
</style>
