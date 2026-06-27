<template>
  <div class="ba-page">
    <div class="ba-toolbar">
      <el-select
        v-model="selectedRecordIds"
        multiple
        :limit="3"
        :placeholder="$t('ballistic.selectRecord') || '选择弹道对比(最多3条)'"
        class="ba-record-select"
        @change="onRecordChange"
      >
        <el-option-group
          v-for="group in groupedRecords"
          :key="group.projectId"
          :label="group.projectName"
        >
          <el-option
            v-for="r in group.records"
            :key="r.id"
            :label="formatRecordLabel(r)"
            :value="r.id"
          />
        </el-option-group>
      </el-select>
      <button class="ba-icon-btn" @click="refreshRecords" title="刷新列表">
        <i class="el-icon-refresh"></i>
      </button>

      <div class="ba-spacer" />

      <button
        class="ba-btn"
        @click="exportCSV"
        :disabled="!activeTableRecordId"
      >
        <i class="el-icon-download"></i> 导出 CSV
      </button>
    </div>

    <div class="ba-selected-tags" v-if="selectedRecordIds.length">
      <div
        class="ba-sel-tag"
        v-for="(id, i) in selectedRecordIds"
        :key="id"
        :class="{ 'is-active': activeTableRecordId === id }"
        @click="activeTableRecordId = id"
      >
        <span
          class="ba-sel-dot"
          :style="{ background: RECORD_COLORS[i % RECORD_COLORS.length] }"
        ></span>
        <span class="ba-sel-name">{{ getRecordDisplayName(id) }}</span>
        <i
          class="el-icon-edit ba-edit-icon"
          @click.stop="renameRecord(id)"
          title="重命名"
        ></i>
      </div>
      <span class="ba-tag-hint" v-if="selectedRecordIds.length > 1"
        >* 点击卡片切换表格数据，且图表中对应主数据曲线会加粗高亮</span
      >
    </div>

    <div class="ba-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="ba-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="ba-content" v-if="activeTableRecordId">
      <div class="ba-panel" v-show="activeTab === 'overview'">
        <div class="ba-kpi-header" v-if="activeTableRecordId">
          <i class="el-icon-data-analysis"></i>
          当前主数据指标：<span class="hl-name">{{
            getRecordDisplayName(activeTableRecordId)
          }}</span>
        </div>

        <div class="ba-kpi-row">
          <div class="ba-kpi" v-for="kpi in kpiList" :key="kpi.label">
            <div class="ba-kpi-val">{{ kpi.value }}</div>
            <div class="ba-kpi-label">{{ kpi.label }}</div>
            <div class="ba-kpi-unit">{{ kpi.unit }}</div>
          </div>
        </div>

        <div class="ba-overview-charts">
          <div class="ba-chart-box">
            <div class="ba-chart-title">海拔对比 (km)</div>
            <div class="ba-chart-wrapper">
              <div ref="overviewAlt" class="ba-echarts-container"></div>
            </div>
          </div>
          <div class="ba-chart-box">
            <div class="ba-chart-title">速度对比 (m/s)</div>
            <div class="ba-chart-wrapper">
              <div ref="overviewSpd" class="ba-echarts-container"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="ba-panel" v-show="activeTab === 'telemetry'">
        <div class="ba-tele-layout">
          <div class="ba-tele-sidebar">
            <div
              class="ba-tele-group"
              v-for="group in paramGroups"
              :key="group.label"
            >
              <div class="ba-tele-group-title">{{ group.label }}</div>
              <label
                class="ba-tele-item"
                v-for="col in group.cols"
                :key="col.index"
              >
                <input
                  type="checkbox"
                  :value="col.index"
                  v-model="selectedParams"
                  :disabled="
                    selectedParams.length >= 4 &&
                    !selectedParams.includes(col.index)
                  "
                />
                <span class="ba-tele-item-name">{{ col.shortName }}</span>
              </label>
            </div>
          </div>
          <div class="ba-tele-chart-area">
            <div class="ba-tele-legend-box" v-show="selectedParams.length">
              <div class="ba-legend-row">
                <span class="ba-lg-title">参数:</span>
                <span
                  class="ba-legend-item"
                  v-for="(idx, i) in selectedParams"
                  :key="'p' + idx"
                >
                  <span
                    class="ba-legend-dot"
                    :style="{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }"
                  ></span>
                  {{ getColLabel(idx) }}
                  <span class="ba-lg-unit" v-if="getColUnit(idx)"
                    >({{ getColUnit(idx) }})</span
                  >
                </span>
              </div>
              <div class="ba-legend-row" v-if="selectedRecordIds.length > 1">
                <span class="ba-lg-title">弹道:</span>
                <span
                  class="ba-legend-item"
                  v-for="id in selectedRecordIds"
                  :key="'r' + id"
                >
                  <span
                    class="ba-legend-line"
                    :class="
                      id === activeTableRecordId ? 'is-main' : 'is-dashed'
                    "
                  ></span>
                  {{ getRecordDisplayName(id) }}
                </span>
              </div>
            </div>

            <div class="ba-tele-chart-wrap">
              <div ref="teleChart" class="ba-echarts-container"></div>
            </div>
            <div class="ba-tele-hint" v-show="!selectedParams.length">
              ← 从左侧选择要比对的参数（最多 4 个）
            </div>
          </div>
        </div>
      </div>

      <div class="ba-panel" v-show="activeTab === 'table'">
        <div class="ba-table-toolbar">
          <el-select
            v-model="tableCols"
            multiple
            collapse-tags
            class="ba-col-select-multi"
            placeholder="选择显示列"
            size="small"
          >
            <el-option-group
              v-for="group in paramGroups"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="col in group.cols"
                :key="col.index"
                :label="col.shortName"
                :value="col.index"
              />
            </el-option-group>
          </el-select>
          <el-input
            v-model="tableTimeRange"
            size="small"
            class="ba-time-input"
            placeholder="时间范围 (如: 10-50)"
            @change="applyTimeFilter"
          />
          <div class="ba-spacer" />
          <span class="ba-table-info"
            >显示 {{ filteredTableData.length.toLocaleString() }} /
            {{ fullData.length.toLocaleString() }} 行</span
          >
        </div>

        <div class="ba-table-wrap">
          <table class="ba-table">
            <thead>
              <tr>
                <th class="ba-th-idx">#</th>
                <th>时间(s)</th>
                <th v-for="ci in displayTableCols" :key="ci">
                  {{ getColLabel(ci)
                  }}<span class="ba-th-unit" v-if="getColUnit(ci)"
                    >({{ getColUnit(ci) }})</span
                  >
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in pagedTableData" :key="ri">
                <td class="ba-td-idx">{{ tablePageStart + ri + 1 }}</td>
                <td>{{ fmtNum(row[0]) }}</td>
                <td v-for="ci in displayTableCols" :key="ci">
                  {{ fmtNum(row[ci]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ba-table-pager" v-if="filteredTableData.length > pageSize">
          <button
            class="ba-pager-btn"
            :disabled="tablePage <= 0"
            @click="tablePage--"
          >
            ‹ 上一页
          </button>
          <span class="ba-pager-info"
            >{{ tablePage + 1 }} / {{ totalPages }}</span
          >
          <button
            class="ba-pager-btn"
            :disabled="tablePage >= totalPages - 1"
            @click="tablePage++"
          >
            下一页 ›
          </button>
        </div>
      </div>
    </div>

    <div class="ba-empty" v-else-if="!loading">
      <div class="ba-empty-icon">📊</div>
      <div class="ba-empty-text">
        请在上方选择弹道记录进行分析 (支持多选对比)
      </div>
    </div>

    <div class="ba-loading" v-if="loading">
      <div class="ba-spinner"></div>
      <span>解析数据中...</span>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as echarts from "echarts";
import { TELEMETRY_COLUMNS, PARAM_GROUPS } from "@/utils/telemetryColumns";

const CHART_COLORS = ["#00e5ff", "#39ff14", "#ff6b6b", "#ffd93d", "#fb923c"];
const RECORD_COLORS = ["#00e5ff", "#c084fc", "#39ff14"];
const LINE_DASHES = ["solid", "dashed", "dotted"];

export default {
  name: "BallisticAnalysis",
  data() {
    return {
      records: [],
      selectedRecordIds: [],
      multiData: {},
      activeTableRecordId: null,
      loading: false,
      activeTab: "overview",
      selectedParams: [26],
      tableCols: [1, 26, 30, 31, 49],
      tableTimeRange: "",
      tableTimeMin: null,
      tableTimeMax: null,
      tablePage: 0,
      pageSize: 100,
      CHART_COLORS,
      RECORD_COLORS,
      LINE_DASHES,
      resizeHandler: null,
      chartAltInstance: null,
      chartSpdInstance: null,
      teleChartInstance: null,
    };
  },
  computed: {
    ...mapState(["projects"]),
    tabs() {
      return [
        { key: "overview", label: "对比概览" },
        { key: "telemetry", label: "遥测叠图" },
        { key: "table", label: "详细数据" },
      ];
    },
    groupedRecords() {
      const map = {};
      this.records.forEach((r) => {
        if (!map[r.projectId]) {
          const p = (this.projects || []).find((x) => x.id === r.projectId);
          map[r.projectId] = {
            projectId: r.projectId,
            projectName: p ? p.name : "默认项目",
            records: [],
          };
        }
        map[r.projectId].records.push(r);
      });
      return Object.values(map);
    },
    fullData() {
      return this.activeTableRecordId
        ? this.multiData[this.activeTableRecordId]
        : null;
    },
    dataColCount() {
      return this.fullData && this.fullData.length
        ? this.fullData[0].length - 1
        : 0;
    },
    paramGroups() {
      const n = this.dataColCount || TELEMETRY_COLUMNS.length;
      return PARAM_GROUPS.map((g) => ({
        label: g.label,
        cols: g.children
          .filter((idx) => idx < n && idx !== 0)
          .map((idx) => ({
            index: TELEMETRY_COLUMNS[idx].col,
            shortName: TELEMETRY_COLUMNS[idx].label,
            unit: TELEMETRY_COLUMNS[idx].unit,
          })),
      })).filter((g) => g.cols.length > 0);
    },
    kpiList() {
      if (!this.fullData || !this.fullData.length) return [];
      const data = this.fullData;
      const n = this.dataColCount;
      const last = data[data.length - 1];
      let maxAlt = -Infinity,
        maxQ = -Infinity,
        maxMach = -Infinity,
        maxAxial = 0;
      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        if (n > 26 && r[26] > maxAlt) maxAlt = r[26];
        if (n > 31 && r[31] > maxQ) maxQ = r[31];
        if (n > 30 && r[30] > maxMach) maxMach = r[30];
        if (n > 23 && Math.abs(r[23]) > maxAxial) maxAxial = Math.abs(r[23]);
      }
      return [
        { label: "飞行时长", value: last[0].toFixed(1), unit: "s" },
        {
          label: "最大海拔",
          value: n > 26 ? (maxAlt / 1000).toFixed(2) : "—",
          unit: "km",
        },
        {
          label: "最大动压",
          value: n > 31 ? maxQ.toFixed(1) : "—",
          unit: "Pa",
        },
        {
          label: "最大过载",
          value: n > 23 ? maxAxial.toFixed(3) : "—",
          unit: "g",
        },
        {
          label: "最大马赫",
          value: n > 30 ? maxMach.toFixed(2) : "—",
          unit: "",
        },
        {
          label: "总航程",
          value: n > 49 ? (last[49] / 1000).toFixed(2) : "—",
          unit: "km",
        },
      ];
    },
    displayTableCols() {
      const n = this.dataColCount;
      const cols = this.tableCols.filter((c) => c > 0 && c < n);
      return cols.length ? cols : [1, 26, 30, 31, 49].filter((c) => c < n);
    },
    filteredTableData() {
      if (!this.fullData) return [];
      if (this.tableTimeMin === null && this.tableTimeMax === null)
        return this.fullData;
      return this.fullData.filter((row) => {
        const t = row[0];
        return (
          (this.tableTimeMin === null || t >= this.tableTimeMin) &&
          (this.tableTimeMax === null || t <= this.tableTimeMax)
        );
      });
    },
    totalPages() {
      return Math.max(
        1,
        Math.ceil(this.filteredTableData.length / this.pageSize),
      );
    },
    tablePageStart() {
      return this.tablePage * this.pageSize;
    },
    pagedTableData() {
      return this.filteredTableData.slice(
        this.tablePageStart,
        this.tablePageStart + this.pageSize,
      );
    },
  },
  watch: {
    selectedParams() {
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.activeTab === "telemetry") {
            this.drawTelemetryChart();
          }
        }, 50);
      });
    },
    activeTab(tab) {
      this.$nextTick(() => {
        setTimeout(() => {
          if (tab === "overview") {
            this.drawOverviewCharts();
          }
          if (tab === "telemetry") {
            this.drawTelemetryChart();
          }
        }, 50);
      });
    },
    activeTableRecordId() {
      this.tablePage = 0;
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.activeTab === "overview") this.drawOverviewCharts();
          if (this.activeTab === "telemetry") this.drawTelemetryChart();
        }, 50);
      });
    },
  },
  activated() {
    this.refreshRecords();
  },
  async mounted() {
    await this.loadRecords();

    let resizeTimer = null;
    this.resizeHandler = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.activeTab === "overview") {
          if (this.chartAltInstance) this.chartAltInstance.resize();
          if (this.chartSpdInstance) this.chartSpdInstance.resize();
        }
        if (this.activeTab === "telemetry") {
          if (this.teleChartInstance) this.teleChartInstance.resize();
        }
      }, 100);
    };
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    if (this.resizeHandler)
      window.removeEventListener("resize", this.resizeHandler);
    if (this.chartAltInstance) this.chartAltInstance.dispose();
    if (this.chartSpdInstance) this.chartSpdInstance.dispose();
    if (this.teleChartInstance) this.teleChartInstance.dispose();
  },
  methods: {
    getColLabel(colIdx) {
      return TELEMETRY_COLUMNS[colIdx]
        ? TELEMETRY_COLUMNS[colIdx].label
        : `列${colIdx}`;
    },
    getColUnit(colIdx) {
      return TELEMETRY_COLUMNS[colIdx] ? TELEMETRY_COLUMNS[colIdx].unit : "";
    },
    getRecordDisplayName(id) {
      const r = this.records.find((x) => x.id === id);
      if (!r) return id;
      if (r.name) return r.name;
      const t = r.ballisticType === "baseline" ? "基础弹道" : "优化弹道";
      return `${t} #${r.id.slice(-6).toUpperCase()}`;
    },
    formatRecordLabel(r) {
      return this.getRecordDisplayName(r.id);
    },
    async refreshRecords() {
      try {
        const list = await window.electronAPI.ballistic.list();
        this.records = list;
        const exist = this.selectedRecordIds.filter((id) =>
          list.some((r) => r.id === id),
        );
        if (exist.length) {
          this.selectedRecordIds = exist;
          if (!exist.includes(this.activeTableRecordId))
            this.activeTableRecordId = exist[0];
        } else if (list.length) {
          this.selectedRecordIds = [list[0].id];
          this.activeTableRecordId = list[0].id;
        } else {
          this.selectedRecordIds = [];
          this.activeTableRecordId = null;
        }
        await this.onRecordChange(this.selectedRecordIds);
      } catch (e) {
        console.error(e);
      }
    },
    async loadRecords() {
      try {
        this.records = await window.electronAPI.ballistic.list();
        if (this.records.length && !this.selectedRecordIds.length) {
          this.selectedRecordIds = [this.records[0].id];
          this.activeTableRecordId = this.records[0].id;
          await this.onRecordChange(this.selectedRecordIds);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async onRecordChange(newVal) {
      if (newVal.length === 0) {
        this.activeTableRecordId = null;
        return;
      }
      if (!newVal.includes(this.activeTableRecordId))
        this.activeTableRecordId = newVal[0];

      this.loading = true;
      await new Promise((r) => requestAnimationFrame(r));
      try {
        const maxNeededCol = Math.max(
          ...TELEMETRY_COLUMNS.map((col) => col.col || 0),
        );

        for (const id of newVal) {
          if (!this.multiData[id]) {
            const rawBuf = await window.electronAPI.ballistic.readFull(id);
            const buf =
              rawBuf instanceof Uint8Array
                ? rawBuf.buffer.slice(
                    rawBuf.byteOffset,
                    rawBuf.byteOffset + rawBuf.byteLength,
                  )
                : rawBuf;
            const hd = new Uint32Array(buf, 0, 2);
            const r = hd[0];
            const c = hd[1];
            const f32 = new Float32Array(buf, 8);
            const data = new Array(r);

            const extractC = Math.min(c, maxNeededCol + 1);

            for (let i = 0; i < r; i++) {
              const row = new Float32Array(extractC + 1);
              const b = i * c;

              for (let j = 0; j < extractC; j++) {
                row[j] = f32[b + j];
              }

              if (c > 7) {
                row[extractC] = Math.sqrt(
                  row[5] * row[5] + row[6] * row[6] + row[7] * row[7],
                );
              }
              data[i] = row;
            }
            this.$set(this.multiData, id, Object.freeze(data));
          }
        }
        Object.keys(this.multiData).forEach((id) => {
          if (!newVal.includes(id)) this.$delete(this.multiData, id);
        });
      } catch (e) {
        this.$message.error("加载数据失败: " + e.message);
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          setTimeout(() => {
            if (this.activeTab === "overview") this.drawOverviewCharts();
            if (this.activeTab === "telemetry") this.drawTelemetryChart();
          }, 50);
        });
      }
    },
    async renameRecord(id) {
      const r = this.records.find((x) => x.id === id);
      this.$prompt("请输入弹道自定义名称", "重命名", {
        inputValue: r.name || "",
        customClass: "hud-confirm-box",
      })
        .then(async ({ value }) => {
          await this.$store.dispatch("RENAME_BALLISTIC_RECORD", {
            recordId: id,
            name: value,
          });
          this.refreshRecords();
        })
        .catch(() => {});
    },

    drawOverviewCharts() {
      if (!this.$refs.overviewAlt || !this.$refs.overviewSpd) return;
      if (!this.selectedRecordIds.length) return;

      let chartAlt = echarts.getInstanceByDom(this.$refs.overviewAlt);
      if (!chartAlt) {
        if (this.chartAltInstance) this.chartAltInstance.dispose();
        this.chartAltInstance = echarts.init(this.$refs.overviewAlt);
      }

      let chartSpd = echarts.getInstanceByDom(this.$refs.overviewSpd);
      if (!chartSpd) {
        if (this.chartSpdInstance) this.chartSpdInstance.dispose();
        this.chartSpdInstance = echarts.init(this.$refs.overviewSpd);
      }

      const dataset = this.selectedRecordIds.map((id) => ({
        id: id,
        source: this.multiData[id],
      }));

      const altSets = [];
      const spdSets = [];

      this.selectedRecordIds.forEach((id, i) => {
        const isMain = id === this.activeTableRecordId;
        const color = RECORD_COLORS[i % RECORD_COLORS.length];

        const baseSeriesOpt = {
          name: this.getRecordDisplayName(id),
          type: "line",
          datasetId: id,
          showSymbol: false,
          smooth: 0.2,
          sampling: "lttb",
          large: true,
          itemStyle: { color },
          lineStyle: {
            width: isMain ? 2 : 1,
            type: isMain ? "solid" : "dashed",
            shadowBlur: isMain ? 8 : 0,
            shadowColor: color,
          },
        };

        altSets.push({
          ...baseSeriesOpt,
          encode: { x: 0, y: 26 },
          tooltip: {
            valueFormatter: (val) => (val / 1000).toFixed(2) + " km", // tooltip中转km
          },
        });

        const colCount = this.multiData[id] ? this.multiData[id][0].length : 0;
        if (colCount > 1) {
          spdSets.push({
            ...baseSeriesOpt,
            encode: { x: 0, y: colCount - 1 },
            tooltip: {
              valueFormatter: (val) => val.toFixed(1) + " m/s",
            },
          });
        }
      });

      const baseOption = {
        backgroundColor: "transparent",
        dataset: dataset, // 挂载 dataset
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            lineStyle: { color: "rgba(0, 229, 255, 0.4)", type: "dashed" },
            crossStyle: { color: "rgba(0, 229, 255, 0.4)", type: "dashed" },
          },
          backgroundColor: "rgba(3, 8, 18, 0.85)",
          borderColor: "rgba(0, 229, 255, 0.4)",
          borderWidth: 1,
          textStyle: {
            color: "#e0f4ff",
            fontSize: 12,
            fontFamily: '"Space Mono", monospace',
          },
          padding: [8, 12],
        },
        grid: { left: 45, right: 15, top: 15, bottom: 25, containLabel: false },
        xAxis: {
          type: "value",
          splitLine: { show: false },
          axisLabel: {
            color: "#5a7a8a",
            fontFamily: '"Space Mono", monospace',
            fontSize: 10,
          },
          axisLine: { lineStyle: { color: "rgba(0,229,255,0.15)" } },
          axisTick: { show: false },
        },
      };

      this.chartAltInstance.setOption(
        {
          ...baseOption,
          yAxis: {
            type: "value",
            scale: true,
            axisLabel: {
              color: "#5a7a8a",
              fontFamily: '"Space Mono", monospace',
              fontSize: 10,
              formatter: (val) => val / 1000, // Y轴直转km展示
            },
            splitLine: {
              lineStyle: { color: "rgba(0,229,255,0.05)", type: "dashed" },
            },
          },
          series: altSets,
        },
        true,
      );

      this.chartSpdInstance.setOption(
        {
          ...baseOption,
          yAxis: {
            type: "value",
            scale: true,
            axisLabel: {
              color: "#5a7a8a",
              fontFamily: '"Space Mono", monospace',
              fontSize: 10,
            },
            splitLine: {
              lineStyle: { color: "rgba(0,229,255,0.05)", type: "dashed" },
            },
          },
          series: spdSets,
        },
        true,
      );

      this.chartAltInstance.resize();
      this.chartSpdInstance.resize();
    },
    hexToRgba(hex, alpha = 1) {
      if (!hex) return "rgba(0,0,0,1)";
      const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
      return `rgba(${r},${g},${b},${alpha})`;
    },
    drawTelemetryChart() {
      if (!this.$refs.teleChart) return;
      let chartTele = echarts.getInstanceByDom(this.$refs.teleChart);
      if (!chartTele) {
        if (this.teleChartInstance) this.teleChartInstance.dispose();
        this.teleChartInstance = echarts.init(this.$refs.teleChart);
      }

      if (this.selectedParams.length === 0) {
        this.teleChartInstance.clear();
        return;
      }

      const dataset = this.selectedRecordIds.map((id) => ({
        id: id,
        source: this.multiData[id],
      }));

      const N = this.selectedParams.length;

      const cols = N <= 2 ? 1 : 2;
      const rows = Math.ceil(N / cols);

      const grids = [];
      const xAxes = [];
      const yAxes = [];
      const series = [];

      this.selectedParams.forEach((colIdx, pIdx) => {
        const colDef = TELEMETRY_COLUMNS[colIdx] || {
          label: `列${colIdx}`,
          unit: "",
        };
        const yName = colDef.unit
          ? `${colDef.shortName}(${colDef.unit})`
          : colDef.shortName;
        const axisColor = CHART_COLORS[pIdx % 5];

        const r = Math.floor(pIdx / cols);
        const c = pIdx % cols;

        const gridWidth = cols === 1 ? "92%" : "43%";
        const gridHeight = rows === 1 ? "75%" : "32%";

        const left = c === 0 ? "4%" : "53%";
        const top = r === 0 ? "10%" : "56%";

        const isBottomRow = pIdx + cols >= N;

        grids.push({
          left: left,
          top: top,
          width: gridWidth,
          height: gridHeight,
          containLabel: true,
          show: true,
          backgroundColor: "rgba(0, 229, 255, 0.015)",
          borderColor: "rgba(0, 229, 255, 0.08)",
          borderWidth: 1,
        });

        xAxes.push({
          gridIndex: pIdx,
          type: "value",
          splitLine: { show: false },
          axisLabel: {
            show: isBottomRow,
            color: "#5a7a8a",
            fontSize: 10,
            fontFamily: '"Space Mono", monospace',
          },
          axisLine: { show: true, lineStyle: { color: "rgba(0,229,255,0.2)" } },
          axisTick: { show: isBottomRow },
        });

        yAxes.push({
          gridIndex: pIdx,
          type: "value",
          name: yName,
          nameLocation: "end",
          nameTextStyle: {
            color: axisColor,
            fontSize: 12,
            fontWeight: "bold",
            padding: [0, 0, 4, 0],
            align: "left",
          },
          splitNumber: 4,
          scale: true,
          axisLine: { show: true, lineStyle: { color: axisColor } },
          splitLine: {
            show: true,
            lineStyle: { color: "rgba(255,255,255,0.03)", type: "dashed" },
          },
          axisLabel: {
            color: axisColor,
            fontSize: 9,
            fontFamily: '"Space Mono", monospace',
            formatter: (value) => {
              if (
                Math.abs(value) >= 100000 ||
                (Math.abs(value) < 0.001 && value !== 0)
              )
                return value.toExponential(2);
              return value;
            },
          },
          axisTick: { show: false },
        });

        this.selectedRecordIds.forEach((id) => {
          const isMain = id === this.activeTableRecordId;

          series.push({
            name: `${this.getRecordDisplayName(id)} - ${colDef.shortName}`,
            type: "line",
            datasetId: id,
            encode: { x: 0, y: colIdx },
            xAxisIndex: pIdx,
            yAxisIndex: pIdx,
            showSymbol: false,
            sampling: "lttb",
            large: true,
            smooth: 0.1,
            itemStyle: { color: axisColor },
            lineStyle: {
              width: isMain ? 2 : 1.2,
              type: isMain ? "solid" : "dashed",
              shadowBlur: isMain ? 6 : 0,
              shadowColor: axisColor,
              opacity: isMain ? 1 : 0.5,
            },
            areaStyle: isMain
              ? {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: this.hexToRgba(axisColor, 0.15) },
                    { offset: 1, color: this.hexToRgba(axisColor, 0.0) },
                  ]),
                }
              : null,
            tooltip: {
              valueFormatter: (val) => (val != null ? val.toPrecision(6) : "—"),
            },
          });
        });
      });

      this.teleChartInstance.setOption(
        {
          backgroundColor: "transparent",
          dataset: dataset,
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "cross",
              label: { backgroundColor: "#00e5ff", color: "#000" },
              lineStyle: { color: "rgba(0, 229, 255, 0.5)", type: "dashed" },
            },
            backgroundColor: "rgba(10, 15, 26, 0.9)",
            borderColor: "rgba(0, 229, 255, 0.3)",
            borderWidth: 1,
            textStyle: {
              color: "#e0f4ff",
              fontSize: 12,
              fontFamily: '"Space Mono", monospace',
            },
            padding: [10, 14],
          },
          dataZoom: [
            { type: "inside", xAxisIndex: "all" },
            {
              type: "slider",
              xAxisIndex: "all",
              height: 16,
              bottom: 2,
              borderColor: "transparent",
              backgroundColor: "rgba(0, 229, 255, 0.05)",
              fillerColor: "rgba(0, 229, 255, 0.15)",
              handleStyle: { color: "#00e5ff" },
              textStyle: { color: "#5a7a8a" },
            },
          ],
          axisPointer: { link: [{ xAxisIndex: "all" }] },
          grid: grids,
          xAxis: xAxes,
          yAxis: yAxes,
          series: series,
        },
        true,
      );

      this.teleChartInstance.resize();
    },

    applyTimeFilter() {
      const val = this.tableTimeRange.trim();
      if (!val) {
        this.tableTimeMin = null;
        this.tableTimeMax = null;
        this.tablePage = 0;
        return;
      }
      const parts = val.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        this.tableTimeMin = parts[0];
        this.tableTimeMax = parts[1];
      }
      this.tablePage = 0;
    },
    fmtNum(v) {
      if (v === undefined || v === null || !isFinite(v)) return "";
      if (Math.abs(v) > 1e8 || (Math.abs(v) < 0.0001 && v !== 0))
        return v.toExponential(4);
      return Number(v.toPrecision(7)).toString();
    },
    exportCSV() {
      if (!this.fullData) return;
      const n = this.dataColCount; // 使用 dataColCount 避免把我们偷偷添加的合成速度列导出去
      const header = [];
      for (let i = 0; i < n; i++)
        header.push(
          TELEMETRY_COLUMNS[i] ? TELEMETRY_COLUMNS[i].label : `列${i}`,
        );

      const rows = this.fullData.map((r) => {
        // 由于原始数组变为了 Float32Array 且带了尾巴速度列，我们需要slice一下再join
        return Array.from(r).slice(0, n).join(",");
      });

      const csv = [header.join(","), ...rows].join("\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `ballistic_${this.activeTableRecordId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped>
.ba-page {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 20px;
  gap: 12px;
  box-sizing: border-box;
}
.ba-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.ba-record-select {
  width: 480px;
}
.ba-icon-btn {
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00e5ff;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.ba-icon-btn:hover {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.5);
}
.ba-spacer {
  flex: 1;
}
.ba-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  padding: 6px 14px;
  color: #00e5ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.ba-btn:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.5);
}
.ba-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 选中标签区 */
.ba-selected-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(0, 15, 30, 0.4);
  border: 1px dashed rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  flex-shrink: 0;
}
.ba-sel-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8ab4c0;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.ba-sel-tag:hover {
  background: rgba(0, 229, 255, 0.05);
}
.ba-sel-tag.is-active {
  border-color: #00e5ff;
  color: #00e5ff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.2);
}
.ba-sel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 4px currentColor;
}
.ba-edit-icon {
  margin-left: 4px;
  cursor: pointer;
  color: #5a7a8a;
}
.ba-edit-icon:hover {
  color: #00e5ff;
}
.ba-tag-hint {
  font-size: 11px;
  color: #5a7a8a;
  margin-left: auto;
}

.ba-tabs {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}
.ba-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 18px;
  color: #5a7a8a;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.ba-tab:hover {
  color: #8ab4c0;
}
.ba-tab.active {
  color: #00e5ff;
  border-bottom-color: #00e5ff;
}

.ba-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.ba-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ba-kpi-header {
  font-size: 13px;
  color: #8ab4c0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 229, 255, 0.05);
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #00e5ff;
  flex-shrink: 0;
}
.hl-name {
  color: #00e5ff;
  font-weight: bold;
}

.ba-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.ba-kpi {
  background: rgba(0, 229, 255, 0.03);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
  padding: 14px;
  text-align: center;
  box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.02);
  transition: all 0.3s;
}
.ba-kpi:hover {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 229, 255, 0.1);
}
.ba-kpi-val {
  font-size: 22px;
  font-weight: 800;
  color: #00e5ff;
  font-family: "Space Mono", monospace;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
}
.ba-kpi-label {
  font-size: 11px;
  color: #8ab4c0;
  margin-top: 6px;
  letter-spacing: 1px;
}
.ba-kpi-unit {
  font-size: 10px;
  color: #3a5a6a;
}

.ba-overview-charts {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 0;
}
.ba-chart-box {
  background: rgba(0, 10, 20, 0.4);
  border: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 6px;
  padding: 12px 12px 0 12px;
  display: flex;
  flex-direction: column;
  min-height: 280px;
}
.ba-chart-title {
  font-size: 11px;
  color: #5a7a8a;
  margin-bottom: 8px;
  padding-left: 4px;
  flex-shrink: 0;
}
.ba-chart-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 240px;
}
.ba-echarts-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.ba-tele-layout {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  min-width: 0;
}
.ba-tele-sidebar {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 229, 255, 0.08);
  padding: 8px 10px;
  min-height: 0;
}
.ba-tele-group {
  margin-bottom: 12px;
}
.ba-tele-group-title {
  font-size: 10px;
  color: #3a5a6a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  padding-left: 2px;
}
.ba-tele-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.15s;
}
.ba-tele-item:hover {
  background: rgba(0, 229, 255, 0.06);
}
.ba-tele-item input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: #00e5ff;
  cursor: pointer;
  flex-shrink: 0;
}
.ba-tele-item-name {
  font-size: 12px;
  color: #8ab4c0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ba-tele-chart-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 12px;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.ba-tele-legend-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 4px;
  background: rgba(0, 20, 40, 0.3);
  flex-shrink: 0;
}
.ba-legend-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.ba-lg-title {
  font-size: 11px;
  color: #5a7a8a;
  width: 35px;
}
.ba-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8ab4c0;
}
.ba-legend-dot {
  width: 10px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}
.ba-legend-line {
  width: 22px;
  height: 2px;
  display: inline-block;
}

.ba-legend-line.is-main {
  height: 3px;
  background: #00e5ff;
}
.ba-legend-line.is-dashed {
  background: repeating-linear-gradient(
    to right,
    #8ab4c0 0,
    #8ab4c0 4px,
    transparent 4px,
    transparent 8px
  );
}
.ba-tele-chart-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  width: 100%;
}
.ba-tele-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #3a5a6a;
  font-size: 14px;
  pointer-events: none;
}

.ba-table-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.ba-col-select-multi {
  width: 320px;
}
.ba-time-input {
  width: 160px;
}
.ba-table-info {
  font-size: 11px;
  color: #5a7a8a;
  font-family: monospace;
}
.ba-table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 4px;
  min-height: 0;
}
.ba-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
}
.ba-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
}
.ba-table th {
  background: rgba(0, 20, 40, 0.95);
  color: #5a7a8a;
  font-weight: 500;
  padding: 8px 10px;
  text-align: right;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
  white-space: nowrap;
}
.ba-th-unit {
  color: #3a5a6a;
  font-size: 10px;
  margin-left: 2px;
}
.ba-table td {
  padding: 5px 10px;
  text-align: right;
  color: #8ab4c0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.04);
}
.ba-table tbody tr:hover td {
  background: rgba(0, 229, 255, 0.04);
}
.ba-th-idx,
.ba-td-idx {
  text-align: center;
  color: #3a5a6a;
  width: 50px;
}

.ba-table-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
  flex-shrink: 0;
}
.ba-pager-btn {
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  padding: 5px 14px;
  color: #00e5ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.ba-pager-btn:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.12);
}
.ba-pager-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.ba-pager-info {
  font-size: 12px;
  color: #5a7a8a;
  font-family: monospace;
}

.ba-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.ba-empty-icon {
  font-size: 48px;
  opacity: 0.4;
}
.ba-empty-text {
  color: #5a7a8a;
  font-size: 14px;
}
.ba-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 5, 15, 0.7);
  z-index: 100;
  color: #00e5ff;
  font-size: 14px;
}
.ba-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 229, 255, 0.2);
  border-top-color: #00e5ff;
  border-radius: 50%;
  animation: ba-spin 0.8s linear infinite;
}
@keyframes ba-spin {
  to {
    transform: rotate(360deg);
  }
}

.ba-page >>> .el-select .el-input__inner {
  background: rgba(0, 20, 40, 0.6);
  border-color: rgba(0, 229, 255, 0.2);
  color: #8ab4c0;
  font-size: 12px;
}
.ba-page >>> .el-select .el-input__inner:focus {
  border-color: rgba(0, 229, 255, 0.5);
}
.ba-page >>> .el-input__inner {
  background: rgba(0, 20, 40, 0.6);
  border-color: rgba(0, 229, 255, 0.2);
  color: #8ab4c0;
  font-size: 12px;
}
.ba-page >>> .el-select-dropdown {
  background: rgba(0, 15, 30, 0.95);
  border-color: rgba(0, 229, 255, 0.2);
}
.ba-page >>> .el-select-dropdown__item {
  color: #8ab4c0;
  font-size: 12px;
}
.ba-page >>> .el-select-dropdown__item.hover,
.ba-page >>> .el-select-dropdown__item:hover {
  background: rgba(0, 229, 255, 0.08);
}
.ba-page >>> .el-select-dropdown__item.selected {
  color: #00e5ff;
  font-weight: bold;
  background: rgba(0, 229, 255, 0.04);
}
.ba-page >>> .el-tag {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.2);
  color: #00e5ff;
}
.ba-panel::-webkit-scrollbar,
.ba-tele-sidebar::-webkit-scrollbar,
.ba-table-wrap::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.ba-panel::-webkit-scrollbar-track,
.ba-tele-sidebar::-webkit-scrollbar-track,
.ba-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}
.ba-panel::-webkit-scrollbar-thumb,
.ba-tele-sidebar::-webkit-scrollbar-thumb,
.ba-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.15);
  border-radius: 3px;
}
.ba-panel::-webkit-scrollbar-thumb:hover,
.ba-tele-sidebar::-webkit-scrollbar-thumb:hover,
.ba-table-wrap::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.3);
}

.hud-confirm-box .el-message-box__input .el-input__inner {
  background: rgba(0, 8, 18, 0.8) !important;
  border: 1px solid rgba(0, 229, 255, 0.4) !important;
  color: #fff !important;
  font-family: var(--font-mono) !important;
  border-radius: 4px !important;
  padding: 8px 12px !important;
}
.hud-confirm-box .el-message-box__input .el-input__inner:focus {
  border-color: var(--cyan) !important;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2) !important;
}
</style>
