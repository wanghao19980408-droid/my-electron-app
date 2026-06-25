self.onmessage = function (e) {
  const { buffer } = e.data;
  try {
    const view = new DataView(buffer);
    const rows = view.getUint32(0, true);
    const cols = view.getUint32(4, true);

    const headerSize = 8;
    const dataBytes = rows * cols * 4;
    if (buffer.byteLength < headerSize + dataBytes) {
      self.postMessage({ error: "文件数据不完整" });
      return;
    }

    const float32 = new Float32Array(buffer, headerSize, rows * cols);

    const columns = {};
    for (let c = 0; c < cols; c++) {
      const arr = new Float32Array(rows);
      for (let r = 0; r < rows; r++) {
        arr[r] = float32[r * cols + c];
      }
      columns[c] = arr;
    }

    self.postMessage(
      { rows, cols, columns },
      Object.values(columns).map((a) => a.buffer),
    );
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
