# Short-showcase video standard

Use this standard for every phase-one 10-15 second product showcase. The
private scenario manifest remains the source of truth for the individual
story; this file makes capture, editing, review, and delivery consistent across
the gallery.

## Contents

1. Delivery profile
2. Story and timing
3. Product capture
4. Editing and visual treatment
5. Labels, captions, and accessibility
6. Files and versions
7. Acceptance gates

## 1. Delivery profile

Use profile `gallery-landscape-v1` unless the human approves another profile.

| Property | Requirement |
|---|---|
| Public duration | 10.0-15.0 seconds; target 12-13 seconds |
| Canvas | 1920 x 1080, 16:9 |
| Frame rate | Constant 30 fps |
| Video | MP4, H.264, `yuv420p`, web fast-start |
| Audio | Silent-first; optional approved narration in AAC, normally 48 kHz |
| Poster | 1920 x 1080 PNG or WebP from the verified hero frame |
| Captions | Burned scene text plus a WebVTT transcript when speech is present |
| File-size target | 12 MiB or less without making product text unreadable |

Capture a full-resolution master before editing. The master may be WebM or MP4
and may be longer than 15 seconds. Keep the public deliverable silent-first:
the transformation must remain understandable when muted.

Machine narration is allowed when it improves comprehension. Treat it as a
separate, deterministic production stage after the visual cut is locked. A
local system voice is suitable for review cuts; use an approved Gemini,
ElevenLabs, or other release voice only when its cost, rights, and identity are
cleared. Record the exact script, provider, voice, rate or model, and offset.

When narration is enabled, generate three required variants from the same
silent visual master:

| Locale | Language | Local review voice | Local review rate |
|---|---|---|---:|
| `en` | English | Daniel | 190 wpm |
| `yue-HK` | Cantonese | Sinji | 175 wpm |
| `ja-JP` | Japanese | Kyoko | 180 wpm |

These are review defaults, not required public voices. A release voice may
change per locale after cost, rights, pronunciation, and identity approval.

Do not auto-crop the landscape deliverable to portrait. Make a separately
reviewed portrait composition when a channel requires 9:16.

## 2. Story and timing

Show one causal transformation:

> recognizable input -> exact request -> real Brian work -> inspectable result

For `observed-output`, do not imitate the missing work. Use:

> recognizable retained output -> meaningful detail -> complete approved result

Use this timing skeleton. Adjust boundaries to the real interaction, but retain
the order and the minimum result hold.

| Time | Beat | Required evidence |
|---|---|---|
| 0.0-2.0s | Situation | Recognizable synthetic input or operating problem |
| 2.0-4.0s | Request | Exact request or its faithful concise excerpt |
| 4.0-9.0s | Work | Real shipped product behavior in causal order |
| 9.0-13.0s | Result | Verified hero frame held for at least 2.5 seconds |
| 13.0-15.0s | Optional close | Short outcome line or channel-specific end card |

If the clip is 10-12 seconds, remove the optional close before shortening the
result hold. Do not turn the video into a feature list. A viewer should be able
to answer: “What did the operator have, and what usable thing did Brian
produce?”

## 3. Product capture

### Before recording

- Complete the permission preflight and product rehearsal.
- Fix the exact scenario version, prompt, starting state, and expected result.
- Use a dedicated clean browser session at 100% browser zoom.
- Set a 1920 x 1080 viewport and one theme for the whole batch.
- Close or hide unrelated tabs, notifications, bookmarks, password managers,
  account menus, developer overlays, and system chrome.
- Confirm every visible record is synthetic or separately approved.
- Put the evidence-appropriate persistent label in the product-frame safe
  area; do not rely on a caption that appears only once:
  - synthetic -> `SYNTHETIC DEMO`;
  - approved Use Brian internal output -> `INTERNAL DEMO`;
  - customer-approved evidence -> the exact label approved in its evidence
    plan.
- Rehearse the cursor path and scroll positions. Keep the hero result readable
  without hovering.

### Recording

- Prefer page-only CDP capture. Use desktop capture only when the product
  behavior cannot be represented page-only and the privacy reviewer approves
  the expanded frame.
- Record the complete successful run, including the initial state, submitted
  request, approval surface when relevant, and final result.
- Keep the real product UI real. Never generate, redraw, or substitute product
  footage to conceal a failed or unavailable behavior.
- Make real product UI the default visual surface, not merely one evidence
  insert among illustrations. When the request, workspace context, approval,
  or result can be shown safely in Brian, show that real surface and let it
  occupy most of the clip.
- Use a neutral diagram only for the exact connector, transformation, or
  external-system step that cannot be captured. Do not illustrate the request
  and result simply because one middle step is unavailable.
- For a prepared concept without a retained causal run, a real Brian request
  state and a real Brian Page may be used as a product-native storyboard only
  when the rail and release record say `PRODUCT UI CONCEPT`. Do not edit the
  sequence to imply the prepared Page was generated by the unretained run.
- Move the cursor directly and deliberately. Do not circle, wiggle, or park it
  over the hero result.
- Scroll only to reveal required evidence. Start and end each scroll on a
  stable readable frame.
- Preserve a clean two-second hero hold in the master.

The timed capture wrapper in the sibling `brian-video` repository is suitable
for a pre-staged route or when an interactive controller drives the same named
browser session during recording. It does not choreograph the product actions
by itself. Against production, the human signs in through the trusted UI and
the capture uses the existing session with `--login=none`.

### Capture failure

Stop the recording when the run diverges from the verified scenario, exposes
private data, produces an incomplete result, or invokes an unapproved action.
Retain the failed run privately when it helps diagnose product behavior. Do not
edit it into apparent success.

### Supplied screenshots and clips

- Inspect the original asset before cropping or converting it.
- Retain the original bytes and record the human's permitted use.
- Crop or frame the real asset; never redraw Slack, Brian, or another product
  UI to make it cleaner.
- When the full generation run is unavailable, classify the result
  `observed-output`, label any reconstructed request representative, and use
  stable detail crops instead of inventing missing causal steps.

## 4. Editing and visual treatment

- Preserve causal order for a retained run. For `observed-output`, preserve an
  honest inspection sequence and never imply that an unretained action
  produced the asset.
- Prefer jump cuts over extreme speed. Accelerate uneventful processing at up
  to 4x. Keep typing, approvals, citations, and result inspection at a readable
  speed.
- Do not cut away from an approval card before sender, recipient or audience,
  content, and action are inspectable.
- Hold the hero result for at least 2.5 seconds after any motion settles.
- Use no more than four or five distinct visual beats in a 15-second clip
  unless the scenario genuinely requires more. Give readable input, request,
  and result states stable holds of roughly two seconds or longer.
- Use hard cuts when the location and state remain easy to track. Use a short
  6-12 frame dissolve when a hard cut between substantially different crops
  would feel jumpy. Do not cycle rapidly through processing screenshots.
- Frame or crop real UI without changing its contents. Do not use generated
  imagery to imitate product UI.
- As a portfolio check, reject a batch in which illustration dominates cases
  that have safe real Brian surfaces available. The normal 10-15 second mix is
  real request, one short explanatory bridge if needed, real result, and a
  tighter real-result hero hold.
- Keep critical text inside an 80 px horizontal and 64 px vertical safe area.
- Apply the authoritative `brian-video/docs/brand-system.md` type, color, and
  logo rules. Use the product UI's true colors; brand the frame around it
  rather than recoloring it.
- Preserve pixel-art geometry. The current Brian mascot is a cropped 7 x 6
  grid: render it at `(7n, 6n)` using an integer cell size and nearest-neighbor
  sampling. Never force it into a square or resize it with Lanczos/bicubic.
  Inspect the expanded rail and compact corner mark after H.264 encoding.
- Use no customer logo, testimonial language, or outcome metric unless the
  evidence and claim review specifically authorize it.

For the first gallery batch, use product footage and deterministic brand
graphics only. Generated or stock b-roll adds cost and weakens the proof in a
10-15 second product demonstration.

## 5. Labels, captions, and accessibility

- Keep `SYNTHETIC DEMO` visible throughout every synthetic product frame.
- Keep `INTERNAL DEMO` visible throughout every approved Use Brian internal
  frame. Pass the same evidence label into the rail, footer, poster, 480 x 270
  card, captions where relevant, and release metadata; do not hard-code one
  classification in a derivative renderer.
- Use one outcome-led caption at a time, no more than two lines and normally
  3-8 words per line.
- Do not cover the request, approval details, citations, totals, or hero result.
- Use high contrast and a quiet solid or translucent backing when the UI is
  visually busy.
- Avoid rapid flashing, caption animation that prevents reading, and color as
  the only carrier of meaning.
- Do not expose hidden reasoning or claim that ordinary UI waiting represents
  autonomous background work.
- If approved speech or product audio matters, provide accurate WebVTT captions
  and review the audio for private names, notifications, and unintended speech.

### Narration workflow

1. Approve the silent-first visual sequence and scene captions.
2. Write one outcome-led narration script that describes only what is visible.
3. Synthesize with the selected provider and voice.
4. Measure the speech against the picture duration. Leave at least 0.2 seconds
   of tail room; never silently truncate or time-stretch speech beyond a narrow,
   natural correction.
5. Mux speech after the visual edit so changing a voice does not re-encode the
   picture. Normalize narration consistently and retain captions for muted
   playback.
6. Review the final audio at normal speed for pronunciation, privacy, claims,
   synchronization, and intelligibility on laptop speakers.
7. Repeat script, voice, duration, caption, and privacy review independently
   for English, Cantonese, and Japanese. Localize meaning and cadence instead
   of translating word-for-word.

When the sibling `brian-video` repository is available, use:

```bash
pnpm narrate:showcase \
  --input=/path/to/showcase-silent.mp4 \
  --output=/path/to/showcase.mp4 \
  --script-file=/path/to/narration.txt \
  --provider=system \
  --voice=Daniel
```

To generate all required locale variants from one silent master:

```bash
pnpm narrate:showcase:locales \
  --input=/path/to/showcase-silent.mp4 \
  --scripts-dir=/path/to/narration \
  --captions-dir=/path/to/captions \
  --output-dir=/path/to/release
```

The scripts directory must contain `en.txt`, `yue-HK.txt`, and `ja-JP.txt`.
When packaging a release, the captions directory must contain the matching
WebVTT files. The batch must fail before producing variants when any required
localized asset is missing.

If the visual master or shared brand renderer changes, regenerate all three
localized MP4s from the new silent master. Refresh the poster, card, contact
sheet, narration manifest, and checksums in the same revision.

### Product-formatting review

- Inspect the hero output at full size and in the 480 x 270 card preview.
- Check that requested headings, lists, emphasis, tables, and spacing use the
  product's native rendering.
- Look specifically for unintended literal Markdown such as `**`, `#`,
  backticks, or raw link syntax.
- When formatting is wrong, correct the real product result and recapture it.
  Do not erase, blur, or cover the defect in the video edit.

### First-viewer review loop

Run this loop after every material edit:

1. Generate a time-sampled eight-frame contact sheet from the encoded video.
2. Watch at normal speed while muted.
3. Inspect the hero at normal laptop size and in the 480 x 270 card.
4. Check the opening rail and compact corner mark for pixel distortion.
5. Ask whether a stranger can name the starting situation and payoff without
   prior explanation.
6. Re-edit and repeat when motion is jumpy, text is too small, the result is
   unclear, or the evidence label is wrong.

Then review each narrated locale at normal speed for timing and pronunciation.
Machine checks do not replace native Cantonese and Japanese review.

## 6. Files and versions

Store local release artifacts under the private scenario directory:

```text
release/v<version>/
  master.webm
  narration/
    en.txt
    yue-HK.txt
    ja-JP.txt
  captions/
    en.vtt
    yue-HK.vtt
    ja-JP.vtt
  showcase.en.mp4
  showcase.yue-HK.mp4
  showcase.ja-JP.mp4
  showcase.narration-variants.json
  poster.png
  release.json
```

The master extension may be `.mp4` when the capture system produces MP4.
Never overwrite an approved version. Increment the scenario version for a
materially different run, claim, product revision, or edit.

Create `release.json` from
[the release-manifest template](../assets/templates/release-manifest.json).
Record SHA-256 checksums for the master, public video, poster, and captions.
Keep private workspace IDs and internal URLs out of the public record.

Keep media bytes in the approved versioned object store or CDN. Store only
stable media URLs and evidence metadata in `agent-docs`.

## 7. Acceptance gates

### Product gate

- The retained run used the stated product revision and scenario inputs, or
  the record truthfully declares `observed-output` and retains the approved
  original asset.
- Every shown capability is shipped or visibly labelled prototype.
- The result passes the scenario's observable checks.
- The run did not depend on concealed recovery work.

### Story gate

- The situation, request, work, and result remain understandable when muted.
- The clip proves one transformation.
- The hero result is legible at normal laptop size and a 390 px-wide gallery
  card.
- The dedicated 480 x 270 card crop remains legible at actual size.
- The edit uses stable readable holds and does not require rapid eye movement
  between unrelated crops.
- The public duration is 10-15 seconds and the hero holds for at least 2.5
  seconds.

### Privacy and claim gate

- No credential, unrelated notification, private customer content, or
  unintended identity appears in frames, audio, captions, filename, or
  metadata.
- The evidence label matches `data_kind` in every visual derivative.
- The public wording does not exceed what the retained run supports.
- A named human has approved privacy and claims.

### Technical gate

- The public MP4 matches `gallery-landscape-v1`.
- The poster is the verified hero frame.
- Captions and audio are synchronized and complete where applicable.
- The product result contains no unintended raw Markdown or broken native
  formatting visible at full size or in the card preview.
- Narration fits without truncation and its recorded script/provider metadata
  match the packaged audio.
- English, Cantonese, and Japanese variants use the same locked visual master,
  and each locale passes native-speaker script, pronunciation, caption, timing,
  privacy, and claim review.
- Checksums match the packaged files.
- Pixel-art branding preserves its aspect ratio and square grid in the opening
  rail and compact corner state.
- The pack passes
  `node <skill-dir>/scripts/validate-showcase-pack.mjs <scenario-dir>
  --stage=candidate`.

### Release gate

Candidate status means the local pack passed product, story, privacy, claim,
and technical review. It does not authorize publication.

Released status additionally requires a human release decision naming the
scenario ID and version, immutable media URLs, catalog validation, and
verification of the public Studio and agent-readable pages.
