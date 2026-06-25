<template>
  <div class="ps-page">
    <div
      v-for="c in ['tl', 'tr', 'bl', 'br']"
      :key="c"
      class="corner"
      :class="c"
    >
      <div class="corner-inner"></div>
      <div class="corner-glow"></div>
    </div>
    <div class="scan-overlay" />

    <el-card shadow="never" class="main-card">
      <div slot="header" class="card-header">
        <div class="panel-title">
          <span class="title-bracket">[</span>
          <span class="title-icon-wrap"
            ><i class="el-icon-setting title-icon"
          /></span>
          <span class="title-text">{{ $t("params.title") || "优化配置" }}</span>
          <span class="title-bracket">]</span>
        </div>

        <div class="header-actions">
          <div class="sim-status" :class="{ active: isSimulating }">
            <span class="status-dot" />
            <span class="status-text">{{
              isSimulating ? "OPTIMIZING" : "STANDBY"
            }}</span>
          </div>
        </div>
      </div>

      <div class="form-body">
        <div class="params-section" :class="{ locked: !localProjectId }">
          <div class="form-lock-overlay" v-if="!localProjectId">
            <div class="lock-core">
              <i class="el-icon-lock" />
              <span>请在下方控制台选择关联项目以加载配置</span>
            </div>
          </div>

          <div class="opt-type-section">
            <div class="section-label">
              <span class="sect-line" />
              <span>{{ $t("params.groups.optType") || "优化目标" }}</span>
              <span class="sect-line" />
            </div>
            <div class="opt-radio-group">
              <label
                class="opt-pill"
                :class="{ active: form.optType === 1, disabled: isSimulating }"
              >
                <input
                  type="radio"
                  v-model="form.optType"
                  :value="1"
                  :disabled="isSimulating"
                />
                <span class="pill-badge">OPT · MAX</span>
                <span class="pill-desc">{{
                  $t("params.labels.optMax") || "运载能力最大化"
                }}</span>
                <div class="pill-glow" />
              </label>
              <label
                class="opt-pill"
                :class="{ active: form.optType === 2, disabled: isSimulating }"
              >
                <input
                  type="radio"
                  v-model="form.optType"
                  :value="2"
                  :disabled="isSimulating"
                />
                <span class="pill-badge">OPT · MIN</span>
                <span class="pill-desc">{{
                  $t("params.labels.optMin") || "关机时间最小化"
                }}</span>
                <div class="pill-glow" />
              </label>
            </div>
          </div>

          <div class="params-grid">
            <div class="params-col">
              <div class="section-header">
                <span class="sh-bar" />
                <span class="sh-text">GLOBAL & ATTITUDE</span>
              </div>
              <div class="field-group">
                <div class="field-row">
                  <span class="field-label">{{
                    $t("params.labels.maxIter") || "最大迭代次数"
                  }}</span>
                  <div class="field-control">
                    <el-input-number
                      v-model="form.maxIterations"
                      :step="100"
                      controls-position="right"
                      :disabled="isSimulating"
                    />
                    <span class="unit">&nbsp;</span>
                  </div>
                </div>
                <div class="field-row">
                  <span class="field-label">{{
                    $t("params.labels.initAz") || "初始发射方位角"
                  }}</span>
                  <div class="field-control">
                    <el-input-number
                      v-model="form.launchAzimuth"
                      :step="1"
                      controls-position="right"
                      :disabled="isSimulating"
                    />
                    <span class="unit">deg</span>
                  </div>
                </div>
                <div class="field-row">
                  <span class="field-label">{{
                    $t("params.labels.initSlope1") || "一级程序转弯斜率"
                  }}</span>
                  <div class="field-control">
                    <el-input-number
                      v-model="form.slope1"
                      :step="0.001"
                      controls-position="right"
                      :disabled="isSimulating"
                    />
                    <span class="unit">&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-divider">
              <div class="divider-line" />
              <div class="divider-diamond" />
              <div class="divider-line" />
            </div>

            <div class="params-col">
              <div class="section-header">
                <span class="sh-bar" />
                <span class="sh-text">INIT CONDITIONS</span>
              </div>
              <div class="field-group">
                <transition name="field-fade" mode="out-in">
                  <div class="field-row" :key="'dyn-' + form.optType">
                    <template v-if="form.optType === 1">
                      <span class="field-label">{{
                        $t("params.labels.initLoad") || "初始预估载荷"
                      }}</span>
                      <div class="field-control">
                        <el-input-number
                          v-model="form.init1.loadMass"
                          :step="10"
                          controls-position="right"
                          :disabled="isSimulating"
                        />
                        <span class="unit">kg</span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="field-label">{{
                        $t("params.labels.initTime") || "初始预估时间"
                      }}</span>
                      <div class="field-control">
                        <el-input-number
                          v-model="form.init2.finalShutdown"
                          :step="1"
                          controls-position="right"
                          :disabled="isSimulating"
                        />
                        <span class="unit">s</span>
                      </div>
                    </template>
                  </div>
                </transition>
                <div class="field-row">
                  <span class="field-label">{{
                    $t("params.labels.initAttack") || "最大负攻角"
                  }}</span>
                  <div class="field-control">
                    <el-input-number
                      v-model="form.attackAngle"
                      :step="0.1"
                      controls-position="right"
                      :disabled="isSimulating"
                    />
                    <span class="unit">deg</span>
                  </div>
                </div>
                <div class="field-row">
                  <span class="field-label">{{
                    $t("params.labels.initSlope2") || "二级程序转弯斜率"
                  }}</span>
                  <div class="field-control">
                    <el-input-number
                      v-model="form.slope2"
                      :step="0.001"
                      controls-position="right"
                      :disabled="isSimulating"
                    />
                    <span class="unit">&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="actions-panel">
          <div class="actions-divider">
            <span class="actions-divider-line" />
            <span class="actions-divider-text">EXECUTION CENTER</span>
            <span class="actions-divider-line" />
          </div>

          <div class="actions-grid single-action">
            <div
              class="action-card main-action"
              :class="{ running: isSimulating }"
            >
              <div class="action-card-header">
                <span class="action-step">CORE</span>
                <span class="action-title">全弹道优化计算</span>
              </div>
              <p class="action-desc">
                {{
                  localProjectId
                    ? "根据配置参数寻优最佳发射方位角、攻角和程序转弯斜率，输出最优解记录。"
                    : "请先在下方选择目标项目，加载参数后即可启动寻优仿真计算。"
                }}
              </p>

              <div class="execution-row">
                <div class="exec-project">
                  <div class="ep-label">
                    <i class="el-icon-folder-opened" /> TARGET PROJECT
                  </div>
                  <div class="project-selector" v-clickoutside="closePanel">
                    <div
                      class="proj-trigger giant-trigger"
                      :class="{
                        open: panelOpen,
                        'has-value': localProjectId,
                        attention: !localProjectId,
                      }"
                      @click="togglePanel"
                    >
                      <span class="proj-trigger-icon">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <rect
                            x="0.5"
                            y="0.5"
                            width="4"
                            height="4"
                            rx="0.5"
                            stroke="currentColor"
                          />
                          <rect
                            x="7.5"
                            y="0.5"
                            width="4"
                            height="4"
                            rx="0.5"
                            stroke="currentColor"
                          />
                          <rect
                            x="0.5"
                            y="7.5"
                            width="4"
                            height="4"
                            rx="0.5"
                            stroke="currentColor"
                            opacity="0.45"
                          />
                          <rect
                            x="7.5"
                            y="7.5"
                            width="4"
                            height="4"
                            rx="0.5"
                            stroke="currentColor"
                            opacity="0.45"
                          />
                        </svg>
                      </span>
                      <span class="proj-trigger-text">
                        {{
                          selectedProject
                            ? selectedProject.name
                            : "请选择计算项目..."
                        }}
                      </span>
                      <span class="proj-trigger-meta" v-if="selectedProject">
                        {{
                          selectedProject.records
                            ? selectedProject.records.length
                            : 0
                        }}
                        REC
                      </span>
                      <span
                        class="proj-trigger-arrow"
                        :class="{ open: panelOpen }"
                      >
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 8 5"
                          fill="none"
                        >
                          <path
                            d="M1 1L4 4L7 1"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          />
                        </svg>
                      </span>
                      <div class="proj-trigger-bar" />
                    </div>

                    <transition name="proj-panel-up">
                      <div class="proj-panel popup-up" v-if="panelOpen">
                        <div class="proj-panel-header">
                          <span class="proj-panel-title">SELECT PROJECT</span>
                          <span class="proj-panel-count"
                            >{{ projects.length }} AVAILABLE</span
                          >
                        </div>
                        <div class="proj-panel-list">
                          <div v-if="!projects.length" class="proj-empty">
                            <i class="el-icon-folder-opened" /> 请先创建项目
                          </div>
                          <div
                            v-for="p in projects"
                            :key="p.id"
                            class="proj-item"
                            :class="{ active: localProjectId === p.id }"
                            @click="selectProject(p.id)"
                          >
                            <div class="proj-item-indicator" />
                            <div class="proj-item-body">
                              <span class="proj-item-name">{{ p.name }}</span>
                              <span class="proj-item-rec"
                                >{{
                                  p.records ? p.records.length : 0
                                }}
                                REC</span
                              >
                            </div>
                            <div
                              class="proj-item-check"
                              v-if="localProjectId === p.id"
                            >
                              <svg
                                width="10"
                                height="8"
                                viewBox="0 0 10 8"
                                fill="none"
                              >
                                <path
                                  d="M1 4L3.5 6.5L9 1"
                                  stroke="currentColor"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </div>
                            <div class="proj-item-scan" />
                          </div>
                        </div>
                        <div class="proj-panel-footer">
                          <div class="proj-panel-footer-line" />
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>

                <div class="exec-divider" v-if="localProjectId"></div>

                <transition name="fade-slide">
                  <div class="exec-actions" v-if="localProjectId">
                    <el-button
                      type="primary"
                      class="action-btn opt-btn giant-btn"
                      :loading="isSimulating"
                      @click="runOptimization"
                    >
                      <i v-if="!isSimulating" class="el-icon-cpu" />
                      {{ isSimulating ? "系统解算中..." : "启动优化计算程序" }}
                    </el-button>
                    <transition name="el-fade-in">
                      <el-button
                        v-if="isSimulating"
                        type="danger"
                        class="action-btn giant-btn-stop"
                        plain
                        @click="stopOptimization"
                      >
                        <i class="el-icon-video-pause" /> 中止
                      </el-button>
                    </transition>
                  </div>
                </transition>
              </div>

              <div class="action-progress" v-if="isSimulating && optProgress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: optProgressPercent + '%' }"
                  />
                </div>
                <span class="progress-text">
                  迭代 {{ optProgress.iteration || 0 }} /
                  {{ form.maxIterations }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-hint-bar" v-if="localProjectId">
          <span class="hint-seg">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> · 启动优化计算
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

function defaultForm() {
  return {
    optType: 1,
    maxIterations: 1,
    launchAzimuth: 190.0,
    attackAngle: 0.2,
    slope1: 0.0,
    slope2: -0.2,
    init1: { loadMass: 2000 },
    init2: { finalShutdown: 550 },
  };
}

export default {
  name: "ParameterSettings",

  directives: {
    clickoutside: {
      bind(el, binding) {
        el._h = (e) => {
          if (!el.contains(e.target)) binding.value();
        };
        document.addEventListener("click", el._h);
      },
      unbind(el) {
        document.removeEventListener("click", el._h);
      },
    },
  },

  data: () => ({
    form: defaultForm(),
    panelOpen: false,
    formSnapshot: "",
  }),

  computed: {
    ...mapState(["isSimulating", "projects", "activeProjectId", "optProgress"]),

    selectedProject() {
      return this.projects.find((p) => p.id === this.localProjectId) || null;
    },

    localProjectId: {
      get() {
        return this.activeProjectId;
      },
      set(val) {
        this.SET_ACTIVE_PROJECT({ projectId: val });
        this.loadLatestForm(val);
      },
    },

    optProgressPercent() {
      if (!this.optProgress?.iteration) return 0;
      return Math.min(
        100,
        (this.optProgress.iteration / this.form.maxIterations) * 100,
      );
    },
  },

  watch: {
    activeProjectId(val) {
      if (val) this.loadLatestForm(val);
    },
  },

  mounted() {
    if (this.activeProjectId) this.loadLatestForm(this.activeProjectId);
    document.addEventListener("keydown", this._onKey);
  },

  beforeDestroy() {
    document.removeEventListener("keydown", this._onKey);
  },

  methods: {
    ...mapActions(["SET_ACTIVE_PROJECT", "SAVE_OPT_RECORD"]),

    _onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (this.localProjectId && !this.isSimulating) this.runOptimization();
      }
    },

    togglePanel() {
      this.panelOpen = !this.panelOpen;
    },
    closePanel() {
      this.panelOpen = false;
    },

    selectProject(id) {
      this.localProjectId = id;
      this.panelOpen = false;
    },

    loadLatestForm(projId) {
      const proj = this.projects.find((p) => p.id === projId);
      if (proj?.records?.length > 0 && proj.records[0].optConfig) {
        const stored = proj.records[0].optConfig;
        this.form = { ...defaultForm(), ...stored };
      } else {
        this.form = defaultForm();
      }
      this.formSnapshot = JSON.stringify(this.form);
    },

    // ========== 优化仿真 ==========
    async runOptimization() {
      if (this.isSimulating) return;
      if (!this.localProjectId) {
        this.$message.warning(
          this.$t("params.msg.noProjectSelected") || "未选择项目",
        );
        return;
      }
      const proj = this.selectedProject;
      if (!proj?.baseParams) {
        this.$message.error(
          this.$t("params.msg.missingBaseConfig") || "缺失项目配置",
        );
        return;
      }
      if (!window.electronAPI?.runSimulation) {
        this.$message.error(this.$t("app.noElectron") || "Electron接口未就绪");
        return;
      }

      const p = { ...proj.baseParams, ...this.form };
      const payload = {
        earth: {
          lambda_0: p.longitude,
          B_0: p.latitude,
          A_0: p.azimuth,
          altitude: p.altitude,
        },
        rocket: {
          stages: 2,
          d_max: p.diameter,
          fairing: p.fairingMass,
          load: p.loadMass,
          struct: [
            [p.stage1.structMass, p.stage1.oxMass + p.stage1.fuelMass],
            [p.stage2.structMass, p.stage2.oxMass + p.stage2.fuelMass],
          ],
          engines: [
            [
              p.stage1.Isp,
              p.stage1.enginesNum,
              p.stage1.thrust,
              p.stage1.nozzleArea,
              p.stage1.mountingAngle,
            ],
            [
              p.stage2.Isp,
              p.stage2.enginesNum,
              p.stage2.thrust,
              p.stage2.nozzleArea,
              p.stage2.mountingAngle,
            ],
          ],
        },
        orbit: {
          height: p.trackHeight * 1000,
          e: p.eccentricity,
          i: p.trackInclination,
        },
        type: parseInt(p.optType),
        t_stages: [[p.time1], [p.time3, p.time4]],
        events: {
          "stage-1": {
            event: ["separate"],
            t_start: [p.time1],
            duration: [p.time2],
          },
          "stage-2": {
            event: ["fairing", "separate"],
            t_start: [p.fairingTime || 10, p.time3 + p.time4],
            duration: [0, p.time5],
          },
        },
        A_0: p.launchAzimuth,
        load_max: p.init1.loadMass,
        alpha_max: p.attackAngle,
        phi_slope: [p.slope1, p.slope2],
        t_minus: p.init2.finalShutdown,
        max_iter: p.maxIterations,
      };

      try {
        this.$store.commit("SET_SIMULATING", true);
        this.$store.commit("SET_RUNNING_OPT_TYPE", this.form.optType);
        this.$store.commit("SET_OPT_PROGRESS", null);
        this.$message.info("优化仿真已启动");

        const data = await window.electronAPI.runSimulation(payload);

        await this.SAVE_OPT_RECORD({
          projectId: this.localProjectId,
          optConfig: this.form,
          optResult: data,
        });

        this.formSnapshot = JSON.stringify(this.form);
        this.$message.success("优化计算已完成并保存");
      } catch (err) {
        if (err !== "MANUAL_STOP") {
          this.$message.error(typeof err === "string" ? err : "优化仿真失败");
        }
      } finally {
        this.$store.commit("SET_OPT_PROGRESS", null);
        this.$store.commit("SET_SIMULATING", false);
      }
    },

    async stopOptimization() {
      if (window.electronAPI?.stopSimulation) {
        await window.electronAPI.stopSimulation();
        this.$message.info("已停止优化");
      }
    },
  },
};
</script>

<style scoped>
/* ========== 页面基础 ========== */
.ps-page {
  position: relative;
  animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 重新设计的四角装饰 ========== */
.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  z-index: 3;
  pointer-events: none;
}

.corner-inner {
  position: absolute;
  inset: 0;
}

.corner-glow {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 12px var(--cyan-glow), 0 0 20px var(--cyan-glow);
  opacity: 0.6;
  animation: cornerPulse 3s ease-in-out infinite;
}

@keyframes cornerPulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* 左上角 */
.corner.tl {
  top: 4px;
  left: 4px;
}
.corner.tl .corner-inner::before,
.corner.tl .corner-inner::after {
  content: "";
  position: absolute;
  background: linear-gradient(135deg, var(--cyan) 0%, transparent 70%);
}
.corner.tl .corner-inner::before {
  top: 0;
  left: 0;
  width: 20px;
  height: 2px;
  border-radius: 1px 0 0 0;
}
.corner.tl .corner-inner::after {
  top: 0;
  left: 0;
  width: 2px;
  height: 20px;
  border-radius: 1px 0 0 0;
}
.corner.tl .corner-glow {
  top: -2px;
  left: -2px;
}

/* 右上角 */
.corner.tr {
  top: 4px;
  right: 4px;
}
.corner.tr .corner-inner::before,
.corner.tr .corner-inner::after {
  content: "";
  position: absolute;
  background: linear-gradient(225deg, var(--cyan) 0%, transparent 70%);
}
.corner.tr .corner-inner::before {
  top: 0;
  right: 0;
  width: 20px;
  height: 2px;
  border-radius: 0 1px 0 0;
}
.corner.tr .corner-inner::after {
  top: 0;
  right: 0;
  width: 2px;
  height: 20px;
  border-radius: 0 1px 0 0;
}
.corner.tr .corner-glow {
  top: -2px;
  right: -2px;
  animation-delay: 0.5s;
}

.corner.bl {
  bottom: 4px;
  left: 4px;
}
.corner.bl .corner-inner::before,
.corner.bl .corner-inner::after {
  content: "";
  position: absolute;
  background: linear-gradient(45deg, var(--cyan) 0%, transparent 70%);
}
.corner.bl .corner-inner::before {
  bottom: 0;
  left: 0;
  width: 20px;
  height: 2px;
  border-radius: 0 0 0 1px;
}
.corner.bl .corner-inner::after {
  bottom: 0;
  left: 0;
  width: 2px;
  height: 20px;
  border-radius: 0 0 0 1px;
}
.corner.bl .corner-glow {
  bottom: -2px;
  left: -2px;
  animation-delay: 1s;
}

.corner.br {
  bottom: 4px;
  right: 4px;
}
.corner.br .corner-inner::before,
.corner.br .corner-inner::after {
  content: "";
  position: absolute;
  background: linear-gradient(315deg, var(--cyan) 0%, transparent 70%);
}
.corner.br .corner-inner::before {
  bottom: 0;
  right: 0;
  width: 20px;
  height: 2px;
  border-radius: 0 0 1px 0;
}
.corner.br .corner-inner::after {
  bottom: 0;
  right: 0;
  width: 2px;
  height: 20px;
  border-radius: 0 0 1px 0;
}
.corner.br .corner-glow {
  bottom: -2px;
  right: -2px;
  animation-delay: 1.5s;
}

.scan-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 229, 255, 0.015) 3px,
    rgba(0, 229, 255, 0.015) 4px
  );
}

/* ========== Card ========== */
::v-deep .el-card {
  position: relative;
  background: rgba(6, 16, 34, 0.92) !important;
  border: 1px solid var(--panel-border) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(20px);
  overflow: visible !important;
  z-index: 2;
}
::v-deep .el-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.6),
    transparent
  );
}
::v-deep .el-card__header {
  background: rgba(0, 0, 0, 0.3) !important;
  border-bottom: 1px solid var(--panel-border) !important;
  padding: 10px 20px;
}
::v-deep .el-card__body {
  padding: 0;
}

/* ========== Header ========== */
.card-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
}
.panel-title {
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-hud);
  font-size: 13px;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 4px;
  text-shadow: 0 0 16px var(--cyan-glow);
}
.title-bracket {
  opacity: 0.6;
  font-size: 16px;
  line-height: 1;
}
.title-icon-wrap {
  display: flex;
  align-items: center;
}
.title-icon {
  font-size: 14px;
  animation: spin 12s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Header Actions */
.header-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 14px;
}
.sim-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #3a5a6a;
  transition: color 0.3s;
}
.sim-status.active {
  color: #39ff14;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2a4a5a;
  transition: all 0.3s;
}
.sim-status.active .status-dot {
  background: #39ff14;
  box-shadow: 0 0 8px #39ff14;
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.form-body {
  position: relative;
  padding: 24px 36px 24px;
}
.params-section {
  position: relative;
  padding-bottom: 24px;
}
.params-section.locked > *:not(.form-lock-overlay) {
  opacity: 0.35;
  pointer-events: none;
  filter: grayscale(0.4);
}
.form-lock-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    ellipse at center,
    rgba(3, 10, 18, 0.5),
    transparent 70%
  );
  pointer-events: none;
}
.lock-core {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(0, 229, 255, 0.5);
  background: rgba(3, 10, 18, 0.85);
  padding: 14px 24px;
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 6px;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.08);
}

.opt-type-section {
  margin-bottom: 28px;
}
.section-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 4px;
  margin-bottom: 16px;
  opacity: 0.75;
}
.sect-line {
  flex: 1;
  height: 1px;
  max-width: 80px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3));
}
.sect-line:last-child {
  background: linear-gradient(270deg, transparent, rgba(0, 229, 255, 0.3));
}
.opt-radio-group {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.opt-pill {
  position: relative;
  flex: 1;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 20px 12px;
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  overflow: hidden;
}
.opt-pill input {
  display: none;
}
.opt-pill:hover:not(.disabled) {
  border-color: rgba(0, 229, 255, 0.4);
  background: rgba(0, 229, 255, 0.04);
}
.opt-pill.active {
  border-color: var(--cyan);
  background: rgba(0, 229, 255, 0.08);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.12),
    inset 0 0 16px rgba(0, 229, 255, 0.05);
}
.opt-pill.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pill-badge {
  font-family: var(--font-hud);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 3px;
  color: #6a9ab5;
  transition: all 0.2s;
}
.opt-pill.active .pill-badge {
  color: var(--cyan);
  text-shadow: 0 0 12px var(--cyan-glow);
}
.pill-desc {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: #4a6a7a;
  transition: color 0.2s;
}
.opt-pill.active .pill-desc {
  color: rgba(0, 229, 255, 0.6);
}
.pill-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: transparent;
  transition: all 0.3s;
}
.opt-pill.active .pill-glow {
  background: var(--cyan);
  box-shadow: 0 0 12px var(--cyan);
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  margin-bottom: 12px;
  align-items: start;
}
.params-col {
  padding: 0 16px;
}
.col-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  align-self: stretch;
}
.divider-line {
  flex: 1;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(0, 229, 255, 0.2),
    transparent
  );
}
.divider-diamond {
  width: 6px;
  height: 6px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  transform: rotate(45deg);
  margin: 8px 0;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  height: 20px;
}
.sh-bar {
  width: 3px;
  height: 14px;
  border-radius: 1px;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan-glow);
}
.sh-text {
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--cyan);
  opacity: 0.8;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}
.field-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: #7aaac0;
  letter-spacing: 0.5px;
  white-space: nowrap;
  line-height: 36px;
}
.field-control {
  display: flex;
  align-items: center;
  gap: 6px;
}
.unit {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(0, 229, 255, 0.4);
  letter-spacing: 1px;
  min-width: 28px;
}

::v-deep .el-input-number {
  width: 180px;
}
::v-deep .el-input-number .el-input__inner {
  background: rgba(0, 8, 20, 0.7) !important;
  border: 1px solid rgba(0, 229, 255, 0.15) !important;
  color: #c0e0f0 !important;
  font-family: var(--font-mono) !important;
  font-size: 12px !important;
  height: 34px !important;
  line-height: 34px !important;
}
::v-deep .el-input-number .el-input__inner:focus {
  border-color: var(--cyan) !important;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.2) !important;
}
::v-deep .el-input-number__decrease,
::v-deep .el-input-number__increase {
  background: rgba(0, 229, 255, 0.05) !important;
  border-color: rgba(0, 229, 255, 0.12) !important;
  color: rgba(0, 229, 255, 0.5) !important;
  height: 16px !important;
  line-height: 16px !important;
}
::v-deep .el-input-number__decrease:hover,
::v-deep .el-input-number__increase:hover {
  color: var(--cyan) !important;
}

/* ========== Execution Center ========== */
.actions-panel {
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.actions-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  width: 100%;
}
.actions-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.2),
    transparent
  );
}
.actions-divider-text {
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 4px;
  color: rgba(0, 229, 255, 0.4);
}

.actions-grid.single-action {
  display: flex;
  justify-content: center;
  width: 100%;
}

.action-card.main-action {
  width: 100%;
  max-width: 760px;
  padding: 24px 32px;
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 8px;
  background: rgba(0, 8, 20, 0.4);
  transition: all 0.3s;
  position: relative;
}
.action-card.main-action::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background 0.3s;
}
.action-card.main-action.running::before {
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  animation: scanLine 2s linear infinite;
}
@keyframes scanLine {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.action-card.main-action.running {
  border-color: rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.08);
}

.action-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}
.action-step {
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  color: rgba(0, 229, 255, 0.5);
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 3px;
  padding: 2px 6px;
}
.action-title {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 800;
  color: #c0e0f0;
  letter-spacing: 1.5px;
}
.action-desc {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  color: #5a8a9a;
  margin: 0 auto 20px;
  text-align: center;
}

.execution-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 24px;
  background: rgba(0, 229, 255, 0.02);
  border: 1px solid rgba(0, 229, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
}

.exec-project {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ep-label {
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  color: #6a9ab5;
  letter-spacing: 2px;
}
.ep-label i {
  margin-right: 6px;
}

.project-selector {
  position: relative;
  z-index: 100;
}
.giant-trigger {
  width: 260px;
  height: 42px;
  padding: 0 14px;
  background: rgba(0, 8, 20, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  user-select: none;
}
.giant-trigger.attention {
  border-color: rgba(57, 255, 20, 0.5);
  box-shadow: 0 0 16px rgba(57, 255, 20, 0.15);
}
.giant-trigger.attention .proj-trigger-icon {
  color: #39ff14;
}
.giant-trigger.attention .proj-trigger-text {
  color: #e0f4ff;
}
.giant-trigger:hover,
.giant-trigger.open {
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
  background: rgba(0, 229, 255, 0.05);
}
.proj-trigger-icon {
  color: rgba(0, 229, 255, 0.4);
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.giant-trigger:hover .proj-trigger-icon,
.giant-trigger.open .proj-trigger-icon {
  color: var(--cyan);
}
.proj-trigger-text {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: #c0e0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.giant-trigger:not(.has-value) .proj-trigger-text {
  color: #5a7a8a;
}
.proj-trigger-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  color: rgba(0, 229, 255, 0.6);
  letter-spacing: 1px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 3px;
  padding: 2px 6px;
}
.proj-trigger-arrow {
  color: rgba(0, 229, 255, 0.4);
  display: flex;
  align-items: center;
  transition: all 0.25s;
}
.proj-trigger-arrow.open {
  transform: rotate(180deg);
  color: var(--cyan);
}
.proj-trigger-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
  width: 0;
  background: var(--cyan);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
  transition: width 0.3s;
}
.giant-trigger.open .proj-trigger-bar,
.giant-trigger:hover .proj-trigger-bar {
  width: 100%;
}

.proj-panel {
  position: absolute;
  left: 0;
  width: 280px;
  background: rgba(4, 12, 28, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.22);
  border-radius: 6px;
  z-index: 10000;
  overflow: hidden;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(0, 229, 255, 0.04),
    inset 0 1px 0 rgba(0, 229, 255, 0.1);
  backdrop-filter: blur(24px);
}
.popup-up {
  top: auto;
  bottom: calc(100% + 8px);
  transform-origin: bottom center;
}
.proj-panel::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.55),
    transparent
  );
}
.proj-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 7px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
}
.proj-panel-title {
  font-family: var(--font-hud);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 3px;
  color: rgba(0, 229, 255, 0.5);
}
.proj-panel-count {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(0, 229, 255, 0.22);
}
.proj-panel-list {
  padding: 6px 0;
  max-height: 240px;
  overflow-y: auto;
}
.proj-panel-list::-webkit-scrollbar {
  width: 2px;
}
.proj-panel-list::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.18);
  border-radius: 1px;
}
.proj-empty {
  padding: 18px 14px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(0, 229, 255, 0.35);
  letter-spacing: 1.5px;
}
.proj-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  overflow: hidden;
}
.proj-item:hover {
  background: rgba(0, 229, 255, 0.05);
}
.proj-item.active {
  background: rgba(0, 229, 255, 0.07);
}
.proj-item-indicator {
  width: 2px;
  height: 20px;
  border-radius: 1px;
  background: rgba(0, 229, 255, 0.1);
  transition: all 0.2s;
}
.proj-item:hover .proj-item-indicator {
  background: rgba(0, 229, 255, 0.38);
}
.proj-item.active .proj-item-indicator {
  background: var(--cyan);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}
.proj-item-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.proj-item-name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: #7aaac0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.proj-item:hover .proj-item-name,
.proj-item.active .proj-item-name {
  color: #e0f4ff;
}
.proj-item-rec {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: rgba(0, 229, 255, 0.22);
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 2px;
  padding: 1px 5px;
}
.proj-item.active .proj-item-rec {
  color: rgba(0, 229, 255, 0.5);
  border-color: rgba(0, 229, 255, 0.2);
}
.proj-item-check {
  color: var(--cyan);
  display: flex;
  filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.55));
}
.proj-item-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 229, 255, 0.05) 50%,
    transparent 100%
  );
}
.proj-item:hover .proj-item-scan {
  animation: itemScan 0.5s ease-out forwards;
}
@keyframes itemScan {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

.proj-panel-up-enter-active {
  animation: panelUpIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.proj-panel-up-leave-active {
  animation: panelUpOut 0.2s ease-in forwards;
}
@keyframes panelUpIn {
  from {
    opacity: 0;
    transform: scaleY(0.88) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}
@keyframes panelUpOut {
  from {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scaleY(0.9) translateY(4px);
  }
}

.exec-divider {
  width: 1px;
  height: 50px;
  background: rgba(0, 229, 255, 0.2);
  align-self: center;
}

/* FIX: 为操作区设立固定宽度盒子，无论中止按钮是否出现，盒子占地雷打不动 */
.exec-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 320px;
}

.action-btn {
  font-family: var(--font-mono) !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
}

/* FIX: 为两个按钮强制写死尺寸与内边距，配合上面的320px安全占位 */
.giant-btn {
  width: 210px !important;
  padding: 0 !important;
  height: 42px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  background: linear-gradient(
    135deg,
    rgba(0, 229, 255, 0.15),
    rgba(0, 229, 255, 0.08)
  ) !important;
  border: 1px solid rgba(0, 229, 255, 0.4) !important;
  color: var(--cyan) !important;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.1) !important;
}

.giant-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(0, 229, 255, 0.25),
    rgba(0, 229, 255, 0.12)
  ) !important;
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.2) !important;
  transform: translateY(-1px);
}
.giant-btn.is-loading,
.giant-btn.is-disabled {
  background: rgba(0, 229, 255, 0.05) !important;
  border: 1px dashed rgba(0, 229, 255, 0.4) !important;
  color: var(--cyan) !important;
  opacity: 0.9 !important;
  box-shadow: inset 0 0 16px rgba(0, 229, 255, 0.05) !important;
}
.giant-btn.is-loading span {
  animation: textPulse 1.5s ease-in-out infinite;
}
@keyframes textPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
    text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
  }
}

/* 🌟 修改：中止按钮重构为暗红色危险警示风格 */
.giant-btn-stop {
  width: 98px !important;
  padding: 0 !important;
  height: 42px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  background: rgba(255, 71, 87, 0.08) !important;
  border: 1px solid rgba(255, 71, 87, 0.4) !important;
  color: #ff4757 !important;
  box-shadow: 0 0 12px rgba(255, 71, 87, 0.1) !important;
  transition: all 0.3s;
}
.giant-btn-stop:hover {
  background: rgba(255, 71, 87, 0.15) !important;
  border-color: #ff4757 !important;
  color: #fff !important;
  box-shadow: 0 0 20px rgba(255, 71, 87, 0.3) !important;
}
.giant-btn-stop {
  width: 98px !important;
  padding: 0 !important;
  height: 42px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

.action-progress {
  margin-top: 20px;
}
.progress-bar {
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 229, 255, 0.1);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
  transition: width 0.3s ease;
}
.progress-text {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(0, 229, 255, 0.5);
  margin-top: 6px;
  display: block;
  text-align: center;
  letter-spacing: 1px;
}

/* ========== Hint Bar ========== */
.form-hint-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 4px;
  border-top: 1px solid rgba(0, 229, 255, 0.06);
  margin-top: 24px;
}
.hint-seg {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(0, 229, 255, 0.3);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.hint-seg kbd {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 3px;
  padding: 1px 5px;
  color: rgba(0, 229, 255, 0.5);
}
</style>
