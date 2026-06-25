const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ---- 优化仿真 ----
  runSimulation: (formData) =>
    ipcRenderer.invoke("system:runSimulation", formData),
  stopSimulation: () => ipcRenderer.invoke("system:stopSimulation"),
  onSimulationUpdate: (callback) => {
    ipcRenderer.removeAllListeners("simulation:update");
    ipcRenderer.on("simulation:update", (_e, data) => callback(data));
  },
  removeSimulationUpdate: () => {
    ipcRenderer.removeAllListeners("simulation:update");
  },

  // ---- 弹道仿真 ----
  ballistic: {
    run: (payload) => ipcRenderer.invoke("system:runBallistic", payload),
    stop: () => ipcRenderer.invoke("system:stopBallistic"),
    list: (p) => ipcRenderer.invoke("db:ballistic:list", p),
    delete: (p) => ipcRenderer.invoke("db:ballistic:delete", p),
    readTrack: (p) => ipcRenderer.invoke("db:ballistic:readTrack", p),
    readFull: (p) => ipcRenderer.invoke("db:ballistic:readFull", p),

    rename: (p) => ipcRenderer.invoke("db:ballistic:rename", p),

    onProgress: (cb) => {
      ipcRenderer.removeAllListeners("ballistic:update");
      ipcRenderer.on("ballistic:update", (_e, msg) => cb(msg));
    },
    removeProgress: () => {
      ipcRenderer.removeAllListeners("ballistic:update");
    },
  },
  readBinaryFile: (filePath) => {
    const fs = require("fs");
    const buf = fs.readFileSync(filePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  },

  // ---- 系统 ----
  getMemory: () => ipcRenderer.invoke("system:getMemory"),
  getCPU: () => ipcRenderer.invoke("system:getCPU"),

  // ---- 窗口 ----
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  setSize: (w, h, resizable) =>
    ipcRenderer.invoke("window:setSize", w, h, resizable),

  // ---- 数据库 ----
  auth: {
    login: (payload) => ipcRenderer.invoke("db:auth:login", payload),
  },
  db: {
    projects: {
      getAll: () => ipcRenderer.invoke("db:projects:getAll"),
      create: (payload) => ipcRenderer.invoke("db:projects:create", payload),
      rename: (payload) => ipcRenderer.invoke("db:projects:rename", payload),
      delete: (payload) => ipcRenderer.invoke("db:projects:delete", payload),
    },
    records: {
      save: (payload) => ipcRenderer.invoke("db:records:save", payload),
      delete: (payload) => ipcRenderer.invoke("db:records:delete", payload),

      rename: (payload) => ipcRenderer.invoke("db:records:rename", payload),
    },
  },
});
