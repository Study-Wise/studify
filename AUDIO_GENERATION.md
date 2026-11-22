# Audio service

Read-aloud and the audio download both use Piper text-to-speech through `@diffusionstudio/vits-web@1.0.3`, running fully in the browser (ONNX Runtime Web, WebAssembly).

## Loading

- `index.html` imports the engine and `onnxruntime-web@1.18.0` from esm.sh in one module script and exposes them as `window.tts` and `window.ort`.
- Voice models (about 60 MB each) download from Hugging Face on first use and are cached in the browser. The engine also fetches its phonemizer data from jsDelivr for every sentence.

## Flow (`script.js`)

- `getSentence(offset)` splits the text into sentences. The voice alternates per sentence (voice 1, voice 2).
- `synthesize(paragraph, onProgress, attempts = 3)` returns a WAV blob.
- Live reading plays one sentence at a time and pre-fetches the next one. The highlighted word follows playback time, so it is approximate.
- Download builds one 22050 Hz WAV from all sentences, with a progress bar.

## Known engine problems and how they are handled

- **Session leak.** The engine builds a new model session on every call and never frees it, so it ran out of memory after about 55 sentences. `InferenceSession.create` is replaced to reuse one session per model.
- **Out-of-range sound ids.** The engine's phonemizer ignores the voice's own sound table. Small voices (130 sounds, mostly `low` and `x_low`) crash with `idx=144 must be within the inclusive range`. The session's `run` catches this, drops the ids above the limit and runs again. The red `idx=144` line in the console is expected and harmless.
- **Failed speech.** One retry with digits and symbols spelled out (`symbolNames`, `digitNames`).
- **Network hangs.** The phonemizer data download can fail without rejecting, so a request is raced against a 90 second timer and tried up to 3 times. After that the error ends with `[voice …, text "…"]`.

## Sample code

Speak one sentence (`window.tts` is set in `index.html`):

```js
const voices = await window.tts.voices();
const blob = await window.tts.predict(
    { text: 'Hello there.', voiceId: 'en_US-hfc_female-medium' },
    progress => console.log(`${progress.loaded}/${progress.total}`)
);
new Audio(URL.createObjectURL(blob)).play();
```

Reuse one model session per voice and drop out-of-range sound ids (condensed from `script.js`):

```js
const sessions = new Map();
const createSession = window.ort.InferenceSession.create.bind(window.ort.InferenceSession);
window.ort.InferenceSession.create = async model => {
    const bytes = new Uint8Array(model);
    const key = `${bytes.length}:${Array.from({ length: Math.ceil(bytes.length / 997) }, (_, index) => bytes[index * 997]).reduce((hash, value) => Math.imul(hash, 31) + value | 0, 0)}`;
    if (!sessions.has(key)) {
        const session = await createSession(model);
        const run = session.run.bind(session);
        session.run = async feeds => {
            try {
                return await run(feeds);
            } catch (error) {
                const limit = /inclusive range \[-\d+,(\d+)\]/.exec(error?.message ?? String(error));
                if (!limit) throw error;
                const ids = BigInt64Array.from(Array.from(feeds.input.data).filter(id => id <= BigInt(limit[1])));
                return run({ ...feeds, input: new window.ort.Tensor('int64', ids, [1, ids.length]), input_lengths: new window.ort.Tensor('int64', [ids.length]) });
            }
        };
        sessions.set(key, session);
    }
    return sessions.get(key);
};
```

Timeout with 3 tries, then one retry with digits and symbols spelled out (simplified from `synthesize`):

```js
function synthesize(paragraph, onProgress, attempts = 3) {
    return Promise.race([
        window.tts.predict({ text: paragraph.text, voiceId: paragraph.voice }, onProgress),
        new Promise(resolve => setTimeout(resolve, 90000, null))
    ]).then(blob => blob ?? (attempts > 1 ? synthesize(paragraph, onProgress, attempts - 1) : Promise.reject(new Error('Timed out'))), error => {
        const spoken = spellOut(paragraph.text);

        if (spoken === paragraph.text) throw error;

        return synthesize({ ...paragraph, text: spoken }, onProgress);
    });
}
```

`spellOut` stands for the digit and symbol replacement using `digitNames` and `symbolNames`, which is written inline in `script.js`.
