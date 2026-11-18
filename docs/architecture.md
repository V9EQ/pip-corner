# Architecture and upstream references

Reviewed **2026-11-19** against current upstream documentation and locally installed
GNOME Shell **51.1**, Mutter `Meta-51.gir`, and Google PiP extension **1.14**.
This is API/source inspection, not yet an interactive Wayland verification.

## Browser/compositor boundary

The Google extension's `chrome.action.onClicked` injects `script.js`, which calls
`HTMLVideoElement.requestPictureInPicture()`. It does not create a normal browser
popup with `chrome.windows.create()`. The PiP Web API exposes neither arbitrary
screen positioning nor a compositor Always on Top switch. `chrome.windows.Window`
reports `alwaysOnTop`, but its update API does not offer a corresponding setter.
Document Picture-in-Picture is a different API and is not the target here.

Chromium's `OverlayWindowWidgetDelegate` uses the localized
`IDS_PICTURE_IN_PICTURE_TITLE_TEXT` (English Linux: `Picture in picture`).
`VideoOverlayWindowViews::Init()` requests a floating window, but Wayland stacking
is controlled by the compositor. A Shell extension can use `Meta.Window.make_above()`.
No browser extension ID is exposed on `Meta.Window`: built-in video PiP and PiP
from the Google extension cannot be distinguished; both should work.

## Detection and Always on Top

`windowManager.js` observes `Meta.Display::window-created` and existing actors.
It waits for `Meta.Window:mapped` and rechecks late `title`, `wm-class` and
`gtk-application-id` notifications. Only NORMAL windows with an exact browser ID
and exact PiP title qualify; matching is case-insensitive and NFC-normalized.
Only the English `Picture in picture` title is built in. Preferences expose one
additional exact title and one additional browser app ID / WM class, both empty
by default. No language detection, title substring or browser-PID rule is used.
GSettings changes recheck existing windows immediately; clearing an additional
title releases windows that no longer match.

`notify::above` reapplies `make_above()` if a managed window loses the flag.
Disabling or losing a match restores the flag only if it was originally unset.
Unmanaged windows are disconnected without further window operations. No polling,
focus changes, workspace changes or persistent browser/desktop setting changes.
Above means Mutter's above-normal layer, not above Shell UI/lock screen or an
unconditional guarantee over fullscreen clients. Other window-management extensions
can conflict. A normal browser window deliberately given the exact PiP title can
be a false positive: Mutter exposes no dedicated Chromium-video-PiP role.

Validation for this stage: JavaScript syntax, `make pack`, archive inspection and
installed GIR property/signal inspection. Manual checks after installation: open
PiP before/after enabling, switch focus to another application, close/reopen PiP,
and disable/re-enable; ordinary browser windows must remain untouched.

## Corner placement and margins

`geometry.js` computes frame coordinates independently of GI. The manager uses
`get_monitor()` and `get_work_area_for_monitor()`, not the primary monitor or
physical screen size. The default is bottom right, inset 16 logical pixels on
each axis. `corner`, `margin-x` and `margin-y` are range/choice-validated GSettings.
`prefs.js` uses GTK4/libadwaita ComboRow, SpinRow and EntryRow in a separate process.

Layout runs through a coalesced GLib idle source after initial mapping,
`size-changed`, settings changes, display `workareas-changed` and
`window-entered-monitor`. The last signal's `(monitor, window)` arguments were
checked in Meta-51.gir. Using actual frame dimensions keeps the margin correct
when Chromium chooses a different size. Margins reduce symmetrically if space
is insufficient; an oversized browser-constrained window cannot fit completely.
Idle sources are removed on release/disable/unmanage. No position-change handler
is installed: dragging is allowed, but the next layout event reanchors the window.
Original geometry is not restored on disable; the extension only reverses its
Always on Top change, not the user's intervening move/resize operations.

Stage checks: syntax, strict schema compilation and archive layout. Manual checks:
all four corners, zero/large margins, a monitor with a negative origin, reserved
panels, moving PiP to another monitor, unplug/replug and fractional scaling.

## Delivery plan

1. Repository scaffold, packaging and documented API contracts.
2. Observe existing/new windows and late metadata; pin only recognized browser PiP.
3. Work-area corner placement, configurable margins and libadwaita preferences.
4. Fixed frame-size requests with asynchronous Wayland size acknowledgement.
5. Monitor-relative bounding box with aspect-preserving fit.

## References

### GNOME

- [GNOME Shell 51 porting guide](https://gjs.guide/extensions/upgrading/gnome-shell-51.html): synchronous disable; current ESM API.
- [Extension anatomy](https://gjs.guide/extensions/overview/anatomy.html).
- [Preferences, GSettings and automatic schema compilation](https://gjs.guide/extensions/development/preferences.html).
- [Review guidelines / cleanup and process separation](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).
- [Meta.Window.make_above](https://mutter.gnome.org/meta/method.Window.make_above.html).
- [Meta.Window.move_resize_frame](https://mutter.gnome.org/meta/method.Window.move_resize_frame.html).
- [Meta.Window.move_frame](https://mutter.gnome.org/meta/method.Window.move_frame.html).
- [Meta.Window.get_work_area_for_monitor](https://mutter.gnome.org/meta/method.Window.get_work_area_for_monitor.html).
- [Adw.SpinRow](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/class.SpinRow.html).
- Local `/usr/lib/mutter-51/Meta-51.gir`: signals/properties and GI signatures checked against the installed target, not older Meta 17 documentation.

### Chromium

- [Installed extension / source link](https://chromewebstore.google.com/detail/picture-in-picture-extens/hkgfoiooedgoejojocmhlaklaeopbecg).
- [Google PiP extension source](https://github.com/GoogleChromeLabs/picture-in-picture-chrome-extension); installed `background.js` and `script.js` inspected read-only.
- [Video Picture-in-Picture API](https://developer.chrome.com/blog/watch-video-using-picture-in-picture).
- [Document Picture-in-Picture](https://developer.chrome.com/docs/web-platform/document-picture-in-picture).
- [chrome.windows](https://developer.chrome.com/docs/extensions/reference/api/windows).
- [Chromium video overlay implementation](https://github.com/chromium/chromium/blob/main/chrome/browser/ui/views/overlay/video_overlay_window_views.cc).
- [Chromium English strings](https://github.com/chromium/chromium/blob/main/chrome/app/generated_resources.grd).
