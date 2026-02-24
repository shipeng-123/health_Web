<template>
  <div class="profile-page">
    <el-row :gutter="16">
      <!-- 左侧：头像 -->
      <el-col :xs="24" :md="8">
        <el-card>
          <template #header>
            <span>头像信息</span>
          </template>

          <div class="avatar-wrap">
            <el-avatar :size="120" :src="fullAvatarSrc">
              <img :src="defaultAvatar" alt="default-avatar" />
            </el-avatar>

            <div class="avatar-tips">
              <div class="main-tip">上传头像后会立即回显</div>
              <div class="sub-tip">支持 jpg / png / webp，大小不超过 2MB</div>
            </div>

            <el-upload
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleAvatarChange"
              accept="image/png,image/jpeg,image/jpg,image/webp"
            >
              <el-button type="primary" :loading="avatarUploading"
                >选择并上传头像</el-button
              >
            </el-upload>

            <el-button
              plain
              @click="resetAvatarToDefault"
              style="margin-top: 8px"
            >
              恢复默认头像（保存后生效）
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：资料 -->
      <el-col :xs="24" :md="16">
        <el-card v-loading="loading">
          <template #header>
            <span>个人资料修改</span>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            style="max-width: 640px"
          >
            <el-form-item label="用户ID">
              <el-input
                :model-value="form.id ? String(form.id) : ''"
                disabled
              />
            </el-form-item>

            <el-form-item label="用户名">
              <el-input v-model="form.username" disabled />
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="form.phone"
                maxlength="11"
                placeholder="请输入手机号"
              />
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="form.nickname"
                maxlength="20"
                placeholder="请输入昵称"
              />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio :value="0">未知</el-radio>
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱（可选）" />
            </el-form-item>

            <el-form-item>
              <el-space wrap>
                <el-button type="primary" :loading="saving" @click="handleSave"
                  >保存修改</el-button
                >
                <el-button @click="reloadProfile" :loading="loading"
                  >重新加载</el-button
                >
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>
            <span>说明</span>
          </template>
          <div class="debug-item">
            当前头像地址（数据库）：<code>{{
              form.avatarUrl || "（空，前端使用默认头像）"
            }}</code>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules, UploadProps } from "element-plus";
import { ElMessage } from "element-plus";
import defaultAvatar from "../assets/default-avatar.svg";
import { getProfileApi, updateProfileApi, uploadAvatarApi } from "../api/user";

const API_BASE = "http://localhost:8080"; // 你后端地址，后续可放到环境变量

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const avatarUploading = ref(false);

const form = reactive({
  id: 0,
  username: "",
  phone: "",
  nickname: "",
  gender: 0,
  email: "",
  avatarUrl: "", // 数据库存的路径，如 /uploads/avatar/xxx.jpg
});

const validatePhone = (
  _rule: any,
  value: string,
  callback: (error?: Error) => void
) => {
  if (!value) return callback(new Error("请输入手机号"));
  if (!/^1\d{10}$/.test(value)) return callback(new Error("手机号格式不正确"));
  callback();
};

const rules: FormRules = {
  phone: [{ validator: validatePhone, trigger: "blur" }],
  nickname: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 1, max: 20, message: "昵称长度需在1-20位之间", trigger: "blur" },
  ],
  email: [
    {
      validator: (
        _rule: any,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (!value) return callback(); // 允许为空
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) return callback(new Error("邮箱格式不正确"));
        callback();
      },
      trigger: "blur",
    },
  ],
};

// 前端展示时把相对路径拼成完整 URL
const fullAvatarSrc = computed(() => {
  if (!form.avatarUrl) return defaultAvatar;

  if (
    form.avatarUrl.startsWith("http://") ||
    form.avatarUrl.startsWith("https://")
  ) {
    return form.avatarUrl;
  }

  return `${API_BASE}${form.avatarUrl}`;
});

const fillForm = (data: any) => {
  form.id = data.id ?? 0;
  form.username = data.username ?? "";
  form.phone = data.phone ?? "";
  form.nickname = data.nickname ?? "";
  form.gender = typeof data.gender === "number" ? data.gender : 0;
  form.email = data.email ?? "";
  form.avatarUrl = data.avatarUrl ?? "";
};

const reloadProfile = async () => {
  try {
    loading.value = true;
    const res = await getProfileApi();
    if (res.code !== 0) {
      ElMessage.error(res.message || "获取个人资料失败");
      return;
    }
    fillForm(res.data);
  } catch (error: any) {
    ElMessage.error(error?.message || "获取个人资料失败");
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    saving.value = true;

    const res = await updateProfileApi({
      phone: form.phone.trim(),
      nickname: form.nickname.trim(),
      gender: form.gender,
      email: form.email.trim(),
      avatarUrl: form.avatarUrl || "",
    });

    if (res.code !== 0) {
      ElMessage.error(res.message || "保存失败");
      return;
    }

    ElMessage.success("保存成功");
    await reloadProfile();
  } catch (error: any) {
    // 表单校验失败会抛异常；请求失败也可能到这里
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    saving.value = false;
  }
};

const handleAvatarChange: UploadProps["onChange"] = async (uploadFile) => {
  const raw = uploadFile.raw;
  if (!raw) return;

  const isImage = raw.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("请选择图片文件");
    return;
  }

  const maxSizeMb = 2;
  if (raw.size / 1024 / 1024 > maxSizeMb) {
    ElMessage.error(`图片大小不能超过 ${maxSizeMb}MB`);
    return;
  }

  try {
    avatarUploading.value = true;

    const res = await uploadAvatarApi(raw);
    if (res.code !== 0) {
      ElMessage.error(res.message || "头像上传失败");
      return;
    }

    // 上传成功后，只更新表单里的 avatarUrl；真正写入数据库在“保存修改”时完成
    form.avatarUrl = res.data;
    ElMessage.success("头像上传成功，请点击“保存修改”完成资料更新");
  } catch (error: any) {
    ElMessage.error(error?.message || "头像上传失败");
  } finally {
    avatarUploading.value = false;
  }
};

const resetAvatarToDefault = () => {
  form.avatarUrl = "";
  ElMessage.success("已切换为默认头像，请点击“保存修改”生效");
};

onMounted(() => {
  reloadProfile();
});
</script>

<style scoped>
.profile-page {
  padding: 4px;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-tips {
  text-align: center;
  color: #606266;
}

.main-tip {
  font-size: 14px;
}

.sub-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.debug-item {
  line-height: 1.9;
  word-break: break-all;
}
</style>
