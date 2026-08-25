# KAI Vision video asset location

This directory is the drop-in location for the approved founder-vision video.
Nothing here is a real video today — this is the placeholder/reference
location the website architecture already points at, so a final file can be
added later without touching any page code.

## Expected files (add here, keep these exact names)

- `kai-vision.mp4` — the final video, H.264/AAC MP4 recommended for the
  widest browser support without extra encoding.
- `kai-vision-poster.jpg` — a static poster frame shown before the visitor
  clicks play (see Performance section of
  `PROJECT_KAI_FOUNDER_VISION_EXPERIENCE.md` for why this matters).
- `kai-vision-captions.vtt` — WebVTT captions/subtitles track. A minimal
  valid placeholder (`WEBVTT` header, no cues) is committed here now so the
  `<track>` element has something real to load; replace its contents with
  real timed captions when the final video is ready.

## What happens with no video file

`VisionVideoModal.astro` does not fabricate a video. If `kai-vision.mp4`
is missing (as it is today), the player's `error` event fires and the
modal shows an honest "the KAI Vision film is coming soon" message instead
of a broken/blank player. No code change is needed when the real file is
added — it will simply start playing correctly the next time the page
loads and finds it.
