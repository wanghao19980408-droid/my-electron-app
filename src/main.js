window.CESIUM_BASE_URL = "./cesium";

import Vue from "vue";
import App from "./App.vue";
import "cesium/Build/Cesium/Widgets/widgets.css";
import router from "./router";
import store from "./store";
import i18n from "./i18n";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import infiniteScroll from "vue-infinite-scroll";
Vue.config.productionTip = false;
Vue.use(ElementUI, { i18n: (key, value) => i18n.t(key, value) });

//注册
new Vue({
  router,
  store,
  i18n,
  infiniteScroll,
  render: (h) => h(App),
}).$mount("#app");
