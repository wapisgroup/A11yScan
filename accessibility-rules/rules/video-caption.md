# `<video>` elements must have captions

**Rule ID:** `video-caption`  
**WCAG:** 1.2.2 Captions (Prerecorded) (Level A)  
**Severity:** Critical

## Issue Description

A `<video>` element with audio lacks captions. Deaf and hard-of-hearing users cannot access the audio content.

## Why It Matters

### Impact on Users

- **Deaf users** cannot access audio information
- **Hard-of-hearing users** may miss important dialogue or sounds
- **Users in noisy environments** can't hear audio
- **Non-native language speakers** benefit from text version
- **Search engines** can't index video content

### Real-World Scenario

A training website has instructional videos without captions. An employee who is deaf cannot complete the required training because all instructions are given verbally in the video with no text alternative. They cannot do their job because they can't access the training materials.

## How to Fix

### Solution 1: Add WebVTT Caption Track

Use the `<track>` element with WebVTT captions.

**Bad Example:**
```html
<!-- FAIL - No captions -->
<video controls>
  <source src="video.mp4" type="video/mp4">
</video>
```

**Good Example:**
```html
<!-- PASS - Has caption track -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track 
    kind="captions" 
    src="captions-en.vtt" 
    srclang="en" 
    label="English"
    default>
</video>
```

### Solution 2: Multiple Language Captions

Provide captions in multiple languages.

**Good Example:**
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  
  <!-- English captions (default) -->
  <track 
    kind="captions" 
    src="captions-en.vtt" 
    srclang="en" 
    label="English"
    default>
  
  <!-- Spanish captions -->
  <track 
    kind="captions" 
    src="captions-es.vtt" 
    srclang="es" 
    label="Español">
  
  <!-- French captions -->
  <track 
    kind="captions" 
    src="captions-fr.vtt" 
    srclang="fr" 
    label="Français">
</video>
```

### Solution 3: Create WebVTT Files

Proper WebVTT caption file format.

**captions-en.vtt:**
```
WEBVTT

00:00:00.000 --> 00:00:03.000
Welcome to our video tutorial.

00:00:03.500 --> 00:00:07.000
Today we'll learn about accessibility.

00:00:07.500 --> 00:00:12.000
Captions are essential for deaf and hard-of-hearing users.

00:00:12.500 --> 00:00:15.000
[background music plays]

00:00:15.500 --> 00:00:20.000
Let's get started with our first example.
```

**Best Practices for Captions:**
```
WEBVTT

NOTE Include speaker identification when multiple people

00:00:00.000 --> 00:00:03.000
<v Alice>Hello, I'm Alice.</v>

00:00:03.500 --> 00:00:06.000
<v Bob>And I'm Bob.</v>

NOTE Include sound effects in brackets

00:00:10.000 --> 00:00:12.000
[phone ringing]

00:00:15.000 --> 00:00:17.000
[door slams]

NOTE Include music cues

00:00:20.000 --> 00:00:23.000
♪ Upbeat music playing ♪

NOTE Break long captions at natural points

00:00:30.000 --> 00:00:33.000
This is the first part
of a longer sentence.

00:00:33.500 --> 00:00:36.000
And this is the continuation
of that sentence.
```

### Solution 4: Framework Implementations

**React Video Player:**
```jsx
function VideoPlayer({ videoSrc, captionTracks }) {
  return (
    <video controls>
      <source src={videoSrc} type="video/mp4" />
      
      {captionTracks.map((track, index) => (
        <track
          key={track.srclang}
          kind="captions"
          src={track.src}
          srclang={track.srclang}
          label={track.label}
          default={index === 0}
        />
      ))}
      
      <p>
        Your browser doesn't support HTML5 video.
        <a href={videoSrc}>Download the video</a>
      </p>
    </video>
  );
}

// Usage
<VideoPlayer
  videoSrc="/videos/tutorial.mp4"
  captionTracks={[
    { src: '/captions/en.vtt', srclang: 'en', label: 'English' },
    { src: '/captions/es.vtt', srclang: 'es', label: 'Español' }
  ]}
/>
```

**Vue Video Component:**
```vue
<template>
  <video controls>
    <source :src="videoSrc" type="video/mp4">
    
    <track
      v-for="(track, index) in captionTracks"
      :key="track.srclang"
      kind="captions"
      :src="track.src"
      :srclang="track.srclang"
      :label="track.label"
      :default="index === 0">
  </video>
</template>

<script setup>
defineProps({
  videoSrc: String,
  captionTracks: Array
});
</script>
```

**Next.js with Cloudinary:**
```jsx
import { CloudinaryVideo } from '@cloudinary/react';

export default function VideoWithCaptions() {
  return (
    <CloudinaryVideo
      cloudName="your-cloud"
      publicId="video-id"
      controls
    >
      <track
        kind="captions"
        src="/captions/en.vtt"
        srclang="en"
        label="English"
        default
      />
    </CloudinaryVideo>
  );
}
```

### Solution 5: YouTube Embedded Videos

For embedded videos, ensure the source has captions.

**Bad Example:**
```html
<!-- FAIL - No way to verify captions exist -->
<iframe 
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Video title">
</iframe>
```

**Good Example:**
```html
<!-- PASS - Enable captions in embed, add note -->
<div class="video-container">
  <iframe 
    src="https://www.youtube.com/embed/VIDEO_ID?cc_load_policy=1"
    title="Video title"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
  <p class="video-note">
    This video includes closed captions. 
    Click the CC button to enable them.
  </p>
</div>
```

**Ensure YouTube Captions:**
1. Upload video to YouTube
2. Add captions (auto-generated or custom)
3. Use `cc_load_policy=1` in embed URL to show captions by default
4. Verify captions are accurate

## Rule Description

This rule ensures `<video>` elements include synchronized captions for the audio content.

### What This Rule Checks

- `<video>` elements have `<track kind="captions">`
- At least one caption track is provided
- Caption track points to a valid file
- `srclang` attribute specifies language

### What Counts as Captions

**Valid:**
- WebVTT (.vtt) files
- `<track kind="captions">`
- Platform-specific captions (YouTube, Vimeo)

**Not valid:**
- `<track kind="subtitles">` (different from captions)
- `<track kind="descriptions">` (for blind users, not deaf)
- Open captions burned into video (doesn't pass for flexibility)

## Captions vs. Subtitles

**Captions (use `kind="captions"`):**
- Include dialogue AND sound effects
- For deaf/hard-of-hearing users
- "[phone ringing]", "[door slams]"
- Speaker identification

**Subtitles (use `kind="subtitles"`):**
- Dialogue only
- For users who can hear but don't understand language
- Translation purposes
- No sound effects

**Example with both:**
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  
  <!-- Captions for deaf users -->
  <track 
    kind="captions" 
    src="captions-en.vtt" 
    srclang="en" 
    label="English Captions"
    default>
  
  <!-- Subtitles for translation -->
  <track 
    kind="subtitles" 
    src="subtitles-es.vtt" 
    srclang="es" 
    label="Spanish Subtitles">
</video>
```

## Common Mistakes

### 1. Missing Track Element
```html
<!-- FAIL -->
<video src="video.mp4" controls></video>

<!-- PASS -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
</video>
```

### 2. Using Subtitles Instead of Captions
```html
<!-- FAIL - Subtitles don't include sound effects -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="subtitles" src="subs.vtt" srclang="en" label="English">
</video>

<!-- PASS - Captions include dialogue and sounds -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
</video>
```

### 3. Missing srclang Attribute
```html
<!-- FAIL -->
<track kind="captions" src="captions.vtt" label="Captions">

<!-- PASS -->
<track kind="captions" src="captions.vtt" srclang="en" label="English" default>
```

### 4. Empty or Invalid VTT File
```html
<!-- FAIL - File doesn't exist or is empty -->
<track kind="captions" src="missing.vtt" srclang="en" label="English">

<!-- PASS - Valid VTT file with content -->
<track kind="captions" src="captions-en.vtt" srclang="en" label="English" default>
```

## Testing

### Manual Testing
1. Open video in browser
2. Look for CC (closed captions) button
3. Enable captions
4. Verify captions display correctly
5. Check captions include sound effects and speaker IDs

### Screen Reader Testing
```
Not directly testable with screen readers
(captions are visual)

But verify:
- Video controls are keyboard accessible
- Caption toggle button has accessible name
- Video has descriptive title/label
```

### Automated Testing
```javascript
// Check for caption tracks
const videos = document.querySelectorAll('video');

videos.forEach(video => {
  const captionTracks = video.querySelectorAll('track[kind="captions"]');
  
  if (captionTracks.length === 0) {
    console.error('Video missing captions:', video);
  } else {
    captionTracks.forEach(track => {
      if (!track.hasAttribute('srclang')) {
        console.error('Caption track missing srclang:', track);
      }
      if (!track.getAttribute('src')) {
        console.error('Caption track missing src:', track);
      }
    });
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'video-caption'
);
```

### Validation
```javascript
// Validate VTT file exists and is accessible
async function validateCaptionTrack(track) {
  const src = track.getAttribute('src');
  
  try {
    const response = await fetch(src);
    if (!response.ok) {
      console.error(`Caption file not found: ${src}`);
      return false;
    }
    
    const text = await response.text();
    if (!text.startsWith('WEBVTT')) {
      console.error(`Invalid VTT file: ${src}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error loading caption file: ${src}`, error);
    return false;
  }
}
```

## Resources

- [WCAG 1.2.2 Captions (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html)
- [WebVTT: The Web Video Text Tracks Format](https://www.w3.org/TR/webvtt1/)
- [MDN: track element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track)
- [W3C: Captions/Subtitles](https://www.w3.org/WAI/media/av/captions/)
- [WebAIM: Captions, Transcripts, and Audio Descriptions](https://webaim.org/techniques/captions/)

## Related Rules

- `audio-caption` - Audio-only content must have captions
- `video-description` - Videos must have audio descriptions
