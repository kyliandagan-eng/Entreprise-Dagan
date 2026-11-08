import sys, json
from faster_whisper import WhisperModel
model_dir, wav, out = sys.argv[1:4]
m = WhisperModel(model_dir, device="cpu", compute_type="int8", cpu_threads=4)
prompt = "Jeffrey Dahmer, Milwaukee, Steven Hicks, Steven Tuomi, Konerak, Tracy Edwards, Polaroids, appartement 213, perpétuités."
import numpy as np
audio = np.fromfile(wav, dtype=np.float32)
segs, info = m.transcribe(audio, language="fr", word_timestamps=True, beam_size=5, initial_prompt=prompt, vad_filter=False, condition_on_previous_text=False)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text, "words": [{"w": w.word, "s": w.start, "e": w.end, "p": w.probability} for w in s.words]})
    print(f"[{s.start:7.2f} - {s.end:7.2f}] {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
