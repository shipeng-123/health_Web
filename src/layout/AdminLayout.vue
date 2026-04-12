<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="logo">管理后台</div>

      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#ffffff"
        @select="handleSelect"
      >
        <el-menu-item index="/admin/dashboard">后台首页</el-menu-item>
        <el-menu-item index="/admin/users">用户管理</el-menu-item>
        <el-menu-item index="/admin/foods">食物管理</el-menu-item>
        <el-menu-item index="/admin/templates">模板管理</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="title">健康管理系统后台</div>
        <div class="user-box">
          <span>{{ nickname || username || "管理员" }}</span>
          <el-button type="danger" plain size="small" @click="logout"
            >退出登录</el-button
          >
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);
const username = localStorage.getItem("username");
const nickname = localStorage.getItem("nickname");

const handleSelect = (index: string) => {
  if (route.path !== index) {
    router.push(index);
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("nickname");
  router.replace("/login");
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.aside {
  background: #1f2937;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menu {
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.main {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
