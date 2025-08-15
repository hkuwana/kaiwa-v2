class AudioProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const inputData = input[0];

        // Calculate audio level (RMS)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        const level = Math.sqrt(sum / inputData.length);

        // Send only the level back to the main thread
        this.port.postMessage({
            type: "audio-data",
            level,
        });

        return true;
    }
}

registerProcessor("audio-processor", AudioProcessor);
