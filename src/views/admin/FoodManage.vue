<template>
  <div class="page-wrap">
    <el-card>
      <template #header>
        <div class="header-row">
          <span>食物管理</span>
          <el-button type="primary" @click="openAdd">新增系统食物</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="search-bar">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="食物名/分类"
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
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="来源">
          <el-select
            v-model="query.isBuiltin"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="系统食物" :value="1" />
            <el-option label="用户自定义" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border v-loading="loading">
        <el-table-column label="序号" width="80">
          <template #default="{ $index }">
            {{ (query.page - 1) * query.pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="food_name" label="食物名称" min-width="140" />
        <el-table-column prop="category" label="分类" min-width="120" />
        <el-table-column
          prop="calorie_per_100g"
          label="热量/100g"
          min-width="110"
        />
        <el-table-column
          prop="protein_per_100g"
          label="蛋白质"
          min-width="90"
        />
        <el-table-column prop="fat_per_100g" label="脂肪" min-width="90" />
        <el-table-column prop="carb_per_100g" label="碳水" min-width="90" />
        <el-table-column prop="unit_hint" label="单位" width="80" />

        <el-table-column label="来源" width="120">
          <template #default="{ row }">
            <el-tag
              :type="Number(row.is_builtin) === 1 ? 'success' : 'warning'"
            >
              {{ Number(row.is_builtin) === 1 ? "系统食物" : "用户自定义" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" min-width="130">
          <template #default="{ row }">
            <span v-if="Number(row.is_builtin) === 1">系统</span>
            <span v-else>{{
              row.creator_nickname || row.creator_username || "-"
            }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'warning'">
              {{ Number(row.status) === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="创建时间" min-width="180" />

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)"> 编辑 </el-button>

            <el-button
              v-if="Number(row.is_builtin) === 0"
              size="small"
              type="primary"
              plain
              @click="handlePromote(row)"
            >
              转系统
            </el-button>

            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
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

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑系统食物' : '新增系统食物'"
      width="600px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="食物名称">
          <el-input v-model="form.foodName" />
        </el-form-item>

        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>

        <el-form-item label="热量/100g">
          <el-input-number
            v-model="form.caloriePer100g"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="蛋白质">
          <el-input-number
            v-model="form.proteinPer100g"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="脂肪">
          <el-input-number
            v-model="form.fatPer100g"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="碳水">
          <el-input-number
            v-model="form.carbPer100g"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="单位">
          <el-input v-model="form.unitHint" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "../../utils/request";

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);

const query = reactive({
  keyword: "",
  status: undefined as number | undefined,
  isBuiltin: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

const emptyForm = () => ({
  id: undefined as number | undefined,
  foodName: "",
  category: "",
  caloriePer100g: 0,
  proteinPer100g: 0,
  fatPer100g: 0,
  carbPer100g: 0,
  unitHint: "g",
  status: 1,
});

const form = reactive(emptyForm());

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await request.get("/api/admin/foods", {
      params: {
        keyword: query.keyword || undefined,
        status: query.status,
        isBuiltin: query.isBuiltin,
        page: query.page,
        pageSize: query.pageSize,
      },
    });

    if (res.code === 0) {
      tableData.value = res.data?.list || [];
      total.value = Number(res.data?.total || 0);
    } else {
      ElMessage.error(res.message || "获取食物列表失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("获取食物列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  query.page = 1;
  loadData();
};

const handleReset = () => {
  query.keyword = "";
  query.status = undefined;
  query.isBuiltin = undefined;
  query.page = 1;
  loadData();
};

const openAdd = () => {
  Object.assign(form, emptyForm());
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  Object.assign(form, {
    id: row.id,
    foodName: row.food_name,
    category: row.category,
    caloriePer100g: Number(row.calorie_per_100g || 0),
    proteinPer100g: Number(row.protein_per_100g || 0),
    fatPer100g: Number(row.fat_per_100g || 0),
    carbPer100g: Number(row.carb_per_100g || 0),
    unitHint: row.unit_hint || "g",
    status: Number(row.status ?? 1),
  });
  dialogVisible.value = true;
};

const save = async () => {
  try {
    const payload = {
      foodName: form.foodName,
      category: form.category,
      caloriePer100g: form.caloriePer100g,
      proteinPer100g: form.proteinPer100g,
      fatPer100g: form.fatPer100g,
      carbPer100g: form.carbPer100g,
      unitHint: form.unitHint,
      status: form.status,
    };

    const res: any = form.id
      ? await request.put(`/api/admin/foods/${form.id}`, payload)
      : await request.post("/api/admin/foods", payload);

    if (res.code === 0) {
      ElMessage.success("保存成功");
      dialogVisible.value = false;
      loadData();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("保存失败");
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认删除该食物吗？", "提示", {
      type: "warning",
    });

    const res: any = await request.delete(`/api/admin/foods/${row.id}`);
    if (res.code === 0) {
      ElMessage.success("删除成功");
      loadData();
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
};

const handlePromote = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      "确认将该用户自定义食物转为系统食物吗？",
      "提示",
      {
        type: "warning",
      }
    );

    const res: any = await request.put(`/api/admin/foods/${row.id}/promote`);
    if (res.code === 0) {
      ElMessage.success("转为系统食物成功");
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
