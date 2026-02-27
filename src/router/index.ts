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
      path: "/",
      component: () => import("../layout/BasicLayout.vue"),
      children: [
        {
          path: "body-metric",
          name: "BodyMetric",
          component: () => import("../views/BodyMetric.vue"),
        },
        {
          path: "diet-record-history",
          name: "DietRecordHistory",
          component: () => import("../views/DietRecordHistory.vue"),
        },
        { path: "", redirect: "/home" },

        // 运动记录
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

        // 饮食记录（新增）
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
          path: "home",
          name: "Home",
          component: () => import("../views/Home.vue"),
        },
        {
          path: "test",
          name: "TestApi",
          component: () => import("../views/TestApi.vue"),
        },
        {
          path: "profile",
          name: "Profile",
          component: () => import("../views/Profile.vue"),
        },
      ],
    },
  ],
});

// 简单守卫：注册页和登录页都放行
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  const whiteList = ["/login", "/register"];

  if (!whiteList.includes(to.path) && !token) {
    next("/login");
    return;
  }

  if ((to.path === "/login" || to.path === "/register") && token) {
    next("/home");
    return;
  }

  next();
});

export default router;
