import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("../views/Register.vue"),
    },
    {
      path: "/admin",
      component: () => import("../layout/AdminLayout.vue"),
      children: [
        { path: "", redirect: "/admin/dashboard" },
        {
          path: "dashboard",
          name: "AdminDashboard",
          component: () => import("../views/admin/Dashboard.vue"),
        },
        {
          path: "users",
          name: "AdminUsers",
          component: () => import("../views/admin/UserManage.vue"),
        },
        {
          path: "foods",
          name: "AdminFoods",
          component: () => import("../views/admin/FoodManage.vue"),
        },
        {
          path: "templates",
          name: "AdminTemplates",
          component: () => import("../views/admin/TemplateManage.vue"),
        },
      ],
    },
    {
      path: "/",
      component: () => import("../layout/BasicLayout.vue"),
      children: [
        { path: "", redirect: "/home" },
        {
          path: "home",
          name: "Home",
          component: () => import("../views/Home.vue"),
        },
        {
          path: "profile",
          name: "Profile",
          component: () => import("../views/Profile.vue"),
        },
        {
          path: "body-metric",
          name: "BodyMetric",
          component: () => import("../views/BodyMetric.vue"),
        },
        {
          path: "diet-record-add",
          name: "DietRecordAdd",
          component: () => import("../views/DietRecordAdd.vue"),
        },
        {
          path: "diet-record-history",
          name: "DietRecordHistory",
          component: () => import("../views/DietRecordHistory.vue"),
        },
        {
          path: "sport-record-add",
          name: "SportRecordAdd",
          component: () => import("../views/SportRecordAdd.vue"),
        },
        {
          path: "sport-record-history",
          name: "SportRecordHistory",
          component: () => import("../views/SportRecordHistory.vue"),
        },
        {
          path: "plan-template",
          name: "PlanTemplate",
          component: () => import("../views/plan/PlanTemplate.vue"),
        },
        {
          path: "plan-week",
          name: "PlanWeek",
          component: () => import("../views/plan/PlanWeek.vue"),
        },
        {
          path: "plan-today",
          name: "PlanToday",
          component: () => import("../views/plan/PlanToday.vue"),
        },
        {
          path: "health-report",
          name: "HealthReport",
          component: () => import("../views/HealthReport.vue"),
        },
        {
          path: "test",
          name: "TestApi",
          component: () => import("../views/TestApi.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const whiteList = ["/login", "/register"];
  const isAdminRoute = to.path.startsWith("/admin");

  if (!whiteList.includes(to.path) && !token) {
    next("/login");
    return;
  }

  if (whiteList.includes(to.path) && token) {
    next(role === "1" ? "/admin/dashboard" : "/home");
    return;
  }

  if (isAdminRoute && role !== "1") {
    next("/home");
    return;
  }

  next();
});

export default router;
