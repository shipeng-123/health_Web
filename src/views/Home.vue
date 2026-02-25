<template>
  <div class="home-page">
    <el-card class="welcome-card" shadow="hover">
      <h2>首页</h2>
      <p>欢迎你，{{ username || "用户" }}</p>
      <p>这是你的健康管理系统前端（轻量版）。</p>

      <div class="action-area">
        <el-button @click="goToProfile">个人信息</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const username = localStorage.getItem("username");

const goToProfile = () => {
  router.push("/profile");
};
</script>

<style scoped>
.home-page {
  padding: 16px;
}

.welcome-card {
  border-radius: 12px;
}

.action-area {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
