---
title: "I Built a Treasure Cabin by the Sea at Blue Hour"
sub: "A little cabin on the fjord, in that blue twenty minutes after sunset — it hides treasures, and each one you find lights a lamp."
date: 2026-09-06
description: "The second 3D personal site after the Atlas of Collections: a small cabin on a Norwegian fjord shore, in that blue twenty minutes after sunset. Inside, it hides my experiences, writing and projects — every treasure you find lights one more lamp. This article records the full path from idea to launch."
tags: ["interactive", "AI", "making"]
draft: false
---

> The second 3D personal site, after the Atlas of Collections: a small wooden cabin by a Norwegian fjord, in that blue twenty minutes after sunset. Inside it hides my experiences, my writing and my projects — every treasure you find lights one more lamp. This article records the whole journey from idea to launch.

**[Try it live →](/cabin/)**（[project page →](/projects/cabin/)）(best on desktop, with headphones)

![The finished scene: a seaside cabin at blue hour](/writing/cabin/final.jpg)

## Where it started: from "looking at the atlas" to "stepping into a house"

The Atlas answered the question "what shaped me" — but an atlas is seen from above, everything laid out at once. I kept wanting to build a space that is **first-person, something you have to walk into and discover one by one** — because that's the right home for the things that are truly mine: experiences, writing, projects.

The spark was still the ramen shop on jesse-zhou.com. Rainy night, neon, a doorway that opens into another world — information hidden in objects, not listed on a menu.

But this time I didn't want to use my own house as the prototype. I wanted a scene **with a mood** — like zhou's rainy neon — where a visitor feels something before clicking anything, just by standing there.

## Choosing the scene: blue hour, a cabin, or a tomb

Three candidates: blue hour (a quality of light), a Nordic seaside cabin (a place), and an ancient tomb (a set of mechanics).

The tomb was out first — its story is "digging into someone else's past," while I wanted to talk about myself, alive, here. What settled it was a Bilibili video by Linksphotograph, [Climbing My First Snow Mountain with Li Xian](https://www.bilibili.com/video/BV1SSQLBREVV/): around 32 minutes in, they stay in a cabin on a fjord shore — **a deep blue night with only a string of warm lights on the porch**, and a line inside struck me — the host said as they walked in: "Let's not turn on all the lights at once."

That was it. Warmth inside solitude. Later I had an AI open the video in a browser and capture that stretch frame by frame to study it — that line became the seed of the whole treasure-finding mechanic (more below).

## The most important decision: shrinking the scope

The first version was ambitious: beach, porch, sunroom, living room, hidden room… two days of rough geometry later, it looked like nothing so much as a tutorial demo.

So I reread the [Ramen-Shop source](https://github.com/enderh3art/Ramen-Shop) and realized a fact: **zhou's award-winning site is really just one facade.** No interior walkthrough, no puzzles — a facade plus a few screens, but every inch polished to the extreme.

So I cut. First make the facade, until it can hold its own on a table. The interior can wait. That decision saved the project.

## Building the house in Blender: 19 iterations

The cabin wasn't dragged together by hand — it was **AI-driven procedural modeling**: I wrote the intent, the AI wrote the Python, Blender executed it. Nineteen style frames were rendered along the way. A few of the key traps:

**The string lights are the soul.** What makes the reference image moving is the 10% of warm yellow inside the 90% cold blue. The festoon is three catenary arcs; each bulb a small emissive sphere with a hanging seat, the glow coming from a post-process bloom. It is the first focus of the frame.

**The sky failed four times in a row.** Early renders always came out with a dirty orange sky, no parameter would fix it. The culprit turned out not to be the sky at all: **the bloom pass was smearing the bright band of the horizon across the entire sky.** Once I disabled bloom to isolate the problem, I abandoned world textures entirely and used an emissive gradient sky dome instead — an idea that later moved into three.js unchanged.

**The sea stayed black no matter what.** After a round of debugging the answer was physical: the mountains were too tall and too close, so at grazing angles the only thing on the reflection path of the water was black mountain — of course the mirror could only reflect black. Push the mountains back and down, and the mirror came alive. The renderer wasn't lying; the geometry was.

**The birch bark looked like a silver-banded snake.** Procedural rings at even spacing are too regular — real birch markings are random, squinting black patches. Noise-driven, horizontally-stretched blotches finally fixed it.

The final scene: deep-blue night cabin, warm windows, festoon, birches, mirror sea, three rows of snowy peaks in silhouette. The model is organized by collections and exported as a Draco-compressed GLB — **only 0.38MB**.

## Technique: borrow the skeleton, replace the flesh

The architecture follows Ramen-Shop wholesale (which is itself the Experience-singleton pattern from Bruno Simon's Three.js Journey course): Vite + native ES modules + three.js + GSAP, no framework, no TypeScript.

Borrowed: single GLB parsed by node names, GSAP camera flights, pointerdown/up displacement thresholds to tell clicks from drags, event-driven resource loading.

Replaced:

- **Content is not textures.** zhou's "about me" is baked into screen textures; that's a dead end for long Chinese text. My treasure content is all HTML overlay + Markdown rendering — readable, linkable, selectable
- **Treasures are a registry, not a switch statement.** One `treasures.json` manages everything: `{id, meshName, cameraNode, lightId, content}`. Adding a treasure never touches code
- **Naming conventions connect Blender and the web.** `HIT_` prefix = invisible hitbox, `CAM_` = camera node, `LGT_` = light node. Arrange it in Blender, and the web side auto-registers — scene changes never touch JS
- **The lighting-up system is what he doesn't have.** Each lamp is a point light (starting at intensity 0) plus an emissive material; when you find a treasure, GSAP ramps the light up and bloom carries the halo. Treasure progress = the process of lighting the house — the video's "let's not turn on all the lights at once"

## From fixed cameras to free orbit

The first version followed zhou: fixed camera nodes with click-to-fly. Ten minutes of playing with it after launch and I gave up — this was an exterior modeled on all 360°, locking the camera wasted it. I switched to OrbitControls free orbit: drag to turn, scroll to zoom, with damping, distance and polar angle clamped (no clipping through walls, no diving into mountains or under water).

The one trick: **when you open a treasure, the orbit target flies with the camera to the treasure itself** — you're orbiting the woodpile while looking at the woodpile, not pasted onto a dead camera. Close the panel and the target flies back to the cabin.

## Three ghost stories from right before launch

**A black shard in the sky.** Investigation: it was the moon. The sky dome is a shader that doesn't take fog; the moon is a normal material that does, so it got dyed deep blue by the fog — darker than the sky itself, a floating foreign object. Blue hour in the reference had no moon anyway. Deleted.

**A light source in the lake that seared your eyes.** From certain angles the sea threw a white beam straight at the camera. Layer by layer: disabling the environment reflection did nothing, pure-black water did nothing, zeroing the directional light — the beam vanished. Root cause: **three.js directional light illuminates the whole scene; `layers` only affects camera visibility, not lighting** — and Fresnel reflectance at grazing angles approaches 1, so there was no fix. In the end the sea became an unlit MeshBasic with the sky environment map applied manually; the beam vanished and the water looked calmer than ever.

**The page mysteriously "froze".** Screenshots were always the same frame; I thought the code was broken. The truth: Chrome **freezes rAF for fully occluded windows and background tabs** — the window I was screenshotting was buried under my own maximized browser. I finally wrote a headless Chrome + CDP screenshot script (`scripts/headless-shot.mjs`) driven by real time, and never begged for a debug screenshot again.

## What I learned

1. **Keep the scope small.** One polished facade beats ten rough rooms. Zhou's site is the proof — I only truly believed it after reading his source
2. **"Don't turn on all the lights at once."** Good interaction mechanics aren't invented; they grow out of the scene itself — look at more reference material, and the mechanic is inside it
3. **The renderer doesn't lie; the geometry does.** When the sea is black, check what sits on the reflection path first
4. The division of labor this time was the same as always: the AI modeled, coded and debugged; I said "that's wrong." **Taste is still the human's job** — all nineteen style frames exist because I said "no" nineteen times

---

*Stack: Blender MCP (procedural modeling) · three.js + GSAP (rendering & interaction) · Vite (tooling) · WebAudio (procedural ambience: wind / waves / firewood) · headless Chrome CDP (debug shots) · all treasure content as local Markdown*
