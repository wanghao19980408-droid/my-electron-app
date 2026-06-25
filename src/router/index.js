import Vue from "vue";
import VueRouter from "vue-router";
import ParameterSettings from "@/views/ParameterSettings.vue";
import ProjectManagement from "@/views/ProjectManagement.vue";
import Login from "@/views/Login.vue";
import store from "@/store";
import CesiumTest from "@/views/CesiumTest.vue";
import FlightProfile from "@/views/FlightProfile.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/", redirect: "/project" },
  {
    path: "/login",
    name: "LoginPage",
    component: Login,
    meta: { public: true },
  },
  { path: "/project", name: "Project", component: ProjectManagement },
  { path: "/parameters", name: "Parameters", component: ParameterSettings },
  { path: "/cesium-test", component: CesiumTest },
  { path: "/flight-profile", name: "FlightProfile", component: FlightProfile },
  {
    path: "/ballistic-analysis",
    name: "BallisticAnalysis",
    component: () =>
      import(
        /* webpackChunkName: "ballistic-analysis" */ "@/views/BallisticAnalysis.vue"
      ),
    meta: {
      title: "ballisticAnalysis",
      icon: "el-icon-data-analysis",
      requiresAuth: true,
    },
  },
];

const router = new VueRouter({
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.public || store.state.isLoggedIn) {
    next();
  } else {
    next("/login");
  }
});
export default router;
