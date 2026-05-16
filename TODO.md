# Garage Kings Refactor - TODO

## PitLane 3D Storytelling Refactor

- [x] 1. Install required 3D + animation dependencies (three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap, ScrollTrigger)

- [x] 2. Create two-column layout + fixed UI lane and right 60% 3D lane

      - [ ] 2.1 Replace `PitLaneJourney` with new `PitLaneStory.jsx`

- [ ] 3. Build R3F scene orchestration
      - [ ] 3.1 Add `StoryScene.jsx` (Canvas root)
      - [ ] 3.2 Add `RoadSpline.jsx` (3D spline road mesh + emissive pit center line)
      - [ ] 3.3 Add `HeroCarModel.jsx` (GLTF/GLB load + MeshPhysicalMaterial clearcoat)
      - [ ] 3.4 Add `PitStopCameraRig.jsx` (camera interpolation + pit stop triggers)
      - [ ] 3.5 Add postprocessing (Bloom + Depth of Field)
- [ ] 4. Implement scroll-bound car movement + turn leaning
      - [ ] 4.1 Map scroll progress to spline `t`
      - [ ] 4.2 Compute lean from curve intensity (tangent curvature approximation)
- [ ] 5. Pit stops UI integration (left lane)
      - [ ] 5.1 START/VERIFY/LANES/VAULT/DROP text fades in/out
      - [ ] 5.2 Use Mint Green (#00C389) for “Authenticated” signals
- [ ] 6. Vault 3D carousel
      - [ ] 6.1 Refactor `VaultShowcase` to 3D carousel component
      - [ ] 6.2 Hover -> slow 360° rotation
- [ ] 7. Replace/adjust existing sections to prevent text overlay issues
- [ ] 8. Ensure typography + palette compliance (near-black/off-white/pit-lane yellow)
- [ ] 9. Run dev build/test and iterate on visuals/responsiveness

