<template>
  <div class="register-page">
    <el-card class="register-card">
      <template #header>
        <div class="card-title">用户注册</div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        @keyup.enter="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名（3-20位）"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码（6-20位）"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入密码"
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称（可选）" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="bottom-actions">
        <span>已有账号？</span>
        <el-button link type="primary" @click="goLogin">去登录</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { registerApi } from "../api/auth";

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: "",
  phone: "",
  password: "",
  confirmPassword: "",
  nickname: "",
  gender: 0,
});

const validatePhone = (
  _rule: any,
  value: string,
  callback: (error?: Error) => void
) => {
  const reg = /^1\d{10}$/;
  if (!value) {
    callback(new Error("请输入手机号"));
    return;
  }
  if (!reg.test(value)) {
    callback(new Error("手机号格式不正确"));
    return;
  }
  callback();
};

const validateConfirmPassword = (
  _rule: any,
  value: string,
  callback: (error?: Error) => void
) => {
  if (!value) {
    callback(new Error("请再次输入密码"));
    return;
  }
  if (value !== form.password) {
    callback(new Error("两次输入的密码不一致"));
    return;
  }
  callback();
};

const rules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度需在3-20位之间", trigger: "blur" },
  ],
  phone: [{ validator: validatePhone, trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度需在6-20位之间", trigger: "blur" },
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }],
  nickname: [
    { min: 0, max: 20, message: "昵称长度不能超过20位", trigger: "blur" },
  ],
};

const handleRegister = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const res = await registerApi({
      username: form.username.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      nickname: form.nickname.trim() || undefined,
      gender: form.gender,
    });

    if (res.code === 0 || res.code === 200) {
      ElMessage.success(res.data || "注册成功");
      router.push("/login");
    } else {
      ElMessage.error(res.message || "注册失败");
    }
  } catch (err: any) {
    // 表单校验失败会走这里，不需要额外提示
  } finally {
    loading.value = false;
  }
};

const goLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  padding: 24px;
}

.register-card {
  width: 460px;
  max-width: 100%;
}

.card-title {
  text-align: center;
  font-weight: 700;
}

.bottom-actions {
  margin-top: 6px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
