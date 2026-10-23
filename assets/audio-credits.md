# Apple bite recording

- Game asset: `apple-bite.wav`, mono 44,100 Hz, 16-bit PCM WAV.
- Source: [Apple Bite by AntumDeluge on OpenGameArt](https://opengameart.org/content/apple-bite).
- Original recording: [apple bite by sonicmariobrotha on Freesound](https://freesound.org/s/333825/).
- License listed by the source: [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- Downloaded source: `apple-bite.ogg`, https://opengameart.org/sites/default/files/apple_bite_0.ogg.
- Conversion: decoded to WAV, trimmed leading/trailing silence, normalized to 80% peak, and applied 3ms/8ms edge fades to prevent clicks. No synthetic tone or noise is layered over the recording.
- The decoder was used only for conversion, under `tmp/`; the game has no new runtime dependency.
