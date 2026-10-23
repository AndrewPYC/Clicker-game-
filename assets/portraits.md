# Supplied character portraits

- `mark.png`: Mark, from `Cute Curly-Haired Hoodie Avatar.png` (blue hoodie).
- `pavly.png`: Pavly, the left person in `Twin Cartoon Portraits on Transparent Background.png` (Nike hoodie).
- `john.png`: John, the right person in that paired image (light-colored top).

The originals remain untouched in the user's Downloads folder. The supplied checkerboard backgrounds were opaque pixels, not transparency. The built-in imagegen tool isolated each character and removed that background, followed by PNG normalization to a 1024 × 1024 transparent canvas for game use.

## Imagegen prompt set

For each portrait, use this prompt with its indicated source image and subject:

> Use case: background-extraction. Edit target: provided image. Isolate [subject] as one separate game character portrait. Remove the baked-in gray/white checkerboard background entirely and replace with genuine transparent alpha. Preserve this person's exact existing face, curly hair, facial hair, skin tone, clothing, colors and 2D cartoon drawing style; do not redesign or add details. Keep the whole visible bust without clipping hair or shoulders, centered on a square transparent canvas with a little padding. No text, no background pattern, no other people. This output is [name]'s separate portrait.

Subjects:
- Mark: the single man in the blue hoodie.
- Pavly: ONLY the LEFT man wearing the Nike hoodie. Remove the right man completely.
- John: ONLY the RIGHT man wearing the light-colored top. Remove the left man completely.

These PNG portraits are explicitly supplied character additions. The four animal characters remain SVG illustrations. Every character uses the same red apple TOCKEN.

## Emmanuel

- `emmanuel.png`: Emmanuel, from `Smiling Curly-Haired Boy Avatar.png` (green zip hoodie). Original Downloads file untouched.
- Prepared with built-in imagegen using genuine transparent alpha.
- Prompt: Use case: background-extraction. Edit target: supplied curly-haired boy portrait. Create Emmanuel's separate game portrait by removing the baked-in gray/white checkerboard completely, replacing it with genuine transparent alpha. Preserve his exact face, smile, dark curly hair, skin tone, green zip hoodie, pose and 2D cartoon style. Keep the entire visible bust centered on a square transparent canvas with small padding, without clipping hair or shoulders. Do not redesign. No text, other people, or background pattern.
