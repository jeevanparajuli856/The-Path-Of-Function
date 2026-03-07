# Game Content Notes

## Primary Scene Flow
`start -> inbed -> hallway -> hallwayafter -> teaching1 -> teaching2 -> dragqns -> aftersubmission -> ending`

## Learning Focus
- Function basics
- Parameters vs arguments
- Return values
- `main()` flow
- Call stack intuition

## Source Locations
- Main entry/flow: `game/script.rpy`
- Story scenes: `game/SceneScript/`
- Drag/drop exercise: `game/FrameNFunction/dragNDropFirst.rpy`
- Telemetry emits/helpers: `game/integration_events.rpy`

## Web Integration Requirement
For web wrapper communication, Ren'Py distribution must include the JS bridge in
`frontend/public/renpy-game/index.html` (see `docs/DEPLOYMENT.md`).
