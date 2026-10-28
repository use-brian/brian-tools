# Feedback and revision playbook

Use this playbook when revising an existing showcase or applying feedback to a
shared renderer.

## 1. Classify the feedback

| Feedback | Required scope |
|---|---|
| Copy or narration | Affected locale scripts, captions, manifest, and claim review |
| Crop, pacing, or legibility | Silent master, poster, card, contact sheet, and all locale MP4s |
| Supplied screenshot or clip | Asset classification, scenario/evidence contract, visual master, and all derivatives |
| Logo, rail, footer, or shared renderer | Every affected scenario and locale, not one example MP4 |
| “Use this instead” | Replacement scenario or version plus active-index update; preserve the old private pack |

## 2. Protect evidence integrity

- Inspect the supplied asset at original resolution before editing.
- Retain its original bytes under `inputs/` or private evidence storage.
- Use `synthetic`, `internal-approved`, or `customer-approved` accurately.
- Use `observed-output` when the original prompt or full run is missing.
- Label a reconstructed prompt `representative` in the scenario and public
  record.
- Do not combine an unrelated synthetic input sequence with a real screenshot
  and imply that one produced the other.
- Separate direct evidence from positioning. A Slack screenshot proves Slack;
  `deliver wherever you want` remains a claim requiring human approval.

## 3. Build for the collapsed viewer

Assume first playback is muted and roughly 390 px wide.

1. Show one recognizable situation.
2. Use three to five stable visual beats.
3. Put captions outside critical product content.
4. Use a dedicated hero crop; do not merely shrink a full desktop.
5. Hold the settled payoff for at least 2.5 seconds.
6. Create a separate 480 x 270 card crop and inspect it at actual size.
7. Prefer a gentle push-in or 6-12-frame dissolve over rapid crop changes.

For a retained screenshot, stable detail crops can reveal the output without
inventing product work. End on the complete approved output.

## 4. Keep Brian branding pixel-correct

Use the authoritative `brian-video` lens renderer. For the current pixel
mascot:

- preserve the cropped 7 x 6 grid rather than forcing a square;
- resize to `(7n, 6n)` with an integer cell size;
- use nearest-neighbor sampling, never Lanczos or bicubic;
- fade opacity without blurring the alpha edge; and
- inspect both the expanded opening rail and compact corner state after video
  encoding.

Pass the evidence label into every branded derivative. Do not hard-code
`SYNTHETIC` in the card renderer.

## 5. Run the mandatory review loop

After each visual edit:

1. Generate an eight-frame contact sheet from the final encoded video.
2. Watch the clip at normal speed while muted.
3. Inspect the result frame and card at actual gallery size.
4. Check for jumpy motion, tiny text, captions covering UI, raw Markdown,
   incorrect labels, stretched logos, and an unclear payoff.
5. Watch the narrated variants for timing and synchronization.
6. Re-edit and repeat until a stranger can state the input and outcome without
   prior explanation.

Native speakers must still review Cantonese and Japanese pronunciation before
release.

Use `scripts/build-review-contact-sheet.mjs` for the standard contact sheet.

## 6. Regenerate the complete family

When the silent master or shared renderer changes:

- re-render the silent master;
- regenerate English, Cantonese, and Japanese MP4s from that master;
- refresh poster, card, contact sheet, captions when copy changed, narration
  manifest, and checksums;
- verify 1920 x 1080, constant 30 fps, H.264 `yuv420p`, AAC 48 kHz when
  narrated, 10-15 seconds, and synchronized duration; and
- rerun scenario and candidate validation at the truthful stage.

Do not overwrite an approved release. Increment the version when the run,
claim, evidence, or edit changes materially.
