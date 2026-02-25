<template>
  <div class="sport-page">
    <el-card class="card-block">
      <template #header>
        <div class="card-title">运动记录管理</div>
      </template>

      <div class="sub-title">手动记录当日运动（支持十余种常见运动）</div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="sport-form"
      >
        <el-form-item label="运动类型" prop="sportType">
          <el-select
            v-model="form.sportType"
            placeholder="请选择运动类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in sportTypeOptions"
              :key="item.value"
              :label="`${item.label}（MET: ${item.met}）`"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="运动时长（分钟）" prop="durationMin">
          <el-input-number
            v-model="form.durationMin"
            :min="1"
            :max="1440"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="距离（km，可选）" prop="distanceKm">
          <el-input-number
            v-model="form.distanceKm"
            :min="0"
            :max="500"
            :precision="2"
            controls-position="right"
            style="width: 100%"
            placeholder="可不填"
          />
        </el-form-item>

        <el-form-item label="记录日期" prop="recordDate">
          <el-date-picker
            v-model="form.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY/MM/DD"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注（可选）" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            placeholder="例如：晚饭后慢跑，状态不错"
          />
        </el-form-item>

        <div class="hint-text">
          热量按“运动类型 + 时长 + 个人体重”估算，距离主要用于记录与后续统计。
        </div>

        <div class="form-actions">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ submitting ? "提交中..." : "保存记录" }}
          </el-button>
          <el-button @click="handleResetForm">重置</el-button>
        </div>

        <div v-if="resultMsg" class="result-msg">
          {{ resultMsg }}
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { createSportRecord, getSportTypeListLocal } from "@/api/sport";

type SportTypeOption = {
  label: string;
  value: string;
  met: number;
};

const formRef = ref<FormInstance>();
const submitting = ref(false);
const resultMsg = ref("");

const today = new Date();
const todayStr = formatDateToYMD(today);

const form = reactive({
  sportType: "",
  durationMin: 30,
  distanceKm: null as number | null,
  recordDate: todayStr,
  remark: "",
});

const rules: FormRules = {
  sportType: [{ required: true, message: "请选择运动类型", trigger: "change" }],
  durationMin: [
    { required: true, message: "请输入运动时长", trigger: "change" },
  ],
  recordDate: [
    { required: true, message: "请选择记录日期", trigger: "change" },
  ],
};

const sportTypeOptions = getSportTypeListLocal() as SportTypeOption[];

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  resultMsg.value = "";

  try {
    const payload = {
      sportType: form.sportType,
      durationMin: form.durationMin,
      distanceKm: form.distanceKm,
      recordDate: form.recordDate,
      remark: form.remark,
    };

    const res: any = await createSportRecord(payload);

    if (res?.code === 0) {
      const calories = res?.data?.calories;
      const savedDate = form.recordDate;
      const sportName = sportTypeText(form.sportType);

      resultMsg.value = `已保存 ${savedDate} 的${sportName}记录 ✅ 本次消耗约 ${
        calories ?? "--"
      } kcal`;

      ElMessage.success(`保存成功，约 ${calories ?? "--"} kcal`);

      form.sportType = "";
      form.durationMin = 30;
      form.distanceKm = null;
      form.remark = "";
      formRef.value?.clearValidate();
    } else {
      ElMessage.error(res?.message || "保存失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("保存失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}

function handleResetForm() {
  form.sportType = "";
  form.durationMin = 30;
  form.distanceKm = null;
  form.recordDate = todayStr;
  form.remark = "";
  resultMsg.value = "";
  formRef.value?.clearValidate();
}

function sportTypeText(value: string) {
  const hit = sportTypeOptions.find((x) => x.value === value);
  return hit?.label || value || "-";
}

function formatDateToYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
</script>

<style scoped>
.sport-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-block {
  border-radius: 14px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
}

.sub-title {
  color: #666;
  margin-bottom: 14px;
}

.sport-form {
  max-width: 720px;
}

.hint-text {
  margin-top: -4px;
  margin-bottom: 12px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.result-msg {
  margin-top: 14px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}
</style>
