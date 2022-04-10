import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueHead from "vue-head";

Vue.config.productionTip = false;

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "@/assets/gapi";
import vuetify from "./plugins/vuetify";

Vue.use(VueHead);

new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
}).$mount("#app");
