# Detailed sunset scene assets

Three actual skinned glTF scenes: learning (three people), running a business (two),
and collaboration (two). Each scan retains its original 89-joint rig and compressed grayscale
detail modulation and original normal maps. Small original skeletal gestures are encoded as real animation clips.

Desktop files use textures up to 2048px; `-mobile.glb` variants use up to 1024px.
Meshes and motion are preserved across tiers. WebP and Meshopt are decoded by the
bundled Three.js loader. Authored cameras are included. The app adds stage offsets
0/7/14 meters; no such offsets are baked into these files.

## Credits

Carla Rigged 001, Eric Rigged 001 and Claudia Rigged 002 by Renderpeople, licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Exact source links and
modification notices are in `asset-provenance.json` and the public `/kredit` page.
These character scans were not created by Belum Menyerah; the scenes, poses, props,
lighting, interaction and optimization are adaptations.

Original source downloads carry a NoAI tag. No source asset or derived image was
sent to generative image/model tools. Conventional Blender/glTF processing only.

The original 4K/source archives and authored Blender sets are retained separately;
they are not included in this runtime directory. Browser performance and final
visual acceptance must be measured with an actual interactive preview.

## Amber material treatment

Natural photographic albedo hues are removed. A narrow grayscale detail map modulates
orange satin clothing and pale amber resin skin/hair. Material factors, roughness,
clearcoat and modest skin transmission are encoded in standard glTF PBR extensions.
Original normal maps preserve scanned relief; they are not flat-color proxy models.
