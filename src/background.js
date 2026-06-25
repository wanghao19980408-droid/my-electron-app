"use strict";

import { app, protocol, BrowserWindow, ipcMain, session } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import os from "os";
import path from "path";
import { spawn, exec } from "child_process";
import fs from "fs";
import {
  initDB,
  projectOps,
  recordOps,
  ballisticOps,
  authOps,
} from "./db/database";

const isDevelopment = process.env.NODE_ENV !== "production";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

let curPy = null;
let currentPyProcess = null;
let manualStopped = false;

// ================= 弹道仿真进程 =================
ipcMain.handle("system:runBallistic", async (event, payload) => {
  const { projectId, formData, ballisticType, optRecordId } = payload;
  return new Promise((resolve, reject) => {
    if (curPy) return reject("已有弹道仿真进程在运行，请先停止");
    manualStopped = false;

    const runId =
      Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const outDir = ballisticOps.getDataDir();
    const tempJson = path.join(app.getPath("temp"), `ballistic_${runId}.json`);

    fs.writeFileSync(tempJson, JSON.stringify(formData), "utf-8");

    let pyExe, args, cwd;
    if (process.env.NODE_ENV !== "production") {
      pyExe =
        process.env.PYTHON_EXE || "D:\\Miniconda3\\envs\\rocket\\python.exe";
      const pyScript = process.env.ROCKET_MAIN_SCRIPT || "D:\\Rocket\\main.py";
      cwd = process.env.ROCKET_DIR || "D:\\Rocket";
      args = [pyScript, "ballistic", tempJson, outDir, runId];
    } else {
      const backendDir = path.join(process.resourcesPath, "rocket_core");
      pyExe = path.join(backendDir, "main.exe");
      cwd = backendDir;
      args = ["ballistic", tempJson, outDir, runId];
    }

    curPy = spawn(pyExe, args, {
      cwd,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let settled = false;
    let errBuf = "";
    let outBuf = "";

    curPy.stdout.on("data", (chunk) => {
      outBuf += chunk.toString("utf-8");
      let idx;
      while ((idx = outBuf.indexOf("\n")) >= 0) {
        const line = outBuf.slice(0, idx).trim();
        outBuf = outBuf.slice(idx + 1);
        if (!line || settled) continue;

        try {
          const msg = JSON.parse(line);
          if (msg.status === "progress" || msg.status === "running") {
            event.sender.send("ballistic:update", msg);
          } else if (msg.status === "success") {
            settled = true;
            const saved = ballisticOps.save({
              projectId,
              ballisticConfig: formData,
              meta: msg.data,
              ballisticType: ballisticType, // 直接传，让 database.js 去处理默认值
              optRecordId: optRecordId,
            });
            resolve({ ...saved, meta: msg.data });
          } else if (msg.status === "error") {
            settled = true;
            reject(msg.message || "Python 返回未知错误");
          }
        } catch (e) {
          console.log("[Python]:", line);
        }
      }
    });

    curPy.stderr.on("data", (d) => {
      errBuf += d.toString("utf-8");
    });

    curPy.on("error", (spawnErr) => {
      curPy = null;
      if (!settled) {
        settled = true;
        reject(`无法启动 Python 进程: ${spawnErr.message}`);
      }
    });
    curPy.on("close", (code) => {
      curPy = null;
      try {
        fs.unlinkSync(tempJson);
      } catch (_) {}
      if (settled) return;
      if (manualStopped) return reject("MANUAL_STOP");
      reject(
        errBuf.trim()
          ? `弹道仿真异常退出(code=${code}): ${errBuf.slice(0, 500)}`
          : `弹道仿真异常退出(code=${code})`,
      );
    });
  });
});

ipcMain.handle("system:stopBallistic", () => {
  if (!curPy) return false;
  manualStopped = true;
  if (process.platform === "win32") {
    exec(`taskkill /pid ${curPy.pid} /t /f`);
  } else {
    curPy.kill("SIGKILL");
  }
  curPy = null;
  return true;
});

// ================= 优化仿真进程 =================
ipcMain.handle("system:runSimulation", async (event, formData) => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const tempJsonPath = path.join(
      app.getPath("temp"),
      "current_rocket_params.json",
    );
    fs.writeFileSync(tempJsonPath, JSON.stringify(formData));

    let pyProcess;
    if (process.env.NODE_ENV !== "production") {
      const scriptPath = "D:\\Rocket\\main.py";
      const pythonDir = "D:\\Rocket";
      const pythonExecutable = "D:\\Miniconda3\\envs\\rocket\\python.exe";

      pyProcess = spawn(pythonExecutable, [scriptPath, "optim", tempJsonPath], {
        cwd: pythonDir,
      });
    } else {
      const backendDir = path.join(process.resourcesPath, "rocket_core");
      const backendExePath = path.join(backendDir, "main.exe");

      pyProcess = spawn(backendExePath, ["optim", tempJsonPath], {
        cwd: backendDir,
      });
    }

    currentPyProcess = pyProcess;

    let errorString = "";
    let stdoutBuffer = "";

    pyProcess.stdout.on("data", (data) => {
      stdoutBuffer += data.toString();
      let lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop();
      for (const line of lines) {
        if (settled) break;
        if (line.trim()) {
          try {
            const result = JSON.parse(line.trim());
            if (result.status === "running") {
              event.sender.send("simulation:update", result);
            } else if (result.status === "success") {
              settled = true;
              resolve(result.data);
            } else if (result.status === "error") {
              settled = true;
              reject(result.message);
            }
          } catch (err) {
            console.log("[Python 普通输出/Log]:", line.trim());
          }
        }
      }
    });

    pyProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pyProcess.on("close", (code) => {
      currentPyProcess = null;
      console.log(`[Python Process] Exited with code ${code}`);
      if (code !== 0 && code !== null) {
        if (errorString.trim() === "") reject("MANUAL_STOP");
        else
          reject(
            `Python 运行崩溃 (代码 ${code})！\n详细错误日志:\n${errorString}`,
          );
      } else if (code === null) {
        reject("MANUAL_STOP");
      }
    });
  });
});

ipcMain.handle("system:stopSimulation", () => {
  if (currentPyProcess) {
    if (process.platform === "win32")
      exec(`taskkill /pid ${currentPyProcess.pid} /t /f`);
    else currentPyProcess.kill("SIGKILL");
    currentPyProcess = null;
    return true;
  }
  return false;
});

// ================= 系统监控 =================
ipcMain.handle("system:getMemory", () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return Math.round((usedMem / totalMem) * 100);
});

function getCPUTimes() {
  const cpus = os.cpus();
  let idle = 0,
    total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

ipcMain.handle("system:getCPU", async () => {
  return new Promise((resolve) => {
    const start = getCPUTimes();
    setTimeout(() => {
      const end = getCPUTimes();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      const usage = 100 - Math.round((100 * idleDiff) / totalDiff);
      resolve(usage);
    }, 1000);
  });
});

// ================= 窗口控制 =================
ipcMain.handle("window:setSize", (event, width, height, resizable = true) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    if (win.isFullScreen()) win.setFullScreen(false);
    win.setSize(width, height, true);
    win.setResizable(resizable);
    win.center();
  }
});

ipcMain.handle("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.handle("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    } else {
      win.maximize();
      return true;
    }
  }
});

ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  } else {
    app.quit();
  }
});

// ================= 数据库方法 =================
ipcMain.handle("db:projects:getAll", () => projectOps.getAll());
ipcMain.handle("db:projects:create", (_e, payload) =>
  projectOps.create(payload),
);
ipcMain.handle("db:projects:rename", (_e, payload) =>
  projectOps.rename(payload),
);
ipcMain.handle("db:projects:delete", (_e, payload) =>
  projectOps.delete(payload),
);
ipcMain.handle("db:records:rename", (_e, payload) => recordOps.rename(payload));
ipcMain.handle("db:ballistic:rename", (_e, p) => ballisticOps.rename(p));
ipcMain.handle("db:records:save", (_e, payload) => recordOps.save(payload));
ipcMain.handle("db:records:delete", (_e, payload) => recordOps.delete(payload));
ipcMain.handle("db:auth:login", (_e, payload) => authOps.login(payload));
ipcMain.handle("db:ballistic:list", (_e, p) => ballisticOps.list(p));
ipcMain.handle("db:ballistic:delete", (_e, p) => ballisticOps.delete(p));
ipcMain.handle("db:ballistic:readTrack", (_e, p) =>
  ballisticOps.readTrackBuffer(p),
);
ipcMain.handle("db:ballistic:readFull", (_e, p) =>
  ballisticOps.readFullBuffer(p),
);

// ================= 应用生命周期 =================
async function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 640,
    resizable: false,
    frame: false,
    thickFrame: false,
    icon: path.join(
      __dirname,
      process.env.WEBPACK_DEV_SERVER_URL
        ? "../public/favicon.ico"
        : "favicon.ico",
    ),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
  }
}

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (curPy) {
    try {
      process.platform === "win32"
        ? exec(`taskkill /pid ${curPy.pid} /t /f`)
        : curPy.kill("SIGKILL");
    } catch (e) {}
  }
  if (currentPyProcess) {
    try {
      process.platform === "win32"
        ? exec(`taskkill /pid ${currentPyProcess.pid} /t /f`)
        : currentPyProcess.kill("SIGKILL");
    } catch (e) {}
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("ready", async () => {
  initDB();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    Object.keys(headers).forEach((k) => {
      if (k.toLowerCase() === "content-security-policy") delete headers[k];
    });
    callback({ responseHeaders: headers });
  });

  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools 插件加载失败:", e.toString());
    }
  }
  createWindow();
});
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") app.quit();
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
