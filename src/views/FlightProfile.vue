<template>
  <div class="flight-profile">
    <div class="profile-header">
      <button class="back-btn" @click="$router.back()">
        <i class="el-icon-arrow-left"></i>
        <span>返回</span>
      </button>
      <h2 class="page-title">弹道剖面分析</h2>
      <div class="header-tools">
        <el-tooltip content="导出图表" placement="bottom">
          <button class="tool-btn" @click="exportCharts">
            <i class="el-icon-download"></i>
          </button>
        </el-tooltip>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loader">
        <div class="loader-ring"></div>
        <span class="loader-text">加载弹道数据...</span>
      </div>
    </div>

    <div
      ref="chartsContainer"
      class="charts-container"
      :class="{ visible: !loading && chartsReady }"
    >
      <div v-if="summary" class="summary-row">
        <div class="summary-card">
          <span class="summary-value"
            >{{ summary.duration }}<small>s</small></span
          >
          <span class="summary-label">飞行时长</span>
        </div>
        <div class="summary-card">
          <span class="summary-value"
            >{{ summary.maxAlt }}<small>km</small></span
          >
          <span class="summary-label">弹道顶点</span>
        </div>
        <div class="summary-card">
          <span class="summary-value"
            >{{ summary.maxVel }}<small>m/s</small></span
          >
          <span class="summary-label">最大速度</span>
        </div>
        <div class="summary-card">
          <span class="summary-value"
            >{{ summary.range }}<small>km</small></span
          >
          <span class="summary-label">水平射程</span>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-panel">
          <div class="chart-title">高度-时间曲线</div>
          <div ref="altChart" class="chart-canvas"></div>
        </div>
        <div class="chart-panel">
          <div class="chart-title">速度-时间曲线</div>
          <div ref="velChart" class="chart-canvas"></div>
        </div>
        <div class="chart-panel wide">
          <div class="chart-title">地面轨迹投影</div>
          <div ref="trackChart" class="chart-canvas"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { parseBTRKTrack } from "@/utils/parseTrack";

export default {
  name: "FlightProfile",
  data() {
    return {
      loading: true,
      chartsReady: false,
      summary: null,
      charts: {},
    };
  },
  mounted() {
    const recordId = this.$route.query.recordId;
    if (recordId) {
      this.loadAndRenderData(recordId);
    } else {
      this.$message.error("未提供数据源 ID");
      this.loading = false;
    }

    this._ro = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        Object.values(this.charts).forEach((c) => c && c.resize());
      });
    });

    this.$nextTick(() => {
      if (this.$refs.altChart) this._ro.observe(this.$refs.altChart);
      if (this.$refs.velChart) this._ro.observe(this.$refs.velChart);
      if (this.$refs.trackChart) this._ro.observe(this.$refs.trackChart);
    });

    window.addEventListener("resize", this.resizeCharts);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.resizeCharts);
    if (this._ro) this._ro.disconnect();
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },

    exportCharts() {
      Object.entries(this.charts).forEach(([name, chart]) => {
        const url = chart.getDataURL({ type: "png", pixelRatio: 2 });
        const a = document.createElement("a");
        a.href = url;
        a.download = `ballistic_${name}_${Date.now()}.png`;
        a.click();
      });
      this.$message.success("图表已导出");
    },

    async loadAndRenderData(recordId) {
      this.loading = true;
      try {
        const buffer = await window.electronAPI.ballistic.readTrack({
          recordId,
        });
        if (!buffer) throw new Error("无法读取轨迹文件");

        const trackData = parseBTRKTrack(buffer);
        const times = [];
        const alts = [];
        const vels = [];
        const lonLats = [];
        let maxAlt = 0;
        let maxVel = 0;

        trackData.forEach((p) => {
          times.push(p.time.toFixed(2));
          alts.push((p.alt / 1000).toFixed(2));
          vels.push(p.velocity.toFixed(1));
          lonLats.push([p.lon.toFixed(4), p.lat.toFixed(4)]);
          if (p.alt > maxAlt) maxAlt = p.alt;
          if (p.velocity > maxVel) maxVel = p.velocity;
        });

        const lastPoint = trackData[trackData.length - 1];
        const firstPoint = trackData[0];
        const R = 6371000;
        const dLat = ((lastPoint.lat - firstPoint.lat) * Math.PI) / 180;
        const dLon = ((lastPoint.lon - firstPoint.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((firstPoint.lat * Math.PI) / 180) *
            Math.cos((lastPoint.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const range = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        this.summary = {
          duration: lastPoint.time.toFixed(1),
          maxAlt: (maxAlt / 1000).toFixed(1),
          maxVel: maxVel.toFixed(0),
          range: (range / 1000).toFixed(1),
        };

        this.loading = false;

        await this.$nextTick();
        // Extra frame to ensure layout is computed
        await new Promise((resolve) => requestAnimationFrame(resolve));

        this.initAltChart(times, alts);
        this.initVelChart(times, vels);
        this.initTrackChart(lonLats);
        this.chartsReady = true;
      } catch (err) {
        this.$message.error("数据加载异常: " + err.message);
        this.loading = false;
      }
    },

    getBaseOption(xAxisName, yAxisName) {
      return {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(10, 12, 20, 0.95)",
          borderColor: "rgba(0, 229, 255, 0.3)",
          borderWidth: 1,
          textStyle: { color: "#e0e0e0", fontSize: 12 },
          axisPointer: {
            type: "cross",
            lineStyle: { color: "rgba(0, 229, 255, 0.3)" },
          },
        },
        grid: {
          left: "3%",
          right: "5%",
          bottom: "15%",
          top: "18%",
          containLabel: true,
        },
        xAxis: {
          name: xAxisName,
          nameLocation: "middle",
          nameGap: 30,
          nameTextStyle: { color: "#666", fontSize: 11 },
          type: "category",
          boundaryGap: false,
          axisLine: { lineStyle: { color: "#2b2b36" } },
          axisLabel: { color: "#8c8c9a", fontSize: 10 },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          name: yAxisName,
          nameLocation: "middle",
          nameGap: 45,
          nameRotate: 90,
          nameTextStyle: { color: "#666", fontSize: 11 },
          type: "value",
          axisLine: { show: false },
          axisLabel: { color: "#8c8c9a", fontSize: 10 },
          axisTick: { show: false },
          splitLine: {
            lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" },
          },
        },
        animationDuration: 1000,
        animationEasing: "cubicOut",
      };
    },

    initAltChart(xData, yData) {
      const el = this.$refs.altChart;
      if (!el || !el.clientWidth) return;
      const chart = echarts.init(el);
      const option = this.getBaseOption("时间 (s)", "高度 (km)");
      option.xAxis.data = xData;
      option.series = [
        {
          name: "高度",
          type: "line",
          showSymbol: false,
          smooth: 0.3,
          data: yData,
          lineStyle: { color: "#00ff80", width: 2 },
          itemStyle: { color: "#00ff80" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(0, 255, 128, 0.25)" },
              { offset: 1, color: "rgba(0, 255, 128, 0.0)" },
            ]),
          },
          markPoint: {
            data: [{ type: "max", name: "最高点" }],
            symbolSize: 8,
            itemStyle: { color: "#00ff80" },
            label: { color: "#00ff80", fontSize: 10, formatter: "{c} km" },
          },
        },
      ];
      chart.setOption(option);
      this.charts.alt = chart;
    },

    initVelChart(xData, yData) {
      const el = this.$refs.velChart;
      if (!el || !el.clientWidth) return;
      const chart = echarts.init(el);
      const option = this.getBaseOption("时间 (s)", "速度 (m/s)");
      option.xAxis.data = xData;
      option.series = [
        {
          name: "速度",
          type: "line",
          showSymbol: false,
          smooth: 0.3,
          data: yData,
          lineStyle: { color: "#00e5ff", width: 2 },
          itemStyle: { color: "#00e5ff" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(0, 229, 255, 0.2)" },
              { offset: 1, color: "rgba(0, 229, 255, 0.0)" },
            ]),
          },
          markPoint: {
            data: [{ type: "max", name: "峰值" }],
            symbolSize: 8,
            itemStyle: { color: "#00e5ff" },
            label: { color: "#00e5ff", fontSize: 10, formatter: "{c} m/s" },
          },
        },
      ];
      chart.setOption(option);
      this.charts.vel = chart;
    },

    initTrackChart(lonLats) {
      const el = this.$refs.trackChart;
      if (!el || !el.clientWidth) return;
      const chart = echarts.init(el);
      const option = {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(10, 12, 20, 0.95)",
          borderColor: "rgba(255, 64, 129, 0.3)",
          textStyle: { color: "#e0e0e0", fontSize: 12 },
          formatter: (p) => `经度: ${p.data[0]}°<br/>纬度: ${p.data[1]}°`,
        },
        grid: {
          left: "4%",
          right: "6%",
          bottom: "22%",
          top: "12%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          name: "经度 (°)",
          nameTextStyle: { color: "#666", fontSize: 11 },
          nameGap: 25,
          scale: true,
          axisLine: { lineStyle: { color: "#2b2b36" } },
          axisLabel: { color: "#8c8c9a", fontSize: 10 },
          splitLine: {
            lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" },
          },
        },
        yAxis: {
          type: "value",
          name: "纬度 (°)",
          nameTextStyle: { color: "#666", fontSize: 11 },
          nameGap: 15,
          scale: true,
          axisLine: { show: false },
          axisLabel: { color: "#8c8c9a", fontSize: 10 },
          splitLine: {
            lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" },
          },
        },
        series: [
          {
            name: "轨迹",
            type: "line",
            showSymbol: false,
            smooth: 0.2,
            data: lonLats,
            lineStyle: { color: "#ff4081", width: 2 },
            z: 1,
          },
          {
            name: "发射点",
            type: "scatter",
            data: [lonLats[0]],
            symbolSize: 12,
            itemStyle: {
              color: "#00ff80",
              borderColor: "#0a0c14",
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: "发射",
              color: "#00ff80",
              fontSize: 11,
              fontWeight: "bold",
              position: "right",
              distance: 8,
              backgroundColor: "rgba(10, 12, 20, 0.7)",
              padding: [3, 6],
              borderRadius: 3,
            },
            z: 10,
          },
          {
            name: "落点",
            type: "scatter",
            data: [lonLats[lonLats.length - 1]],
            symbolSize: 12,
            symbol: "diamond",
            itemStyle: {
              color: "#ff4081",
              borderColor: "#0a0c14",
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: "落点",
              color: "#ff4081",
              fontSize: 11,
              fontWeight: "bold",
              position: "left",
              distance: 8,
              backgroundColor: "rgba(10, 12, 20, 0.7)",
              padding: [3, 6],
              borderRadius: 3,
            },
            z: 10,
          },
        ],
        animationDuration: 1200,
      };
      chart.setOption(option);
      this.charts.track = chart;
    },
  },
};
</script>

<style scoped>
.flight-profile {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0a0c14;
  color: #e0e0e0;
  position: relative;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(10, 12, 20, 0.95);
  z-index: 10;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #8c8c9a;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.3);
}

.page-title {
  flex: 1;
  text-align: center;
  font-family: "Orbitron", monospace;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.header-tools {
  display: flex;
  gap: 6px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  color: #8c8c9a;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.3);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  background: #0a0c14;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-ring {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 229, 255, 0.1);
  border-top-color: #00e5ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 13px;
  color: #8c8c9a;
}

.charts-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
  min-height: 0;
}

.charts-container.visible {
  opacity: 1;
}

.charts-container::-webkit-scrollbar {
  width: 4px;
}

.charts-container::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.15);
  border-radius: 2px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-shrink: 0;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(20, 22, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
}

.summary-value {
  font-family: "Space Mono", monospace;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.summary-value small {
  font-size: 11px;
  color: #8c8c9a;
  margin-left: 2px;
  font-weight: 400;
}

.summary-label {
  font-size: 11px;
  color: #666;
}

.charts-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  min-height: 520px;
}

.chart-panel {
  display: flex;
  flex-direction: column;
  background: rgba(20, 22, 35, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 12px;
  overflow: hidden;
  min-height: 0;
}

.chart-panel.wide {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 12px;
  color: #8c8c9a;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.chart-canvas {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
