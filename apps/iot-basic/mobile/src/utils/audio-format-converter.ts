/**
 * 音频格式处理工具
 * 后端只支持 WAV 和 PCM 格式，需要将其他格式转换
 */

/**
 * AudioBuffer 转 WAV Blob
 * 输出格式：16kHz, 单声道, 16-bit PCM
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // 单声道
  const sampleRate = 16000; // 16kHz
  const bitDepth = 16; // 16-bit
  const format = 1; // PCM

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // 写入 WAV 头
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 块大小
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 写入 PCM 数据（16-bit）
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, value, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * 写入字符串到 DataView
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Blob 转 Base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 将 Blob 转为 WAV 格式并返回 Base64
 * 支持输入格式：WebM, MP3, AAC, OGG 等浏览器可解码的格式
 */
export async function convertBlobToWavBase64(blob: Blob): Promise<string> {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWav(audioBuffer);
    return await blobToBase64(wavBlob);
  } finally {
    await audioContext.close();
  }
}
