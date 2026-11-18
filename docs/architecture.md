# Architecture

API references reviewed on **2026-11-19** against GNOME Shell 51.1, Mutter 51,
and Google PiP extension 1.14. API inspection is not live Wayland verification.

## Modules

| Module | Responsibility |
| --- | --- |
| `extension.js` | Synchronous enable/disable lifecycle |
| `windowManager.js` | Window observation, stacking, and scheduled layout |
| `matching.js` | Exact browser ID and title matching |
| `geometry.js` | Pure size and corner calculations in logical coordinates |
| `prefs.js` | GTK 4/libadwaita settings; runs outside Shell |

`src/` contains runtime code; `schemas/` contains GSettings XML. The Makefile
stages files under `.build/extension` and packs them at the ZIP root. Build output
is ignored. Follow the repository layout used by Package Updates.

## Window lifecycle

Observe existing windows and `window-created`; recheck late title/app-ID metadata
and `mapped`. Only NORMAL windows matching both allowlists qualify. Chromium
exposes no dedicated PiP role or originating extension ID, so a browser window
with the exact PiP title can be a false positive.

Save the original above flag, call `make_above()`, and reapply it on `notify::above`.
On disable or mismatch, reverse only the extension's stacking change. On unmanage,
disconnect without further window operations. Disconnect all signals and cancel
pending idle sources during cleanup; do not restore geometry or steal focus.

## Layout

Use the window's current monitor and `get_work_area_for_monitor()`. Coalesce
layout through one GLib idle source per window. Initial adoption, settings,
work-area changes, and monitor changes request sizing. `size-changed` only
reanchors automatically placed windows: Wayland acknowledgements are asynchronous,
and repeating size requests could fight Chromium's constraints.

Fixed dimensions and relative dimensions share the same work-area/margin cap.
Relative sizes use `round(workAreaDimension × percentage / 100)` independently
on each axis. Position uses the actual accepted frame; margins shrink when needed.
An oversized client-constrained window cannot always fit. `grab-op-begin` cancels
pending layout and suppresses it during moves/resizes. On `grab-op-end`, normal
pointer/keyboard moves may snap each axis independently to a nearby inset edge;
unconstrained moves and resizes stay free. Manual placement survives later size
acknowledgements. There is no polling, drag resistance, or position-change handler.

## References

- [GNOME Shell 51 porting guide](https://gjs.guide/extensions/upgrading/gnome-shell-51.html)
- [GSettings and preferences](https://gjs.guide/extensions/development/preferences.html)
- [Extension review and cleanup rules](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)
- [Meta.Window API](https://mutter.gnome.org/meta/class.Window.html) and [grab operations](https://mutter.gnome.org/meta/signal.Display.grab-op-end.html); target signatures checked in `/usr/lib/mutter-51/Meta-51.gir`
- [Chromium video overlay and localized title](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/views/overlay/video_overlay_window_views.cc)
- [Google PiP extension source](https://github.com/GoogleChromeLabs/picture-in-picture-chrome-extension)
- [Video PiP API](https://developer.chrome.com/blog/watch-video-using-picture-in-picture): no screen-position setter
