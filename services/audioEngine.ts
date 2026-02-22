/**
 * audioEngine.ts — Professional Web Audio API Engine for EarVan
 *
 * Architecture:
 *   Mic → GainNode → HighPassFilter → EQ BankFilters → Compressor → AnalyserNode → Output
 *
 * Design principles:
 * - AudioContext is SUSPENDED not closed on stop (avoids recreation overhead)
 * - Mic stream stopped ONLY on full shutdown
 * - All node reconnections happen without AudioContext restart
 * - Mode switching updates filter params only (no reconnect)
 * - EQ filter gains ramp smoothly (no zipper noise)
 */

import { HearingProfile, EnvironmentMode } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────
const EQ_FREQUENCIES = [500, 1000, 2000, 4000, 8000] as const;
type EQFrequency = typeof EQ_FREQUENCIES[number];

/** FFT size: 1024 gives 512 bins — enough for a detailed, stable visualizer */
const FFT_SIZE = 1024;
/** Smoothing: 0.8 = natural falloff without lag */
const SMOOTHING = 0.8;

// ─── Environment mode DSP presets ────────────────────────────────────────────
const ENV_PRESETS: Record<EnvironmentMode, {
  gainOffset: number;
  eqOffsets: Partial<Record<EQFrequency, number>>;
  highpassFreq: number;         // Hz — 0 means disabled (1Hz = passthrough)
  compressorThreshold: number;  // dBFS
  compressorRatio: number;
}> = {
  QUIET: {
    gainOffset: 0,
    eqOffsets: {},
    highpassFreq: 1,        // Flat — full range
    compressorThreshold: -24,
    compressorRatio: 4,
  },
  CONVERSATION: {
    gainOffset: 0.15,         // Slight boost for voice
    eqOffsets: {
      500: -5,               // Cut low rumble
      1000: +6,              // Vowel clarity (tuned for speech)
      2000: +8,              // Consonant definition (tuned for clarity)
      4000: +4,              // Presence
      8000: -2,              // Tame sibilance
    },
    highpassFreq: 150,       // Cut handling noise
    compressorThreshold: -30,  // Compress for consistent voice volume
    compressorRatio: 6,
  },
  NOISY: {
    gainOffset: 0.25,        // Compensate for environmental noise
    eqOffsets: {
      500: -10,              // Aggressive cut for low rumble
      1000: +2,
      2000: +6,              // Focus on voice clarity
      4000: +4,
      8000: -6,              // Cut high-frequency noise
    },
    highpassFreq: 400,       // Stiff high-pass to kill traffic rumble
    compressorThreshold: -20,
    compressorRatio: 10,
  },
};

// ─── Hearing Profile EQ additions ────────────────────────────────────────────
/**
 * "Mild Loss Profile" typical audiogram: loss in 2k–8k range.
 * These are BASE boosts applied on top of whatever the user EQ band says.
 */
const MILD_LOSS_BOOSTS: Partial<Record<EQFrequency, number>> = {
  2000: +3,
  4000: +5,
  8000: +6,
};

const SPEECH_FOCUS_BOOSTS: Partial<Record<EQFrequency, number>> = {
  500: -3,
  1000: +6,
  2000: +8,
  4000: +4,
};

const BALANCED_BOOSTS: Partial<Record<EQFrequency, number>> = {
  500: +1,
  1000: +2,
  2000: +2,
  4000: +1,
};

// ─── AudioEngine class ────────────────────────────────────────────────────────
export class AudioEngine {
  // AudioContext — created once, suspended/resumed, never recreated
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;

  // Node graph
  private micSource: MediaStreamAudioSourceNode | null = null;
  private testSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  // State
  private _isRunning = false;
  private _currentMode: EnvironmentMode = 'QUIET';
  private _currentProfile: HearingProfile | null = null;
  private _isBypassed = false;
  private _isTesting = false;

  // ─── Initialization ────────────────────────────────────────────────────────
  public async initialize(): Promise<void> {
    if (this.context) {
      // Resume if suspended (browser autoplay policy)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      this._isRunning = true;
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioCtx({ latencyHint: 'interactive', sampleRate: 44100 });

    // ── Build node graph ────────────────────────────────────────────────────
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1.0;

    this.highpassFilter = this.context.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.value = 1;    // Initially flat (1Hz = pass-all)
    this.highpassFilter.Q.value = 0.7;          // Butterworth response

    // EQ peaking filter bank
    this.eqFilters = EQ_FREQUENCIES.map(freq => {
      const f = this.context!.createBiquadFilter();
      f.type = 'peaking';
      f.frequency.value = freq;
      f.Q.value = 1.4;   // Moderate Q — musical, not surgical
      f.gain.value = 0;
      return f;
    });

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;  // 3ms — fast enough for transients
    this.compressor.release.value = 0.15;  // 150ms

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = SMOOTHING;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    // Connect the static part of the graph (EQ → Compressor → Analyser → Out)
    this._connectStaticChain();

    // Attach mic input
    await this._attachMicrophone();

    this._isRunning = true;
  }

  /** Connect the non-source parts of the graph: EQ bank → compressor → analyser → output */
  private _connectStaticChain(): void {
    if (!this.context) return;

    let node: AudioNode = this.gainNode!;
    node.connect(this.highpassFilter!);
    node = this.highpassFilter!;

    this.eqFilters.forEach(f => {
      node.connect(f);
      node = f;
    });

    node.connect(this.compressor!);
    this.compressor!.connect(this.analyser!);
    this.analyser!.connect(this.context.destination);
  }

  /** Attach microphone as the input source. */
  private async _attachMicrophone(): Promise<void> {
    if (!this.context) return;

    // Clean up old test source
    if (this.testSource) {
      try { this.testSource.stop(); } catch { /* already stopped */ }
      this.testSource.disconnect();
      this.testSource = null;
      this._isTesting = false;
    }

    // Re-use existing mic stream if we have one and it's still active
    if (!this.stream || !this.stream.active) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,   // We handle processing ourselves
            noiseSuppression: false,   // Same — raw input for our DSP chain
            autoGainControl: false,    // Manual gain via GainNode
            // Low latency constraint for modern browsers
            latency: 0,
          } as MediaTrackConstraints,
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow mic access and try again.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a mic and try again.');
        }
        throw new Error(`Microphone error: ${err.message}`);
      }
    }

    if (this.micSource) {
      this.micSource.disconnect();
    }
    this.micSource = this.context.createMediaStreamSource(this.stream);
    this.micSource.connect(this.gainNode!);
  }

  // ─── Public Controls ───────────────────────────────────────────────────────
  /** Start / resume the audio engine (called when ON button pressed). */
  public async start(): Promise<void> {
    await this.initialize();
    this._isBypassed = false;
    this._applySettings();
  }

  /** Suspend audio processing WITHOUT destroying the context (ON→OFF toggle). */
  public async suspend(): Promise<void> {
    if (this.context && this.context.state === 'running') {
      await this.context.suspend();
    }
    this._isRunning = false;
    this._isBypassed = true;
  }

  /** Full shutdown — stops mic, closes context (called on logout / unmount). */
  public async destroy(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.testSource) {
      try { this.testSource.stop(); } catch { }
      this.testSource = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    this.micSource = null;
    this._isRunning = false;
    this._isTesting = false;
  }

  /** @deprecated Use start()/suspend() instead */
  public async stop(): Promise<void> {
    return this.destroy();
  }

  // ─── Test Audio (Pink Noise) ───────────────────────────────────────────────
  public startTestAudio(): void {
    if (!this.context || this._isTesting) return;
    this._isTesting = true;

    if (this.micSource) {
      this.micSource.disconnect();
    }

    // Generate pink noise buffer (2 seconds, looped)
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, sampleRate * 2, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      b6 = w * 0.115926;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    }

    this.testSource = this.context.createBufferSource();
    this.testSource.buffer = buffer;
    this.testSource.loop = true;
    this.testSource.connect(this.gainNode!);
    this.testSource.start();
  }

  public async stopTestAudio(): Promise<void> {
    this._isTesting = false;
    if (this.testSource) {
      try { this.testSource.stop(); } catch { }
      this.testSource.disconnect();
      this.testSource = null;
    }
    await this._attachMicrophone();
  }

  // ─── Profile & Mode ───────────────────────────────────────────────────────
  public setProfile(profile: HearingProfile): void {
    this._currentProfile = profile;
    this._applySettings();
  }

  public setEnvironment(mode: EnvironmentMode): void {
    this._currentMode = mode;
    this._applySettings();
  }

  public setBypass(bypass: boolean): void {
    this._isBypassed = bypass;
    this._applySettings();
  }

  public setMasterVolume(value: number): void {
    if (this.gainNode && this.context) {
      this.gainNode.gain.setTargetAtTime(
        Math.max(0, Math.min(4, value)),
        this.context.currentTime,
        0.05
      );
    }
  }

  // ─── DSP application ──────────────────────────────────────────────────────
  private _applySettings(): void {
    if (!this.context || !this.currentProfile) return;

    const now = this.context.currentTime;
    const ramp = 0.05; // 50ms smooth ramp — avoids zipper noise

    const preset = ENV_PRESETS[this._currentMode];

    // 1. High-pass filter (mode-dependent)
    if (this.highpassFilter) {
      this.highpassFilter.frequency.setTargetAtTime(
        this._isBypassed ? 1 : preset.highpassFreq,
        now, ramp
      );
    }

    // 2. EQ filters — profile base + specific boost + mode offsets
    this.eqFilters.forEach((filter, i) => {
      const freq = EQ_FREQUENCIES[i];
      if (this._isBypassed) {
        filter.gain.setTargetAtTime(0, now, ramp);
        return;
      }

      const profileGain = this._currentProfile?.eqBands[freq] ?? 0;

      // Select boost based on profile name or a type field if we had one
      let specificBoost = 0;
      const profileName = (this._currentProfile as any)?.name?.toLowerCase() || '';

      if (profileName.includes('mild')) {
        specificBoost = MILD_LOSS_BOOSTS[freq] ?? 0;
      } else if (profileName.includes('speech')) {
        specificBoost = SPEECH_FOCUS_BOOSTS[freq] ?? 0;
      } else if (profileName.includes('balanced')) {
        specificBoost = BALANCED_BOOSTS[freq] ?? 0;
      }

      const envOffset = preset.eqOffsets[freq] ?? 0;
      const total = Math.max(-18, Math.min(18, profileGain + specificBoost + envOffset));

      filter.gain.setTargetAtTime(total, now, ramp);
    });

    // 3. Compressor
    if (this.compressor) {
      this.compressor.threshold.setTargetAtTime(
        this._isBypassed ? -60 : preset.compressorThreshold,
        now, ramp
      );
      this.compressor.ratio.setTargetAtTime(
        this._isBypassed ? 1 : preset.compressorRatio,
        now, ramp
      );
    }

    // 4. Gain node — mode offset
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(
        this._isBypassed ? 0 : (1.0 + preset.gainOffset),
        now, ramp
      );
    }
  }

  // ─── Getters ──────────────────────────────────────────────────────────────
  public get currentProfile() { return this._currentProfile; }
  public get currentMode() { return this._currentMode; }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public isRunning(): boolean {
    return this._isRunning && !!this.context && this.context.state === 'running';
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    return this.context ? this.context.state : 'uninitialized';
  }
}

export const audioEngine = new AudioEngine();