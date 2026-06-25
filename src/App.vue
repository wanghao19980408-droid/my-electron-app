<template>
  <div id="app">
    <div class="bg-canvas" />
    <div class="grid-overlay" />
    <div class="scan-line" />

    <transition name="fade-slide" mode="out-in" v-if="isLoginPage">
      <router-view />
    </transition>

    <div class="app-workspace" v-else>
      <transition name="boot-fade">
        <div class="system-boot-overlay" v-if="isBooting">
          <div class="sbo-core">
            <div class="sbo-ring">
              <svg viewBox="0 0 100 100" class="sbo-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(0,229,255,0.2)"
                  stroke-width="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#00e5ff"
                  stroke-width="2"
                  stroke-dasharray="80 200"
                  stroke-linecap="round"
                  class="sbo-svg-arc"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(57,255,20,0.3)"
                  stroke-width="1"
                  stroke-dasharray="10 10"
                />
              </svg>
            </div>
            <div class="sbo-text">{{ $t("app.boot.sysOnline") }}</div>
            <div class="sbo-sub">{{ $t("app.boot.initializing") }}</div>
            <div class="sbo-bar"><div class="sbo-progress"></div></div>
          </div>
        </div>
      </transition>

      <el-container
        class="main-container"
        :class="{ 'is-booting': isBooting, 'is-maximized-fix': isMaximized }"
      >
        <el-header class="app-header" height="60px">
          <div class="logo-area">
            <div class="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" width="28" height="28">
                <circle
                  cx="14"
                  cy="22"
                  r="9"
                  stroke="#00e5ff"
                  stroke-width="1.1"
                  fill="none"
                  opacity="0.9"
                />
                <ellipse
                  cx="14"
                  cy="22"
                  rx="9"
                  ry="4"
                  stroke="#00e5ff"
                  stroke-width="0.7"
                  fill="none"
                  opacity="0.35"
                />
                <line
                  x1="5"
                  y1="22"
                  x2="23"
                  y2="22"
                  stroke="#00e5ff"
                  stroke-width="0.7"
                  opacity="0.35"
                />
                <line
                  x1="14"
                  y1="13"
                  x2="14"
                  y2="31"
                  stroke="#00e5ff"
                  stroke-width="0.7"
                  opacity="0.35"
                />
                <path
                  d="M5.5 17.5 Q14 13.5 22.5 17.5"
                  stroke="#00e5ff"
                  stroke-width="0.6"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M5.5 26.5 Q14 30.5 22.5 26.5"
                  stroke="#00e5ff"
                  stroke-width="0.6"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M22 12 Q26 6 30 3"
                  stroke="#39ff14"
                  stroke-width="1.3"
                  fill="none"
                  stroke-linecap="round"
                  stroke-dasharray="2 2"
                  opacity="0.85"
                />
                <g transform="translate(28.5,4.5) rotate(-42)">
                  <path
                    d="M0,-4 C0.8,-4 1.6,-2.5 1.6,0 C1.6,2.5 0.8,3.5 0,4 C-0.8,3.5 -1.6,2.5 -1.6,0 C-1.6,-2.5 -0.8,-4 0,-4 Z"
                    fill="rgba(0,229,255,0.15)"
                    stroke="#00e5ff"
                    stroke-width="0.9"
                  />
                  <rect
                    x="-0.8"
                    y="1.5"
                    width="1.6"
                    height="2"
                    rx="0.3"
                    fill="#00e5ff"
                    opacity="0.6"
                  />
                  <path
                    d="M-1.6,2 L-2.8,4.5 L0,3.5 L2.8,4.5 L1.6,2 Z"
                    fill="rgba(57,255,20,0.5)"
                    stroke="#39ff14"
                    stroke-width="0.5"
                  />
                </g>
                <circle cx="22" cy="12" r="1.2" fill="#39ff14" opacity="0.9">
                  <animate
                    attributeName="opacity"
                    values="0.9;0.2;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
            <div class="logo-en">{{ $t("header.title") }}</div>
          </div>

          <div class="header-actions">
            <div class="lang-toggle">
              <button
                class="lang-btn"
                :class="{ active: currentLang === 'zh' }"
                @click="switchLanguage('zh')"
              >
                中
              </button>
              <span class="lang-sep" />
              <button
                class="lang-btn"
                :class="{ active: currentLang === 'en' }"
                @click="switchLanguage('en')"
              >
                EN
              </button>
            </div>

            <div class="win-controls">
              <button
                class="wc logout"
                @click="handleLogout"
                :title="$t('header.logout')"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
              <button class="wc" @click="winMinimize">
                <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                  <line
                    x1="0"
                    y1="1"
                    x2="12"
                    y2="1"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
              <button class="wc" @click="winMaximize">
                <svg
                  v-if="!isMaximized"
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                >
                  <rect
                    x="0.75"
                    y="0.75"
                    width="9.5"
                    height="9.5"
                    rx="1.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                </svg>
                <svg
                  v-else
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                >
                  <rect
                    x="2"
                    y="0.75"
                    width="8.25"
                    height="8.25"
                    rx="1.2"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M0.75 3.5V2.5A1.75 1.75 0 0 1 2.5 0.75H3.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
              <button class="wc close" @click="winClose">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <line
                    x1="1"
                    y1="1"
                    x2="10"
                    y2="10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <line
                    x1="10"
                    y1="1"
                    x2="1"
                    y2="10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </el-header>

        <el-container class="body-container">
          <el-aside :width="sidebarWidth" class="app-sidebar">
            <div class="nav-label">{{ $t("sidebar.navigation") }}</div>
            <el-menu
              :default-active="$route.path"
              router
              background-color="transparent"
              text-color="#5a7a8a"
              active-text-color="#00e5ff"
              class="nav-menu"
            >
              <el-menu-item index="/project">
                <svg
                  slot="title"
                  class="nav-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
                  <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
                  <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
                  <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
                </svg>
                <span slot="title">{{ $t("nav.project") }}</span>
              </el-menu-item>

              <el-menu-item index="/ballistic-analysis">
                <svg
                  slot="title"
                  class="nav-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="1.5 12.5 4.5 7 7.5 9.5 10.5 3.5 14.5 8" />
                  <line x1="1.5" y1="14.5" x2="14.5" y2="14.5" />
                </svg>
                <span slot="title">{{
                  $t("nav.ballistic") || "弹道分析"
                }}</span>
              </el-menu-item>
              <!-- <el-menu-item index="/cesium-test">
                <svg
                  slot="title"
                  class="nav-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="8" cy="8" r="6.5" />
                  <ellipse cx="8" cy="8" rx="2.5" ry="6.5" />
                  <line x1="1.5" y1="8" x2="14.5" y2="8" />
                </svg>
                <span slot="title">{{ $t("nav.results") }}</span>
              </el-menu-item> -->
              <el-menu-item index="/parameters">
                <svg
                  slot="title"
                  class="nav-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                >
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                  <circle
                    cx="5"
                    cy="4"
                    r="1.6"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="10"
                    cy="8"
                    r="1.6"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="6"
                    cy="12"
                    r="1.6"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                <span slot="title">{{ $t("nav.params") }}</span>
              </el-menu-item>
            </el-menu>

            <div class="hw-monitor">
              <div class="hw-row" v-for="item in hwRows" :key="item.label">
                <div class="hw-label">{{ item.label }}</div>
                <div class="hw-bar-wrap">
                  <div
                    class="hw-bar"
                    :class="item.cls"
                    :style="{ width: item.val + '%' }"
                  />
                </div>
                <div class="hw-val">
                  {{ item.val }}<span class="hw-unit">%</span>
                </div>
              </div>
              <div class="hw-status">
                <div class="header-center">
                  <span class="sys-time">{{ currentTime }}</span>
                </div>
              </div>
            </div>
          </el-aside>

          <el-main class="app-main">
            <transition name="fade-slide" mode="out-in">
              <keep-alive><router-view /></keep-alive>
            </transition>

            <transition name="hud-fade">
              <div
                class="opt-hud-container"
                :style="hudContainerStyle"
                v-show="
                  !isDetailOpen &&
                  ((isSimulating && optProgress) || simCompleted)
                "
              >
                <div class="opt-hud" v-show="!hudCollapsed">
                  <div class="hud-header">
                    <div style="display: flex; align-items: center; gap: 10px">
                      <span class="hud-blink" :class="{ done: simCompleted }" />
                      <span>{{
                        simCompleted ? $t("app.completed") : $t("app.searching")
                      }}</span>
                    </div>
                    <button
                      class="hud-toggle-btn"
                      @click.stop="hudCollapsed = true"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        otia
                        <polyline points="4 14 12 22 20 14"></polyline>
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                      </svg>
                    </button>
                  </div>

                  <div class="hud-body" v-if="!simCompleted && optProgress">
                    <div class="hud-section">
                      <div class="hud-section-label">{{ $t("app.input") }}</div>
                      <div class="hud-param-grid">
                        <div
                          class="hud-param-cell"
                          v-for="(item, i) in hudInputParams"
                          :key="'in' + i"
                        >
                          <div class="hud-pcell-label">{{ item.label }}</div>
                          <div class="hud-pcell-val">
                            {{ item.val
                            }}<span v-if="item.unit" class="hud-pcell-unit">{{
                              item.unit
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="hud-section">
                      <div class="hud-section-label">
                        {{ $t("app.output") }}
                      </div>
                      <div class="hud-param-grid out">
                        <div
                          class="hud-param-cell out"
                          v-for="(item, i) in hudOutputParams"
                          :key="'out' + i"
                        >
                          <div class="hud-pcell-label">{{ item.label }}</div>
                          <div class="hud-pcell-val out">
                            {{ item.val
                            }}<span v-if="item.unit" class="hud-pcell-unit">{{
                              item.unit
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="hud-done" v-if="simCompleted">
                    <span class="done-ico">✓</span>
                    <span>{{ $t("app.simDone") }}</span>
                  </div>
                </div>

                <div
                  class="hud-earth"
                  :class="{ dragging: isDragging }"
                  v-show="hudCollapsed"
                  @mousedown.stop="onEarthMouseDown"
                >
                  <div class="earth-core" :class="{ done: simCompleted }">
                    <svg
                      viewBox="0 0 24 24"
                      width="100%"
                      height="100%"
                      stroke="currentColor"
                      stroke-width="1.5"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path
                        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                      ></path>
                    </svg>
                  </div>
                  <div class="earth-halo" :class="{ done: simCompleted }"></div>
                </div>
              </div>
            </transition>
          </el-main>
        </el-container>
      </el-container>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

const EARTH_SIZE = 44;
const EARTH_MARGIN = 8;
const PANEL_WIDTH = 640;
const VIEWPORT_MARGIN = 16;

export default {
  data: () => ({
    currentLang: "",
    currentTime: "--:--:--",
    memUsage: "--",
    cpuUsage: "--",
    isMaximized: false,
    hudCollapsed: false,
    simCompleted: false,
    timer: null,
    hwTimer: null,
    isBooting: false,
    // 小地球拖拽
    earthPos: null, // { x, y }；null 表示使用默认右下位置
    isDragging: false,
  }),

  computed: {
    ...mapState([
      "isSimulating",
      "optProgress",
      "isDetailOpen",
      "activeProjectId",
      "projects",
    ]),

    isLoginPage() {
      return this.$route.path === "/login";
    },
    sidebarWidth() {
      return this.currentLang === "zh" ? "196px" : "232px";
    },
    hwRows() {
      return [
        { label: "CPU", val: this.cpuUsage, cls: "" },
        { label: this.$t("sidebar.mem"), val: this.memUsage, cls: "mem" },
      ];
    },

    currentOptType() {
      return this.$store.state.runningOptType || 1;
    },

    hudInputParams() {
      if (!this.optProgress?.input) return [];
      const inp = this.optProgress.input;
      const isType1 = this.currentOptType === 1;
      const fmt = (v) =>
        v !== undefined ? parseFloat(Number(v).toFixed(6)) : "—";
      const list = [];
      list.push({
        label: this.$t("project.optParams.launchAzimuth"),
        unit: "°",
        val: fmt(inp[0]),
      });
      list.push({
        label: isType1
          ? this.$t("params.labels.load")
          : this.$t("params.labels.initTime"),
        unit: isType1 ? "kg" : "s",
        val: fmt(inp[1]),
      });
      list.push({
        label: this.$t("project.optParams.maxNegAttackAngle"),
        unit: "°",
        val: fmt(inp[2]),
      });
      for (let i = 3; i < (inp.length || 0); i++) {
        list.push({
          label: `${this.$t("project.optParams.pitchProgramSlope")} ${i - 2}`,
          unit: "",
          val: fmt(inp[i]),
        });
      }
      return list;
    },

    hudOutputParams() {
      if (!this.optProgress?.output) return [];
      const out = this.optProgress.output;
      const fmt = (v) =>
        v !== undefined ? parseFloat(Number(v).toFixed(6)) : "—";
      return [
        {
          label: this.$t("params.labels.trackRadius"),
          unit: "m",
          val: fmt(out[0]),
        },
        { label: this.$t("params.labels.ecc"), unit: "", val: fmt(out[1]) },
        {
          label: this.$t("params.labels.trackInc"),
          unit: "°",
          val: fmt(out[2]),
        },
      ];
    },

    // 根据小地球位置计算 HUD 容器定位样式
    hudContainerStyle() {
      if (!this.earthPos) return {}; // 未拖动：用默认 CSS（右下角）
      const { x, y } = this.earthPos;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (this.hudCollapsed) {
        // 折叠态：容器就是地球本身，按 left/top 定位
        return {
          left: `${x}px`,
          top: `${y}px`,
          right: "auto",
          bottom: "auto",
        };
      }

      // 展开态：面板以地球所在象限为锚点向相反方向延伸，保证不出屏
      const centerX = x + EARTH_SIZE / 2;
      const centerY = y + EARTH_SIZE / 2;
      const isLeft = centerX < vw / 2;
      const isTop = centerY < vh / 2;

      const style = {
        left: "auto",
        right: "auto",
        top: "auto",
        bottom: "auto",
      };

      if (isLeft) {
        let left = x;
        const maxLeft = vw - PANEL_WIDTH - VIEWPORT_MARGIN;
        left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));
        style.left = `${left}px`;
      } else {
        let right = vw - (x + EARTH_SIZE);
        const maxRight = vw - PANEL_WIDTH - VIEWPORT_MARGIN;
        right = Math.max(VIEWPORT_MARGIN, Math.min(right, maxRight));
        style.right = `${right}px`;
      }

      if (isTop) {
        style.top = `${Math.max(VIEWPORT_MARGIN, y)}px`;
      } else {
        style.bottom = `${Math.max(VIEWPORT_MARGIN, vh - (y + EARTH_SIZE))}px`;
      }

      return style;
    },
  },

  watch: {
    $route(to, from) {
      if (from.path === "/login" && to.path !== "/login") {
        this.isBooting = true;
        setTimeout(() => {
          this.isBooting = false;
        }, 2200);
      }
    },

    isSimulating(newVal, oldVal) {
      if (newVal) {
        this.hudCollapsed = false;
        this.simCompleted = false;
        if (this.completedTimer) {
          clearTimeout(this.completedTimer);
          this.completedTimer = null;
        }
      } else if (oldVal && !newVal) {
        if (this.optProgress && !this.isDetailOpen) {
          this.simCompleted = true;
          this.completedTimer = setTimeout(() => {
            this.simCompleted = false;
            this.completedTimer = null;
          }, 3000);
        }
      }
    },
  },

  async mounted() {
    this.currentLang = this.$store.state.language;
    if (window.electronAPI) {
      await this.$store.dispatch("INIT_DATA");
      window.electronAPI.onSimulationUpdate((data) =>
        this.$store.commit("SET_OPT_PROGRESS", data),
      );
    }
    this.timer = setInterval(() => {
      this.currentTime = new Date().toTimeString().split(" ")[0];
    }, 1000);
    this.hwTimer = window.electronAPI
      ? setInterval(this.updateHW, 3000)
      : (() => {
          this.memUsage = this.cpuUsage = "N/A";
        })();
    if (window.electronAPI) this.updateHW();

    window.addEventListener("resize", this.clampEarthPos);
  },

  beforeDestroy() {
    clearInterval(this.timer);
    clearInterval(this.hwTimer);
    if (this.completedTimer) clearTimeout(this.completedTimer);
    window.electronAPI?.removeSimulationUpdate?.();
    window.removeEventListener("resize", this.clampEarthPos);
    window.removeEventListener("mousemove", this.onEarthMouseMove);
    window.removeEventListener("mouseup", this.onEarthMouseUp);
  },

  methods: {
    switchLanguage(lang) {
      if (this.currentLang === lang) return;
      this.currentLang = lang;
      this.$store.commit("SET_LANGUAGE", lang);
      this.$i18n.locale = lang;
    },

    handleLogout() {
      this.$confirm(
        this.$t("header.logoutConfirmMsg"),
        this.$t("header.logoutTitle"),
        {
          confirmButtonText: this.$t("common.confirm"),
          cancelButtonText: this.$t("common.cancel"),
          type: "warning",
          customClass: "hud-confirm-box",
        },
      )
        .then(async () => {
          this.$store.commit("SET_LOGGED_IN", { status: false });
          this.isMaximized = false;
          if (window.electronAPI && window.electronAPI.setSize) {
            await window.electronAPI.setSize(480, 640, false);
          }
          this.$router.replace("/login");
        })
        .catch(() => false);
    },

    async updateHW() {
      try {
        const [mem, cpu] = await Promise.all([
          window.electronAPI.getMemory(),
          window.electronAPI.getCPU(),
        ]);
        this.memUsage = mem;
        this.cpuUsage = cpu;
      } catch (err) {
        console.warn("HW update bypassed");
      }
    },

    winMinimize() {
      window.electronAPI?.minimize();
    },
    async winMaximize() {
      if (window.electronAPI)
        this.isMaximized = await window.electronAPI.maximize();
    },
    winClose() {
      this.$confirm(this.$t("header.exitMsg"), this.$t("header.exitTitle"), {
        confirmButtonText: this.$t("header.exitConfirm"),
        cancelButtonText: this.$t("header.exitCancel"),
        type: "warning",
        customClass: "hud-confirm-box",
      })
        .then(() => window.electronAPI?.close())
        .catch(() => false);
    },

    // ── 小地球拖拽 ──
    onEarthMouseDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      const defaultX = window.innerWidth - 32 - EARTH_SIZE;
      const defaultY = window.innerHeight - 32 - EARTH_SIZE;
      const startX = this.earthPos ? this.earthPos.x : defaultX;
      const startY = this.earthPos ? this.earthPos.y : defaultY;
      this._dragState = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX,
        startY,
        moved: false,
      };
      window.addEventListener("mousemove", this.onEarthMouseMove);
      window.addEventListener("mouseup", this.onEarthMouseUp);
    },

    onEarthMouseMove(e) {
      const s = this._dragState;
      if (!s) return;
      const dx = e.clientX - s.startMouseX;
      const dy = e.clientY - s.startMouseY;
      if (!s.moved && Math.hypot(dx, dy) > 4) {
        s.moved = true;
        this.isDragging = true;
      }
      if (s.moved) {
        const maxX = window.innerWidth - EARTH_SIZE - EARTH_MARGIN;
        const maxY = window.innerHeight - EARTH_SIZE - EARTH_MARGIN;
        this.earthPos = {
          x: Math.max(EARTH_MARGIN, Math.min(maxX, s.startX + dx)),
          y: Math.max(EARTH_MARGIN, Math.min(maxY, s.startY + dy)),
        };
      }
    },

    onEarthMouseUp() {
      const s = this._dragState;
      window.removeEventListener("mousemove", this.onEarthMouseMove);
      window.removeEventListener("mouseup", this.onEarthMouseUp);
      this._dragState = null;
      this.isDragging = false;
      // 未拖动视为点击 → 在当前位置展开
      if (s && !s.moved) {
        this.hudCollapsed = false;
      }
    },

    clampEarthPos() {
      if (!this.earthPos) return;
      const maxX = window.innerWidth - EARTH_SIZE - EARTH_MARGIN;
      const maxY = window.innerHeight - EARTH_SIZE - EARTH_MARGIN;
      this.earthPos = {
        x: Math.max(EARTH_MARGIN, Math.min(maxX, this.earthPos.x)),
        y: Math.max(EARTH_MARGIN, Math.min(maxY, this.earthPos.y)),
      };
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@300;400;500&display=swap");

:root {
  --cyan: #00e5ff;
  --cyan-dim: rgba(0, 229, 255, 0.1);
  --cyan-glow: rgba(0, 229, 255, 0.35);
  --green: #39ff14;
  --green-dim: rgba(57, 255, 20, 0.08);
  --amber: #ffb300;
  --red: #ff3d57;
  --bg: #030a12;
  --panel: rgba(6, 18, 36, 0.92);
  --panel-border: rgba(0, 229, 255, 0.14);
  --text: #c0dce8;
  --text-dim: #4a6a80;
  --text-muted: #2e4a5a;
  --font-hud: "Orbitron", monospace;
  --font-mono: "Space Mono", monospace;
  --font-cn: "Noto Sans SC", sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-cn);
  user-select: none;
}
#app,
.main-container {
  height: 100vh;
  overflow: hidden;
  background: transparent;
}
.app-workspace {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* ── Boot overlay ── */
.system-boot-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(3, 10, 18, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}
.sbo-core {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sbo-ring {
  width: 100px;
  height: 100px;
  margin-bottom: 24px;
  position: relative;
}
.sbo-svg {
  width: 100%;
  height: 100%;
  animation: sboSpin 3s linear infinite;
}
.sbo-svg-arc {
  animation: sboPulse 1.5s ease-in-out infinite alternate;
}
@keyframes sboSpin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes sboPulse {
  from {
    stroke-dasharray: 40 240;
    stroke-width: 2;
  }
  to {
    stroke-dasharray: 120 160;
    stroke-width: 4;
  }
}
.sbo-text {
  font-family: var(--font-hud);
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 10px;
  text-shadow: 0 0 10px var(--cyan), 0 0 20px var(--cyan),
    0 0 40px var(--cyan-glow);
  margin-bottom: 12px;
  animation: sboFlicker 0.15s infinite alternate;
}
@keyframes sboFlicker {
  0% {
    opacity: 0.9;
  }
  100% {
    opacity: 1;
  }
}
.sbo-sub {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cyan);
  letter-spacing: 4px;
  margin-bottom: 32px;
  opacity: 0.8;
}
.sbo-bar {
  width: 280px;
  height: 3px;
  background: rgba(0, 229, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.sbo-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan);
  animation: sboFill 1.8s cubic-bezier(0.785, 0.135, 0.15, 0.86) forwards;
}
@keyframes sboFill {
  0% {
    width: 0;
  }
  30% {
    width: 45%;
  }
  60% {
    width: 60%;
  }
  100% {
    width: 100%;
  }
}
.boot-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.boot-fade-leave-to {
  opacity: 0;
  transform: scale(1.12);
}

.main-container {
  transition: filter 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center center;
}
.main-container.is-booting {
  filter: blur(14px) brightness(0.4);
  transform: scale(0.95);
  pointer-events: none;
}
.main-container.is-maximized-fix {
  margin-top: 1px;
  height: calc(100vh - 1px);
}

/* ── Background ── */
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
      ellipse 55% 35% at 50% 0%,
      rgba(0, 100, 180, 0.12) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 35% 55% at 100% 100%,
      rgba(0, 229, 255, 0.05) 0%,
      transparent 60%
    ),
    #030a12;
}
.grid-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(
      rgba(0, 229, 255, 0.025) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(0, 229, 255, 0.025) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: gridShift 28s linear infinite;
}
@keyframes gridShift {
  to {
    transform: translateY(44px);
  }
}
.scan-line {
  position: fixed;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 229, 255, 0.25) 50%,
    transparent 100%
  );
  animation: scan 10s linear infinite;
}
@keyframes scan {
  from {
    top: -2px;
    opacity: 0.6;
  }
  to {
    top: 100vh;
    opacity: 0;
  }
}

/* ── Header ── */
.app-header {
  position: relative;
  z-index: 10;
  background: rgba(3, 8, 18, 0.97) !important;
  border-bottom: 1px solid var(--panel-border);
  backdrop-filter: blur(20px);
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px !important;
  -webkit-app-region: drag;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 11px;
  -webkit-app-region: no-drag;
}
.logo-icon {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.04);
  overflow: hidden;
  flex-shrink: 0;
  animation: iconPulse 4s ease-in-out infinite;
}
@keyframes iconPulse {
  0%,
  100% {
    box-shadow: 0 0 6px var(--cyan-glow);
    border-color: rgba(0, 229, 255, 0.25);
  }
  50% {
    box-shadow: 0 0 14px var(--cyan-glow), inset 0 0 8px var(--cyan-dim);
    border-color: rgba(0, 229, 255, 0.5);
  }
}
.logo-en {
  font-family: var(--font-hud);
  font-size: 15px;
  color: #90bcd4;
  letter-spacing: 3.5px;
  font-weight: 800;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9);
  white-space: nowrap;
}
.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 12px;
  color: #6a94a8;
  font-weight: 100;
  pointer-events: none;
  white-space: nowrap;
}
.sys-time {
  letter-spacing: 2px;
  padding: 5px 0 0 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.lang-toggle {
  display: flex;
  align-items: center;
  background: rgba(0, 6, 14, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 5px;
  overflow: hidden;
}
.lang-btn {
  font-family: var(--font-hud);
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 700;
  padding: 5px 12px;
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s;
}
.lang-btn.active {
  background: var(--cyan-dim);
  color: var(--cyan);
}
.lang-sep {
  width: 1px;
  height: 20px;
  background: rgba(0, 229, 255, 0.18);
}

.win-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 14px;
  padding-left: 14px;
  border-left: 1px solid rgba(0, 229, 255, 0.14);
}
.wc {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: var(--text-dim);
  transition: background 0.15s, color 0.15s;
}
.wc:hover {
  background: rgba(0, 229, 255, 0.08);
  color: var(--cyan);
}
.wc.logout:hover {
  background: rgba(255, 179, 0, 0.12);
  color: var(--amber);
}
.wc.close:hover {
  background: rgba(255, 61, 87, 0.12);
  color: var(--red);
}

/* ── Sidebar ── */
.body-container {
  position: relative;
  z-index: 1;
}
.app-sidebar {
  background: rgba(3, 8, 18, 0.8) !important;
  border-right: 1px solid var(--panel-border) !important;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
}
.nav-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 3px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 18px 16px 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}
.nav-menu {
  border-right: none !important;
  background: transparent !important;
  flex: 1;
  padding: 4px 10px !important;
}
.nav-menu .el-menu-item {
  font-family: var(--font-cn);
  font-size: 13px;
  font-weight: 500;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 6px;
  margin-bottom: 2px;
  padding: 0 12px !important;
  transition: background 0.15s, color 0.15s;
}
.nav-menu .el-menu-item:hover {
  background: rgba(0, 229, 255, 0.06) !important;
  color: #a0cce0 !important;
}
.nav-menu .el-menu-item.is-active {
  color: var(--cyan) !important;
  background: rgba(0, 229, 255, 0.1) !important;
  border-left: 2px solid var(--cyan);
  padding-left: 10px !important;
}
.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: block;
}

/* ── HW monitor ── */
.hw-monitor {
  padding: 12px 14px 16px;
  border-top: 1px solid rgba(0, 229, 255, 0.1);
  font-family: var(--font-mono);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hw-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hw-label {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1px;
  min-width: 28px;
}
.hw-bar-wrap {
  flex: 1;
  height: 3px;
  background: rgba(0, 229, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.hw-bar {
  height: 100%;
  background: var(--cyan);
  border-radius: 2px;
  transition: width 0.6s;
  max-width: 100%;
}
.hw-bar.mem {
  background: var(--amber);
}
.hw-val {
  font-size: 11px;
  color: var(--text);
  min-width: 30px;
  text-align: right;
}
.hw-unit {
  font-size: 9px;
  color: var(--text-dim);
  margin-left: 1px;
}
.hw-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 1.5px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 229, 255, 0.07);
}

/* ── Main area ── */
.app-main {
  position: relative;
  padding: 20px 24px;
  background: transparent;
  overflow-y: auto;
}
.app-main::-webkit-scrollbar {
  width: 3px;
}
.app-main::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.15);
  border-radius: 2px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s;
}
.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

/* ── Optimization HUD ── */
.opt-hud-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.opt-hud {
  width: 640px;
  background: rgba(2, 6, 14, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0, 229, 255, 0.15);
  backdrop-filter: blur(8px);
  overflow: hidden;
}
.hud-header {
  background: rgba(0, 229, 255, 0.08);
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--cyan);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
}
.hud-toggle-btn {
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: var(--cyan);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s;
}
.hud-toggle-btn:hover {
  background: rgba(0, 229, 255, 0.3);
  color: #fff;
}
.hud-blink {
  width: 6px;
  height: 6px;
  background: var(--cyan);
  box-shadow: 0 0 6px var(--cyan);
  flex-shrink: 0;
  animation: blink 1s step-end infinite;
}
.hud-blink.done {
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: none;
}
@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

.hud-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hud-section-label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 3px;
  color: #8ab8cc;
  font-weight: 700;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  padding-bottom: 6px;
  margin-bottom: 10px;
}
.hud-param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
}
.hud-param-grid.out {
  grid-template-columns: repeat(3, 1fr) !important;
}
.hud-param-cell {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 4px;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.hud-param-cell.out {
  border-color: rgba(57, 255, 20, 0.18);
  background: rgba(57, 255, 20, 0.03);
}
.hud-pcell-label {
  font-family: var(--font-cn);
  font-size: 11px;
  color: #a0c8e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hud-pcell-val {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--cyan);
  white-space: nowrap;
}
.hud-pcell-val.out {
  color: var(--green);
}
.hud-pcell-unit {
  font-size: 10px;
  color: #6a9ab5;
  margin-left: 3px;
}
.hud-done {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--green);
}
.done-ico {
  font-size: 18px;
  text-shadow: 0 0 8px var(--green);
}

/* ── 小地球（可拖拽） ── */
.hud-earth {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(2, 6, 14, 0.95);
  border: 1px solid var(--cyan);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: grab;
  transition: box-shadow 0.3s, transform 0.3s;
  user-select: none;
  -webkit-app-region: no-drag;
}
.hud-earth:hover {
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  transform: scale(1.08);
}
.hud-earth:active {
  cursor: grabbing;
}
.hud-earth.dragging {
  cursor: grabbing;
  transition: none;
  transform: scale(1.12);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.7);
}
.earth-core {
  width: 24px;
  height: 24px;
  color: var(--cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: earthSpin 10s linear infinite;
  filter: drop-shadow(0 0 4px var(--cyan));
  pointer-events: none;
}
.earth-core.done {
  color: var(--green);
  filter: drop-shadow(0 0 4px var(--green));
  animation: none;
}
@keyframes earthSpin {
  to {
    transform: rotate(360deg);
  }
}
.earth-halo {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px dashed rgba(0, 229, 255, 0.4);
  animation: haloSpin 6s linear reverse infinite;
  pointer-events: none;
}
.earth-halo.done {
  border-color: rgba(57, 255, 20, 0.6);
}
@keyframes haloSpin {
  to {
    transform: rotate(360deg);
  }
}

.hud-fade-enter-active,
.hud-fade-leave-active {
  transition: all 0.25s;
}
.hud-fade-enter,
.hud-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}

.el-message {
  background: rgba(3, 10, 22, 0.97) !important;
  border: 1px solid var(--panel-border) !important;
  color: var(--text) !important;
  border-radius: 6px !important;
}
.hud-confirm-box {
  background: rgba(3, 8, 18, 0.98) !important;
  border: 1px solid rgba(0, 229, 255, 0.4) !important;
  backdrop-filter: blur(12px);
  border-radius: 8px !important;
}
.hud-confirm-box .el-message-box__title {
  color: var(--cyan) !important;
  font-family: var(--font-hud) !important;
  font-size: 14px !important;
}
.hud-confirm-box .el-message-box__content {
  color: var(--text) !important;
  font-family: var(--font-cn) !important;
}
.hud-confirm-box .el-button--primary {
  background: rgba(255, 61, 87, 0.12) !important;
  border-color: var(--red) !important;
  color: var(--red) !important;
}
.hud-confirm-box .el-button--default {
  background: transparent !important;
  border-color: rgba(0, 229, 255, 0.25) !important;
  color: var(--text-dim) !important;
}
</style>
