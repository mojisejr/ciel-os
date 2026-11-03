# Praneet Office — reference-character map lab

**Workstream:** `praneet-character-map-lab-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Goal and owner agreement

Owner supplies a Xiao Mu character sheet, selects that character unchanged
as the initial reference and a static model on a map rather than facial/body
animation. Owner then explicitly selects Wat Mangkon Buppharam in Chanthaburi
and asks for a cute bubble containing the temple name in the experimental set.
Prove original code-authored 3D geometry anchored at that place with a short
silent camera preview. Keep both existing production styles intact.

Owner's whole-figure art direction: a collectible-style static figure faithful
to the sheet, with balanced volumes from every viewing angle. Treat head,
visible face and water-bird hood as one visual composition. A good front view,
mathematical symmetry or closed topology does not establish proportion or
likeness from the side/back. Restore the characteristic blue side-wing feathers.
Body is plump and cuddly, with a little belly, rounded shoulders, barely visible
neck and short limbs under the Chinese outfit, rather than a flat box torso.
Preserve reference identity, colors and expression; allow relative proportions
and placement to change together to make one coherent three-dimensional figure.
Maintain balanced left/right masses with intentional small asymmetric details.

Develop primary head/hood/body/clothing volumes together, then inspect equally
scaled front, both obliques, both sides and back plus a neutral 360-degree
turntable. Use an unlit silhouette view as an additional mass check. Detail
cannot substitute for shape approval. Natural clothing support and settling
are authored within the cartoon design; physical cloth simulation is not
required or claimed. Deliver this local design proof first, preserving all
earlier media and the v02 map selection. Defer another map movie until review.

The agreed outcome is a character/location lab, not adoption of a page mascot,
a narrated episode or a universal image-to-3D converter. Agent's declared
modelling default is the large front reference and its three gold closures;
the sheet's detail panel says two, so exact canonical costume fidelity remains
subject to owner review. No new confirmation is needed for the specifically
requested location/bubble trial; further art corrections follow its output.

## Scope and constraints

- Isolate source in Office `posts/video/labs/xiao-mu-map/` and ignored assets/
  outputs in `posts/out/labs/xiao-mu-map/`. Retain current drawing/garden sources,
  films, runbooks, voice and budget guard. No shared tool or default-style rewrite.
- Original Blender Python geometry/materials exported to GLB; Three.js shares
  MapLibre's map/camera/depth context. Static figure, gentle orbit and a readable
  rounded name bubble. No rig, body/face animation, voice, paid generation,
  new dependency, cloud renderer, upload, posting or PR in this proof.
- Use the verified POI as an approximate map anchor, not a surveyed temple
  entrance/building location. Official name is วัดมังกรบุปผาราม (เล่งฮัวยี่).
  No temple-building reconstruction or official-endorsement claim.
- Capture stills first, inspect character silhouette/front/side/back and map
  anchor/name layout, then bounded native portrait silent motion. Record actual
  canvas/output, hashes, timing and process RSS with measurement limits.
- CIEL stays on shared `hq/20261103` in the primary checkout; stage only owned
  plan/event paths. Office uses an isolated topic branch from current clean main.

## Project links

| Project ID | Role |
| --- | --- |
| `ciel-os` | owner agreement and local proof closeout |
| `praneet-office` | isolated experimental character, map, label and renderer |

## Slices

- [1. Static Xiao Mu at the selected temple with a name bubble](slices/1.md)
