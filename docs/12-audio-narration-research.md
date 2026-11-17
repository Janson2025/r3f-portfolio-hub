# Audio and narration research

The site currently has an opt-in audio icon, off by default. It enables quiet synthesized ambient tones, a short avatar poke effect, and a short cube slice effect. These are local Web Audio prototypes; no speech service, voice recording, microphone permission, or paid account is used.

## Recommended next step: pre-generated narration

The biography and questions are a small, fixed set of scripts. Record James or generate approved speech once, store the audio alongside the content, and play it only after sound is enabled. This provides a consistent voice without a network synthesis request every time someone visits. Voice, pronunciation, usage rights and final scripts need selecting before generating production recordings.

Use the actual audio playback clock as the single authority for text, bubbles and mouth cues. `HTMLMediaElement.currentTime` exposes seconds on the audio timeline ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)). Selecting a question should stop the old recording, reset that clock, and start its replacement. Pausing or buffering must pause the mouth and typewriter. Muting should stop speech; text-only behavior must remain complete.

For mouth movement, map timed phonemes or visemes to the GLB avatar's existing mouth targets. The current character-derived mouth cues are suitable for silent text playback, but do not provide accurate synchronization to a real recording. Obtain aligned timing metadata when synthesizing or use an offline alignment step for recorded speech.

## Alternatives

| Approach | Requirements | Benefits | Limits and costs |
| --- | --- | --- | --- |
| Browser speech synthesis | `speechSynthesis`, voice discovery after `voiceschanged`, cancellation and a text-only fallback | No speech backend or hosted audio needed for a prototype | Voices depend on the visitor's device. Word boundary events have limited browser support, so exact lip sync is unreliable. No service charge is added by this app, but quality and offline behavior vary. |
| Record or pre-generate clips | Approved scripts/voice and audio assets; alignment metadata; hosting | Consistent sound and predictable timing, cacheable; no live vendor dependency | Recording/editing time, any voice license or generation fees, plus storage and transfer. Script changes require new clips. |
| Server-side TTS | A server endpoint, protected credentials, caching, usage limits and a provider | Dynamic text, consistent chosen voice; some services supply visemes | Usage-based synthesis and hosting costs, network delay, vendor dependency, and disclosure of submitted text. Never place service credentials in the client bundle. |

Browser voice availability is reported by [`getVoices()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices). [`boundary`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/boundary_event) is not a universally supported timing API. Azure is one example of a provider with [viseme IDs and blend-shape timing](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme); its output would need a mapping to this GLB's morph targets. This is an option, not a selected subscription.

## Interaction sounds and consent

Web Audio should resume after an explicit user gesture because browsers apply autoplay policies ([Chrome guidance](https://developer.chrome.com/blog/autoplay)). The current sound toggle creates no context before enablement and suspends on mute, hidden tabs and navigation. Replace synthetic prototypes with short, licensed poke/slide clips and a seamless, restrained ambient loop after sound design review. Keep ambient and interaction levels independently configurable in the eventual asset configuration; avoid stacking repeated slide effects during fast cube moves. No visitor audio input is needed.

## Implementation sequence

1. Select James's recorded voice or an approved synthetic voice and final scripts.
2. Produce a sample biography plus one question, with aligned timing metadata.
3. Add an audio-clock playback controller shared by avatar, bubbles and text, including interruption, loading, errors and muted fallback.
4. Confirm intelligibility, phoneme alignment, volume and licensing on desktop/mobile, then produce remaining clips.
5. Replace sound prototypes and tune them by listening on headphones and phone speakers. Exact provider pricing was not researched or quoted.
