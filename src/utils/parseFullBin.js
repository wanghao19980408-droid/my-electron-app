export function parseFullBinBuffer(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 8) {
    throw new Error("无效的二进制数据");
  }

  const view = new DataView(arrayBuffer);
  const rows = view.getUint32(0, true);
  const cols = view.getUint32(4, true);
  const headerSize = 8;
  const expectedBytes = headerSize + rows * cols * 4;

  if (arrayBuffer.byteLength < expectedBytes) {
    throw new Error(
      "文件数据不完整: 期望 " +
        expectedBytes +
        " 字节, 实际 " +
        arrayBuffer.byteLength +
        " 字节",
    );
  }

  const float32 = new Float32Array(arrayBuffer, headerSize, rows * cols);

  const columns = {};
  for (let c = 0; c < cols; c++) {
    const arr = new Float32Array(rows);
    for (let r = 0; r < rows; r++) {
      arr[r] = float32[r * cols + c];
    }
    columns[c] = arr;
  }

  return { rows, cols, columns };
}

export function safeMax(arr) {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

export function safeMin(arr) {
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
}

export const CHART_MAX_POINTS = 3000;

export function downsampleLTTB(timeArr, valueArr, threshold) {
  const len = timeArr.length;
  if (len <= threshold) {
    return { time: Array.from(timeArr), value: Array.from(valueArr) };
  }

  const sampled_time = [timeArr[0]];
  const sampled_value = [valueArr[0]];
  const bucketSize = (len - 2) / (threshold - 2);

  let a = 0;
  for (let i = 1; i < threshold - 1; i++) {
    const rangeStart = Math.floor((i - 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor(i * bucketSize) + 1, len - 1);
    const nextStart = Math.floor(i * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len - 1);

    let avgX = 0;
    let avgY = 0;
    let avgCount = nextEnd - nextStart;
    if (avgCount <= 0) avgCount = 1;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += timeArr[j];
      avgY += valueArr[j];
    }
    avgX /= avgCount;
    avgY /= avgCount;

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
