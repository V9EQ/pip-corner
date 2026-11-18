# PiP Corner

A GNOME Shell **51** extension that keeps Chromium video Picture-in-Picture above
other windows and places it in a configurable corner on Wayland. Works with
[Picture-in-Picture Extension (by Google)](https://chromewebstore.google.com/detail/picture-in-picture-extens/hkgfoiooedgoejojocmhlaklaeopbecg)
and Chromium's built-in video PiP.

## Installation

Requires GNOME Shell 51, GJS, GTK 4, libadwaita, GLib tools, GNU make, and
`gnome-extensions`. Node.js is needed only for build-time syntax checks.

```sh
make install
# Log out and back in on Wayland, then enable:
gnome-extensions enable pip-corner@v9eq.github.io
```

Open PiP using your browser extension's button or Alt+P. No browser modifications,
root access, or X11 utilities are needed.

## Settings

```sh
gnome-extensions prefs pip-corner@v9eq.github.io
```

| Setting | Default | Options |
| --- | --- | --- |
| Corner | Bottom right | Any of the four corners |
| Horizontal / vertical margin | 16 / 16 | 0–500 logical pixels |
| Size mode | Fixed size | Fixed, browser size, or monitor-relative |
| Fixed width / height | 480 × 270 | Logical pixels, including the frame |
| Relative width / height | 25% / 25% | 5–100% of the current monitor's work area |
| Additional PiP title | Empty | One exact title alongside `Picture in picture` |
| Additional browser ID | Empty | One exact app ID / WM class alongside Chromium and Chrome |

Changes apply immediately. Placement excludes panels and reserved space; size
requests are capped to leave room for margins. Chromium may impose its own size
constraints. Width and height are independent requests, not video-aspect settings.

You can move or resize PiP manually. Resizing reanchors it; settings, monitor, or
work-area changes reapply the size policy. Disabling restores the previous Always
on Top flag but leaves the window's position and size unchanged.

## Limitations

- Only English titles are built in. For another title or browser ID, inspect the
  window in Looking Glass (Alt+F2 → `lg`, **Windows**) and use the additional fields.
  Matching ignores case and surrounding whitespace.
- Targets Chromium video PiP, not Firefox or arbitrary Document PiP windows.
  Shell cannot distinguish built-in PiP from PiP opened by a browser extension.
- Always on Top means above normal windows, not above Shell UI or every fullscreen
  application. Other window-management extensions can conflict.
- Syntax, schemas, packaging, and preferences widgets are checked. Interactive
  Chromium behavior on Wayland still needs manual verification.

## Build and removal

`make pack` creates `dist/pip-corner@v9eq.github.io.shell-extension.zip` without
installing it. See [Contributing](CONTRIBUTING.md) and [Architecture](docs/architecture.md).

```sh
gnome-extensions disable pip-corner@v9eq.github.io
gnome-extensions uninstall pip-corner@v9eq.github.io
```

[GPL-2.0-or-later](LICENSE). Independent project; not affiliated with Google.
