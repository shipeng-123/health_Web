<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div style="text-align: center; font-weight: bold">登录</div>
      </template>

      <el-form :model="form" label-width="90px" @keyup.enter="handleLogin">
        <el-form-item label="账号/手机号">
          <el-input v-model="form.username" placeholder="请输入账号或手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="bottom-actions">
        <span>还没有账号？</span>
        <el-button link type="primary" @click="goRegister">去注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { loginApi } from "../api/auth";

const router = useRouter();
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning("请输入账号/手机号和密码");
    return;
  }

  try {
    loading.value = true;
    const res = await loginApi({
      username: form.username.trim(),
      password: form.password,
    });

    if (res.code === 200 || res.code === 0) {
      localStorage.setItem("token", res.data?.token || "");
      localStorage.setItem("username", res.data?.username || "");
      ElMessage.success("登录成功");
      router.push("/home");
    } else {
      ElMessage.error(res.message || "登录失败");
    }
  } finally {
    loading.value = false;
  }
};

const goRegister = () => {
  router.push("/register");
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
}
.login-card {
  width: 420px;
}
.bottom-actions {
  margin-top: 6px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
