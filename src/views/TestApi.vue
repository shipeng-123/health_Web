<template>
  <div>
    <el-card style="margin-bottom: 16px">
      <template #header>测试接口</template>

      <el-space wrap>
        <el-button type="primary" @click="callHello"
          >调用 /test/hello</el-button
        >
        <el-button type="success" @click="callDb">调用 /test/db</el-button>
      </el-space>
    </el-card>

    <el-card>
      <template #header>返回结果</template>
      <pre style="white-space: pre-wrap; word-break: break-all">{{
        resultText
      }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { helloApi, testDbApi } from "../api/test";

const resultText = ref("点击上方按钮测试接口");

const callHello = async () => {
  const res = await helloApi();
  resultText.value =
    typeof res === "string" ? res : JSON.stringify(res, null, 2);
};

const callDb = async () => {
  const res = await testDbApi();
  resultText.value = JSON.stringify(res, null, 2);
};
</script>
