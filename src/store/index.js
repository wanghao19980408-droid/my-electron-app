import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const STORAGE_KEY = "rocketSim_active_id";
const SESSION_KEY = "rocketSim_logged_in";
const getActiveId = () => localStorage.getItem(STORAGE_KEY) || null;
const setActiveId = (id) => {
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
};

function defaultBaselineOptConfig() {
  return {
    optType: 1,
    maxIterations: 2000,
    launchAzimuth: 191.336955918,
    attackAngle: 0.2453223,
    slope1: 0.001009251,
    slope2: -0.225160683,
    init1: { loadMass: 1940.162348932 },
    init2: { finalShutdown: 6.188 },
  };
}

function buildBaselinePayload(baseParams) {
  const b = baseParams;
  const defaultOpt = defaultBaselineOptConfig();

  return {
    earth: {
      lambda_0: b.longitude,
      B_0: b.latitude,
      A_0: b.azimuth,
      altitude: b.altitude,
    },
    rocket: {
      stages: 2,
      d_max: b.diameter,
      fairing: b.fairingMass,
      load: b.loadMass,
      struct: [
        [b.stage1.structMass, b.stage1.oxMass + b.stage1.fuelMass],
        [b.stage2.structMass, b.stage2.oxMass + b.stage2.fuelMass],
      ],
      engines: [
        [
          b.stage1.Isp,
          b.stage1.enginesNum,
          b.stage1.thrust,
          b.stage1.nozzleArea,
          b.stage1.mountingAngle,
        ],
        [
          b.stage2.Isp,
          b.stage2.enginesNum,
          b.stage2.thrust,
          b.stage2.nozzleArea,
          b.stage2.mountingAngle,
        ],
      ],
    },
    orbit: {
      height: b.trackHeight * 1000,
      e: b.eccentricity,
      i: b.trackInclination,
    },
    type: 1,
    t_stages: [[b.time1], [b.time3, b.time4]],
    events: {
      "stage-1": {
        event: ["separate"],
        t_start: [b.time1],
        duration: [b.time2],
      },
      "stage-2": {
        event: ["fairing", "separate"],
        t_start: [b.fairingTime || 10, b.time3 + b.time4],
        duration: [0, b.time5],
      },
    },
    A_0: defaultOpt.launchAzimuth,
    load_max: defaultOpt.init1.loadMass,
    alpha_max: defaultOpt.attackAngle,
    phi_slope: [defaultOpt.slope1, defaultOpt.slope2],
    t_minus: 0,
  };
}

function buildOptimizedPayload(baseParams, optConfig, optResult) {
  const b = baseParams;
  const c = optConfig;
  const r = optResult;

  const optParams = r?.optimized_params || [];

  const isMax = String(c.optType || 1) === "1";

  const optimizedA0 = optParams[0] ?? c.launchAzimuth;

  const optimizedLoad = isMax
    ? optParams[1] ?? c.init1?.loadMass ?? b.loadMass
    : b.loadMass;
  const optimizedTMinus = !isMax
    ? optParams[1] ?? c.init2?.finalShutdown ?? 0
    : 0;

  const optimizedAlpha = optParams[2] ?? c.attackAngle;
  const optimizedSlope1 = optParams[3] ?? c.slope1;
  const optimizedSlope2 = optParams[4] ?? c.slope2;

  return {
    earth: {
      lambda_0: b.longitude,
      B_0: b.latitude,
      A_0: b.azimuth,
      altitude: b.altitude,
    },
    rocket: {
      stages: 2,
      d_max: b.diameter,
      fairing: b.fairingMass,
      load: b.loadMass,
      struct: [
        [b.stage1.structMass, b.stage1.oxMass + b.stage1.fuelMass],
        [b.stage2.structMass, b.stage2.oxMass + b.stage2.fuelMass],
      ],
      engines: [
        [
          b.stage1.Isp,
          b.stage1.enginesNum,
          b.stage1.thrust,
          b.stage1.nozzleArea,
          b.stage1.mountingAngle,
        ],
        [
          b.stage2.Isp,
          b.stage2.enginesNum,
          b.stage2.thrust,
          b.stage2.nozzleArea,
          b.stage2.mountingAngle,
        ],
      ],
    },
    orbit: {
      height: b.trackHeight * 1000,
      e: b.eccentricity,
      i: b.trackInclination,
    },
    type: parseInt(c.optType) || 1,
    t_stages: [[b.time1], [b.time3, b.time4]],
    events: {
      "stage-1": {
        event: ["separate"],
        t_start: [b.time1],
        duration: [b.time2],
      },
      "stage-2": {
        event: ["fairing", "separate"],
        t_start: [b.fairingTime || 10, b.time3 + b.time4],
        duration: [0, b.time5],
      },
    },

    A_0: optimizedA0,
    load_max: optimizedLoad,
    alpha_max: optimizedAlpha,
    phi_slope: [optimizedSlope1, optimizedSlope2],
    t_minus: optimizedTMinus,
  };
}

export default new Vuex.Store({
  state: {
    projects: [],
    activeProjectId: getActiveId(),
    optProgress: null,
    isDetailOpen: false,
    isSimulating: false,
    isBallisticRunning: false,
    resultData: null,
    ballisticData: null,
    language: "zh",
    isLoggedIn: sessionStorage.getItem(SESSION_KEY) === "1",
    runningOptType: 1,
    loggedInUser: sessionStorage.getItem("rocketSim_user") || null,
  },

  getters: {
    activeProject: (state) =>
      state.projects.find((p) => p.id === state.activeProjectId) || null,

    activeBallisticRecords: (_state, getters) => {
      const proj = getters.activeProject;
      return proj?.ballisticRecords || [];
    },

    latestOptRecord: (_state, getters) => {
      const proj = getters.activeProject;
      return proj?.records?.[0] || null;
    },

    canRunBaselineBallistic: (_state, getters) => {
      const proj = getters.activeProject;
      return !!proj?.baseParams;
    },

    canRunOptimizedBallistic: (_state, getters) => {
      const proj = getters.activeProject;
      return !!(proj?.baseParams && proj?.records?.length > 0);
    },

    canRunBallistic: (_state, getters) => {
      return getters.canRunBaselineBallistic;
    },
  },

  mutations: {
    SET_LOGGED_IN(state, { status, username }) {
      state.isLoggedIn = status;
      state.loggedInUser = username || null;
      if (status) {
        sessionStorage.setItem(SESSION_KEY, "1");
        sessionStorage.setItem("rocketSim_user", username);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("rocketSim_user");
      }
    },
    SET_PROJECTS(state, list) {
      state.projects = list;
    },
    SET_ACTIVE_PROJECT_ID(state, id) {
      state.activeProjectId = id;
      setActiveId(id);
    },
    SET_RESULT_DATA(state, data) {
      state.resultData = data;
    },
    SET_BALLISTIC_DATA(state, data) {
      state.ballisticData = data;
    },
    SET_RUNNING_OPT_TYPE(state, val) {
      state.runningOptType = val;
    },
    SET_SIMULATING(state, status) {
      state.isSimulating = status;
    },
    SET_BALLISTIC_RUNNING(state, status) {
      state.isBallisticRunning = status;
    },
    SET_LANGUAGE(state, lang) {
      state.language = lang;
    },
    SET_OPT_PROGRESS(state, data) {
      state.optProgress = data;
    },
    SET_DETAIL_OPEN(state, val) {
      state.isDetailOpen = val;
    },
  },

  actions: {
    /**
     * 运行基线弹道仿真（不需要优化结果）
     * @param {string} projectId - 项目 ID
     */
    async RUN_BASELINE_BALLISTIC({ dispatch, commit, state }, { projectId }) {
      const proj = state.projects.find((p) => p.id === projectId);

      if (!proj) throw new Error("项目不存在");
      if (!proj.baseParams)
        throw new Error("项目缺少基础配置，请先在项目管理中完善参数");

      const fullPayload = buildBaselinePayload(proj.baseParams);

      commit("SET_BALLISTIC_RUNNING", true);
      commit("SET_BALLISTIC_DATA", null);
      commit("SET_OPT_PROGRESS", null);

      try {
        window.electronAPI.ballistic.onProgress((msg) => {
          commit("SET_OPT_PROGRESS", msg);
        });

        const res = await window.electronAPI.ballistic.run({
          projectId,
          formData: fullPayload,
          ballisticType: "baseline", // 标识类型
        });

        commit("SET_BALLISTIC_DATA", { recordId: res.id, meta: res.meta });
        await dispatch("INIT_DATA");
        return res;
      } catch (err) {
        if (err === "MANUAL_STOP") return null;
        throw err;
      } finally {
        commit("SET_BALLISTIC_RUNNING", false);
        commit("SET_OPT_PROGRESS", null);
      }
    },

    /**
     * 运行优化后弹道仿真（需要优化结果）
     * @param {string} projectId - 项目 ID
     * @param {string} recordId - 使用哪条优化记录的结果（可选，默认用最新的）
     */
    async RUN_BALLISTIC({ dispatch, commit, state }, { projectId, recordId }) {
      const proj = state.projects.find((p) => p.id === projectId);

      if (!proj) throw new Error("项目不存在");
      if (!proj.baseParams)
        throw new Error("项目缺少基础配置，请先在项目管理中完善参数");
      if (!proj.records || proj.records.length === 0) {
        throw new Error("请先运行优化仿真，获得最优参数后再运行优化弹道");
      }

      const record = recordId
        ? proj.records.find((r) => r.id === recordId)
        : proj.records[0];

      if (!record) throw new Error("未找到指定的优化记录");

      const fullPayload = buildOptimizedPayload(
        proj.baseParams,
        record.optConfig,
        record.result,
      );

      commit("SET_BALLISTIC_RUNNING", true);
      commit("SET_BALLISTIC_DATA", null);
      commit("SET_OPT_PROGRESS", null);

      try {
        window.electronAPI.ballistic.onProgress((msg) => {
          commit("SET_OPT_PROGRESS", msg);
        });

        const res = await window.electronAPI.ballistic.run({
          projectId,
          formData: fullPayload,
          ballisticType: "optimized",
          optRecordId: record.id,
        });

        commit("SET_BALLISTIC_DATA", { recordId: res.id, meta: res.meta });
        await dispatch("INIT_DATA");
        return res;
      } catch (err) {
        if (err === "MANUAL_STOP") return null;
        throw err;
      } finally {
        commit("SET_BALLISTIC_RUNNING", false);
        commit("SET_OPT_PROGRESS", null);
      }
    },

    async STOP_BALLISTIC({ commit }) {
      const stopped = await window.electronAPI.ballistic.stop();
      if (stopped) {
        commit("SET_BALLISTIC_RUNNING", false);
        commit("SET_OPT_PROGRESS", null);
      }
      return stopped;
    },

    async SELECT_BALLISTIC_RECORD({ commit, state }, { recordId }) {
      const proj = state.projects.find((p) => p.id === state.activeProjectId);
      const rec = proj?.ballisticRecords?.find((r) => r.id === recordId);
      if (rec) commit("SET_BALLISTIC_DATA", { recordId, meta: rec });
    },

    async INIT_DATA({ commit, state }) {
      if (!window.electronAPI) return;
      const projects = await window.electronAPI.db.projects.getAll();
      commit("SET_PROJECTS", projects);

      if (
        state.activeProjectId &&
        !projects.find((p) => p.id === state.activeProjectId)
      ) {
        commit(
          "SET_ACTIVE_PROJECT_ID",
          projects.length > 0 ? projects[0].id : null,
        );
      } else if (!state.activeProjectId && projects.length > 0) {
        commit("SET_ACTIVE_PROJECT_ID", projects[0].id);
      }
    },

    async CREATE_PROJECT({ dispatch, commit }, payload) {
      const newProj = await window.electronAPI.db.projects.create(payload);
      commit("SET_ACTIVE_PROJECT_ID", newProj.id);
      await dispatch("INIT_DATA");
    },

    async DELETE_PROJECT({ dispatch, state, commit }, { projectId }) {
      await window.electronAPI.db.projects.delete({ projectId });
      if (state.activeProjectId === projectId)
        commit("SET_ACTIVE_PROJECT_ID", null);
      await dispatch("INIT_DATA");
    },

    async RENAME_PROJECT({ dispatch }, payload) {
      await window.electronAPI.db.projects.rename(payload);
      await dispatch("INIT_DATA");
    },

    SET_ACTIVE_PROJECT({ commit }, { projectId }) {
      commit("SET_ACTIVE_PROJECT_ID", projectId);
    },

    async SAVE_OPT_RECORD({ dispatch }, { projectId, optConfig, optResult }) {
      if (!window.electronAPI) return;
      await window.electronAPI.db.records.save({
        projectId,
        optConfig,
        optResult,
      });
      await dispatch("INIT_DATA");
    },

    async DELETE_RECORD({ dispatch }, { recordId }) {
      if (!window.electronAPI) return;
      await window.electronAPI.db.records.delete({ recordId });
      await dispatch("INIT_DATA");
    },

    async DELETE_BALLISTIC_RECORD({ dispatch }, { recordId }) {
      if (!window.electronAPI) return;
      await window.electronAPI.ballistic.delete({ recordId }); // ✅ 修复：直接使用 electronAPI.ballistic
      await dispatch("INIT_DATA");
    },
    async RENAME_OPT_RECORD({ dispatch }, { recordId, name }) {
      if (!window.electronAPI) return;
      await window.electronAPI.db.records.rename({ recordId, name });
      await dispatch("INIT_DATA");
    },

    async RENAME_BALLISTIC_RECORD({ dispatch }, { recordId, name }) {
      if (!window.electronAPI) return;
      await window.electronAPI.ballistic.rename({ recordId, name }); // ✅ 修复：直接使用 electronAPI.ballistic
      await dispatch("INIT_DATA");
    },
  },
});
