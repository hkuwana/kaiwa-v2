class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Increase input gain for better level detection
        this.gain = 5.0; // Amplify input by 5x
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const inputData = input[0];

        // Apply gain to input data
        const amplifiedData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            amplifiedData[i] = inputData[i] * this.gain;
        }

        // Calculate audio level (RMS) from amplified data
        let sum = 0;
        for (let i = 0; i < amplifiedData.length; i++) {
            sum += amplifiedData[i] * amplifiedData[i];
        }
        const rms = Math.sqrt(sum / amplifiedData.length);

        // Apply some amplification and smoothing to make levels more visible
        // Normalize and amplify the level (0-1 range)
        const level = Math.min(1, rms * 2); // Amplify by 2x for better visibility

        // Add some debugging
        if (rms > 0.001) { // Only log when there's actual audio
            console.log('🎵 AudioWorklet - RMS:', rms.toFixed(4), 'Amplified:', level.toFixed(4));
        }

        // Send only the level back to the main thread
        this.port.postMessage({
            type: "audio-data",
            level,
        });

        return true;
    }
}

registerProcessor("audio-processor", AudioProcessor);
