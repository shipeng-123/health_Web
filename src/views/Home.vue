<template>
  <div>
    <el-card>
      <h2>首页</h2>
      <p>欢迎你，{{ username || "用户" }}</p>
      <p>这是你的健康管理系统前端（轻量版）。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const username = localStorage.getItem("username");
</script>
