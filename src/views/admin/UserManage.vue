<template>
  <div class="page-wrap">
    <el-card>
      <template #header>
        <div class="header-row">
          <span>用户管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="search-bar">
        <el-form-item label="用户名">
          <el-input
            v-model="query.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="query.phone"
            placeholder="请输入手机号"
            clearable
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="角色">
          <el-select
            v-model="query.role"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />

        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="Number(row.role) === 1 ? 'danger' : 'info'">
              {{ Number(row.role) === 1 ? "管理员" : "普通用户" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'warning'">
              {{ Number(row.status) === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="180" />

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="changeStatus(row, Number(row.status) === 1 ? 0 : 1)"
            >
              {{ Number(row.status) === 1 ? "禁用" : "启用" }}
            </el-button>

            <el-button
              size="small"
              type="danger"
              plain
              @click="changeRole(row, Number(row.role) === 1 ? 0 : 1)"
            >
              {{ Number(row.role) === 1 ? "取消管理员" : "设为管理员" }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="query.page"
          :page-size="query.pageSize"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "../../utils/request";

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);

const query = reactive({
  username: "",
  phone: "",
  status: undefined as number | undefined,
  role: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await request.get("/api/admin/users", {
      params: {
        username: query.username || undefined,
        phone: query.phone || undefined,
        status: query.status,
        role: query.role,
        page: query.page,
        pageSize: query.pageSize,
      },
    });

    if (res.code === 0) {
      tableData.value = res.data?.list || [];
      total.value = Number(res.data?.total || 0);
    } else {
      ElMessage.error(res.message || "获取用户列表失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  query.page = 1;
  loadData();
};

const handleReset = () => {
  query.username = "";
  query.phone = "";
  query.status = undefined;
  query.role = undefined;
  query.page = 1;
  loadData();
};

const changeStatus = async (row: any, status: number) => {
  try {
    await ElMessageBox.confirm("确认修改该用户状态吗？", "提示", {
      type: "warning",
    });

    const res: any = await request.put(`/api/admin/users/${row.id}/status`, {
      status,
    });

    if (res.code === 0) {
      ElMessage.success("操作成功");
      loadData();
    } else {
      ElMessage.error(res.message || "操作失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
};

const changeRole = async (row: any, role: number) => {
  try {
    await ElMessageBox.confirm("确认修改该用户角色吗？", "提示", {
      type: "warning",
    });

    const res: any = await request.put(`/api/admin/users/${row.id}/role`, {
      role,
    });

    if (res.code === 0) {
      ElMessage.success("操作成功");
      loadData();
    } else {
      ElMessage.error(res.message || "操作失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-wrap {
  padding: 0;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-bar {
  margin-bottom: 12px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
