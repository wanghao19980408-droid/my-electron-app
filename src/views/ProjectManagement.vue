<template>
  <div class="pm-page">
    <section class="hero">
      <div class="hero-left">
        <div class="eyebrow">// MISSION CONTROL CENTER</div>
        <h1 class="hero-title">
          {{ $t("project.title") }}<br />
          <span class="title-glow">{{ $t("project.subtitle") }}</span>
        </h1>
        <p class="hero-sub">{{ $t("project.desc") }}</p>
        <div class="hero-stats">
          <div class="hstat">
            <div class="hstat-val">{{ projects.length }}</div>
            <div class="hstat-key">{{ $t("project.stats.projects") }}</div>
          </div>
          <div class="hstat-div" />
          <div class="hstat">
            <div class="hstat-val">{{ totalConfigs }}</div>
            <div class="hstat-key">{{ $t("project.stats.configs") }}</div>
          </div>
          <div class="hstat-div" />
          <div class="hstat">
            <div class="hstat-val">{{ totalResults }}</div>
            <div class="hstat-key">{{ $t("project.stats.results") }}</div>
          </div>
        </div>
      </div>

      <div class="radar-wrap">
        <svg class="radar-svg" viewBox="0 0 200 200" aria-hidden="true">
          <circle
            v-for="r in radarRings"
            :key="r.r"
            cx="100"
            cy="100"
            :r="r.r"
            :stroke="`rgba(0,229,255,${r.o})`"
            stroke-width="1"
            fill="none"
          />
          <line
            x1="100"
            y1="10"
            x2="100"
            y2="190"
            stroke="rgba(0,229,255,0.06)"
            stroke-width="1"
          />
          <line
            x1="10"
            y1="100"
            x2="190"
            y2="100"
            stroke="rgba(0,229,255,0.06)"
            stroke-width="1"
          />
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="10"
            stroke="rgba(0,229,255,0.5)"
            stroke-width="1.5"
            style="
              transform-origin: 100px 100px;
              animation: radarSpin 4s linear infinite;
            "
          />
          <circle
            v-for="(d, i) in radarDots"
            :key="'d' + i"
            :cx="d.x"
            :cy="d.y"
            r="2.5"
            fill="#00e5ff"
            :opacity="d.o"
            style="filter: drop-shadow(0 0 4px #00e5ff)"
          />
        </svg>
        <div class="radar-label">{{ $t("project.sysOnline") }}</div>
      </div>

      <div class="active-card" :class="{ empty: !activeProject }">
        <template v-if="activeProject">
          <div class="ac-head">
            <span class="ac-dot" />
            <span class="ac-label">{{ $t("project.activeProject") }}</span>
          </div>
          <div class="ac-name">{{ activeProject.name }}</div>
          <div class="ac-meta">
            <span
              >{{ activeProject.records ? activeProject.records.length : 0 }}
              {{ $t("project.card.configs") }}</span
            >
            <span class="sep">·</span>
            <span
              >{{ projectResultCount(activeProject) }}
              {{ $t("project.card.results") }}</span
            >
          </div>
          <div class="ac-time">
            {{ $t("project.drawer.created") }}
            {{ fmtDate(activeProject.createdAt || activeProject.created_at) }}
          </div>
          <button class="ac-goto" @click="$router.push('/parameters')">
            {{ $t("project.goToParams") }}
          </button>
        </template>
        <template v-else>
          <div class="empty-ico" aria-hidden="true">◉</div>
          <div class="empty-txt">{{ $t("project.noActive") }}</div>
          <div class="empty-hint" v-html="$t('project.noActiveHint')" />
        </template>
      </div>
    </section>

    <div class="toolbar">
      <div class="tb-left">
        <span class="tb-label">// {{ $t("project.listTitle") }}</span>
        <span class="tb-count"
          >{{ filteredProjects.length }} / {{ projects.length }}</span
        >
      </div>
      <div class="tb-right">
        <div class="search-box" :class="{ focused: searchFocused }">
          <i class="el-icon-search search-ico" aria-hidden="true" />
          <input
            v-model="searchQueryRaw"
            class="search-input"
            :placeholder="$t('project.search')"
            :aria-label="$t('project.search')"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />
          <transition name="fade-scale">
            <button
              v-if="searchQueryRaw"
              class="search-clear"
              :aria-label="$t('common.clear')"
              @click="searchQueryRaw = ''"
            >
              ✕
            </button>
          </transition>
        </div>
        <button class="btn-new" @click="openCreateDialog">
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path
              d="M5.5 1v9M1 5.5h9"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          {{ $t("project.newProject") }}
        </button>
      </div>
    </div>

    <div
      class="grid-scroll"
      v-infinite-scroll="loadMoreProjects"
      :infinite-scroll-disabled="allLoaded"
      :infinite-scroll-distance="50"
    >
      <div class="empty-state" v-if="projects.length === 0">
        <div class="empty-rings" aria-hidden="true">
          <div
            v-for="s in ['r1', 'r2', 'r3']"
            :key="s"
            class="ring"
            :class="s"
          />
          <div class="ring-ico">⬡</div>
        </div>
        <div class="empty-title">{{ $t("project.noProject") }}</div>
        <div class="empty-hint-text">{{ $t("project.noProjectHint") }}</div>
      </div>

      <div class="projects-grid" v-else>
        <div
          v-for="(proj, idx) in pagedProjects"
          :key="proj.id"
          class="proj-card"
          :class="{ 'is-active': proj.id === activeProjectId }"
          :style="{ animationDelay: (idx % PAGE_SIZE) * 0.07 + 's' }"
        >
          <span class="corner tl" /><span class="corner tr" />
          <div class="card-head">
            <div
              class="status-dot"
              :class="{ 'has-result': projectResultCount(proj) > 0 }"
            />
            <div class="card-title-wrap">
              <div class="card-name" v-if="renamingId !== proj.id">
                {{ proj.name }}
              </div>
              <input
                v-else
                ref="renameInput"
                v-model="renameVal"
                class="rename-input"
                :aria-label="$t('project.card.rename')"
                @keydown.enter="confirmRename(proj.id)"
                @keydown.esc="renamingId = null"
                @blur="confirmRename(proj.id)"
                @click.stop
              />
            </div>
            <div class="card-actions">
              <button
                class="ca-btn"
                @click.stop="startRename(proj)"
                :title="$t('project.card.rename')"
                :aria-label="$t('project.card.rename')"
              >
                <i class="el-icon-edit" />
              </button>
              <button
                class="ca-btn danger"
                @click.stop="deleteProject(proj)"
                :title="$t('project.card.delete')"
                :aria-label="$t('project.card.delete')"
              >
                <i class="el-icon-delete" />
              </button>
            </div>
          </div>
          <div class="card-id">
            {{ $t("project.card.id") }} · {{ proj.id.slice(-8).toUpperCase() }}
          </div>
          <div class="card-date">
            {{ fmtFullDate(proj.createdAt || proj.created_at) }}
          </div>
          <div class="card-divider" />

          <div class="card-stats">
            <div class="cs-item">
              <div class="cs-val">
                {{ proj.records ? proj.records.length : 0 }}
              </div>
              <div class="cs-key">{{ $t("project.card.configs") }}</div>
            </div>
            <div class="cs-item">
              <div
                class="cs-val"
                :class="projectResultCount(proj) > 0 ? 'val-green' : 'val-dim'"
              >
                {{ projectResultCount(proj) }}
              </div>
              <div class="cs-key">{{ $t("project.card.results") }}</div>
            </div>
            <div class="cs-item">
              <div class="cs-val val-amber">{{ latestRunDate(proj) }}</div>
              <div class="cs-key">{{ $t("project.card.lastRun") }}</div>
            </div>
          </div>

          <div class="card-has-result" v-if="projectResultCount(proj) > 0">
            <i class="el-icon-circle-check" />
            {{ $t("project.drawer.optCalcDone") }}
          </div>
          <div class="card-no-result" v-else>
            {{ $t("project.card.noResult") }}
          </div>

          <div class="card-footer">
            <button
              class="btn-set-active"
              :class="{ active: proj.id === activeProjectId }"
              @click="setActive(proj.id)"
            >
              <span v-if="proj.id === activeProjectId"
                ><i class="el-icon-check" />
                {{ $t("project.card.active") }}</span
              >
              <span v-else>{{ $t("project.card.setActive") }}</span>
            </button>
            <button class="btn-detail" @click="openDetail(proj)">
              {{ $t("project.card.detail") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div
        class="modal-overlay"
        v-if="showCreate"
        role="dialog"
        :aria-label="$t('project.modal.title')"
        @click.self="showCreate = false"
      >
        <div class="modal-box wizard-box">
          <div
            v-for="c in ['tl', 'tr', 'bl', 'br']"
            :key="c"
            class="modal-corner"
            :class="c"
          />
          <div class="modal-head">
            <span class="modal-title">// {{ $t("project.modal.title") }}</span>
            <button
              class="modal-close"
              :aria-label="$t('common.close')"
              @click="showCreate = false"
            >
              ✕
            </button>
          </div>
          <div class="modern-breadcrumb" role="tablist">
            <template v-for="(stepKey, i) in WIZARD_STEPS">
              <div
                :key="'step-' + i"
                class="crumb-item"
                :class="{
                  active: createStep === i,
                  done: createStep > i,
                  clickable: i <= highestStepReached,
                }"
                role="tab"
                :aria-selected="createStep === i"
                @click="jumpToStep(i)"
              >
                <span class="crumb-text">{{ $t(stepKey) }}</span>
              </div>
              <i
                v-if="i < WIZARD_STEPS.length - 1"
                :key="'sep-' + i"
                class="el-icon-arrow-right crumb-sep"
              ></i>
            </template>
          </div>

          <div class="modal-body" v-show="createStep === 0">
            <div class="field-label">
              {{ $t("project.modal.name") }} <span class="required">*</span>
            </div>
            <input
              ref="createInput"
              v-model="newProject.name"
              class="field-input"
              :placeholder="$t('project.modal.namePlaceholder')"
              maxlength="40"
              @keydown.enter="nextStep"
            />
            <div class="field-label mt">{{ $t("project.modal.desc") }}</div>
            <textarea
              v-model="newProject.desc"
              class="field-textarea"
              :placeholder="$t('project.modal.descPlaceholder')"
              rows="3"
            />
          </div>

          <div class="modal-body step-scroll" v-show="createStep === 1">
            <el-form
              :model="newProject.baseParams"
              label-width="140px"
              size="small"
              class="param-form dark-form"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="section-title">
                    // {{ $t("params.groups.launchPoint") }}
                  </div>
                  <el-form-item
                    v-for="f in LAUNCH_FIELDS"
                    :key="f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams[f.key]"
                      :precision="f.precision"
                      :step="f.step"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <div class="section-title">
                    // {{ $t("params.groups.structure") }}
                  </div>
                  <el-form-item
                    v-for="f in STRUCT_FIELDS"
                    :key="f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams[f.key]"
                      :precision="f.precision"
                      :step="f.step"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="modal-body step-scroll" v-show="createStep === 2">
            <el-form
              :model="newProject.baseParams"
              label-width="140px"
              size="small"
              class="param-form dark-form"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="stage-badge-wrap">
                    <div class="stage-badge s1">
                      <span class="dot" /> STAGE · I
                    </div>
                  </div>
                  <el-form-item
                    v-for="f in STAGE_FIELDS"
                    :key="'s1' + f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams.stage1[f.key]"
                      :precision="f.precision"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <div class="stage-badge-wrap">
                    <div class="stage-badge s2">
                      <span class="dot" /> STAGE · II
                    </div>
                  </div>
                  <el-form-item
                    v-for="f in STAGE_FIELDS"
                    :key="'s2' + f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams.stage2[f.key]"
                      :precision="f.precision"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="modal-body step-scroll" v-show="createStep === 3">
            <el-form
              :model="newProject.baseParams"
              label-width="190px"
              size="small"
              class="param-form dark-form"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="section-title">
                    // {{ $t("params.groups.orbit") }}
                  </div>
                  <el-form-item
                    v-for="f in ORBIT_FIELDS"
                    :key="f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams[f.key]"
                      :precision="f.precision"
                      :step="f.step"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <div class="section-title">
                    // {{ $t("params.groups.time") }}
                  </div>
                  <el-form-item
                    v-for="f in TIME_FIELDS"
                    :key="f.key"
                    :label="$t(f.label)"
                  >
                    <el-input-number
                      v-model="newProject.baseParams[f.key]"
                      :step="f.step"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="modal-foot">
            <button
              class="mbtn cancel"
              v-if="createStep > 0"
              @click="createStep--"
            >
              {{ $t("wizard.prev") }}
            </button>
            <button
              class="mbtn confirm"
              v-if="createStep < 3"
              @click="nextStep"
              :disabled="createStep === 0 && !newProject.name.trim()"
            >
              {{ $t("wizard.next") }}
            </button>
            <button
              class="mbtn confirm"
              v-if="createStep === 3"
              @click="confirmCreate"
            >
              {{ $t("wizard.finish") }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="overlay-fade">
      <div
        class="drawer-overlay"
        v-if="detailProject"
        role="dialog"
        :aria-label="detailProject.name"
        @click.self="closeDetail"
      >
        <transition name="drawer-slide">
          <div class="drawer drawer-wide" v-if="detailProject" key="dp">
            <div class="drawer-head">
              <div class="drawer-title">
                <span
                  class="drawer-dot"
                  :class="{
                    'has-result': projectResultCount(detailProject) > 0,
                  }"
                />
                {{ detailProject.name }}
              </div>
              <div class="drawer-head-actions">
                <button
                  class="export-btn"
                  @click="exportProject(detailProject)"
                >
                  <i class="el-icon-download" />
                  {{ $t("project.drawer.exportData") }}
                </button>
                <button
                  class="drawer-close"
                  :aria-label="$t('common.close')"
                  @click="closeDetail"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="drawer-meta-bar">
              <span class="dmb-item"
                ><i class="el-icon-key" />
                {{ detailProject.id.slice(-8).toUpperCase() }}</span
              >
              <span class="dmb-sep">·</span>
              <span class="dmb-item"
                ><i class="el-icon-time" />
                {{
                  fmtFullDate(
                    detailProject.createdAt || detailProject.created_at,
                  )
                }}</span
              >
              <template v-if="detailProject.desc">
                <span class="dmb-sep">·</span>
                <span class="dmb-item dmb-desc">{{ detailProject.desc }}</span>
              </template>
            </div>

            <div class="drawer-tabs">
              <button
                class="dt-btn"
                :class="{ active: drawerTab === 'base' }"
                @click="drawerTab = 'base'"
              >
                <i class="el-icon-cpu"></i> 基础架构 & 基础弹道
              </button>
              <button
                class="dt-btn"
                :class="{ active: drawerTab === 'opt' }"
                @click="drawerTab = 'opt'"
              >
                <i class="el-icon-data-analysis"></i> 弹道优化档案区
              </button>
            </div>

            <div class="drawer-body">
              <div v-show="drawerTab === 'base'" class="drawer-tab-content">
                <div
                  class="base-params-wrapper"
                  v-if="detailProject.baseParams"
                >
                  <div class="custom-params-grid">
                    <div
                      class="cp-item"
                      v-for="(item, idx) in displayFlatBaseParams"
                      :key="'bp-' + idx"
                      :class="{ 'is-highlight': item.isHighlight }"
                    >
                      <div class="cp-label">{{ item.key }}</div>
                      <div class="cp-val">{{ item.val }}</div>
                    </div>
                  </div>
                </div>
                <div class="base-params-empty" v-else>
                  <i class="el-icon-warning-outline" />
                  {{ $t("project.drawer.noBaseConfig") }}
                </div>

                <div
                  class="drawer-section-label"
                  style="
                    margin-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  "
                >
                  <span>// 优化配置前的弹道 (Baseline Trajectory)</span>
                  <button
                    class="opt-apply-btn"
                    style="
                      border-color: rgba(57, 255, 20, 0.4);
                      color: #39ff14;
                      background: rgba(57, 255, 20, 0.08);
                    "
                    @click="runBaseline(detailProject.id)"
                    :disabled="isBallisticRunning"
                  >
                    <i
                      :class="
                        isBallisticRunning &&
                        runningBallisticType === 'baseline'
                          ? 'el-icon-loading'
                          : 'el-icon-video-play'
                      "
                    ></i>
                    {{
                      isBallisticRunning && runningBallisticType === "baseline"
                        ? "弹道计算中..."
                        : "生成基础弹道"
                    }}
                  </button>
                </div>
                <div
                  class="trajectory-list"
                  style="padding: 0 26px 14px"
                  v-if="baselineBallistics.length"
                >
                  <div
                    class="trajectory-card"
                    v-for="tr in baselineBallistics"
                    :key="tr.id"
                    @click="viewProfile(tr.id)"
                  >
                    <div class="tr-status"></div>
                    <div class="tr-body">
                      <div class="tr-main">
                        <span
                          class="tr-name"
                          @click.stop="renameBallisticRecord(tr)"
                          style="cursor: pointer"
                          title="点击重命名"
                        >
                          {{
                            tr.name ||
                            "基础弹道 #" + tr.id.slice(-6).toUpperCase()
                          }}
                          <i
                            class="el-icon-edit"
                            style="margin-left: 6px; color: #5a8aaa"
                          ></i>
                        </span>
                        <span class="tr-time">{{ fmtFullDate(tr.ranAt) }}</span>
                      </div>
                    </div>
                    <button
                      class="tr-action"
                      @click.stop="deleteBallistic(tr.id)"
                      title="删除"
                    >
                      <i class="el-icon-delete"></i>
                    </button>
                  </div>
                </div>
                <div class="base-params-empty" v-else style="padding-top: 5px">
                  <i class="el-icon-info" />
                  暂无基础弹道记录，请点击上方按钮生成。
                </div>
              </div>

              <div v-show="drawerTab === 'opt'" class="drawer-tab-content">
                <div class="drawer-section-label">
                  // {{ $t("project.drawer.recordsTitle") }}
                </div>
                <div class="config-list">
                  <transition name="live-fade">
                    <div
                      class="drawer-live"
                      v-if="
                        isSimulating && detailProject.id === activeProjectId
                      "
                    >
                      <div class="live-header">
                        <div
                          style="display: flex; align-items: center; gap: 10px"
                        >
                          <span class="live-blink" /><span>{{
                            $t("project.drawer.computing")
                          }}</span>
                        </div>
                        <button class="stop-btn" @click="stopSimulation">
                          <i class="el-icon-video-pause" />
                          {{ $t("project.drawer.stopCalc") }}
                        </button>
                      </div>
                      <div class="live-body" v-if="optProgress">
                        <div
                          class="live-line"
                          v-for="row in liveRows(optProgress)"
                          :key="row.k"
                        >
                          <span class="live-key">{{ row.k }}:</span>
                          <span
                            class="live-val"
                            :class="{ 'live-dim': row.dim }"
                            >{{ row.v }}</span
                          >
                        </div>
                      </div>
                      <div class="live-waiting" v-else>
                        <span class="live-dots">···</span>
                        {{ $t("project.drawer.initOptimizer") }}
                      </div>
                    </div>
                  </transition>

                  <div
                    v-if="
                      !detailProject.records || !detailProject.records.length
                    "
                    class="config-empty"
                  >
                    {{ $t("project.drawer.noRecords") }}
                    <div style="margin-top: 10px">
                      <el-button
                        type="text"
                        style="color: #00e5ff"
                        @click="$router.push('/parameters')"
                      >
                        {{ $t("project.drawer.goToOpt") }} →
                      </el-button>
                    </div>
                  </div>

                  <div
                    v-for="(rec, idx) in detailProject.records"
                    :key="rec.id"
                    class="config-item"
                    :style="{ animationDelay: idx * 0.06 + 0.15 + 's' }"
                  >
                    <div class="cfg-head">
                      <span class="cfg-dot has-result" />
                      <span
                        class="cfg-name"
                        @click="renameOptRecord(rec)"
                        style="cursor: pointer"
                        title="点击重命名"
                      >
                        {{
                          rec.name ||
                          $t("project.drawer.recordLabel") +
                            " #" +
                            (detailProject.records.length - idx)
                        }}
                        <i
                          class="el-icon-edit"
                          style="margin-left: 6px; color: #5a8aaa"
                        ></i>
                        <span
                          class="opt-badge"
                          :class="isOptTypeMax(rec) ? 'type1' : 'type2'"
                          @click.stop
                        >
                          {{
                            isOptTypeMax(rec)
                              ? $t("project.drawer.optTypeMax")
                              : $t("project.drawer.optTypeMin")
                          }}
                        </span>
                      </span>
                      <span class="cfg-time">{{ fmtFullDate(rec.ranAt) }}</span>
                      <div class="cfg-actions">
                        <button
                          class="cfg-btn danger"
                          @click.stop="deleteRecord(rec)"
                          :aria-label="$t('project.card.delete')"
                        >
                          <i class="el-icon-delete" />
                        </button>
                      </div>
                    </div>

                    <div class="rec-config-block" v-if="rec.optConfig">
                      <div class="rec-section-label">
                        // {{ $t("project.drawer.recInitConfig") }}
                      </div>
                      <div class="custom-params-grid">
                        <div
                          class="cp-item"
                          v-for="(item, i) in flatOf(rec.optConfig)"
                          :key="i"
                        >
                          <div class="cp-label">{{ item.key }}</div>
                          <div class="cp-val">{{ item.val }}</div>
                        </div>
                      </div>
                    </div>

                    <div
                      class="cfg-result-panel"
                      v-if="rec.result && rec.result.optimized_params"
                    >
                      <div class="crp-header">
                        <span class="crp-pulse" />
                        <span class="crp-label">{{
                          $t("project.drawer.optResult")
                        }}</span>
                      </div>
                      <div class="opt-grid">
                        <div
                          class="opt-cell"
                          v-for="(item, i) in getOptParamsList(rec)"
                          :key="i"
                        >
                          <div class="opt-label">{{ item.label }}</div>
                          <div class="opt-value">
                            {{ item.value
                            }}<span class="opt-unit">{{ item.unit }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="cfg-no-result" v-else-if="rec.result">
                      {{ $t("project.drawer.parseError") }}
                    </div>

                    <div class="opt-trajectory-section">
                      <div
                        class="crp-header"
                        style="
                          background: rgba(192, 132, 252, 0.08);
                          border-bottom-color: rgba(192, 132, 252, 0.2);
                        "
                      >
                        <span
                          class="crp-pulse"
                          style="
                            background: #c084fc;
                            box-shadow: 0 0 8px #c084fc;
                          "
                        ></span>
                        <span class="crp-label" style="color: #c084fc"
                          >应用于此结果的优化后弹道</span
                        >
                        <div style="margin-left: auto">
                          <button
                            class="opt-apply-btn"
                            style="
                              border-color: rgba(192, 132, 252, 0.4);
                              color: #c084fc;
                              background: rgba(192, 132, 252, 0.1);
                            "
                            @click="
                              runOptimizedBallistic(detailProject.id, rec.id)
                            "
                            :disabled="isBallisticRunning"
                          >
                            <i
                              :class="
                                isBallisticRunning &&
                                runningBallisticType === 'opt-' + rec.id
                                  ? 'el-icon-loading'
                                  : 'el-icon-video-play'
                              "
                            ></i>
                            {{
                              isBallisticRunning &&
                              runningBallisticType === "opt-" + rec.id
                                ? "弹道计算中..."
                                : "生成优化弹道"
                            }}
                          </button>
                        </div>
                      </div>
                      <div
                        class="trajectory-list"
                        style="padding: 10px"
                        v-if="getOptimizedBallistics(rec.id).length > 0"
                      >
                        <div
                          class="trajectory-card"
                          v-for="tr in getOptimizedBallistics(rec.id)"
                          :key="tr.id"
                          @click="viewProfile(tr.id)"
                          style="
                            background: rgba(10, 15, 25, 0.6);
                            border-color: rgba(192, 132, 252, 0.2);
                          "
                        >
                          <div class="tr-status optimized"></div>
                          <div class="tr-body">
                            <div class="tr-main">
                              <span
                                class="tr-name"
                                @click.stop="renameBallisticRecord(tr)"
                                style="cursor: pointer"
                                title="点击重命名"
                              >
                                {{
                                  tr.name ||
                                  "优化弹道 #" + tr.id.slice(-6).toUpperCase()
                                }}
                                <i
                                  class="el-icon-edit"
                                  style="margin-left: 6px; color: #5a8aaa"
                                ></i>
                              </span>
                              <span class="tr-time">{{
                                fmtFullDate(tr.ranAt)
                              }}</span>
                            </div>
                          </div>
                          <button
                            class="tr-action"
                            @click.stop="deleteBallistic(tr.id)"
                            title="删除"
                          >
                            <i class="el-icon-delete"></i>
                          </button>
                        </div>
                      </div>
                      <div
                        v-else
                        style="
                          padding: 12px 14px;
                          font-size: 12px;
                          color: #5a8aaa;
                        "
                      >
                        <i class="el-icon-info"></i>
                        暂无优化弹道记录，请点击右上角生成。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import html2pdf from "html2pdf.js";

const PAGE_SIZE = 20;
const PAGE_STEP = 15;
const SEARCH_DEBOUNCE_MS = 200;

const LAUNCH_FIELDS = [
  { key: "longitude", label: "params.labels.lon", precision: 4, step: 0.1 },
  { key: "latitude", label: "params.labels.lat", precision: 4, step: 0.1 },
  { key: "azimuth", label: "params.labels.az", precision: 4, step: 1 },
  { key: "altitude", label: "params.labels.alt", precision: 0, step: 10 },
];
const STRUCT_FIELDS = [
  { key: "length", label: "params.labels.len", precision: 2, step: 0.5 },
  {
    key: "fairingMass",
    label: "params.labels.fairing",
    precision: 0,
    step: 10,
  },
  { key: "loadMass", label: "params.labels.load", precision: 0, step: 10 },
  { key: "diameter", label: "params.labels.dia", precision: 2, step: 0.1 },
];
const STAGE_FIELDS = [
  { key: "structMass", label: "params.labels.struct" },
  { key: "oxMass", label: "params.labels.ox" },
  { key: "fuelMass", label: "params.labels.fuel" },
  { key: "tankOxMass", label: "params.labels.tankOx" },
  { key: "tankFuelMass", label: "params.labels.tankFuel" },
  { key: "Isp", label: "params.labels.Isp" },
  { key: "mixingRatio", label: "params.labels.mix", precision: 2 },
  { key: "totalConsumption", label: "params.labels.consume" },
  { key: "enginesNum", label: "params.labels.engineNum" },
  { key: "thrust", label: "params.labels.thrust" },
  { key: "nozzleArea", label: "params.labels.nozzle", precision: 3 },
  { key: "mountingAngle", label: "params.labels.mountAngle", precision: 2 },
];
const ORBIT_FIELDS = [
  {
    key: "trackHeight",
    label: "params.labels.trackHeight",
    precision: 0,
    step: 10,
  },
  {
    key: "eccentricity",
    label: "params.labels.ecc",
    precision: 4,
    step: 0.001,
  },
  {
    key: "trackInclination",
    label: "params.labels.trackInc",
    precision: 3,
    step: 1,
  },
];
const TIME_FIELDS = [
  { key: "time1", label: "params.labels.t1", step: 1 },
  { key: "time2", label: "params.labels.t2", step: 0.5 },
  { key: "time3", label: "params.labels.t3", step: 1 },
  { key: "time4", label: "params.labels.t4", step: 1 },
  { key: "time5", label: "params.labels.t5", step: 1 },
];

const WIZARD_STEPS = [
  "wizard.step1",
  "wizard.step2",
  "wizard.step3",
  "wizard.step4",
];
const RADAR_RINGS = [
  { r: 90, o: 0.06 },
  { r: 65, o: 0.09 },
  { r: 40, o: 0.13 },
  { r: 15, o: 0.2 },
];
const LABEL_DICT_KEYS = {
  longitude: "params.labels.lon",
  latitude: "params.labels.lat",
  azimuth: "params.labels.az",
  altitude: "params.labels.alt",
  length: "params.labels.len",
  fairingMass: "params.labels.fairing",
  loadMass: "params.labels.load",
  diameter: "params.labels.dia",
  structMass: "params.labels.struct",
  oxMass: "params.labels.ox",
  tankOxMass: "params.labels.tankOx",
  fuelMass: "params.labels.fuel",
  tankFuelMass: "params.labels.tankFuel",
  Isp: "params.labels.Isp",
  mixingRatio: "params.labels.mix",
  totalConsumption: "params.labels.consume",
  enginesNum: "params.labels.engineNum",
  thrust: "params.labels.thrust",
  nozzleArea: "params.labels.nozzle",
  mountingAngle: "params.labels.mountAngle",
  trackHeight: "params.labels.trackHeight",
  eccentricity: "params.labels.ecc",
  trackInclination: "params.labels.trackInc",
  time1: "params.labels.t1",
  time2: "params.labels.t2",
  time3: "params.labels.t3",
  time4: "params.labels.t4",
  time5: "params.labels.t5",
  optType: "params.groups.optType",
  maxIterations: "params.labels.maxIter",
  errSemiMajorAxis: "params.labels.errSemi",
  errEccentricity: "params.labels.errEcc",
  errInclination: "params.labels.errInc",
  launchAzimuth: "params.labels.initAz",
  attackAngle: "params.labels.initAttack",
  slope1: "params.labels.initSlope1",
  slope2: "params.labels.initSlope2",
  finalShutdown: "params.labels.initTime",
};

const FLAT_CACHE = new WeakMap();

function defaultBaseParams() {
  return {
    longitude: 100.5,
    latitude: 41.1,
    azimuth: 191.335,
    altitude: 994,
    length: 46.0,
    fairingMass: 1125,
    loadMass: 1383.28,
    diameter: 3.35,
    trackHeight: 500,
    eccentricity: 0,
    trackInclination: 97.397,
    time1: 170,
    time2: 1.2,
    time3: 10,
    time4: 90,
    time5: 3,
    stage1: {
      structMass: 11612.7,
      oxMass: 115179.729,
      fuelMass: 41483.442,
      tankOxMass: 113911.395,
      tankFuelMass: 41368.47,
      Isp: 2840.909,
      mixingRatio: 2.8034,
      totalConsumption: 897.6,
      enginesNum: 4,
      thrust: 637.5,
      nozzleArea: 0.611,
      mountingAngle: 2.5,
    },
    stage2: {
      structMass: 3092.5,
      oxMass: 21800.6605,
      fuelMass: 7449.582,
      tankOxMass: 21741.245,
      tankFuelMass: 7438.86,
      Isp: 3428.169,
      mixingRatio: 3.0341,
      totalConsumption: 71,
      enginesNum: 2,
      thrust: 121.7,
      nozzleArea: 0.859,
      mountingAngle: 2.5,
    },
  };
}

export default {
  name: "ProjectManagement",
  data: () => ({
    searchQueryRaw: "",
    searchQuery: "",
    searchFocused: false,
    searchTimer: null,
    displayLimit: PAGE_SIZE,
    showCreate: false,
    createStep: 0,
    highestStepReached: 0,
    detailProject: null,
    renamingId: null,
    renameVal: "",
    drawerTab: "base",
    runningBallisticType: null,
    newProject: { name: "", desc: "", baseParams: defaultBaseParams() },
    radarDots: [
      { x: 135, y: 62, o: 0.8 },
      { x: 72, y: 148, o: 0.6 },
      { x: 158, y: 130, o: 0.9 },
      { x: 55, y: 78, o: 0.5 },
      { x: 120, y: 165, o: 0.7 },
    ],
    PAGE_SIZE,
    WIZARD_STEPS,
    LAUNCH_FIELDS,
    STRUCT_FIELDS,
    STAGE_FIELDS,
    ORBIT_FIELDS,
    TIME_FIELDS,
    radarRings: RADAR_RINGS,
  }),
  computed: {
    ...mapState([
      "projects",
      "activeProjectId",
      "isSimulating",
      "optProgress",
      "isBallisticRunning",
    ]),
    activeProject() {
      return this.projects.find((p) => p.id === this.activeProjectId) || null;
    },
    filteredProjects() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.projects;
      return this.projects.filter((p) => p.name.toLowerCase().includes(q));
    },
    pagedProjects() {
      return this.filteredProjects.slice(0, this.displayLimit);
    },
    allLoaded() {
      return this.displayLimit >= this.filteredProjects.length;
    },
    totalConfigs() {
      return this.projects.reduce((s, p) => s + (p.records?.length || 0), 0);
    },
    totalResults() {
      return this.projects.reduce((s, p) => s + this.projectResultCount(p), 0);
    },
    baselineBallistics() {
      if (!this.detailProject || !this.detailProject.ballisticRecords)
        return [];
      return this.detailProject.ballisticRecords.filter(
        (r) => r.ballisticType === "baseline",
      );
    },
    displayFlatBaseParams() {
      if (!this.detailProject || !this.detailProject.baseParams) return [];
      return this.flatOf(this.detailProject.baseParams);
    },
  },
  watch: {
    projects: {
      deep: true,
      handler(v) {
        if (this.detailProject) {
          this.detailProject =
            v.find((p) => p.id === this.detailProject.id) || null;
        }
      },
    },
    searchQueryRaw(val) {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.searchQuery = val;
        this.displayLimit = PAGE_SIZE;
      }, SEARCH_DEBOUNCE_MS);
    },
  },
  mounted() {
    this._esc = (e) => {
      if (e.key !== "Escape") return;
      if (this.detailProject) this.closeDetail();
      else if (this.showCreate) this.showCreate = false;
    };
    document.addEventListener("keydown", this._esc);
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this._esc);
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },
  methods: {
    ...mapActions([
      "CREATE_PROJECT",
      "DELETE_PROJECT",
      "RENAME_PROJECT",
      "SET_ACTIVE_PROJECT",
      "DELETE_RECORD",
    ]),
    renameBallisticRecord(tr) {
      this.$prompt("请输入弹道自定义名称", "重命名弹道", {
        inputValue: tr.name || "",
        customClass: "hud-confirm-box",
      })
        .then(({ value }) => {
          this.$store.dispatch("RENAME_BALLISTIC_RECORD", {
            recordId: tr.id,
            name: value,
          });
        })
        .catch(() => {});
    },
    renameOptRecord(rec) {
      this.$prompt("请输入优化记录自定义名称", "重命名记录", {
        inputValue: rec.name || "",
        customClass: "hud-confirm-box",
      })
        .then(({ value }) => {
          this.$store.dispatch("RENAME_OPT_RECORD", {
            recordId: rec.id,
            name: value,
          });
        })
        .catch(() => {});
    },

    async runBaseline(projectId) {
      if (this.isBallisticRunning) return;
      this.runningBallisticType = "baseline";
      try {
        await this.$store.dispatch("RUN_BASELINE_BALLISTIC", { projectId });
        this.$message.success("基础弹道仿真完成！");
      } catch (err) {
        if (err !== "MANUAL_STOP" && err?.message !== "MANUAL_STOP") {
          this.$message.error("仿真失败: " + (err.message || err));
        }
      } finally {
        this.runningBallisticType = null;
      }
    },

    async runOptimizedBallistic(projectId, recordId) {
      if (this.isBallisticRunning) return;
      this.runningBallisticType = "opt-" + recordId;
      try {
        await this.$store.dispatch("RUN_BALLISTIC", { projectId, recordId });
        this.$message.success("优化后弹道仿真完成！");
      } catch (err) {
        if (err !== "MANUAL_STOP" && err?.message !== "MANUAL_STOP") {
          this.$message.error("仿真失败: " + (err.message || err));
        }
      } finally {
        this.runningBallisticType = null;
      }
    },

    getOptimizedBallistics(optRecordId) {
      if (!this.detailProject || !this.detailProject.ballisticRecords)
        return [];
      return this.detailProject.ballisticRecords.filter(
        (r) => r.ballisticType === "optimized" && r.optRecordId === optRecordId,
      );
    },

    viewProfile(recordId) {
      this.$router.push({ name: "FlightProfile", query: { recordId } });
    },

    deleteBallistic(recordId) {
      this.$confirm(
        "确定删除这条弹道记录及相关数据文件？操作不可恢复。",
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          customClass: "hud-confirm-box",
        },
      )
        .then(() => {
          this.$store.dispatch("DELETE_BALLISTIC_RECORD", { recordId });
          this.$message.success("弹道记录已删除");
        })
        .catch(() => {});
    },

    flatOf(params) {
      if (!params) return [];
      const cached = FLAT_CACHE.get(params);
      if (cached && cached.lang === this.$i18n?.locale) return cached.data;
      const t = (k) => this.$t(k);
      const flat = [];
      const walk = (obj, prefix = "") => {
        for (const k in obj) {
          const val = obj[k];
          const labelKey = LABEL_DICT_KEYS[k];
          const label = labelKey ? t(labelKey) : k;
          const fullLabel = prefix ? `${prefix} · ${label}` : label;
          if (val !== null && typeof val === "object") {
            let nextPrefix = fullLabel;
            if (k === "stage1") nextPrefix = t("params.groups.stage1");
            else if (k === "stage2") nextPrefix = t("params.groups.stage2");
            else if (k === "init1" || k === "init2")
              nextPrefix = t("params.groups.init");
            walk(val, nextPrefix);
          } else {
            flat.push({ key: fullLabel, val });
          }
        }
      };
      walk(params);
      FLAT_CACHE.set(params, { lang: this.$i18n?.locale, data: flat });
      return flat;
    },
    projectResultCount(proj) {
      if (!proj?.records?.length) return 0;
      return proj.records.filter((r) => r.result && r.result.optimized_params)
        .length;
    },
    isOptTypeMax(rec) {
      return rec.optConfig && String(rec.optConfig.optType) === "1";
    },
    loadMoreProjects() {
      if (!this.allLoaded) this.displayLimit += PAGE_STEP;
    },
    latestRunDate(proj) {
      if (!proj.records || !proj.records.length) return "—";
      const d = new Date(proj.records[0].ranAt);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    },
    fmtDate(iso) {
      if (!iso) return "—";
      const locale = this.$i18n?.locale === "zh" ? "zh-CN" : "en-US";
      return new Date(iso).toLocaleDateString(locale);
    },
    fmtFullDate(iso) {
      if (!iso) return "—";
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    formatArray: (arr) =>
      Array.isArray(arr) && arr.length ? arr.join("  ") : "",
    liveRows(p) {
      const rows = [
        { k: this.$t("app.input"), v: `[${this.formatArray(p.input)}]` },
        { k: this.$t("app.output"), v: `[${this.formatArray(p.output)}]` },
      ];
      if (p.error !== undefined)
        rows.push({ k: this.$t("app.error"), v: p.error, dim: true });
      return rows;
    },
    getOptParamsList(rec) {
      if (!rec?.result?.optimized_params) return [];
      const params = rec.result.optimized_params;
      const isMax = String(rec.optConfig?.optType || "1") === "1";
      const list = [];
      const t = (k) => this.$t(k);
      if (params.length > 0)
        list.push({
          label: t("project.optParams.launchAzimuth"),
          value: params[0].toFixed(3),
          unit: "°",
        });
      if (params.length > 1)
        list.push({
          label: isMax ? t("params.labels.load") : t("params.labels.initTime"),
          value: params[1].toFixed(2),
          unit: isMax ? "kg" : "s",
        });
      if (params.length > 2)
        list.push({
          label: t("params.labels.initAttack"),
          value: params[2].toFixed(3),
          unit: "°",
        });
      if (params.length > 3)
        list.push({
          label: t("params.labels.initSlope1"),
          value: params[3].toFixed(4),
          unit: "",
        });
      for (let i = 4; i < params.length; i++) {
        const label =
          i === 4
            ? t("params.labels.initSlope2")
            : `${t("project.optParams.pitchProgramSlope")} ${i - 2}`;
        list.push({ label, value: params[i].toFixed(4), unit: "" });
      }
      return list;
    },
    openDetail(proj) {
      this.detailProject = proj;
      this.drawerTab = "base";
      this.$store.commit("SET_DETAIL_OPEN", true);
    },
    closeDetail() {
      this.detailProject = null;
      this.$store.commit("SET_DETAIL_OPEN", false);
    },
    openCreateDialog() {
      this.newProject = { name: "", desc: "", baseParams: defaultBaseParams() };
      this.createStep = 0;
      this.highestStepReached = 0;
      this.showCreate = true;
      this.$nextTick(() => this.$refs.createInput?.focus());
    },
    nextStep() {
      if (this.createStep === 0 && !this.newProject.name.trim()) return;
      if (this.createStep < WIZARD_STEPS.length - 1) {
        this.createStep++;
        this.highestStepReached = Math.max(
          this.highestStepReached,
          this.createStep,
        );
      }
    },
    jumpToStep(i) {
      if (this.createStep === 0 && i > 0 && !this.newProject.name.trim())
        return;
      if (i <= this.highestStepReached) {
        this.createStep = i;
      }
    },
    async confirmCreate() {
      const name = this.newProject.name.trim();
      if (!name) return;
      if (this.projects.some((p) => p.name === name)) {
        this.$message.warning(
          this.$t("project.msg.nameExistsWarn").replace("{name}", name),
        );
        return;
      }
      await this.CREATE_PROJECT({
        name,
        desc: this.newProject.desc.trim(),
        baseParams: JSON.parse(JSON.stringify(this.newProject.baseParams)),
      });
      this.showCreate = false;
      this.$confirm(
        this.$t("project.msg.createSuccessConfirm").replace("{name}", name),
        this.$t("common.confirm"),
        {
          confirmButtonText: this.$t("project.msg.goConfig"),
          cancelButtonText: this.$t("project.msg.stayHere"),
          type: "success",
          customClass: "hud-confirm-box",
        },
      )
        .then(() => this.$router.push("/parameters"))
        .catch(() => {});
    },
    deleteProject(proj) {
      this.$confirm(
        this.$t("project.msg.delConfirmMsg", { name: proj.name }),
        this.$t("project.msg.delConfirmTitle"),
        {
          confirmButtonText: this.$t("project.modal.confirmDel"),
          cancelButtonText: this.$t("project.modal.cancel"),
          type: "warning",
          customClass: "hud-confirm-box",
        },
      )
        .then(() => {
          this.DELETE_PROJECT({ projectId: proj.id });
          if (this.detailProject?.id === proj.id) this.detailProject = null;
          this.$message({
            message: this.$t("project.msg.deleted", { name: proj.name }),
            type: "info",
          });
        })
        .catch(() => {});
    },
    deleteRecord(rec) {
      this.$confirm(
        this.$t("project.msg.delRecordConfirmMsg"),
        this.$t("project.msg.delRecordConfirmTitle"),
        {
          confirmButtonText: this.$t("project.modal.confirmDel"),
          cancelButtonText: this.$t("project.modal.cancel"),
          type: "warning",
          customClass: "hud-confirm-box",
        },
      )
        .then(() => {
          this.DELETE_RECORD({ recordId: rec.id });
          this.$message({
            message: this.$t("project.msg.recordDeleted"),
            type: "info",
          });
        })
        .catch(() => {});
    },
    startRename(proj) {
      this.renamingId = proj.id;
      this.renameVal = proj.name;
      this.$nextTick(() => {
        const el = Array.isArray(this.$refs.renameInput)
          ? this.$refs.renameInput[0]
          : this.$refs.renameInput;
        el?.focus();
      });
    },
    confirmRename(id) {
      const val = this.renameVal.trim();
      if (!val) {
        this.renamingId = null;
        return;
      }
      if (this.projects.some((p) => p.name === val && p.id !== id)) {
        this.$message.warning(this.$t("project.msg.nameExistsRename"));
        this.renamingId = null;
        return;
      }
      this.RENAME_PROJECT({ projectId: id, name: val });
      this.renamingId = null;
    },
    setActive(id) {
      this.SET_ACTIVE_PROJECT({ projectId: id });
      this.$message({
        message: this.$t("project.msg.switched"),
        type: "success",
      });
    },
    async stopSimulation() {
      if (window.electronAPI?.stopSimulation) {
        await window.electronAPI.stopSimulation();
        this.$store.commit("SET_SIMULATING", false);
        this.$store.commit("SET_OPT_PROGRESS", null);
        this.$message({
          message: this.$t("project.drawer.manualStopped"),
          type: "warning",
        });
      }
    },
    exportProject(proj) {
      if (!proj?.records?.length && !proj?.baseParams) {
        this.$message.warning("该项目暂无配置数据可供导出");
        return;
      }
      const safe = proj.name.replace(/[\\/?:*<>"|]/g, "_");
      const fileName = `RocketSim_${safe}_Report.pdf`;
      const t = (k) => this.$t(k);

      // 1. 报表头部信息
      let html = `<div style="font-family:'Helvetica Neue',Helvetica,'PingFang SC',sans-serif;padding:20px;color:#1e293b;background:#fff">
        <h1 style="text-align:center;color:#0f172a;border-bottom:2px solid #0ea5e9;padding-bottom:10px;margin-bottom:20px;letter-spacing:2px">${t(
          "project.export.reportTitle",
        )}</h1>
        <div style="background:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:25px">
          <p style="margin:5px 0;font-size:14px"><strong>${t(
            "project.export.projectName",
          )}</strong> ${proj.name}</p>
          <p style="margin:5px 0;font-size:14px"><strong>${t(
            "project.export.projectId",
          )}</strong> ${proj.id.toUpperCase()}</p>
          <p style="margin:5px 0;font-size:14px"><strong>${t(
            "project.export.createdAt",
          )}</strong> ${this.fmtFullDate(proj.createdAt || proj.created_at)}</p>
          ${
            proj.desc
              ? `<p style="margin:5px 0;font-size:14px"><strong>${t(
                  "project.export.projectDesc",
                )}</strong> ${proj.desc}</p>`
              : ""
          }
        </div>`;

      // 2. 基础配置部分 (全项目统一)
      if (proj.baseParams) {
        html += `<div style="margin-bottom:30px">
          <h2 style="background:#334155;color:#fff;padding:8px 15px;border-radius:4px;font-size:15px;margin-bottom:12px">// ${t(
            "project.drawer.baseConfig",
          )}</h2>`;
        const baseFlat = this.flatOf(proj.baseParams);
        if (baseFlat.length) {
          html += `<table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #cbd5e1"><tbody>`;
          for (let i = 0; i < baseFlat.length; i += 2) {
            const p1 = baseFlat[i],
              p2 = baseFlat[i + 1];
            html += `<tr>
              <td style="border:1px solid #cbd5e1;background:#f1f5f9;padding:6px;width:25%;color:#475569">${
                p1.key
              }</td>
              <td style="border:1px solid #cbd5e1;padding:6px;width:25%;color:#0f172a;font-weight:bold">${
                p1.val
              }</td>
              <td style="border:1px solid #cbd5e1;background:#f1f5f9;padding:6px;width:25%;color:#475569">${
                p2 ? p2.key : ""
              }</td>
              <td style="border:1px solid #cbd5e1;padding:6px;width:25%;color:#0f172a;font-weight:bold">${
                p2 ? p2.val : ""
              }</td>
            </tr>`;
          }
          html += `</tbody></table>`;
        }
        html += `</div>`;
      }

      // 3. 优化记录循环 (配置 -> 结果)
      if (proj.records && proj.records.length) {
        html += `<h2 style="color:#0f172a;border-left:4px solid #0ea5e9;padding-left:10px;font-size:16px;margin:30px 0 15px">${t(
          "project.drawer.recordsTitle",
        )}</h2>`;

        proj.records.forEach((rec, idx) => {
          html += `<div style="margin-bottom:40px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background:#e0f2fe; padding:10px 15px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #bae6fd">
              <span style="font-weight:bold; color:#0369a1">${t(
                "project.drawer.recordLabel",
              )} #${proj.records.length - idx}</span>
              <span style="font-size:12px; color:#64748b">${this.fmtFullDate(
                rec.ranAt,
              )}</span>
            </div>
            
            <div style="padding:15px">
              <h3 style="font-size:13px; color:#334155; margin-bottom:8px">● 优化输入初值 (Optimization Input)</h3>`;

          const optFlat = this.flatOf(rec.optConfig);
          if (optFlat.length) {
            html += `<table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #e2e8f0;margin-bottom:15px"><tbody>`;
            for (let i = 0; i < optFlat.length; i += 2) {
              const p1 = optFlat[i],
                p2 = optFlat[i + 1];
              html += `<tr>
                <td style="border:1px solid #e2e8f0;background:#f8fafc;padding:5px;width:25%">${
                  p1.key
                }</td>
                <td style="border:1px solid #e2e8f0;padding:5px;width:25%;font-weight:bold">${
                  p1.val
                }</td>
                <td style="border:1px solid #e2e8f0;background:#f8fafc;padding:5px;width:25%">${
                  p2 ? p2.key : ""
                }</td>
                <td style="border:1px solid #e2e8f0;padding:5px;width:25%;font-weight:bold">${
                  p2 ? p2.val : ""
                }</td>
              </tr>`;
            }
            html += `</tbody></table>`;
          }

          html += `<h3 style="font-size:13px; color:#166534; margin-bottom:8px">● 优化解算结果 (Engine Output)</h3>`;
          if (rec.result?.optimized_params) {
            html += `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px">`;
            this.getOptParamsList(rec).forEach((item) => {
              html += `<div style="border-bottom:1px dashed #dcfce7;padding:4px 0;display:flex;justify-content:space-between">
                <span style="color:#166534;font-size:11px">${item.label}</span>
                <span style="color:#15803d;font-weight:bold;font-size:12px">${item.value} ${item.unit}</span>
              </div>`;
            });
            html += `</div>`;
          } else {
            html += `<p style="font-size:12px;color:#64748b;font-style:italic;padding:10px">${t(
              "project.export.noOptResult",
            )}</p>`;
          }

          html += `</div></div>`;
          if ((idx + 1) % 2 === 0)
            html += `<div style="page-break-after:always"></div>`;
        });
      }

      html += `</div>`;
      const element = document.createElement("div");
      element.innerHTML = html;
      this.$message.info(t("project.export.generating"));

      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: fileName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save()
        .then(() => {
          this.$message.success(t("project.export.success"));
        })
        .catch((err) =>
          this.$message.error(t("project.export.fail") + err.message),
        );
    },
  },
};
</script>

<style scoped>
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
@media (max-width: 1200px) {
  .hero {
    flex-wrap: wrap;
  }
  .active-card {
    width: 100%;
  }
}
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 28px;
  }
}
.pm-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  min-height: 0;
  animation: fadeUp 0.35s ease both;
  overflow: hidden;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes radarSpin {
  to {
    transform: rotate(360deg);
  }
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
.hero {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 22px;
  background: rgba(8, 20, 40, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.14);
  border-radius: 8px;
  padding: 28px 32px;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.5),
    transparent
  );
}
.hero-left {
  flex: 1;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--cyan);
  opacity: 0.7;
  margin-bottom: 10px;
}
.hero-title {
  font-family: var(--font-hud);
  font-size: 38px;
  font-weight: 800;
  line-height: 1.15;
  color: #d0ecff;
  letter-spacing: 5px;
  margin: 0 0 10px;
}
.title-glow {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan-glow), 0 0 40px rgba(0, 229, 255, 0.2);
}
.hero-sub {
  font-family: var(--font-cn);
  font-size: 15px;
  color: #5a8aaa;
  margin: 0 0 24px;
  letter-spacing: 1px;
}
.hero-stats {
  display: flex;
  align-items: center;
}
.hstat {
  text-align: center;
  padding: 0 22px;
}
.hstat-val {
  font-family: var(--font-hud);
  font-size: 34px;
  font-weight: 800;
  color: var(--cyan);
  text-shadow: 0 0 16px var(--cyan-glow);
}
.hstat-key {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #4a7a9a;
  letter-spacing: 3px;
  margin-top: 5px;
  font-weight: 700;
}
.hstat-div {
  width: 1px;
  height: 44px;
  background: rgba(0, 229, 255, 0.15);
}
.radar-wrap {
  flex-shrink: 0;
  position: relative;
  width: 170px;
  text-align: center;
}
.radar-svg {
  display: block;
  margin: 0 auto;
}
.radar-label {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--green);
  letter-spacing: 3px;
  text-shadow: 0 0 8px var(--green);
  margin-top: 8px;
  font-weight: 700;
}
.active-card {
  width: 270px;
  flex-shrink: 0;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 8px;
  padding: 20px;
  position: relative;
}
.active-card.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  border-style: dashed;
  border-color: rgba(0, 229, 255, 0.15);
}
.ac-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ac-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: blink 1.5s ease-in-out infinite;
}
.ac-label {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cyan);
  letter-spacing: 2px;
  font-weight: 700;
}
.ac-name {
  font-family: var(--font-hud);
  font-size: 19px;
  color: #e0f4ff;
  font-weight: 700;
  margin-bottom: 8px;
  word-break: break-all;
}
.ac-meta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #5a8aaa;
}
.sep {
  margin: 0 7px;
  opacity: 0.4;
}
.ac-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a5a6a;
  margin-top: 7px;
}
.ac-goto {
  display: block;
  width: 100%;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 9px;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: var(--cyan);
  transition: all 0.2s;
}
.ac-goto:hover {
  background: rgba(0, 229, 255, 0.16);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
  transform: translateY(-1px);
}
.empty-ico {
  font-size: 30px;
  color: rgba(0, 229, 255, 0.2);
}
.empty-txt {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: #3a6a8a;
  letter-spacing: 2px;
}
.empty-hint {
  font-family: var(--font-cn);
  font-size: 13px;
  color: #2a4a5a;
  line-height: 1.6;
}
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.tb-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.tb-label {
  font-family: var(--font-mono);
  font-size: 15px;
  color: var(--cyan);
  letter-spacing: 3px;
  font-weight: 700;
}
.tb-count {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 3px 10px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  color: #4a7a9a;
  border-radius: 4px;
  letter-spacing: 2px;
  font-weight: 700;
}
.tb-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 8, 18, 0.7);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 4px;
  padding: 9px 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-box.focused {
  border-color: rgba(0, 229, 255, 0.5);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.1);
}
.search-ico {
  color: #3a6a8a;
  font-size: 15px;
}
.search-box.focused .search-ico {
  color: var(--cyan);
}
.search-input {
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-mono);
  font-size: 14px;
  color: #a0c8d8;
  width: 180px;
  letter-spacing: 1px;
}
.search-input::placeholder {
  color: #2a4a5a;
}
.search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: #3a6a8a;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: color 0.15s;
}
.search-clear:hover {
  color: var(--red);
}
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.fade-scale-enter,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.btn-new {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 2px;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.35);
  color: var(--cyan);
  transition: all 0.2s;
}
.btn-new:hover {
  background: rgba(0, 229, 255, 0.16);
  box-shadow: 0 0 14px rgba(0, 229, 255, 0.25);
  transform: translateY(-1px);
}
.btn-new:active {
  transform: translateY(0);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  gap: 18px;
}
.empty-rings {
  position: relative;
  width: 120px;
  height: 120px;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(0, 229, 255, 0.15);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ringPulse 3s ease-in-out infinite;
}
.ring.r1 {
  width: 100px;
  height: 100px;
}
.ring.r2 {
  width: 70px;
  height: 70px;
  animation-delay: 0.4s;
}
.ring.r3 {
  width: 40px;
  height: 40px;
  animation-delay: 0.8s;
}
@keyframes ringPulse {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.4;
  }
}
.ring-ico {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 26px;
  color: rgba(0, 229, 255, 0.25);
}
.empty-title {
  font-family: var(--font-hud);
  font-size: 18px;
  font-weight: 700;
  color: #2a4a5a;
  letter-spacing: 4px;
}
.empty-hint-text {
  font-family: var(--font-cn);
  font-size: 15px;
  color: #1a3040;
}
.grid-scroll {
  flex: 1;
  height: 0;
  overflow-y: auto;
  padding-right: 4px;
  padding-bottom: 20px;
}
.grid-scroll::-webkit-scrollbar {
  width: 4px;
}
.grid-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.grid-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.2);
  border-radius: 2px;
}
.grid-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.4);
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
}
.proj-card {
  background: rgba(8, 20, 40, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 8px;
  padding: 22px;
  position: relative;
  overflow: hidden;
  animation: cardIn 0.4s ease both;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
}
.proj-card:hover {
  border-color: rgba(0, 229, 255, 0.28);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 20px rgba(0, 229, 255, 0.08);
  transform: translateY(-2px);
}
.proj-card.is-active {
  border-color: rgba(0, 229, 255, 0.55) !important;
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.12),
    inset 0 0 16px rgba(0, 229, 255, 0.04);
}
.proj-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.25),
    transparent
  );
}
.proj-card.is-active::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.6),
    transparent
  );
}
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.rec-config-block {
  margin: 10px 0;
}
.rec-section-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--cyan);
  letter-spacing: 2px;
  font-weight: 700;
  margin-bottom: 6px;
  opacity: 0.85;
}
.rec-config-block .cp-label {
  width: 130px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}
.rec-config-block .cp-val {
  padding: 8px 10px;
  font-size: 12px;
  white-space: normal;
  word-break: break-all;
  line-height: 1.35;
  min-width: 0;
}
.rec-config-block .cp-label {
  width: 160px;
  padding: 8px 12px;
  font-size: 11.5px;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
}
.rec-config-block .cp-val {
  padding: 8px 12px;
  font-size: 12.5px;
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}
.corner {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}
.corner.tl {
  top: 8px;
  left: 8px;
  border-top: 1px solid rgba(0, 229, 255, 0.4);
  border-left: 1px solid rgba(0, 229, 255, 0.4);
}
.corner.tr {
  top: 8px;
  right: 8px;
  border-top: 1px solid rgba(0, 229, 255, 0.4);
  border-right: 1px solid rgba(0, 229, 255, 0.4);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 7px;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #1a3a2a;
  transition: background 0.3s;
}
.status-dot.has-result {
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: blink 2s ease-in-out infinite;
}
.card-title-wrap {
  flex: 1;
  overflow: hidden;
}
.card-name {
  font-family: var(--font-hud);
  font-size: 20px;
  font-weight: 700;
  color: #c0e0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.is-active .card-name {
  color: #fff;
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
}
.rename-input {
  width: 100%;
  background: rgba(0, 8, 18, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 4px;
  color: #e8f8ff;
  font-family: var(--font-hud);
  font-size: 17px;
  padding: 5px 9px;
  outline: none;
}
.card-actions {
  display: flex;
  gap: 7px;
  opacity: 0;
  transition: opacity 0.2s;
}
.proj-card:hover .card-actions {
  opacity: 1;
}
.ca-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #3a6a8a;
  font-size: 15px;
  padding: 5px 7px;
  border-radius: 4px;
  transition: all 0.15s;
}
.ca-btn:hover {
  color: #c0e0f0;
  background: rgba(255, 255, 255, 0.06);
  transform: scale(1.1);
}
.ca-btn.danger:hover {
  color: var(--red);
}
.card-id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #2a4a5a;
  letter-spacing: 2px;
  margin-bottom: 5px;
  font-weight: 700;
}
.card-date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a5a6a;
  margin-bottom: 14px;
}
.card-divider {
  height: 1px;
  background: rgba(0, 229, 255, 0.08);
  margin-bottom: 14px;
}
.card-stats {
  display: flex;
  margin-bottom: 14px;
}
.cs-item {
  flex: 1;
  text-align: center;
  padding: 7px 0;
  border-right: 1px solid rgba(0, 229, 255, 0.07);
}
.cs-item:last-child {
  border-right: none;
}
.cs-val {
  font-family: var(--font-hud);
  font-size: 28px;
  font-weight: 800;
  color: #4a7a9a;
  transition: color 0.3s;
}
.cs-val.val-green {
  color: var(--green);
  text-shadow: 0 0 8px var(--green);
}
.cs-val.val-amber {
  color: var(--amber);
  font-size: 24px;
}
.cs-val.val-dim {
  color: #2a4a5a;
}
.cs-key {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a5a6a;
  letter-spacing: 2px;
  margin-top: 5px;
  font-weight: 700;
}
.card-has-result {
  font-family: var(--font-cn);
  font-size: 13px;
  color: var(--green);
  text-align: center;
  padding: 14px 0;
  margin-bottom: 14px;
  border: 1px dashed rgba(57, 255, 20, 0.2);
  background: rgba(57, 255, 20, 0.03);
  border-radius: 6px;
}
.card-has-result i {
  margin-right: 4px;
  vertical-align: middle;
}
.card-no-result {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #2a4a5a;
  letter-spacing: 2px;
  text-align: center;
  padding: 14px 0;
  margin-bottom: 14px;
  border: 1px dashed rgba(0, 229, 255, 0.07);
  border-radius: 6px;
  font-weight: 700;
}
.card-footer {
  display: flex;
  gap: 10px;
}
.btn-set-active {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 2px;
  font-weight: 700;
  padding: 9px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  color: #4a7a9a;
}
.btn-set-active:hover {
  background: rgba(0, 229, 255, 0.12);
  color: var(--cyan);
  border-color: rgba(0, 229, 255, 0.4);
  transform: translateY(-1px);
}
.btn-set-active.active {
  background: rgba(57, 255, 20, 0.08);
  border-color: rgba(57, 255, 20, 0.35);
  color: var(--green);
  text-shadow: 0 0 8px var(--green);
}
.btn-detail {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 1px;
  font-weight: 700;
  padding: 9px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  border: 1px solid rgba(0, 229, 255, 0.15);
  color: #3a6a8a;
}
.btn-detail:hover {
  border-color: rgba(0, 229, 255, 0.4);
  color: #a0c8d8;
  background: rgba(0, 229, 255, 0.06);
  transform: translateY(-1px);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(2, 6, 14, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-box {
  background: rgba(4, 12, 26, 0.96);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 229, 255, 0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: modalIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(15px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-corner {
  position: absolute;
  width: 15px;
  height: 15px;
  pointer-events: none;
}
.modal-corner.tl {
  top: -1px;
  left: -1px;
  border-top: 2px solid var(--cyan);
  border-left: 2px solid var(--cyan);
}
.modal-corner.tr {
  top: -1px;
  right: -1px;
  border-top: 2px solid var(--cyan);
  border-right: 2px solid var(--cyan);
}
.modal-corner.bl {
  bottom: -1px;
  left: -1px;
  border-bottom: 2px solid var(--cyan);
  border-left: 2px solid var(--cyan);
}
.modal-corner.br {
  bottom: -1px;
  right: -1px;
  border-bottom: 2px solid var(--cyan);
  border-right: 2px solid var(--cyan);
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
  background: rgba(0, 229, 255, 0.03);
}
.modal-title {
  font-family: var(--font-hud);
  font-size: 17px;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 3px;
  text-shadow: 0 0 10px var(--cyan-glow);
}
.modal-close {
  background: transparent;
  border: none;
  color: #5a8aaa;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px;
  border-radius: 4px;
}
.modal-close:hover {
  color: var(--red);
  background: rgba(255, 61, 87, 0.1);
}
.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 229, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
}
.field-label {
  font-family: var(--font-mono);
  font-size: 14px;
  color: #4a7a9a;
  letter-spacing: 3px;
  margin-bottom: 8px;
  font-weight: 700;
}
.field-label.mt {
  margin-top: 18px;
}
.required {
  color: var(--red);
}
.field-input,
.field-textarea {
  width: 100%;
  background: rgba(0, 8, 18, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  color: #e0f4ff;
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  box-sizing: border-box;
  transition: all 0.3s;
}
.field-input::placeholder,
.field-textarea::placeholder {
  color: #2a4a5a;
}
.field-input:focus,
.field-textarea:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
}
.field-textarea {
  resize: vertical;
}
.mbtn {
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 2px;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 700;
}
.mbtn.cancel {
  background: transparent;
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: #5a8aaa;
}
.mbtn.cancel:hover {
  background: rgba(0, 229, 255, 0.08);
  color: #a0c8d8;
}
.mbtn.confirm {
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid var(--cyan);
  color: var(--cyan);
}
.mbtn.confirm:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}
.mbtn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(0, 229, 255, 0.2);
  color: rgba(0, 229, 255, 0.5);
}
.wizard-box {
  width: 820px !important;
  max-width: 95vw;
}
.modern-breadcrumb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  margin-bottom: 28px;
  padding: 0 20px;
}
.crumb-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  transition: all 0.3s ease;
}
.crumb-text {
  font-family: var(--font-cn);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}
.crumb-item {
  color: #3a6a8a;
}
.crumb-item.active {
  color: var(--cyan);
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
}
.crumb-item.done {
  color: var(--green);
}
.crumb-sep {
  color: rgba(0, 229, 255, 0.2);
  font-size: 14px;
  font-weight: bold;
}
.crumb-item.clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.crumb-item.clickable:hover:not(.active) {
  color: var(--cyan);
  opacity: 0.8;
  transform: translateY(-1px);
}
.step-scroll {
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.step-scroll::-webkit-scrollbar {
  display: none;
}
.section-title {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--cyan);
  letter-spacing: 3px;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.18);
  font-weight: 700;
}
.stage-badge-wrap {
  text-align: center;
  margin-bottom: 10px;
}
.stage-badge {
  font-family: var(--font-hud);
  font-size: 14px;
  letter-spacing: 4px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0 !important;
}
.stage-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.stage-badge.s1 {
  background: rgba(0, 229, 255, 0.1);
  color: var(--cyan);
  border: 1px solid rgba(0, 229, 255, 0.4);
}
.stage-badge.s1 .dot {
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
}
.stage-badge.s2 {
  background: rgba(255, 179, 0, 0.1);
  color: var(--amber);
  border: 1px solid rgba(255, 179, 0, 0.4);
}
.stage-badge.s2 .dot {
  background: var(--amber);
  box-shadow: 0 0 8px var(--amber);
}
.dark-form ::v-deep .el-form-item {
  display: flex !important;
  align-items: center !important;
  margin-bottom: 10px !important;
}
.dark-form ::v-deep .el-form-item__label {
  float: none !important;
  color: #8ab8cc !important;
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: normal !important;
  word-break: break-word;
  text-align: left;
  line-height: 1.2 !important;
  padding-right: 12px !important;
}
.dark-form ::v-deep .el-form-item__content {
  float: none !important;
  margin-left: 0 !important;
  flex: 1;
  min-width: 0;
  line-height: normal !important;
}
.dark-form ::v-deep .el-input-number {
  width: 100%;
}
.dark-form ::v-deep .el-input__inner {
  background: rgba(0, 8, 18, 0.6) !important;
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
  color: #e0f4ff !important;
  font-family: var(--font-mono) !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}
.dark-form ::v-deep .el-input__inner:focus {
  border-color: var(--cyan) !important;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2) !important;
}
.dark-form ::v-deep .el-input-number__decrease,
.dark-form ::v-deep .el-input-number__increase {
  background: rgba(0, 229, 255, 0.05) !important;
  border-color: rgba(0, 229, 255, 0.15) !important;
  color: var(--cyan) !important;
}
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(2, 6, 14, 0.6);
  backdrop-filter: blur(4px);
}
.overlay-fade-enter-active {
  transition: opacity 0.28s;
}
.overlay-fade-leave-active {
  transition: opacity 0.22s;
}
.overlay-fade-enter,
.overlay-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active {
  transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.28s;
}
.drawer-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1), opacity 0.22s;
}
.drawer-slide-enter,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 改造后的超级宽抽屉 */
.drawer.drawer-wide {
  width: 880px;
}
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(4, 12, 26, 0.99);
  border-left: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow: -16px 0 60px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
}

/* 抽屉内双引擎 Tabs */
.drawer-tabs {
  display: flex;
  padding: 0 26px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
  gap: 8px;
}
.dt-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #5a8aaa;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dt-btn:hover {
  color: #8ab8cc;
  background: rgba(0, 229, 255, 0.04);
}
.dt-btn.active {
  color: var(--cyan);
  border-bottom-color: var(--cyan);
}
.drawer-tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drawer-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 26px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
  position: relative;
}
.drawer-head::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 229, 255, 0.3),
    transparent
  );
}
.drawer-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.drawer-title {
  font-family: var(--font-hud);
  font-size: 19px;
  font-weight: 700;
  color: #d0ecff;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
.drawer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1a3a2a;
  flex-shrink: 0;
  transition: background 0.3s;
}
.drawer-dot.has-result {
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: blink 2s ease-in-out infinite;
}
.drawer-close {
  background: none;
  border: none;
  color: #3a6a8a;
  font-size: 17px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.drawer-close:hover {
  color: var(--red);
  background: rgba(255, 61, 87, 0.1);
}
.drawer-meta-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 26px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(0, 229, 255, 0.07);
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a6a8a;
  font-weight: 700;
}
.dmb-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dmb-sep {
  color: rgba(0, 229, 255, 0.2);
}
.dmb-desc {
  color: #4a6a7a;
  font-family: var(--font-cn);
  font-weight: 400;
}
.drawer-section-label {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cyan);
  letter-spacing: 3px;
  padding: 14px 26px 10px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  font-weight: 700;
}
.config-empty {
  font-family: var(--font-cn);
  font-size: 15px;
  color: #2a4a5a;
  text-align: center;
  padding: 40px 0;
}
.config-item {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 229, 255, 0.1);
  border-radius: 8px;
  padding: 16px 18px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  animation: cfgIn 0.35s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes cfgIn {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.config-item:hover {
  border-color: rgba(0, 229, 255, 0.28);
  background: rgba(0, 229, 255, 0.03);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.cfg-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
}
.cfg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1a3a2a;
  flex-shrink: 0;
  transition: all 0.3s;
}
.cfg-dot.has-result {
  background: var(--green);
  box-shadow: 0 0 5px var(--green);
}
.cfg-name {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #a0c8d8;
  font-weight: 700;
  flex: 1;
}
.opt-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: 1px;
}
.opt-badge.type1 {
  background: rgba(0, 229, 255, 0.1);
  color: var(--cyan);
  border: 1px solid rgba(0, 229, 255, 0.3);
}
.opt-badge.type2 {
  background: rgba(255, 179, 0, 0.1);
  color: var(--amber);
  border: 1px solid rgba(255, 179, 0, 0.3);
}
.cfg-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a6a8a;
  font-weight: 700;
}
.cfg-actions {
  display: flex;
  gap: 7px;
  opacity: 0;
  transition: opacity 0.15s;
}
.config-item:hover .cfg-actions {
  opacity: 1;
}
.cfg-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #3a6a8a;
  font-size: 15px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.cfg-btn:hover {
  color: #c0e0f0;
  background: rgba(255, 255, 255, 0.08);
}
.cfg-btn.danger:hover {
  color: var(--red);
}
.cfg-btn.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.cfg-result-panel {
  background: rgba(0, 3, 10, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 6px;
}
.crp-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  background: rgba(0, 229, 255, 0.04);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}
.crp-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: blink 2s ease-in-out infinite;
  flex-shrink: 0;
}
.crp-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--green);
  font-weight: 700;
}
.opt-apply-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: var(--cyan);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.opt-apply-btn:hover {
  background: rgba(0, 229, 255, 0.2);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.2);
}
.opt-apply-btn.cancel {
  background: rgba(255, 179, 0, 0.1);
  border-color: rgba(255, 179, 0, 0.4);
  color: var(--amber);
}
.opt-apply-btn.cancel:hover {
  background: rgba(255, 179, 0, 0.2);
  box-shadow: 0 0 8px rgba(255, 179, 0, 0.2);
}
.opt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 9px;
  padding: 12px;
}
.opt-cell {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  transition: all 0.2s;
}
.opt-cell:hover {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.3);
  transform: translateY(-1px);
}
.opt-label {
  font-family: var(--font-cn);
  font-size: 11px;
  color: #5a8aaa;
  margin-bottom: 6px;
}
.opt-value {
  font-family: var(--font-hud);
  font-size: 17px;
  font-weight: 800;
  color: var(--cyan);
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
}
.opt-unit {
  font-size: 11px;
  margin-left: 3px;
  opacity: 0.7;
}
.cfg-no-result {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #3a5a6a;
  letter-spacing: 1px;
  margin-top: 6px;
  font-weight: 700;
}
.drawer-live {
  background: rgba(0, 3, 10, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  font-family: var(--font-mono);
  margin: 8px 0 12px;
}
.live-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: rgba(0, 229, 255, 0.07);
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--cyan);
}
.live-blink {
  width: 6px;
  height: 6px;
  background: var(--cyan);
  box-shadow: 0 0 6px var(--cyan);
  flex-shrink: 0;
  animation: blink 0.8s step-end infinite;
}
.stop-btn {
  background: rgba(255, 61, 87, 0.1);
  border: 1px solid rgba(255, 61, 87, 0.3);
  color: var(--red);
  font-family: var(--font-cn);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.stop-btn:hover {
  background: rgba(255, 61, 87, 0.2);
  box-shadow: 0 0 8px rgba(255, 61, 87, 0.4);
  color: #fff;
}
.live-body {
  padding: 9px 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.live-line {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 11.5px;
}
.live-key {
  color: #4ac8e0;
  width: 50px;
  flex-shrink: 0;
}
.live-val {
  color: #d0f0e8;
  word-break: break-all;
  white-space: normal;
}
.live-dim {
  color: #4a6a80;
}
.live-waiting {
  padding: 11px 13px;
  font-size: 12px;
  color: #3a6a8a;
  letter-spacing: 1px;
}
.live-dots {
  letter-spacing: 3px;
  animation: blink 1.2s ease-in-out infinite;
}
.live-fade-enter-active,
.live-fade-leave-active {
  transition: all 0.3s;
}
.live-fade-enter,
.live-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.export-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--cyan);
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  padding: 5px 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  white-space: nowrap;
}
.export-btn:hover {
  background: rgba(0, 229, 255, 0.15);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
  transform: translateY(-1px);
}

/* 弹道记录样式 */
.trajectory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.trajectory-card {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: rgba(20, 22, 35, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.trajectory-card:hover {
  background: rgba(0, 229, 255, 0.06);
  border-color: rgba(0, 229, 255, 0.35);
  transform: translateX(2px);
}
.tr-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  background: #00e5ff;
  box-shadow: 0 0 6px rgba(0, 229, 255, 0.6);
}
.tr-status.optimized {
  background: #c084fc;
  box-shadow: 0 0 6px rgba(192, 132, 252, 0.6);
}
.tr-body {
  flex: 1;
  min-width: 0;
}
.tr-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tr-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: #e0f4ff;
}
.tr-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #5a8aaa;
}
.tr-action {
  background: none;
  border: none;
  color: #3a6a8a;
  font-size: 16px;
  padding: 4px;
  cursor: pointer;
  transition: color 0.2s;
  margin-left: 10px;
}
.tr-action:hover {
  color: var(--red);
}
.opt-trajectory-section {
  background: rgba(0, 3, 10, 0.4);
  border: 1px solid rgba(192, 132, 252, 0.15);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 10px;
}
</style>
<style>
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
.base-params-wrapper {
  padding: 10px 26px 20px;
}
.base-params-empty {
  padding: 15px 26px 20px;
  color: #4a6a7a;
  font-family: var(--font-cn);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.custom-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: rgba(0, 229, 255, 0.15);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
}
.cp-item {
  display: flex;
  background: rgba(2, 6, 14, 0.85);
  transition: all 0.3s ease;
}
.cp-item:hover {
  background: rgba(0, 229, 255, 0.05);
}
.cp-item.is-highlight {
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.1);
}
.cp-label {
  width: 170px;
  flex-shrink: 0;
  padding: 10px 14px;
  background: rgba(0, 229, 255, 0.03);
  color: #8ab8cc;
  font-family: var(--font-cn);
  font-size: 12px;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(0, 229, 255, 0.08);
  transition: all 0.3s ease;
}
.cp-item.is-highlight .cp-label {
  background: rgba(0, 229, 255, 0.2);
  color: #e0f4ff;
  font-weight: 700;
  border-right-color: rgba(0, 229, 255, 0.3);
}
.cp-val {
  flex: 1;
  padding: 10px 14px;
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}
.cp-item.is-highlight .cp-val {
  color: #fff;
  text-shadow: 0 0 8px var(--cyan);
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  display: block !important;
}
.drawer-body::-webkit-scrollbar {
  width: 4px;
}
.drawer-body::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.15);
  border-radius: 2px;
}
.drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.3);
}
.config-list {
  flex: none !important;
  overflow-y: visible !important;
  padding: 14px 26px 60px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
