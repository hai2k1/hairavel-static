<template>
  <a-config-provider :locale="enUS">
    <div id="app" class="bg-gray-100 dark:bg-blackgray-1">
      <Page :show="show" />
    </div>
  </a-config-provider>
</template>

<script>
import enUS from '@arco-design/web-vue/es/locale/lang/en-us';
import Page from "./components/route/Page.vue";
import { event } from "./utils/event";

export default {
  name: "App",
  components: {
    Page,
  },
  data() {
    return {
      show: true,
        enUS,
    };
  },
  created() {
    // 注册图表
    window.Apex = {
      chart: {
        locales: [
          {
            name: "en-US",
              options: {
                  months: [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                  ],
                  shortMonths: [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                  ],
                  days: [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                  ],
                  shortDays: [
                      "Sunday",
                      "on Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                  ],
                  toolbar: {
                      exportToSVG: "Download SVG",
                      exportToPNG: "Download PNG",
                      exportToCSV: "Download CSV",
                      menu: "Menu",
                      selection: "selection",
                      selectionZoom: "Selection size",
                      zoomIn: "Zoom in",
                      zoomOut: "zoom out",
                      pan: "move",
                      reset: "Reset",
                  },
              },
          },
        ],
        fontFamily: "inherit",
        defaultLocale: "zh-CN",
        background: "transparent",
        foreColor: "#373d3f",
      },
      tooltip: {
        theme: "light",
      },
      theme: {
        mode: "light",
        palette: "palette1",
      },
    };

    event.add("switch-dark", (type) => {
      this.switchDark(type);
    });

    this.switchDark(
      localStorage.getItem("darkMode") === "dark" ? "dark" : "light"
    );

    const config = window.appConfig;
    // websocket 服务
    if (config.pusher && config.pusher.status) {
    }
  },
  methods: {
    switchDark(type) {
      localStorage.setItem("darkMode", type);
      this.show = false;
      window.darkMode = type;
      window.Apex.tooltip.theme = type;
      window.Apex.theme.mode = type;
      window.Apex.chart.foreColor = type === "dark" ? "#f6f7f8" : "#373d3f";

      if (type === "dark") {
        document.body.classList.add("dark");
        document.body.setAttribute("arco-theme", "dark");
      } else {
        document.body.classList.remove("dark");
        document.body.removeAttribute("arco-theme");
      }

      this.$nextTick(() => {
        this.show = true;
      });
    },
  },
};
</script>

<style>
#app {
  height: 100%;
}

* {
  padding: 0;
  margin: 0;
}

div,
input,
textarea {
  box-sizing: border-box;
}
</style>
