<template>
  <div>
    <el-container style="height: 100vh">
      <el-aside width="220px" style="background: #f5f7fa; padding: 12px">
        <div style="font-weight: bold; margin-bottom: 16px">健康管理系统</div>
        <el-menu :default-active="activePath" router>
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/test">测试接口</el-menu-item>
          <el-menu-item index="/profile">个人中心</el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span>后台管理</span>
          <el-button type="danger" plain @click="logout">退出登录</el-button>
        </el-header>
        <el-main style="background: #fff">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const activePath = computed(() => route.path);

const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};
</script>
