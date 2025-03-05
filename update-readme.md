1. Change tauri.conf version
2. Run GH workflow (no v prefix)
3. $env:TAURI_SIGNING_PRIVATE_KEY = "your-private-key-here"; cargo tauri build
4. Download latest.json
5. Add signature to json
6. Upload the updated json and the generated .msi file to the GH release
