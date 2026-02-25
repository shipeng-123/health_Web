<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, RefreshRight, Plus } from "@element-plus/icons-vue";
import {
  searchFoodApi,
  createCustomFoodApi,
  type FoodItem,
  type CreateCustomFoodReq,
} from "@/api/food";
import { createDietRecordApi, getDietRecordByDateApi } from "@/api/diet";
import { getDailyCalorieSummaryApi } from "@/api/dailyCalorie";

function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const loading = ref(false);
const searchLoading = ref(false);

const keyword = ref("");
const foodList = ref<FoodItem[]>([]);
const selectedFood = ref<FoodItem | null>(null);

const summary = ref<any>(null); // 当天饮食明细汇总（/api/diet-record/date）
const dailySummary = ref<any>(null); // 当天热量对比（/api/daily-calorie/summary）

const form = ref({
  recordDate: formatLocalDate(),
  mealType: 1,
  intakeGram: 100,
  remark: "",
});

// ✅ 自定义食物弹窗
const customDialogVisible = ref(false);
const customSaving = ref(false);
const customFoodForm = ref<CreateCustomFoodReq>({
  foodName: "",
  category: "",
  caloriePer100g: 100,
  proteinPer100g: undefined,
  fatPer100g: undefined,
  carbPer100g: undefined,
  unitHint: "g",
});

const mealTypeOptions = [
  { label: "早餐", value: 1 },
  { label: "午餐", value: 2 },
  { label: "晚餐", value: 3 },
  { label: "加餐", value: 4 },
];

const mealTypeTextMap: Record<number, string> = {
  1: "早餐",
  2: "午餐",
  3: "晚餐",
  4: "加餐",
};

const totalCalories = computed(() => {
  if (!selectedFood.value) return 0;
  const intake = Number(form.value.intakeGram) || 0;
  const cal = ((selectedFood.value.caloriePer100g || 0) * intake) / 100;
  return Number(cal.toFixed(2));
});

// ✅ 分组：公共/自定义（依赖后端返回 isBuiltin）
const builtinFoods = computed(() =>
  (foodList.value as any[]).filter((f) => f.isBuiltin === 1 || f.userId == null)
);
const myFoods = computed(() =>
  (foodList.value as any[]).filter((f) => f.isBuiltin === 0 || f.userId != null)
);

async function handleSearch() {
  searchLoading.value = true;
  try {
    const result: any = await searchFoodApi(keyword.value.trim(), 50);
    if (result.code === 0) {
      foodList.value = result.data || [];
      if (foodList.value.length === 0) {
        ElMessage.warning("未搜索到食物，请换个关键词或新增自定义食物");
      }
    } else {
      ElMessage.error(result.message || "搜索失败");
    }
  } catch (e) {
    console.error("searchFoodApi error:", e);
    ElMessage.error("搜索请求失败");
  } finally {
    searchLoading.value = false;
  }
}

function selectFood(food: FoodItem) {
  selectedFood.value = food;
}

async function loadDateSummary() {
  try {
    const result: any = await getDietRecordByDateApi(form.value.recordDate);
    if (result.code === 0) {
      summary.value = result.data;
    } else {
      ElMessage.error(result.message || "加载当天汇总失败");
    }
  } catch (e) {
    console.error("getDietRecordByDateApi error:", e);
    ElMessage.error("加载当天汇总失败");
  }
}

async function loadDailySummary() {
  try {
    const result: any = await getDailyCalorieSummaryApi(form.value.recordDate);
    if (result.code === 0) {
      dailySummary.value = result.data;
    }
  } catch (e) {
    console.error("getDailyCalorieSummaryApi error:", e);
  }
}

async function refreshRightPanel() {
  await Promise.all([loadDateSummary(), loadDailySummary()]);
}

async function handleSubmit() {
  if (!selectedFood.value) {
    ElMessage.warning("请先选择食物");
    return;
  }
  if (!form.value.intakeGram || Number(form.value.intakeGram) <= 0) {
    ElMessage.warning("请输入正确的摄入重量");
    return;
  }

  loading.value = true;
  try {
    const payload = {
      foodItemId: selectedFood.value.id,
      mealType: Number(form.value.mealType),
      intakeGram: Number(form.value.intakeGram),
      recordDate: form.value.recordDate,
      remark: form.value.remark?.trim() || "",
    };

    const result: any = await createDietRecordApi(payload);

    if (result.code === 0) {
      ElMessage.success("记录成功");
      form.value.remark = "";
      await refreshRightPanel();
    } else {
      ElMessage.error(result.message || "记录失败");
    }
  } catch (e) {
    console.error("createDietRecordApi error:", e);
    ElMessage.error("保存失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

// =========================
// ✅ 自定义食物相关方法
// =========================
function openCustomFoodDialog() {
  customFoodForm.value = {
    foodName: keyword.value?.trim() || "",
    category: "",
    caloriePer100g: 100,
    proteinPer100g: undefined,
    fatPer100g: undefined,
    carbPer100g: undefined,
    unitHint: "g",
  };
  customDialogVisible.value = true;
}

function resetCustomFoodForm() {
  customFoodForm.value = {
    foodName: "",
    category: "",
    caloriePer100g: 100,
    proteinPer100g: undefined,
    fatPer100g: undefined,
    carbPer100g: undefined,
    unitHint: "g",
  };
}

async function handleCreateCustomFood() {
  const f = customFoodForm.value;

  if (!f.foodName || !f.foodName.trim()) {
    ElMessage.warning("请输入食物名称");
    return;
  }
  if (f.caloriePer100g == null || Number(f.caloriePer100g) <= 0) {
    ElMessage.warning("请输入正确的每100g热量");
    return;
  }

  customSaving.value = true;
  try {
    const payload: CreateCustomFoodReq = {
      foodName: f.foodName.trim(),
      category: f.category?.trim() || "",
      caloriePer100g: Number(f.caloriePer100g),
      proteinPer100g:
        f.proteinPer100g == null ? undefined : Number(f.proteinPer100g),
      fatPer100g: f.fatPer100g == null ? undefined : Number(f.fatPer100g),
      carbPer100g: f.carbPer100g == null ? undefined : Number(f.carbPer100g),
      unitHint: f.unitHint?.trim() || "g",
    };

    const result: any = await createCustomFoodApi(payload);

    if (result.code === 0) {
      ElMessage.success("自定义食物创建成功");
      customDialogVisible.value = false;

      keyword.value = payload.foodName;
      await handleSearch();

      const found = (foodList.value as any[]).find(
        (item) => item.foodName === payload.foodName
      );
      if (found) selectedFood.value = found;

      resetCustomFoodForm();
    } else {
      ElMessage.error(result.message || "创建失败");
    }
  } catch (e) {
    console.error("createCustomFoodApi error:", e);
    ElMessage.error("创建失败，请稍后重试");
  } finally {
    customSaving.value = false;
  }
}

onMounted(() => {
  handleSearch();
  refreshRightPanel();
});
</script>

<template>
  <div class="diet-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">饮食记录新增</h2>
        <p class="page-desc">
          搜索常见食物，录入三餐/加餐摄入，自动计算本次热量
        </p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：录入 -->
      <el-col :xs="24" :lg="13">
        <el-card class="card-block" shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">新增饮食记录</span>
              <el-tag type="success" effect="light">饮食管理</el-tag>
            </div>
          </template>

          <el-form label-width="88px" class="diet-form">
            <el-form-item label="日期">
              <el-date-picker
                v-model="form.recordDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
                @change="refreshRightPanel"
              />
            </el-form-item>

            <el-form-item label="餐次">
              <el-select v-model="form.mealType" style="width: 100%">
                <el-option
                  v-for="item in mealTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="搜索食物">
              <div class="search-row search-row-3">
                <el-input
                  v-model="keyword"
                  placeholder="输入食物名称，如 米饭、鸡蛋、牛奶"
                  clearable
                  @keyup.enter="handleSearch"
                />
                <el-button
                  type="primary"
                  :icon="Search"
                  :loading="searchLoading"
                  @click="handleSearch"
                >
                  搜索
                </el-button>
                <el-button plain @click="openCustomFoodDialog">
                  新增自定义食物
                </el-button>
              </div>
            </el-form-item>

            <!-- ✅ 分组食物列表 -->
            <el-form-item label="食物列表">
              <div class="food-list">
                <div v-if="foodList.length === 0" class="empty-text">
                  暂无结果，请输入关键词后搜索（也可点击“新增自定义食物”）
                </div>

                <template v-else>
                  <div class="group-title">公共食物</div>
                  <div v-if="builtinFoods.length === 0" class="empty-mini">
                    暂无公共食物
                  </div>

                  <div
                    v-for="food in builtinFoods"
                    :key="'b-' + food.id"
                    class="food-item"
                    :class="{ active: selectedFood?.id === food.id }"
                    @click="selectFood(food)"
                  >
                    <div class="food-item-top">
                      <div class="food-name">{{ food.foodName }}</div>
                      <el-tag size="small" effect="plain">{{
                        food.category || "未分类"
                      }}</el-tag>
                    </div>
                    <div class="food-meta">
                      <span>{{ food.caloriePer100g }} kcal/100g</span>
                      <span v-if="food.proteinPer100g != null"
                        >蛋白 {{ food.proteinPer100g }}g</span
                      >
                      <span v-if="food.fatPer100g != null"
                        >脂肪 {{ food.fatPer100g }}g</span
                      >
                      <span v-if="food.carbPer100g != null"
                        >碳水 {{ food.carbPer100g }}g</span
                      >
                    </div>
                  </div>

                  <div class="group-title" style="margin-top: 10px">
                    我的自定义
                  </div>
                  <div v-if="myFoods.length === 0" class="empty-mini">
                    暂无自定义食物
                  </div>

                  <div
                    v-for="food in myFoods"
                    :key="'m-' + food.id"
                    class="food-item"
                    :class="{ active: selectedFood?.id === food.id }"
                    @click="selectFood(food)"
                  >
                    <div class="food-item-top">
                      <div class="food-name">
                        {{ food.foodName }}
                        <el-tag
                          size="small"
                          type="success"
                          effect="light"
                          style="margin-left: 6px"
                        >
                          自定义
                        </el-tag>
                      </div>
                      <el-tag size="small" effect="plain">{{
                        food.category || "未分类"
                      }}</el-tag>
                    </div>
                    <div class="food-meta">
                      <span>{{ food.caloriePer100g }} kcal/100g</span>
                      <span v-if="food.proteinPer100g != null"
                        >蛋白 {{ food.proteinPer100g }}g</span
                      >
                      <span v-if="food.fatPer100g != null"
                        >脂肪 {{ food.fatPer100g }}g</span
                      >
                      <span v-if="food.carbPer100g != null"
                        >碳水 {{ food.carbPer100g }}g</span
                      >
                    </div>
                  </div>
                </template>
              </div>
            </el-form-item>

            <el-form-item label="已选食物" v-if="selectedFood">
              <div class="selected-food-box">
                <div class="selected-food-name">
                  {{ selectedFood.foodName }}
                </div>
                <div class="selected-food-info">
                  {{ selectedFood.category || "未分类" }} ·
                  {{ selectedFood.caloriePer100g }} kcal/100g
                </div>
              </div>
            </el-form-item>

            <el-form-item label="摄入重量">
              <el-input-number
                v-model="form.intakeGram"
                :min="1"
                :max="5000"
                :step="10"
                controls-position="right"
                style="width: 220px"
              />
              <span class="unit-text">g</span>
            </el-form-item>

            <el-form-item label="本次热量">
              <div class="calorie-box">
                <span class="calorie-value">{{ totalCalories }}</span>
                <span class="calorie-unit">kcal</span>
              </div>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                placeholder="如：水煮、少糖、半碗、无油等（可选）"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="Plus"
                :loading="loading"
                @click="handleSubmit"
              >
                保存记录
              </el-button>
              <el-button :icon="RefreshRight" @click="refreshRightPanel">
                刷新汇总
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：当天汇总 -->
      <el-col :xs="24" :lg="11">
        <el-card class="card-block" shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">当天饮食汇总</span>
              <el-button
                text
                type="primary"
                :icon="RefreshRight"
                @click="refreshRightPanel"
              >
                刷新
              </el-button>
            </div>
          </template>

          <template v-if="summary">
            <!-- 热量对比卡片 -->
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

            <!-- 原有饮食明细汇总 -->
            <div class="summary-wrap">
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
                  <div class="summary-text">
                    {{ summary.totalCalories }} kcal
                  </div>
                </div>
              </div>

              <div class="record-list">
                <div
                  v-if="!summary.records || summary.records.length === 0"
                  class="empty-text"
                  style="margin-top: 8px"
                >
                  当天暂无饮食记录
                </div>

                <div
                  v-for="item in summary.records"
                  :key="item.id"
                  class="record-item"
                >
                  <div class="record-main">
                    <div class="record-name">{{ item.foodName }}</div>
                    <el-tag size="small" type="info" effect="light">
                      {{ mealTypeTextMap[item.mealType] || "未知餐次" }}
                    </el-tag>
                  </div>
                  <div class="record-sub">
                    <span>{{ item.intakeGram }}g</span>
                    <span>{{ item.caloriePer100g }} kcal/100g</span>
                    <span class="strong">{{ item.totalCalories }} kcal</span>
                  </div>
                  <div v-if="item.remark" class="record-remark">
                    备注：{{ item.remark }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <el-empty v-else description="点击刷新或保存记录后查看当天汇总" />
        </el-card>
      </el-col>
    </el-row>

    <!-- ✅ 新增自定义食物弹窗 -->
    <el-dialog
      v-model="customDialogVisible"
      title="新增自定义食物"
      width="560px"
      destroy-on-close
    >
      <el-form label-width="110px" class="custom-food-form">
        <el-form-item label="食物名称" required>
          <el-input
            v-model="customFoodForm.foodName"
            placeholder="如：奶茶半糖 / 食堂炒面 / 自制鸡胸沙拉"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类">
          <el-input
            v-model="customFoodForm.category"
            placeholder="如：饮品 / 主食 / 肉类 / 水果"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="每100g热量" required>
          <el-input-number
            v-model="customFoodForm.caloriePer100g"
            :min="0.01"
            :max="5000"
            :precision="2"
            :step="1"
            controls-position="right"
            style="width: 220px"
          />
          <span class="unit-text">kcal</span>
        </el-form-item>

        <el-form-item label="蛋白质(每100g)">
          <el-input-number
            v-model="customFoodForm.proteinPer100g"
            :min="0"
            :max="1000"
            :precision="2"
            :step="0.5"
            controls-position="right"
            style="width: 220px"
          />
          <span class="unit-text">g</span>
        </el-form-item>

        <el-form-item label="脂肪(每100g)">
          <el-input-number
            v-model="customFoodForm.fatPer100g"
            :min="0"
            :max="1000"
            :precision="2"
            :step="0.5"
            controls-position="right"
            style="width: 220px"
          />
          <span class="unit-text">g</span>
        </el-form-item>

        <el-form-item label="碳水(每100g)">
          <el-input-number
            v-model="customFoodForm.carbPer100g"
            :min="0"
            :max="1000"
            :precision="2"
            :step="0.5"
            controls-position="right"
            style="width: 220px"
          />
          <span class="unit-text">g</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <el-button @click="customDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="customSaving"
            @click="handleCreateCustomFood"
          >
            保存自定义食物
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.diet-page {
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

.diet-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  width: 100%;
}

.search-row-3 {
  grid-template-columns: 1fr auto auto;
}

.food-list {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 8px;
  min-height: 110px;
  max-height: 320px;
  overflow-y: auto;
  background: #fafafa;
}

.group-title {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  padding: 6px 6px 8px;
}

.empty-mini {
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
  padding: 10px 0;
}

.food-item {
  border: 1px solid transparent;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.food-item:last-child {
  margin-bottom: 0;
}

.food-item:hover {
  border-color: #c6e2ff;
  background: #f5faff;
}

.food-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.food-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.food-name {
  font-weight: 600;
  color: #1f2937;
}

.food-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
}

.selected-food-box {
  width: 100%;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f0f9ff;
  border: 1px solid #dbeafe;
}

.selected-food-name {
  font-weight: 600;
  color: #0f172a;
}

.selected-food-info {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.unit-text {
  margin-left: 10px;
  color: #6b7280;
}

.calorie-box {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  padding: 6px 12px;
}

.calorie-value {
  font-size: 22px;
  font-weight: 700;
  color: #ea580c;
  line-height: 1;
}

.calorie-unit {
  color: #9a3412;
  font-size: 12px;
}

.summary-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-top {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
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
  word-break: break-all;
}

.record-list {
  border-top: 1px solid #f0f2f5;
  padding-top: 6px;
  max-height: 480px;
  overflow-y: auto;
}

.record-item {
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  padding: 10px;
  margin-top: 8px;
  background: #fff;
}

.record-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.record-name {
  font-weight: 600;
  color: #111827;
}

.record-sub {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
}

.record-sub .strong {
  color: #16a34a;
  font-weight: 700;
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
  padding: 18px 8px;
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
}

@media (max-width: 992px) {
  .summary-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .search-row-3 {
    grid-template-columns: 1fr;
  }
}
</style>
