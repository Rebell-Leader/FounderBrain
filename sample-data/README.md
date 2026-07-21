# LingoLoop local fixture bundle

This is the frozen, fictional source corpus for the judge-safe sandbox. The
pipeline reads these files, detects 13 candidates, merges only the three
Datawise sources, and renders the five expected action cards in
`manifest.json`. Keep it fictional and hand-review edits; `npm run test:fixtures`
validates its schema, references, planted anchors, and golden pipeline output.
