type SoundName = 'select' | 'open' | 'confirm' | 'success' | 'error' | 'complete';

type Tone = {
  frequency: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

function playTone(context: AudioContext, destination: AudioNode, tone: Tone, baseTime: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = baseTime + tone.start;
  const endTime = startTime + tone.duration;
  const peakGain = tone.gain ?? 0.08;

  oscillator.type = tone.type ?? 'sine';
  oscillator.frequency.setValueAtTime(tone.frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(tone.frequency * 1.01, endTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

function playNoise(context: AudioContext, destination: AudioNode, baseTime: number, duration: number, gainValue: number) {
  const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  filter.type = 'highpass';
  filter.frequency.value = 1400;
  gain.gain.setValueAtTime(gainValue, baseTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(baseTime);
}

function tonesFor(name: SoundName): Tone[] {
  switch (name) {
    case 'select':
      return [
        { frequency: 440, start: 0, duration: 0.055, type: 'triangle', gain: 0.045 },
        { frequency: 660, start: 0.04, duration: 0.075, type: 'sine', gain: 0.055 },
      ];
    case 'open':
      return [
        { frequency: 520, start: 0, duration: 0.06, type: 'triangle', gain: 0.05 },
        { frequency: 780, start: 0.055, duration: 0.08, type: 'triangle', gain: 0.045 },
      ];
    case 'confirm':
      return [
        { frequency: 640, start: 0, duration: 0.045, type: 'sine', gain: 0.05 },
        { frequency: 960, start: 0.035, duration: 0.08, type: 'triangle', gain: 0.055 },
      ];
    case 'success':
      return [
        { frequency: 523.25, start: 0, duration: 0.09, type: 'triangle', gain: 0.06 },
        { frequency: 659.25, start: 0.075, duration: 0.1, type: 'triangle', gain: 0.065 },
        { frequency: 783.99, start: 0.15, duration: 0.16, type: 'sine', gain: 0.07 },
      ];
    case 'error':
      return [
        { frequency: 220, start: 0, duration: 0.09, type: 'sawtooth', gain: 0.035 },
        { frequency: 185, start: 0.08, duration: 0.11, type: 'sawtooth', gain: 0.03 },
      ];
    case 'complete':
      return [
        { frequency: 392, start: 0, duration: 0.1, type: 'triangle', gain: 0.06 },
        { frequency: 523.25, start: 0.08, duration: 0.1, type: 'triangle', gain: 0.06 },
        { frequency: 659.25, start: 0.16, duration: 0.13, type: 'triangle', gain: 0.065 },
        { frequency: 1046.5, start: 0.28, duration: 0.22, type: 'sine', gain: 0.06 },
      ];
  }
}

export function playSound(name: SoundName) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === 'suspended') {
    void context.resume();
  }

  const compressor = context.createDynamicsCompressor();
  const masterGain = context.createGain();
  const now = context.currentTime + 0.01;

  masterGain.gain.value = 0.72;
  compressor.threshold.value = -20;
  compressor.knee.value = 24;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.16;

  masterGain.connect(compressor);
  compressor.connect(context.destination);
  tonesFor(name).forEach((tone) => playTone(context, masterGain, tone, now));

  if (name === 'success' || name === 'complete') {
    playNoise(context, masterGain, now + 0.01, name === 'complete' ? 0.2 : 0.11, name === 'complete' ? 0.035 : 0.022);
  }
}
