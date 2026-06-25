<template>
  <div class="cesium-page">
    <div ref="box" class="cesium-box"></div>

    <!-- 顶部状态条 -->
    <div class="top-bar" v-if="track">
      <div class="mission-badge">
        <span class="pulse-dot" :class="{ active: running }"></span>
        <span class="mission-label">{{
          meta?.mission || "TRAJECTORY SIM"
        }}</span>
      </div>
      <div class="time-display" v-if="sample">
        <span class="t-prefix">T+</span>
        <span class="t-value">{{ formatTime(sample.t) }}</span>
      </div>
    </div>

    <!-- 左侧控制 -->
    <div class="side-panel left">
      <div class="panel-glass">
        <button class="action-btn primary" :disabled="running" @click="runSim">
          <svg
            v-if="!running"
            class="btn-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            class="btn-icon spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
          <span>{{ running ? "运行中..." : "启动仿真" }}</span>
        </button>
        <button v-if="running" class="action-btn danger" @click="stopSim">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          <span>终止</span>
        </button>

        <!-- 视角 -->
        <div class="view-grid" v-if="track">
          <button
            class="view-btn"
            :class="{ active: currentView === 'global' }"
            @click="viewGlobal"
          >
            🌍 全局
          </button>
          <button
            class="view-btn"
            :class="{ active: currentView === 'rocket' }"
            @click="trackRocket"
          >
            🚀 跟踪
          </button>
          <button
            class="view-btn"
            :class="{ active: currentView === 'launch' }"
            @click="viewLaunchpad"
          >
            🗼 发射台
          </button>
          <button
            class="view-btn"
            :class="{ active: currentView === 'chase' }"
            @click="viewChase"
          >
            🎬 追踪
          </button>
        </div>
      </div>

      <div class="error-toast" v-if="errMsg">{{ errMsg }}</div>
    </div>

    <!-- 右侧遥测 -->
    <div class="side-panel right" v-if="sample">
      <div class="telemetry-glass">
        <div class="telemetry-title">TELEMETRY</div>
        <div class="telem-row">
          <span class="telem-label">ALT</span>
          <span class="telem-num alt">{{
            (sample.alt / 1000).toFixed(2)
          }}</span>
          <span class="telem-unit">km</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">VEL</span>
          <span class="telem-num vel">{{ sample.speed.toFixed(1) }}</span>
          <span class="telem-unit">m/s</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">LAT</span>
          <span class="telem-num">{{ sample.lat.toFixed(4) }}°</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">LON</span>
          <span class="telem-num">{{ sample.lon.toFixed(4) }}°</span>
        </div>
      </div>
    </div>

    <!-- 速度控制 -->
    <div class="speed-control" v-if="track">
      <button
        v-for="sp in speedOptions"
        :key="sp"
        class="speed-btn"
        :class="{ active: currentSpeed === sp }"
        @click="setSpeed(sp)"
      >
        {{ sp }}×
      </button>
    </div>
  </div>
</template>

<script>
import * as Cesium from "cesium";
// import { parseTrackBuffer } from "@/utils/parseTrack";

export default {
  name: "CesiumTrajectory",
  data() {
    return {
      viewer: null,
      track: null,
      meta: null,
      startJD: null,
      stopJD: null,
      rocket: null,
      allEntities: [],
      sample: null,
      running: false,
      errMsg: "",
      currentView: "global",
      currentSpeed: 10,
      speedOptions: [1, 5, 10, 25, 50, 100],
      tickCount: 0,
    };
  },
  mounted() {
    Cesium.Ion.defaultAccessToken = "";
    this.$nextTick(() => this.initViewer());
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.clock.onTick.removeEventListener(this.onTick);
      this.viewer.entities.removeAll();
      this.viewer.destroy();
      this.viewer = null;
    }
    this.track = null;
    this.sample = null;
    this.allEntities = [];
  },
  methods: {
    formatTime(t) {
      const m = Math.floor(t / 60);
      const s = (t % 60).toFixed(1);
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    },

    initViewer() {
      this.viewer = new Cesium.Viewer(this.$refs.box, {
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        imageryProvider: false,
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: true,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        requestRenderMode: true, // 按需渲染，大幅降低空闲GPU占用
        maximumRenderTimeChange: Infinity,
        contextOptions: {
          webgl: { alpha: false, antialias: true },
        },
      });

      const viewer = this.viewer;
      viewer._cesiumWidget._creditContainer.style.display = "none";
      viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
      viewer.clock.onTick.addEventListener(this.onTick);

      // 影像
      viewer.imageryLayers.removeAll();
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        maximumLevel: 18,
      });
      viewer.imageryLayers.addImageryProvider
        ? viewer.imageryLayers.addImageryProvider(provider)
        : viewer.imageryLayers.add(new Cesium.ImageryLayer(provider));

      const scene = viewer.scene;
      scene.backgroundColor = Cesium.Color.fromCssColorString("#020810");
      scene.globe.enableLighting = true;
      scene.fog.enabled = false; // 关闭雾效，减少GPU开销

      // 关闭后处理（bloom等），这是卡顿主因之一
      if (scene.postProcessStages) {
        scene.postProcessStages.bloom.enabled = false;
        scene.postProcessStages.fxaa.enabled = false;
      }

      // 不要高DPI，性能优先
      viewer.resolutionScale = 1.0;

      this.viewGlobal();
    },

    // ─── 视角 ───
    viewGlobal() {
      if (!this.viewer) return;
      this.currentView = "global";
      this.viewer.trackedEntity = undefined;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(100, 35, 12000000),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        duration: 1.5,
      });
    },

    trackRocket() {
      if (!this.rocket) return;
      this.currentView = "rocket";
      this.viewer.trackedEntity = this.rocket;
    },

    viewLaunchpad() {
      if (!this.meta?.launch) return;
      this.currentView = "launch";
      this.viewer.trackedEntity = undefined;
      const { lon, lat } = this.meta.launch;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          lon + 0.01,
          lat - 0.01,
          1800,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(30),
          pitch: Cesium.Math.toRadians(-25),
          roll: 0,
        },
        duration: 2,
      });
    },

    viewChase() {
      if (!this.rocket) return;
      this.currentView = "chase";
      this.viewer.trackedEntity = this.rocket;
      this.rocket.viewFrom = new Cesium.Cartesian3(-30000, -30000, 15000);
    },

    setSpeed(sp) {
      this.currentSpeed = sp;
      if (this.viewer) this.viewer.clock.multiplier = sp;
    },

    // ─── 仿真 ───
    async ensureProjectId() {
      const projects = await window.electronAPI.db.projects.getAll();
      if (projects?.length) return projects[0].id;
      const p = await window.electronAPI.db.projects.create({
        name: "Cesium 测试项目",
        desc: "弹道可视化验证",
        baseParams: {},
      });
      return p.id;
    },

    async runSim() {
      this.errMsg = "";
      this.running = true;
      try {
        const projectId = await this.ensureProjectId();
        const formData = this.buildDemoForm();

        const res = await window.electronAPI.ballistic.run({
          projectId,
          formData,
        });
        const buf = await window.electronAPI.ballistic.readTrack({
          recordId: res.id,
        });
        if (!buf) throw new Error("轨迹文件读取失败");

        this.meta = res.meta;
        // this.track = parseTrackBuffer(buf);

        this.clearEntities();
        this.buildTimeline();
        this.buildTrajectory();
        this.buildEventPins();

        this.viewLaunchpad();
        setTimeout(() => {
          if (this.running) this.trackRocket();
        }, 3500);
      } catch (e) {
        if (e !== "MANUAL_STOP") this.errMsg = String(e);
      } finally {
        this.running = false;
      }
    },

    async stopSim() {
      await window.electronAPI.ballistic.stop();
    },

    clearEntities() {
      this.allEntities.forEach((e) => this.viewer.entities.remove(e));
      this.allEntities = [];
      this.rocket = null;
      this.sample = null;
    },

    buildTimeline() {
      const tr = this.track;
      const t0 = tr.t(0);
      const t1 = tr.t(tr.pointCount - 1);
      this.startJD = Cesium.JulianDate.fromIso8601("2024-01-01T00:00:00Z");
      this.stopJD = Cesium.JulianDate.addSeconds(
        this.startJD,
        t1 - t0,
        new Cesium.JulianDate(),
      );
      const c = this.viewer.clock;
      c.startTime = this.startJD.clone();
      c.stopTime = this.stopJD.clone();
      c.currentTime = this.startJD.clone();
      c.multiplier = this.currentSpeed;
      c.shouldAnimate = true;
      this.viewer.timeline.zoomTo(this.startJD, this.stopJD);
    },

    // 替换 buildTrajectory 方法中火箭实体部分

    buildTrajectory() {
      const tr = this.track;
      const t0 = tr.t(0);
      const pos = new Cesium.SampledPositionProperty();
      pos.setInterpolationOptions({
        interpolationDegree: 3,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
      });

      const polyPositions = [];
      const step = Math.max(1, Math.floor(tr.pointCount / 500));

      for (let i = 0; i < tr.pointCount; i++) {
        const jd = Cesium.JulianDate.addSeconds(
          this.startJD,
          tr.t(i) - t0,
          new Cesium.JulianDate(),
        );
        const c = Cesium.Cartesian3.fromDegrees(
          tr.lon(i),
          tr.lat(i),
          tr.alt(i),
        );
        pos.addSample(jd, c);
        if (i % step === 0) polyPositions.push(c);
      }

      // 用 Canvas 画一个 2D 火箭图标
      const rocketImage = this.createRocketCanvas();

      this.rocket = this.viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({ start: this.startJD, stop: this.stopJD }),
        ]),
        position: pos,
        orientation: new Cesium.VelocityOrientationProperty(pos),
        billboard: {
          image: rocketImage,
          scale: 1.0,
          pixelOffset: new Cesium.Cartesian2(0, 0),
          alignedAxis: Cesium.Cartesian3.ZERO, // 始终面向相机
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 2.0, 5e6, 0.5),
          sizeInMeters: false,
        },
        path: {
          resolution: 1,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString("#ff6b35"),
          }),
          width: 4,
          leadTime: 0,
          trailTime: 40,
        },
      });
      this.allEntities.push(this.rocket);

      // 轨迹线
      this.allEntities.push(
        this.viewer.entities.add({
          polyline: {
            positions: polyPositions,
            width: 2,
            material: Cesium.Color.fromCssColorString("#90e0ef").withAlpha(0.7),
            arcType: Cesium.ArcType.NONE,
          },
        }),
      );
    },

    // 用 Canvas 绘制 2D 火箭
    createRocketCanvas() {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // 火箭主体
      ctx.beginPath();
      ctx.moveTo(32, 4); // 顶部尖端
      ctx.lineTo(40, 20); // 右肩
      ctx.lineTo(40, 48); // 右身
      ctx.lineTo(46, 56); // 右尾翼
      ctx.lineTo(40, 52); // 右尾翼内
      ctx.lineTo(40, 56);
      ctx.lineTo(24, 56);
      ctx.lineTo(24, 52);
      ctx.lineTo(18, 56); // 左尾翼
      ctx.lineTo(24, 48); // 左身
      ctx.lineTo(24, 20); // 左肩
      ctx.closePath();

      // 渐变填充
      const grad = ctx.createLinearGradient(24, 4, 40, 56);
      grad.addColorStop(0, "#e0f7fa");
      grad.addColorStop(0.4, "#b2ebf2");
      grad.addColorStop(1, "#006064");
      ctx.fillStyle = grad;
      ctx.fill();

      // 轮廓
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 窗口
      ctx.beginPath();
      ctx.arc(32, 22, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00e5ff";
      ctx.fill();
      ctx.strokeStyle = "#004d40";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 尾焰
      ctx.beginPath();
      ctx.moveTo(28, 56);
      ctx.lineTo(32, 64);
      ctx.lineTo(36, 56);
      ctx.closePath();
      const flameGrad = ctx.createLinearGradient(28, 56, 36, 64);
      flameGrad.addColorStop(0, "#ff6b35");
      flameGrad.addColorStop(1, "#ffeb3b");
      ctx.fillStyle = flameGrad;
      ctx.fill();

      return canvas;
    },
    buildEventPins() {
      if (!this.meta?.events) return;

      const nameMap = {
        liftoff: "起飞",
        apogee: "远地点",
        orbit_insertion: "入轨",
        "stage-1_separate": "一二级分离",
        "stage-2_fairing": "抛罩",
        "stage-2_separate": "星箭分离",
      };

      const colorMap = {
        liftoff: "#39ff14",
        apogee: "#00e5ff",
        orbit_insertion: "#ff3d57",
        "stage-1_separate": "#ff8c00",
        "stage-2_fairing": "#ffd166",
        "stage-2_separate": "#a855f7",
      };

      // 发射台
      if (this.meta.launch) {
        const { lon, lat } = this.meta.launch;
        this.allEntities.push(
          this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
            point: {
              pixelSize: 14,
              color: Cesium.Color.fromCssColorString("#39ff14"),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1e3, 1.5, 1e7, 0.8),
            },
            label: {
              text: "发射阵地",
              font: 'bold 14px "Microsoft YaHei", sans-serif',
              pixelOffset: new Cesium.Cartesian2(0, -24),
              fillColor: Cesium.Color.fromCssColorString("#39ff14"),
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.4),
            },
          }),
        );
      }

      // 事件点
      this.meta.events.forEach((ev) => {
        const label = nameMap[ev.name] || ev.name;
        const color = colorMap[ev.name] || "#ffffff";

        this.allEntities.push(
          this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(ev.lon, ev.lat, ev.alt),
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromCssColorString(color),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1e4, 1.2, 1e7, 0.5),
            },
            label: {
              text: `${label} T+${ev.time.toFixed(0)}s`,
              font: '12px "Microsoft YaHei", sans-serif',
              pixelOffset: new Cesium.Cartesian2(0, -20),
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 8e6, 0.3),
            },
          }),
        );
      });
    },

    // ─── Tick：节流到 ~5fps 更新 HUD ───
    onTick(clock) {
      this.tickCount++;

      // 按需渲染模式下主动请求下一帧
      if (this.viewer && clock.shouldAnimate) {
        this.viewer.scene.requestRender();
      }

      if (this.tickCount % 10 !== 0) return; // ~6fps HUD刷新
      if (!this.track) return;

      const tr = this.track;
      const elapsed = Cesium.JulianDate.secondsDifference(
        clock.currentTime,
        this.startJD,
      );
      const t = elapsed + tr.t(0);

      let lo = 0,
        hi = tr.pointCount - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (tr.t(mid) < t) lo = mid;
        else hi = mid;
      }

      if (!this.sample) {
        this.sample = { t: 0, lon: 0, lat: 0, alt: 0, speed: 0 };
      }
      this.sample.t = elapsed;
      this.sample.lon = tr.lon(lo);
      this.sample.lat = tr.lat(lo);
      this.sample.alt = tr.alt(lo);
      this.sample.speed = tr.speed(lo);
    },

    buildDemoForm() {
      return {
        earth: { lambda_0: 100.5, B_0: 41.1, A_0: 191.335, altitude: 994 },
        rocket: {
          stages: 2,
          d_max: 3.35,
          fairing: 1125,
          load: 1383.28,
          struct: [
            [11612.7, 156663.171],
            [3092.5, 29250.2425],
          ],
          engines: [
            [2840.909, 4, 637.5, 0.611, 2.5],
            [3428.169, 2, 121.7, 0.859, 2.5],
          ],
        },
        orbit: { height: 500e3, e: 0, i: 97.397 },
        type: 1,
        t_stages: [[170], [100, 300]],
        events: {
          "stage-1": { event: ["separate"], t_start: [170], duration: [1.2] },
          "stage-2": {
            event: ["fairing", "separate"],
            t_start: [10, 400],
            duration: [0, 3],
          },
        },
        A_0: 191.336955918,
        load_max: 1940.162348932,
        alpha_max: 0.2453223,
        phi_slope: [0.001009251, -0.225160683],
        t_minus: 6.188,
      };
    },
  },
};
</script>

<style scoped>
.cesium-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: #020810;
  overflow: hidden;
  font-family: "Inter", "Microsoft YaHei", sans-serif;
}

.cesium-box {
  position: absolute;
  inset: 0;
}

/* 顶部 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: linear-gradient(
    180deg,
    rgba(2, 8, 16, 0.85) 0%,
    transparent 100%
  );
  pointer-events: none;
}

.mission-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5a6a7a;
}

.pulse-dot.active {
  background: #39ff14;
  box-shadow: 0 0 8px #39ff14;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}

.mission-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.7);
}

.time-display {
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  color: #fff;
}

.t-prefix {
  color: #5a8aaa;
  font-size: 11px;
  margin-right: 3px;
}

.t-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 侧面板 */
.side-panel {
  position: absolute;
  top: 56px;
  z-index: 15;
}

.side-panel.left {
  left: 12px;
}
.side-panel.right {
  right: 12px;
}

.panel-glass,
.telemetry-glass {
  background: rgba(6, 14, 28, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 220px;
}

/* 按钮 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid rgba(0, 180, 216, 0.3);
  border-radius: 8px;
  background: rgba(0, 180, 216, 0.06);
  color: #90e0ef;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(0, 180, 216, 0.15);
  border-color: rgba(0, 180, 216, 0.6);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.4);
}

.action-btn.danger {
  color: #ff6b7a;
  border-color: rgba(255, 61, 87, 0.4);
  background: rgba(255, 61, 87, 0.06);
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 视角网格 */
.view-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.view-btn {
  padding: 8px 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  color: #8ab8cc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.view-btn:hover {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.3);
}

.view-btn.active {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.5);
}

/* 遥测 */
.telemetry-glass {
  width: 200px;
}

.telemetry-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #39ff14;
  margin-bottom: 4px;
}

.telem-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.telem-label {
  font-size: 10px;
  color: #5a8aaa;
  font-weight: 600;
  width: 30px;
  flex-shrink: 0;
}

.telem-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #c0dce8;
  flex: 1;
}

.telem-num.alt {
  color: #00e5ff;
}
.telem-num.vel {
  color: #39ff14;
}

.telem-unit {
  font-size: 10px;
  color: #5a8aaa;
}

/* 速度控制 */
.speed-control {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  display: flex;
  gap: 3px;
  padding: 5px;
  background: rgba(6, 14, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  backdrop-filter: blur(12px);
}

.speed-btn {
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #5a8aaa;
  font-size: 11px;
  font-weight: 600;
  font-family: "JetBrains Mono", monospace;
  cursor: pointer;
  transition: all 0.15s;
}

.speed-btn:hover {
  color: #90e0ef;
  background: rgba(255, 255, 255, 0.04);
}

.speed-btn.active {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.3);
}

/* 错误 */
.error-toast {
  margin-top: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(255, 61, 87, 0.08);
  border: 1px solid rgba(255, 61, 87, 0.3);
  color: #ff6b7a;
  font-size: 12px;
  max-width: 220px;
}

/* Cesium timeline */
:deep(.cesium-viewer-timelineContainer) {
  left: 240px !important;
  right: 220px !important;
  bottom: 0 !important;
}

:deep(.cesium-timeline-bar) {
  background: rgba(6, 14, 28, 0.9) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
}

:deep(.cesium-timeline-needle) {
  background: #00e5ff !important;
}
</style>
