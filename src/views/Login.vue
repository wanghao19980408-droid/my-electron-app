<template>
  <div class="login-root" :class="{ 'black-bg': authSuccess }">
    <template v-if="!authSuccess">
      <div class="login-drag-bar">
        <div
          class="lang-toggle"
          style="-webkit-app-region: no-drag; margin-right: 15px"
        >
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

      <div class="corner tl" />
      <div class="corner tr" />
      <div class="corner bl" />
      <div class="corner br" />

      <div class="login-stage">
        <div class="login-logo-wrap">
          <svg class="login-logo-svg" viewBox="0 0 36 36" fill="none">
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
          <div class="login-sys-name">{{ $t("header.title") }}</div>
        </div>

        <div class="login-panel" :class="{ shake: shaking }">
          <div class="panel-topbar">
            <span class="topbar-dot" />
            <span class="topbar-dot amber" />
            <span class="topbar-dot green" />
            <span class="topbar-title">{{ $t("login.systemAccess") }}</span>
          </div>

          <div class="panel-body">
            <div class="status-row">
              <span class="status-led" :class="statusLed" />
              <span class="status-text">{{ statusMsg }}</span>
            </div>

            <div class="field-group">
              <label class="field-label">{{ $t("login.usernameLabel") }}</label>
              <div
                class="field-wrap"
                :class="{ focused: focusUser, error: fieldError }"
              >
                <svg
                  class="field-ico"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                >
                  <circle cx="8" cy="5.5" r="2.5" />
                  <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                </svg>
                <input
                  ref="usernameInput"
                  class="field-input"
                  type="text"
                  v-model="username"
                  :placeholder="$t('login.userPlaceholder')"
                  autocomplete="username"
                  @focus="focusUser = true"
                  @blur="focusUser = false"
                  @keyup.enter="$refs.passwordInput.focus()"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">{{ $t("login.passwordLabel") }}</label>
              <div
                class="field-wrap"
                :class="{ focused: focusPass, error: fieldError }"
              >
                <svg
                  class="field-ico"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                >
                  <rect x="3" y="7" width="10" height="7" rx="1.5" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                </svg>
                <input
                  ref="passwordInput"
                  class="field-input"
                  :type="showPwd ? 'text' : 'password'"
                  v-model="password"
                  :placeholder="$t('login.pwdPlaceholder')"
                  autocomplete="current-password"
                  @focus="focusPass = true"
                  @blur="focusPass = false"
                  @keyup.enter="doLogin"
                  :disabled="loading"
                />
                <button
                  class="pwd-toggle"
                  @click="showPwd = !showPwd"
                  tabindex="-1"
                >
                  <svg
                    v-if="!showPwd"
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  >
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
                    <circle cx="8" cy="8" r="2" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  >
                    <path d="M2 2l12 12M6.7 6.8A2 2 0 0 0 9.3 9.2" />
                    <path
                      d="M4.2 4.3C2.7 5.3 1.5 6.8 1 8c1 2.5 3.8 5 7 5 1.3 0 2.5-.4 3.5-1"
                    />
                    <path
                      d="M9.5 3.6C8.8 3.2 8 3 7.2 3c-3.2 0-6 2.5-7 5 .4 1 1.1 2 2 2.8"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <transition name="err-fade">
              <div class="err-bar" v-if="errorMsg">
                <svg
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#ff3d57"
                  stroke-width="1.5"
                  stroke-linecap="round"
                >
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="5" x2="8" y2="8.5" />
                  <circle cx="8" cy="11" r="0.6" fill="#ff3d57" stroke="none" />
                </svg>
                {{ errorMsg }}
              </div>
            </transition>

            <button
              class="login-btn"
              :class="{ loading }"
              @click="doLogin"
              :disabled="loading"
            >
              <span v-if="!loading" class="btn-inner">
                <svg
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" />
                  <polyline points="10 11 14 8 10 5" />
                  <line x1="14" y1="8" x2="5" y2="8" />
                </svg>
                {{ $t("login.submit") }}
              </span>
              <span v-else class="btn-inner">
                <span class="spin-ring" />
                {{ $t("login.verifying") }}
              </span>
            </button>
          </div>
        </div>

        <div class="login-footer">
          <span class="footer-time">{{ currentTime }}</span>
          <span class="footer-sep">·</span>
          <span class="footer-ver">v2.0.0</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "LoginPage",
  data: () => ({
    username: "",
    password: "",
    showPwd: false,
    loading: false,
    errorMsg: "",
    fieldError: false,
    shaking: false,
    focusUser: false,
    focusPass: false,
    currentTime: "--:--:--",
    timer: null,
    currentLang: "",
    authSuccess: false,
  }),
  computed: {
    statusLed() {
      if (this.loading) return "amber";
      if (this.errorMsg) return "red";
      return "green";
    },
    statusMsg() {
      if (this.loading) return this.$t("login.authenticating");
      if (this.errorMsg) return this.$t("login.accessDenied");
      return this.$t("login.awaiting");
    },
  },
  mounted() {
    this.currentLang = this.$store.state.language || "zh";
    this.$i18n.locale = this.currentLang;

    if (window.electronAPI && window.electronAPI.setSize) {
      window.electronAPI.setSize(480, 640, false);
    }

    this.$nextTick(() => this.$refs.usernameInput?.focus());
    this.timer = setInterval(() => {
      this.currentTime = new Date().toTimeString().split(" ")[0];
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    switchLanguage(lang) {
      if (this.currentLang === lang) return;
      this.currentLang = lang;
      this.$store.commit("SET_LANGUAGE", lang);
      this.$i18n.locale = lang;
    },

    winMinimize() {
      window.electronAPI?.minimize();
    },
    winClose() {
      window.electronAPI?.close();
    },

    async doLogin() {
      if (this.loading) return;
      this.errorMsg = "";
      this.fieldError = false;

      if (!this.username.trim() || !this.password) {
        this.showError(this.$t("login.emptyError"));
        return;
      }

      this.loading = true;
      await new Promise((r) => setTimeout(r, 600));

      try {
        let result = null;
        if (window.electronAPI?.auth) {
          result = await window.electronAPI.auth.login({
            username: this.username.trim(),
            password: this.password,
          });
        } else {
          result =
            this.username === "admin" && this.password === "123456"
              ? { username: "admin" }
              : null;
        }

        if (result) {
          this.$store.commit("SET_LOGGED_IN", {
            status: true,
            username: result.username,
          });

          this.authSuccess = true;

          setTimeout(() => {
            if (window.electronAPI && window.electronAPI.setSize) {
              window.electronAPI.setSize(1600, 1000, true);
            }
            this.$router.replace("/");
          }, 100);
        } else {
          this.showError(this.$t("login.wrongCredentials"));
        }
      } catch (e) {
        this.showError(this.$t("login.systemError"));
      } finally {
        this.loading = false;
      }
    },

    showError(msg) {
      this.errorMsg = msg;
      this.fieldError = true;
      this.shaking = true;
      setTimeout(() => (this.shaking = false), 500);
      setTimeout(() => {
        this.errorMsg = "";
        this.fieldError = false;
      }, 3500);
    },
  },
};
</script>

<style scoped>
/* ── Root ── */
.login-root {
  width: 100vw;
  height: 100vh;
  background: #030a12;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  font-family: "Noto Sans SC", sans-serif;
  transition: background 0.3s;
}
.login-root.black-bg {
  background: rgba(3, 10, 18, 0.85); /* 统一黑色遮罩以便平滑过渡 */
}

/* 拖拽栏与按钮样式 */
.login-drag-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px; /* 增加高度 */
  -webkit-app-region: drag;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 24px; /* 向内缩进，防止被系统边框遮挡 */
  z-index: 9999; /* 放在所有内容的最顶层 */
}

/* ===== 语言切换样式 ===== */
.lang-toggle {
  display: flex;
  align-items: center;
  background: rgba(0, 6, 14, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 5px;
  overflow: hidden;
}
.lang-btn {
  font-family: "Orbitron", monospace;
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 700;
  padding: 5px 12px;
  background: transparent;
  border: none;
  color: #4a6a80;
  cursor: pointer;
  transition: all 0.15s;
}
.lang-btn.active {
  background: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
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
  -webkit-app-region: no-drag;
  position: relative;
  z-index: 10000;
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
  color: #4a6a80;
  transition: background 0.15s, color 0.15s;
}
.wc:hover {
  background: rgba(0, 229, 255, 0.08);
  color: #00e5ff;
}
.wc.close:hover {
  background: rgba(255, 61, 87, 0.12);
  color: #ff3d57;
}

/* ── Corner decorations ── */
.corner {
  position: fixed;
  width: 18px;
  height: 18px;
  z-index: 1;
  pointer-events: none;
}
.corner::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  background: #00e5ff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.8);
}
.corner.tl {
  top: 60px; /* 避开顶部 50px 的拖拽栏与控制按钮 */
  left: 20px;
  border-top: 1.5px solid rgba(0, 229, 255, 0.5);
  border-left: 1.5px solid rgba(0, 229, 255, 0.5);
}
.corner.tl::after {
  top: -2.5px;
  left: -2.5px;
}

.corner.tr {
  top: 60px;
  right: 20px;
  border-top: 1.5px solid rgba(0, 229, 255, 0.5);
  border-right: 1.5px solid rgba(0, 229, 255, 0.5);
}
.corner.tr::after {
  top: -2.5px;
  right: -2.5px;
}

.corner.bl {
  bottom: 20px;
  left: 20px;
  border-bottom: 1.5px solid rgba(0, 229, 255, 0.5);
  border-left: 1.5px solid rgba(0, 229, 255, 0.5);
}
.corner.bl::after {
  bottom: -2.5px;
  left: -2.5px;
}

.corner.br {
  bottom: 20px;
  right: 20px;
  border-bottom: 1.5px solid rgba(0, 229, 255, 0.5);
  border-right: 1.5px solid rgba(0, 229, 255, 0.5);
}
.corner.br::after {
  bottom: -2.5px;
  right: -2.5px;
}

.login-stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  -webkit-app-region: no-drag;
}
.login-logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.login-logo-svg {
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.5));
  animation: iconPulse 4s ease-in-out infinite;
}
@keyframes iconPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 229, 255, 0.8));
  }
}
.login-sys-name {
  font-family: "Orbitron", monospace;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 5px;
  color: #90bcd4;
  text-shadow: 0 0 18px rgba(0, 229, 255, 0.25);
}

.login-panel {
  width: 420px;
  background: rgba(4, 12, 26, 0.96);
  border: 1px solid rgba(0, 229, 255, 0.22);
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.08),
    inset 0 1px 0 rgba(0, 229, 255, 0.1);
  overflow: hidden;
  backdrop-filter: blur(16px);
  animation: panelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.login-panel.shake {
  animation: shake 0.45s ease both;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

/* ── Panel top bar ── */
.panel-topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(0, 229, 255, 0.06);
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
}
.topbar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.5);
}
.topbar-dot.amber {
  background: rgba(255, 179, 0, 0.4);
  border-color: rgba(255, 179, 0, 0.6);
}
.topbar-dot.green {
  background: rgba(57, 255, 20, 0.4);
  border-color: rgba(57, 255, 20, 0.6);
}
.topbar-title {
  font-family: "Space Mono", monospace;
  font-size: 10px;
  letter-spacing: 3px;
  color: #4a6a80;
  margin-left: 6px;
}

/* ── Panel body ── */
.panel-body {
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Space Mono", monospace;
  font-size: 11px;
  letter-spacing: 2px;
  color: #4a6a80;
}
.status-led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #39ff14;
  box-shadow: 0 0 6px #39ff14;
  animation: blink 1.2s step-end infinite;
}
.status-led.amber {
  background: #ffb300;
  box-shadow: 0 0 6px #ffb300;
}
.status-led.red {
  background: #ff3d57;
  box-shadow: 0 0 6px #ff3d57;
  animation: none;
}
.status-led.green {
  background: #39ff14;
  box-shadow: 0 0 6px #39ff14;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

/* ── Field group ── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field-label {
  font-family: "Space Mono", monospace;
  font-size: 10px;
  letter-spacing: 3px;
  color: #3a5a70;
  font-weight: 700;
}
.field-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 10, 22, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 5px;
  padding: 0 12px;
  height: 44px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-wrap.focused {
  border-color: rgba(0, 229, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.07),
    inset 0 0 8px rgba(0, 229, 255, 0.04);
}
.field-wrap.error {
  border-color: rgba(255, 61, 87, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 61, 87, 0.06);
}
.field-ico {
  width: 15px;
  height: 15px;
  color: #3a5a70;
  flex-shrink: 0;
  transition: color 0.2s;
}
.field-wrap.focused .field-ico {
  color: #00e5ff;
}
.field-wrap.error .field-ico {
  color: #ff3d57;
}
.field-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "Space Mono", monospace;
  font-size: 13px;
  color: #c0dce8;
  letter-spacing: 1px;
  caret-color: #00e5ff;
}
.field-input::placeholder {
  color: #2a4a5a;
}
.field-input:disabled {
  opacity: 0.5;
}
.pwd-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #3a5a70;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}
.pwd-toggle:hover {
  color: #00e5ff;
}

/* ── Error bar ── */
.err-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: "Space Mono", monospace;
  font-size: 11px;
  letter-spacing: 1px;
  color: #ff3d57;
  background: rgba(255, 61, 87, 0.06);
  border: 1px solid rgba(255, 61, 87, 0.2);
  border-radius: 4px;
  padding: 8px 12px;
}
.err-fade-enter-active,
.err-fade-leave-active {
  transition: all 0.25s;
}
.err-fade-enter,
.err-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Login button ── */
.login-btn {
  height: 46px;
  border: 1px solid #39ff14;
  border-radius: 5px;
  background: rgba(57, 255, 20, 0.07);
  color: #fff;
  font-family: "Orbitron", monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: 0 0 8px rgba(57, 255, 20, 0.5);
  margin-top: 4px;
}
.login-btn:hover:not(:disabled) {
  background: rgba(57, 255, 20, 0.14);
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.25);
}
.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.login-btn.loading {
  animation: runPulse 1.1s ease-in-out infinite;
}
@keyframes runPulse {
  0%,
  100% {
    box-shadow: 0 0 6px rgba(57, 255, 20, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.55);
  }
}
.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  pointer-events: none;
}
.spin-ring {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(57, 255, 20, 0.3);
  border-top-color: #39ff14;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Footer ── */
.login-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Space Mono", monospace;
  font-size: 11px;
  color: #2e4a5a;
  letter-spacing: 2px;
}
.footer-sep {
  color: #1a3040;
}
</style>
