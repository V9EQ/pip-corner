# Contributing

Use GNOME Shell 48–51 on Wayland. Read [Architecture](docs/architecture.md) and
check current upstream APIs before changing window management.

## Conventions

- Use ESM, four-space indentation, single quotes, and semicolons.
- Keep Shell/Meta imports out of GTK preferences and vice versa.
- Create resources in `enable()`; keep `disable()` synchronous and clean up every
  signal and scheduled source. Do not poll or shell out to window-control tools.
- Keep geometry independent of GI and use logical frame/work-area coordinates.
- Commit each feature separately. Do not push, install, enable, change desktop
  settings, or launch another Shell session without approval.
- Follow the reference project's approach: do not add a test suite unless requested.

## Validation

```sh
make check
make pack
unzip -l dist/pip-corner@v9eq.github.io.shell-extension.zip
git diff --check
```

Checks cover JavaScript syntax, strict schema compilation, and archive layout.
For widget smoke checks, use an in-memory GSettings backend without presenting a
window. These checks do not replace live Chromium/Wayland verification.

After installing, check opening/closing PiP, all corners and size modes, manual
moves/resizes, monitor changes, fractional scaling, and disable/re-enable. Confirm
ordinary browser windows remain untouched and cleanup leaves no errors.

Keep documentation in concise English, use sentence-case headings, and describe
the current behavior rather than implementation history. Avoid repeating code or
settings tables. See the [Google style highlights](https://developers.google.com/style/highlights).
