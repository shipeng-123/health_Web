<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span>计划模板管理</span>
        <el-button type="primary" @click="openAdd">新增模板</el-button>
      </div>
    </template>

    <el-form :inline="true" :model="query" class="search-bar">
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="模板名/描述" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="query.status"
          placeholder="全部"
          clearable
          style="width: 120px"
        >
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="tableData" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="模板名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'warning'">
            {{ row.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="update_time" label="更新时间" min-width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑模板' : '新增模板'"
      width="900px"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="items-header">
        <span>模板明细</span>
        <el-button type="primary" link @click="addItem">新增明细</el-button>
      </div>

      <el-table :data="form.items" border>
        <el-table-column label="周几" width="120">
          <template #default="{ row }">
            <el-select v-model="row.dayOfWeek" style="width: 100%">
              <el-option label="周一" :value="1" />
              <el-option label="周二" :value="2" />
              <el-option label="周三" :value="3" />
              <el-option label="周四" :value="4" />
              <el-option label="周五" :value="5" />
              <el-option label="周六" :value="6" />
              <el-option label="周日" :value="7" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="运动类型">
          <template #default="{ row }">
            <el-input v-model="row.sportType" />
          </template>
        </el-table-column>
        <el-table-column label="目标时长(分)" width="140">
          <template #default="{ row }">
            <el-input-number
              v-model="row.targetDurationMin"
              :min="1"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="目标距离(km)" width="140">
          <template #default="{ row }">
            <el-input-number
              v-model="row.targetDistanceKm"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="提醒时间" width="130">
          <template #default="{ row }">
            <el-input v-model="row.remindTime" placeholder="08:00" />
          </template>
        </el-table-column>
        <el-table-column label="备注">
          <template #default="{ row }">
            <el-input v-model="row.remark" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeItem($index)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "../../utils/request";

const query = reactive({
  keyword: "",
  status: undefined as number | undefined,
});

const tableData = ref<any[]>([]);
const dialogVisible = ref(false);

const emptyItem = () => ({
  dayOfWeek: 1,
  sportType: "",
  targetDurationMin: 30,
  targetDistanceKm: 0,
  remindTime: "",
  remark: "",
  sortNo: 1,
});

const emptyForm = () => ({
  id: undefined as number | undefined,
  name: "",
  description: "",
  status: 1,
  items: [emptyItem()],
});

const form = reactive<any>(emptyForm());

const loadData = async () => {
  const res: any = await request.get("/api/admin/plan-templates", {
    params: query,
  });
  if (res.code === 0) {
    tableData.value = res.data || [];
  }
};

const resetQuery = () => {
  query.keyword = "";
  query.status = undefined;
  loadData();
};

const openAdd = () => {
  Object.assign(form, emptyForm());
  dialogVisible.value = true;
};

const openEdit = async (row: any) => {
  const res: any = await request.get(`/api/admin/plan-templates/${row.id}`);
  if (res.code !== 0) return;

  Object.assign(form, {
    id: res.data.id,
    name: res.data.name,
    description: res.data.description,
    status: res.data.status,
    items: (res.data.items || []).map((it: any, index: number) => ({
      dayOfWeek: it.day_of_week,
      sportType: it.sport_type,
      targetDurationMin: it.target_duration_min,
      targetDistanceKm: Number(it.target_distance_km || 0),
      remindTime: it.remind_time || "",
      remark: it.remark || "",
      sortNo: it.sort_no || index + 1,
    })),
  });

  if (!form.items.length) {
    form.items = [emptyItem()];
  }

  dialogVisible.value = true;
};

const addItem = () => {
  form.items.push({
    ...emptyItem(),
    sortNo: form.items.length + 1,
  });
};

const removeItem = (index: number) => {
  form.items.splice(index, 1);
  if (!form.items.length) {
    form.items.push(emptyItem());
  }
};

const save = async () => {
  const payload = {
    name: form.name,
    description: form.description,
    status: form.status,
    items: form.items.map((it: any, index: number) => ({
      dayOfWeek: it.dayOfWeek,
      sportType: it.sportType,
      targetDurationMin: it.targetDurationMin,
      targetDistanceKm: it.targetDistanceKm,
      remindTime: it.remindTime,
      remark: it.remark,
      sortNo: index + 1,
    })),
  };

  const res: any = form.id
    ? await request.put(`/api/admin/plan-templates/${form.id}`, payload)
    : await request.post("/api/admin/plan-templates", payload);

  if (res.code === 0) {
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    loadData();
  } else {
    ElMessage.error(res.message || "保存失败");
  }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm("确认删除该模板？", "提示", { type: "warning" });
  const res: any = await request.delete(`/api/admin/plan-templates/${row.id}`);
  if (res.code === 0) {
    ElMessage.success("删除成功");
    loadData();
  }
};

onMounted(loadData);
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.search-bar {
  margin-bottom: 12px;
}
.items-header {
  margin: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
</style>
