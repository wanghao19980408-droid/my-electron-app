export function parseBTRKTrack(buffer) {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );

  if (magic !== "BTRK") throw new Error("无效的弹道数据文件：头标识错误");

  const fieldCount = view.getUint16(6, true);
  const pointCount = view.getUint32(8, true);
  const floatArray = new Float32Array(buffer, 12);

  const trackData = [];
  for (let i = 0; i < pointCount; i++) {
    const base = i * fieldCount;
    const vx = floatArray[base + 4];
    const vy = floatArray[base + 5];
    const vz = floatArray[base + 6];

    trackData.push({
      time: floatArray[base],
      lon: floatArray[base + 1],
      lat: floatArray[base + 2],
      alt: floatArray[base + 3],
      velocity: Math.sqrt(vx * vx + vy * vy + vz * vz),
      stage: Math.round(floatArray[base + 7]),
    });
  }
  return trackData;
}
