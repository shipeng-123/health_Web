<template>
  <div class="login-page">
    <div class="login-card">
      <h2>健康管理系统登录</h2>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名或手机号"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="bottom-bar">
          <span>还没有账号？</span>
          <router-link to="/register">去注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import request from "../utils/request";

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res: any = await request.post("/api/auth/login", form);
    if (res.code !== 0) {
      ElMessage.error(res.message || "登录失败");
      return;
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username || "");
    localStorage.setItem("nickname", res.data.nickname || "");
    localStorage.setItem("role", String(res.data.role ?? 0));

    ElMessage.success("登录成功");

    if (String(res.data.role) === "1") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/home");
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #e8f3ff, #f6fbff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 420px;
  background: #fff;
  padding: 32px 28px 18px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
.login-card h2 {
  text-align: center;
  margin: 0 0 24px;
}
.bottom-bar {
  text-align: center;
  color: #666;
}
.bottom-bar a {
  margin-left: 8px;
  color: #409eff;
  text-decoration: none;
}
</style>
