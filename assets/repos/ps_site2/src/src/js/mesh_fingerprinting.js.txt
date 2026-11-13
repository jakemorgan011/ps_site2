// Copyright (c) 2025, Jake Morgan, termite
// This code contains all the basic steps necessary to start understanding audio sculpting
// This code is free to use for any purpose.
//
/*
                 _ _                        _       _   _
                | (_)                      | |     | | (_)
  __ _ _   _  __| |_  ___    ___  ___ _   _| |_ __ | |_ _ _ __   __ _
 / _` | | | |/ _` | |/ _ \  / __|/ __| | | | | '_ \| __| | '_ \ / _` |
| (_| | |_| | (_| | | (_) | \__ \ (__| |_| | | |_) | |_| | | | | (_| |
 \__,_|\__,_|\__,_|_|\___/  |___/\___|\__,_|_| .__/ \__|_|_| |_|\__, |
                                             | |                 __/ |
                                             |_|                |___/
*/
//
// info:
// in this example I use the offlineAudioContext web API.
// in retrospect, I would never use that again.
// I'm using their default fx "Nodes" in this code but in other examples found in my github-
// I interact with the buffer directly which proved to be extremely buggy and difficult.
//          ...shout out LLMS
// I also used an old dsp library called dsp.js...
//
// future:
// switch to "supersonic" audio engine.
// - sonic pi web engine.
// rather than running mathmetical expressions one time as a single-pass feature extraction
// create a real-time information retrieval system.
// switch to processing on server side or just switch to full integrated application off the web.


// NOTICE:
// IF YOU ARE LOOKING FOR THE OPENGL CALLS GO TO SKETCH.JS
// it uses the p5js webgl utility.


// step 1
class obj_parser {
    static parse(text) {
        const vertices = [];
        const lines = text.split('\n');

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts[0] === 'v') {
                vertices.push({
                    x: parseFloat(parts[1]),
                    y: parseFloat(parts[2]),
                    z: parseFloat(parts[3])
                });
            }
        }

        return vertices;
    }
}


// NOTE:
// APOLOGIES i changed my naming conventions a lot during this project...
// I'm sorry if you are searching for things and it doesn't make sense.

// get all stats HERE
class mesh_fingerprint {
    static calculate(vertices) {
        if (vertices.length === 0) return null;

        // just sorting to make everything fluid.
        const byX = [...vertices].sort((a, b) => a.x - b.x);
        const byY = [...vertices].sort((a, b) => a.y - b.y);
        const byZ = [...vertices].sort((a, b) => a.z - b.z);

        const xSpread = byX[byX.length - 1].x - byX[0].x;
        const ySpread = byY[byY.length - 1].y - byY[0].y;
        const zSpread = byZ[byZ.length - 1].z - byZ[0].z;
        const volume = Math.abs(xSpread * ySpread * zSpread);

        const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
        const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
        const centerZ = vertices.reduce((sum, v) => sum + v.z, 0) / vertices.length;

        const variance = vertices.reduce((sum, v) => {
            return sum +
                Math.pow(v.x - centerX, 2) +
                Math.pow(v.y - centerY, 2) +
                Math.pow(v.z - centerZ, 2);
        }, 0) / vertices.length;

        // y-axis profile for spectral curve
        const yProfile = [];
        for (let i = 0; i <= 20; i++) {
            const idx = Math.floor((i / 20) * (byY.length - 1));
            yProfile.push(byY[idx].y);
        }

        // z-axis profile for phase manipulation
        const zProfile = [];
        for (let i = 0; i <= 10; i++) {
            const idx = Math.floor((i / 10) * (byZ.length - 1));
            zProfile.push(byZ[idx].z);
        }

        const stats = {
            volume: volume,
            xSpread: xSpread,
            ySpread: ySpread,
            zSpread: zSpread,
            centerX: centerX,
            centerY: centerY,
            centerZ: centerZ,
            variance: variance,
            yProfile: yProfile,
            zProfile: zProfile,
            surfaceComplexity: Math.sqrt(variance / (volume || 1))
        };

        return stats;
    }

    // yea okay definitely don't normalize inside a mapping function...
    // DO ALL YOUR NORMALIZING WITHIN THE STATS OBJECT IT MAKES IT SO MUCH EASIER AND UNDERSTANDABLE.
    static mapToAudioParams(stats) {
        const normalize = (value, min, max) => {
            return Math.max(0, Math.min(1, (value - min) / (max - min)));
        };

        return {
            // SPECTRAL PARAMETERS
            // y-axis creates frequency shaping curve
            spectralCurve: stats.yProfile,

            // x-axis controls spectral spread/width
            spectralSpread: normalize(stats.xSpread, 0, 10) * 0.7,
            spectralShift: (normalize(stats.centerX, -5, 5) - 0.5) * 1.5,

            // z-axis controls phase and time smearing
            phaseScramble: normalize(Math.abs(stats.centerZ), 0, 5) * 0.6,
            spectralSmear: normalize(stats.zSpread, 0, 10) * 0.5,

            spectralBlur: normalize(stats.variance, 0, 10) * 0.4,

            binSkip: Math.floor(normalize(stats.surfaceComplexity, 0, 3) * 5),

            spectralDensity: normalize(stats.volume, 0, 100),

            reverbSize: 1.5 + Math.cbrt(stats.volume) * 2.5,
            reverbDecay: 0.5 + normalize(stats.volume, 0, 100) * 0.3,
            reverbDiffusion: normalize(stats.surfaceComplexity, 0, 2),
            reverbMix: 0.3 + normalize(stats.volume, 0, 50) * 0.3
        };
    }
}


// IGNORE THIS IF YOU JUST WANT TO SEE HOW ITS DONE.
//
// this is my 'spectral_mashing' effect that got axed during the course of this project.
// I was having some trouble interacting with the buffer and not breaking playback with OfflineAudioContext
// so it was ultimately scrapped from the production version.
// My math wasn't very strong when I wrote this so i couldn't do much without a environment like maxmsp

// PURE SPECTRAL PROCESSING
async function spectral_transform(inputBuffer, params) {
    const sampleRate = inputBuffer.sampleRate;
    const numChannels = inputBuffer.numberOfChannels;
    const outputLength = inputBuffer.length;

    const outputChannels = [];
    for (let ch = 0; ch < numChannels; ch++) {
        outputChannels[ch] = new Float32Array(outputLength);
    }

    const fftSize = 4096;
    const hopSize = Math.floor(fftSize / 4);

    for (let ch = 0; ch < numChannels; ch++) {
        const input = inputBuffer.getChannelData(ch);
        const output = outputChannels[ch];
        const fft = new FFT(fftSize, sampleRate);

        let prevMagnitudes = null;

        for (let i = 0; i < input.length - fftSize; i += hopSize) {
            const chunk = input.slice(i, i + fftSize);

            // Hann window
            const windowed = new Float32Array(fftSize);
            for (let j = 0; j < fftSize; j++) {
                const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / fftSize);
                windowed[j] = chunk[j] * w;
            }

            fft.forward(windowed);

            const real = new Float32Array(fft.real);
            const imag = new Float32Array(fft.imag);
            const magnitudes = new Float32Array(real.length);
            const phases = new Float32Array(real.length);

            for (let bin = 0; bin < real.length; bin++) {
                magnitudes[bin] = Math.sqrt(real[bin]**2 + imag[bin]**2);
                phases[bin] = Math.atan2(imag[bin], real[bin]);
            }

            const numBins = magnitudes.length;
            for (let bin = 0; bin < numBins; bin++) {
                const curveIdx = Math.floor((bin / numBins) * (params.spectralCurve.length - 1));
                const normalizedY = (params.spectralCurve[curveIdx] + 5) / 10; // normalize to 0-1
                const gain = 0.2 + normalizedY * 1.5;
                magnitudes[bin] *= gain;
            }

            if (params.spectralSpread > 0.01) {
                const newMagnitudes = new Float32Array(magnitudes.length);
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    const spreadFactor = 1 + (Math.sin(bin * 0.1) * params.spectralSpread);
                    const targetBin = Math.floor(bin * spreadFactor);
                    if (targetBin < magnitudes.length) {
                        newMagnitudes[targetBin] += magnitudes[bin] * 0.7;
                        newMagnitudes[bin] += magnitudes[bin] * 0.3;
                    }
                }
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    magnitudes[bin] = newMagnitudes[bin];
                }
            }

            if (Math.abs(params.spectralShift) > 0.01) {
                const newMagnitudes = new Float32Array(magnitudes.length);
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    const shiftedBin = Math.floor(bin * (1 + params.spectralShift));
                    if (shiftedBin >= 0 && shiftedBin < magnitudes.length) {
                        newMagnitudes[shiftedBin] += magnitudes[bin];
                    }
                }
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    magnitudes[bin] = newMagnitudes[bin] * 0.7 + magnitudes[bin] * 0.3;
                }
            }

            if (params.phaseScramble > 0.01) {
                for (let bin = 0; bin < phases.length; bin++) {
                    const zIdx = Math.floor((bin / phases.length) * (params.zProfile.length - 1));
                    const scramble = params.zProfile[zIdx] * params.phaseScramble;
                    phases[bin] += scramble * Math.PI;
                }
            }

            if (params.spectralSmear > 0.01 && prevMagnitudes) {
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    magnitudes[bin] = magnitudes[bin] * (1 - params.spectralSmear) +
                                     prevMagnitudes[bin] * params.spectralSmear;
                }
            }

            if (params.spectralBlur > 0.01) {
                const blurred = new Float32Array(magnitudes.length);
                const blurWidth = Math.ceil(params.spectralBlur * 10);
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    let sum = 0;
                    let count = 0;
                    for (let offset = -blurWidth; offset <= blurWidth; offset++) {
                        const targetBin = bin + offset;
                        if (targetBin >= 0 && targetBin < magnitudes.length) {
                            sum += magnitudes[targetBin];
                            count++;
                        }
                    }
                    blurred[bin] = sum / count;
                }
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    magnitudes[bin] = magnitudes[bin] * (1 - params.spectralBlur) +
                                     blurred[bin] * params.spectralBlur;
                }
            }

            if (params.binSkip > 0) {
                for (let bin = 0; bin < magnitudes.length; bin++) {
                    if (bin % (params.binSkip + 1) !== 0) {
                        magnitudes[bin] *= 0.3;
                    } else {
                        magnitudes[bin] *= 1.5;
                    }
                }
            }

            const densityGain = 0.5 + params.spectralDensity * 0.8;
            for (let bin = 0; bin < magnitudes.length; bin++) {
                magnitudes[bin] *= densityGain;
            }

            prevMagnitudes = new Float32Array(magnitudes);

            for (let bin = 0; bin < real.length; bin++) {
                real[bin] = magnitudes[bin] * Math.cos(phases[bin]);
                imag[bin] = magnitudes[bin] * Math.sin(phases[bin]);
            }

            const processed = fft.inverse(real, imag);

            for (let j = 0; j < processed.length; j++) {
                if (i + j < output.length) {
                    const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / fftSize);
                    output[i + j] += processed[j] * w * 0.5;
                }
            }
        }
    }

    return outputChannels;
}


// here we go.
// this is where stuff happens
class audio_processor {
    constructor() {
        this.audioContext = null;
        this.sourceBuffer = null;
        this.processedBuffer = null;
        this.isPlaying = false;
        this.currentSource = null;
    }
    // basic loaders. nothing important here.
    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    async loadAudioFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        this.sourceBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return this.sourceBuffer;
    }

    //
    // basically all this does is assign the stats object we made to all of our offlineAudioContext `nodes`
    // i personally don't mind the node system but would've liked to be able to create custom nodes easier.
    async process_with_parameters(params) {
        if (!this.sourceBuffer) {
            throw new Error('No audio loaded');
        }

        // SPECTRAL PROCESSING
        const spectralChannels = await spectral_transform(this.sourceBuffer, params);

        let processedBuffer = this.audioContext.createBuffer(
            spectralChannels.length,
            spectralChannels[0].length,
            this.sourceBuffer.sampleRate
        );

        for (let ch = 0; ch < spectralChannels.length; ch++) {
            processedBuffer.copyToChannel(spectralChannels[ch], ch);
        }

        // REVERB ONLY
        const offlineContext = new OfflineAudioContext(
            processedBuffer.numberOfChannels,
            processedBuffer.length,
            processedBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = processedBuffer;

        // Reverb
        const convolver = offlineContext.createConvolver();
        convolver.buffer = this.create_reverb(
            offlineContext,
            params.reverbSize,
            params.reverbDecay,
            params.reverbDiffusion
        );

        const reverbMix = offlineContext.createGain();
        reverbMix.gain.value = params.reverbMix;

        const dryGain = offlineContext.createGain();
        dryGain.gain.value = 0.7;

        source.connect(convolver);
        convolver.connect(reverbMix);
        source.connect(dryGain);

        dryGain.connect(offlineContext.destination);
        reverbMix.connect(offlineContext.destination);

        // render at first sample.
        source.start(0);

        this.processedBuffer = await offlineContext.startRendering();
        return this.processedBuffer;
    }

    create_reverb(context, size, decay, diffusion) {
        const sampleRate = context.sampleRate;
        const duration = Math.max(1, size);
        const length = Math.floor(sampleRate * duration);
        const impulse = context.createBuffer(1, length, sampleRate);
        const impulseData = impulse.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / length;
            const envelope = Math.pow(1 - t, decay * 2.5);

            let sample = 0;
            const reflections = Math.floor(15 + diffusion * 40);

            for (let r = 0; r < reflections; r++) {
                const reflectionTime = (r / reflections) * length;
                if (i > reflectionTime) {
                    const reflection = (Math.random() * 2 - 1) * Math.exp(-r * 0.08);
                    sample += reflection;
                }
            }

            if (t > 0.3) {
                sample += (Math.random() * 2 - 1) * Math.pow(1 - t, decay * 4) * 0.8;
            }

            impulseData[i] = sample * envelope;
        }

        return impulse;
    }

    // playback time. has a lot of weird issues if you start creating custom effects.
    async play(buffer) {
        if (this.isPlaying) this.stop();

        // Ensure audio context exists and is running
        if (!this.audioContext) {
            await this.init();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer || this.processedBuffer;
        this.currentSource.connect(this.audioContext.destination);
        this.currentSource.start(0);
        this.isPlaying = true;

        this.currentSource.onended = () => {
            this.isPlaying = false;
        };
    }

    stop() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
            this.isPlaying = false;
        }
    }



    downloadProcessedAudio(filename = 'processed.wav') {
        if (!this.processedBuffer) {
            throw new Error('No processed audio available');
        }

        const wav = this.audioBufferToWav(this.processedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const data = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            data.push(buffer.getChannelData(i));
        }

        const length = data[0].length;
        const arrayBuffer = new ArrayBuffer(44 + length * blockAlign);
        const view = new DataView(arrayBuffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * blockAlign, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, length * blockAlign, true);

        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, data[channel][i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    }
}

// from here its all html interaction for GUI and UX

// ui control
const audioProcessor = new audio_processor();
let meshFingerprint = null;
let audioParams = null;

// start processing when interact`
document.addEventListener('click', () => {
    if (!audioProcessor.audioContext) {
        audioProcessor.init();
    }
}, { once: true });

document.getElementById('obj-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const text = await file.text();
        const vertices = obj_parser.parse(text);

        document.getElementById('status-text').textContent = `Loaded ${vertices.length} vertices`;

        meshFingerprint = mesh_fingerprint.calculate(vertices);
        audioParams = mesh_fingerprint.mapToAudioParams(meshFingerprint);

        const paramsDisplay = document.getElementById('params-display');
        const paramsList = document.getElementById('params-list');
        paramsDisplay.style.display = 'block';

        paramsList.innerHTML = Object.entries(audioParams)
            .filter(([key]) => !key.includes('Profile') && !key.includes('Curve'))
            .map(([key, value]) => `<p>${key}: ${typeof value === 'number' ? value.toFixed(3) : value}</p>`)
            .join('');

        if (audioProcessor.sourceBuffer) {
            document.getElementById('process-btn').disabled = false;
        }
    }
});

document.getElementById('wav-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await audioProcessor.init();
        await audioProcessor.loadAudioFile(file);

        document.getElementById('status-text').textContent = 'Audio loaded';

        if (audioParams) {
            document.getElementById('process-btn').disabled = false;
        }
    }
});

document.getElementById('process-btn').addEventListener('click', async () => {
    if (audioParams && audioProcessor.sourceBuffer) {
        document.getElementById('status-text').textContent = 'Processing...';

        try {
            await audioProcessor.process_with_parameters(audioParams);

            document.getElementById('status-text').textContent = 'Processing complete!';
            document.getElementById('play-btn').disabled = false;
            document.getElementById('download-btn').disabled = false;
        } catch (error) {
            document.getElementById('status-text').textContent = `Error: ${error.message}`;
        }
    }
});

document.getElementById('play-btn').addEventListener('click', async () => {
    await audioProcessor.play();
    document.getElementById('stop-btn').disabled = false;
});

document.getElementById('stop-btn').addEventListener('click', () => {
    audioProcessor.stop();
    document.getElementById('stop-btn').disabled = true;
});

document.getElementById('download-btn').addEventListener('click', () => {
    audioProcessor.downloadProcessedAudio('dimensionality-processed.wav');
});
