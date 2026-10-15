# After Effects Timing Transfer

After Effects scripts that copy timing from one project to another, so you don't have to re-time translated versions by hand. Layer in/out points, keyframes, comp timing and voiceover audio are carried over, and nothing is recreated.

## Files
- `export-timing.jsx` – saves timing from the source project to a JSON file
- `import-timing.jsx` – applies that timing to the target project
- `export-audio.jsx` – saves voiceover audio timing from the source project
- `import-audio.jsx` – swaps in the new voiceover and applies its timing

## How to use
1. In After Effects, go to **Preferences → Scripting & Expressions** and tick **Allow Scripts to Write Files and Access Network**.
2. Open the **source project** (the one with the correct timing).
3. Go to **File → Scripts → Run Script File** and run `export-timing.jsx`. Save the JSON file when asked.
4. Open the **target project** (the one to be re-timed).
5. Run `import-timing.jsx` and select the JSON file.
6. For voiceovers, import the new audio into the Project panel first, then run `export-audio.jsx` on the source project and `import-audio.jsx` on the target project.

## Tips
- Save a backup copy of the target project before running the scripts.
- Layer names should match between both projects.

## License
MIT
