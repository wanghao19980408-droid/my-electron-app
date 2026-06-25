// src/utils/telemetryColumns.js
export const TELEMETRY_COLUMNS = [
  { col: 0, key: "t", label: "时间", unit: "s" },
  { col: 1, key: "mass", label: "质量", unit: "kg" },
  { col: 2, key: "px", label: "发射系位置 x", unit: "m" },
  { col: 3, key: "py", label: "发射系位置 y", unit: "m" },
  { col: 4, key: "pz", label: "发射系位置 z", unit: "m" },
  { col: 5, key: "vx", label: "发射系速度 vx", unit: "m/s" },
  { col: 6, key: "vy", label: "发射系速度 vy", unit: "m/s" },
  { col: 7, key: "vz", label: "发射系速度 vz", unit: "m/s" },
  { col: 8, key: "phi_T", label: "发惯系俯仰角", unit: "°" },
  { col: 9, key: "psi_T", label: "发惯系偏航角", unit: "°" },
  { col: 10, key: "gamma_T", label: "发惯系滚转角", unit: "°" },
  { col: 11, key: "wx1", label: "箭体系角速度 ωx1", unit: "rad/s" },
  { col: 12, key: "wy1", label: "箭体系角速度 ωy1", unit: "rad/s" },
  { col: 13, key: "wz1", label: "箭体系角速度 ωz1", unit: "rad/s" },
  { col: 14, key: "Fx1", label: "箭体系推力 Fx1", unit: "N" },
  { col: 15, key: "Fy1", label: "箭体系推力 Fy1", unit: "N" },
  { col: 16, key: "Fz1", label: "箭体系推力 Fz1", unit: "N" },
  { col: 17, key: "Rx1", label: "箭体系气动力 Rx1", unit: "N" },
  { col: 18, key: "Ry1", label: "箭体系气动力 Ry1", unit: "N" },
  { col: 19, key: "Rz1", label: "箭体系气动力 Rz1", unit: "N" },
  { col: 20, key: "Wx1", label: "视加速度 Wx1", unit: "m/s²" },
  { col: 21, key: "Wy1", label: "视加速度 Wy1", unit: "m/s²" },
  { col: 22, key: "Wz1", label: "视加速度 Wz1", unit: "m/s²" },
  { col: 23, key: "nx1", label: "过载系数 nx1", unit: "" },
  { col: 24, key: "ny1", label: "过载系数 ny1", unit: "" },
  { col: 25, key: "nz1", label: "过载系数 nz1", unit: "" },
  { col: 26, key: "H", label: "海拔", unit: "m" },
  { col: 27, key: "rx", label: "地心发射系位置 rx", unit: "m" },
  { col: 28, key: "ry", label: "地心发射系位置 ry", unit: "m" },
  { col: 29, key: "rz", label: "地心发射系位置 rz", unit: "m" },
  { col: 30, key: "mach", label: "马赫数", unit: "" },
  { col: 31, key: "q", label: "动压", unit: "Pa" },
  { col: 32, key: "gx", label: "重力加速度 gx", unit: "m/s²" },
  { col: 33, key: "gy", label: "重力加速度 gy", unit: "m/s²" },
  { col: 34, key: "gz", label: "重力加速度 gz", unit: "m/s²" },
  { col: 35, key: "phi", label: "俯仰角 φ", unit: "°" },
  { col: 36, key: "psi", label: "偏航角 ψ", unit: "°" },
  { col: 37, key: "gamma", label: "滚转角 γ", unit: "°" },
  { col: 38, key: "theta", label: "速度倾角 θ", unit: "°" },
  { col: 39, key: "sigma", label: "航迹偏航角 σ", unit: "°" },
  { col: 40, key: "nu", label: "倾侧角 ν", unit: "°" },
  { col: 41, key: "alpha", label: "攻角 α", unit: "°" },
  { col: 42, key: "beta", label: "侧滑角 β", unit: "°" },
  { col: 43, key: "lon", label: "弹下点经度", unit: "°" },
  { col: 44, key: "lat_geo", label: "弹下点地理纬度", unit: "°" },
  { col: 45, key: "lat_cen", label: "弹下点地心纬度", unit: "°" },
  { col: 46, key: "A_e", label: "发射方位角", unit: "°" },
  { col: 47, key: "theta_e", label: "当地弹道倾角", unit: "°" },
  { col: 48, key: "BETA", label: "航程角", unit: "°" },
  { col: 49, key: "L", label: "航程", unit: "m" },
  { col: 50, key: "axv", label: "速度系加速度 ax", unit: "m/s²" },
  { col: 51, key: "ayv", label: "速度系加速度 ay", unit: "m/s²" },
  { col: 52, key: "azv", label: "速度系加速度 az", unit: "m/s²" },
  { col: 53, key: "gix", label: "发惯系重力 gix", unit: "m/s²" },
  { col: 54, key: "giy", label: "发惯系重力 giy", unit: "m/s²" },
  { col: 55, key: "giz", label: "发惯系重力 giz", unit: "m/s²" },
  { col: 56, key: "rix", label: "发惯系位置 rix", unit: "m" },
  { col: 57, key: "riy", label: "发惯系位置 riy", unit: "m" },
  { col: 58, key: "riz", label: "发惯系位置 riz", unit: "m" },
  { col: 59, key: "rex", label: "地心发惯系位置 rex", unit: "m" },
  { col: 60, key: "rey", label: "地心发惯系位置 rey", unit: "m" },
  { col: 61, key: "rez", label: "地心发惯系位置 rez", unit: "m" },
  { col: 62, key: "vix", label: "发惯系速度 vix", unit: "m/s" },
  { col: 63, key: "viy", label: "发惯系速度 viy", unit: "m/s" },
  { col: 64, key: "viz", label: "发惯系速度 viz", unit: "m/s" },
  { col: 65, key: "a_osc", label: "瞬时半长轴", unit: "km" },
  { col: 66, key: "e_osc", label: "瞬时偏心率", unit: "" },
  { col: 67, key: "i_osc", label: "瞬时轨道倾角", unit: "°" },
  { col: 68, key: "Omega_osc", label: "瞬时升交点赤经", unit: "°" },
  { col: 69, key: "w_osc", label: "瞬时近地点幅角", unit: "°" },
  { col: 70, key: "M_osc", label: "平近地点角", unit: "°" },
  { col: 71, key: "E_osc", label: "偏近地点角", unit: "°" },
  { col: 72, key: "f_osc", label: "真近点角", unit: "°" },
  { col: 73, key: "u_osc", label: "升交点角距", unit: "°" },
  { col: 74, key: "theta_ECI", label: "弹道倾角 θ_ECI", unit: "°" },
  { col: 75, key: "T_osc", label: "轨道周期", unit: "s" },
  { col: 76, key: "b_osc", label: "半短轴", unit: "km" },
  { col: 77, key: "a_mean", label: "平根半长轴", unit: "km" },
  { col: 78, key: "e_mean", label: "平根偏心率", unit: "" },
  { col: 79, key: "i_mean", label: "平根轨道倾角", unit: "°" },
  { col: 80, key: "Omega_mean", label: "平根升交点赤经", unit: "°" },
  { col: 81, key: "w_mean", label: "平根近地点幅角", unit: "°" },
  { col: 82, key: "M_mean", label: "平根平近地点角", unit: "°" },
  { col: 83, key: "a_pesu", label: "入轨半长轴", unit: "km" },
  { col: 84, key: "e_pesu", label: "入轨偏心率", unit: "" },
  { col: 85, key: "i_pesu", label: "入轨轨道倾角", unit: "°" },
  { col: 86, key: "w_pesu", label: "入轨近地点幅角", unit: "°" },
  { col: 87, key: "theta_pesu", label: "入轨弹道倾角", unit: "°" },
  { col: 88, key: "r_pesu", label: "入轨位置", unit: "km" },
  { col: 89, key: "v_pesu", label: "入轨速度", unit: "m/s" },
  { col: 90, key: "stage", label: "子级标识", unit: "" },
];

export const PARAM_GROUPS = [
  {
    id: "basic",
    label: "基本状态",
    icon: "el-icon-info",
    children: [0, 1, 26, 30, 31, 49],
  },
  {
    id: "position_launch",
    label: "发射系位置",
    icon: "el-icon-location",
    children: [2, 3, 4],
  },
  {
    id: "velocity_launch",
    label: "发射系速度",
    icon: "el-icon-right",
    children: [5, 6, 7],
  },
  {
    id: "attitude_inertial",
    label: "发惯系姿态角",
    icon: "el-icon-refresh",
    children: [8, 9, 10],
  },
  {
    id: "angular_rate",
    label: "箭体系角速度",
    icon: "el-icon-loading",
    children: [11, 12, 13],
  },
  {
    id: "thrust",
    label: "箭体系推力",
    icon: "el-icon-top",
    children: [14, 15, 16],
  },
  {
    id: "aero",
    label: "箭体系气动力",
    icon: "el-icon-cloudy",
    children: [17, 18, 19],
  },
  {
    id: "accel_apparent",
    label: "视加速度",
    icon: "el-icon-sort",
    children: [20, 21, 22],
  },
  {
    id: "overload",
    label: "过载系数",
    icon: "el-icon-warning",
    children: [23, 24, 25],
  },
  {
    id: "position_geocentric",
    label: "地心发射系位置",
    icon: "el-icon-place",
    children: [27, 28, 29],
  },
  {
    id: "gravity_launch",
    label: "发射系重力加速度",
    icon: "el-icon-bottom",
    children: [32, 33, 34],
  },
  {
    id: "euler",
    label: "欧拉角",
    icon: "el-icon-refresh-right",
    children: [35, 36, 37],
  },
  {
    id: "flight_angles",
    label: "飞行角",
    icon: "el-icon-discover",
    children: [38, 39, 40, 41, 42],
  },
  {
    id: "geo_coords",
    label: "地理坐标",
    icon: "el-icon-map-location",
    children: [43, 44, 45, 46, 47, 48],
  },
  {
    id: "accel_velocity",
    label: "速度系加速度",
    icon: "el-icon-d-arrow-right",
    children: [50, 51, 52],
  },
  {
    id: "gravity_inertial",
    label: "发惯系重力加速度",
    icon: "el-icon-download",
    children: [53, 54, 55],
  },
  {
    id: "position_inertial",
    label: "发惯系位置",
    icon: "el-icon-position",
    children: [56, 57, 58],
  },
  {
    id: "position_eci",
    label: "地心发惯系位置",
    icon: "el-icon-aim",
    children: [59, 60, 61],
  },
  {
    id: "velocity_inertial",
    label: "发惯系速度",
    icon: "el-icon-promotion",
    children: [62, 63, 64],
  },
  {
    id: "orbit_osculating",
    label: "瞬时轨道根数",
    icon: "el-icon-sunny",
    children: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
  },
  {
    id: "orbit_mean",
    label: "平均轨道根数",
    icon: "el-icon-moon",
    children: [77, 78, 79, 80, 81, 82],
  },
  {
    id: "orbit_insertion",
    label: "入轨参数",
    icon: "el-icon-star-on",
    children: [83, 84, 85, 86, 87, 88, 89],
  },
];

export const CHART_MAX_POINTS = 3000;

export function downsampleLTTB(timeArr, valueArr, threshold) {
  const len = timeArr.length;
  if (len <= threshold) return { time: timeArr, value: valueArr };

  const sampled_time = [timeArr[0]];
  const sampled_value = [valueArr[0]];

  const bucketSize = (len - 2) / (threshold - 2);

  let a = 0;
  for (let i = 1; i < threshold - 1; i++) {
    const rangeStart = Math.floor((i - 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor(i * bucketSize) + 1, len - 1);

    const nextStart = Math.floor(i * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len - 1);

    let avgX = 0,
      avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += timeArr[j];
      avgY += valueArr[j];
    }
    avgX /= nextEnd - nextStart || 1;
    avgY /= nextEnd - nextStart || 1;

    let maxArea = -1;
    let maxIdx = rangeStart;
    const pointAX = timeArr[a];
    const pointAY = valueArr[a];

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (valueArr[j] - pointAY) -
          (pointAX - timeArr[j]) * (avgY - pointAY),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }

    sampled_time.push(timeArr[maxIdx]);
    sampled_value.push(valueArr[maxIdx]);
    a = maxIdx;
  }

  sampled_time.push(timeArr[len - 1]);
  sampled_value.push(valueArr[len - 1]);

  return { time: sampled_time, value: sampled_value };
}
