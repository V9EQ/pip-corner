# Contributing

Use GNOME Shell 51 and read [Architecture](docs/architecture.md) before changing
window management. Check current upstream documentation and the installed
`/usr/lib/mutter-51/Meta-51.gir`; record sources and limitations alongside each feature.

- Keep Shell/Meta imports out of GTK/Adwaita preferences and vice versa.
- Create resources only in `enable()`. Keep `disable()` synchronous (required in 51).
- Disconnect every signal and cancel every scheduled source on disable/unmanage.
- Use exact, configurable browser/title matching, never title substrings alone.
- Use Mutter logical frame coordinates and work areas, not physical pixel/scaling guesses.
- Do not poll, shell out to window-control tools or change Chromium's profile.
- Keep pure geometry separate from GI/lifecycle code.
- Commit each finished feature separately, including its documentation.
- Do not install/enable the extension, change desktop settings, launch another Shell,
  install dependencies or push without approval.

## Validation

```sh
make check
make pack
unzip -l dist/pip-corner@v9eq.github.io.shell-extension.zip
git diff --check
```

Follow the reference project's approach: do not add a test suite unless requested.
Syntax checks, strict schema compilation, API inspection and archive inspection
are not interactive Wayland verification. Manual validation instructions belong
in the architecture document. Node is a development dependency only; runtime is GJS.

Only include runtime JavaScript, metadata, schema XML and LICENSE in the ZIP.
Generated schema caches, build outputs and documentation stay out of Git/the ZIP.
