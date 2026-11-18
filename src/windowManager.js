// SPDX-License-Identifier: GPL-2.0-or-later
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import {cornerPosition, magneticPosition, requestedSize} from './geometry.js';
import {matchesPip} from './matching.js';

export class PipWindowManager {
    constructor(settings) {
        this._settings = settings;
        this._windows = new Map();
        this._settingsId = settings.connect('changed', (_settings, key) => {
            if (key === 'snap-enabled' || key === 'snap-distance')
                return;
            for (const [window, state] of this._windows)
                this._refresh(window, state, true);
        });
        this._createdId = global.display.connect('window-created', (_display, window) => {
            this._watch(window);
        });
        this._workareasId = global.display.connect('workareas-changed', () => {
            for (const [window, state] of this._windows)
                this._queueLayout(window, state, true);
        });
        this._monitorId = global.display.connect('window-entered-monitor', (_display, _monitor, window) => {
            const state = this._windows.get(window);
            if (state)
                this._queueLayout(window, state, true);
        });
        this._grabBeginId = global.display.connect('grab-op-begin', (_display, window) => {
            const state = this._windows.get(window);
            if (!state?.managed)
                return;
            state.grabbed = true;
            state.manualPosition = true;
            this._cancelLayout(state);
        });
        this._grabEndId = global.display.connect('grab-op-end', (_display, window, operation) => {
            const state = this._windows.get(window);
            if (!state?.grabbed)
                return;
            state.grabbed = false;
            // Unconstrained moves deliberately bypass snapping; resizing stays free.
            if ((operation === Meta.GrabOp.MOVING || operation === Meta.GrabOp.KEYBOARD_MOVING) &&
                this._settings.get_boolean('snap-enabled')) {
                state.snapRequested = true;
                this._queueLayout(window, state);
            }
        });
        for (const actor of global.get_window_actors())
            this._watch(actor.meta_window);
    }

    _watch(window) {
        if (this._windows.has(window))
            return;

        const state = {
            signals: [], managed: false, originalAbove: false,
            layoutId: 0, resizeRequested: false,
            grabbed: false, manualPosition: false, snapRequested: false,
        };
        this._windows.set(window, state);
        // Metadata may arrive after window-created, especially on native Wayland.
        for (const property of ['title', 'wm-class', 'gtk-application-id', 'mapped']) {
            state.signals.push(window.connect(`notify::${property}`, () => {
                this._refresh(window, state);
            }));
        }
        state.signals.push(window.connect('notify::above', () => {
            if (state.managed && !window.is_above())
                window.make_above();
        }));
        state.signals.push(window.connect('size-changed', () => {
            this._queueLayout(window, state);
        }));
        state.signals.push(window.connect('unmanaged', () => {
            this._forget(window, state, false);
        }));
        this._refresh(window, state);
    }

    _refresh(window, state, resize = false) {
        const matches = window.get_window_type() === Meta.WindowType.NORMAL && matchesPip([
            window.get_wm_class(), window.get_gtk_application_id(),
        ], window.get_title(), this._settings.get_string('custom-browser-id'),
        this._settings.get_string('custom-title'));

        if (!matches) {
            this._release(window, state, true);
            return;
        }
        if (!window.mapped)
            return;
        if (!state.managed) {
            state.originalAbove = window.is_above();
            state.managed = true;
            window.make_above();
            resize = true;
        }
        this._queueLayout(window, state, resize);
    }

    _queueLayout(window, state, resize = false) {
        if (!state.managed || state.grabbed)
            return;
        if (resize) {
            state.manualPosition = false;
            state.snapRequested = false;
        }
        state.resizeRequested ||= resize;
        if (state.layoutId)
            return;
        state.layoutId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            state.layoutId = 0;
            if (state.managed && window.mapped)
                this._layout(window, state);
            return GLib.SOURCE_REMOVE;
        });
    }

    _layout(window, state) {
        const monitor = window.get_monitor();
        if (monitor < 0 || monitor >= global.display.get_n_monitors())
            return;
        const area = window.get_work_area_for_monitor(monitor);
        if (area.width < 1 || area.height < 1)
            return;
        const marginX = this._settings.get_int('margin-x');
        const marginY = this._settings.get_int('margin-y');
        let frame = window.get_frame_rect();
        if (state.resizeRequested) {
            state.resizeRequested = false;
            const size = requestedSize(area, {
                mode: this._settings.get_string('size-mode'),
                width: this._settings.get_int('window-width'),
                height: this._settings.get_int('window-height'),
                widthPercent: this._settings.get_int('width-percent'),
                heightPercent: this._settings.get_int('height-percent'),
                marginX, marginY,
            });
            if (size && (frame.width !== size.width || frame.height !== size.height)) {
                window.move_resize_frame(false, frame.x, frame.y, size.width, size.height);
                frame = window.get_frame_rect();
            }
        }
        // Wayland acknowledgements must not undo a manual move or resize.
        if (state.manualPosition && (!state.snapRequested || !this._settings.get_boolean('snap-enabled'))) {
            state.snapRequested = false;
            return;
        }
        const position = state.manualPosition
            ? magneticPosition(area, frame, marginX, marginY, this._settings.get_int('snap-distance'))
            : cornerPosition(area, frame, this._settings.get_string('corner'), marginX, marginY);
        state.snapRequested = false;
        const {x, y} = position;
        if (frame.x !== x || frame.y !== y)
            window.move_frame(false, x, y);
    }

    _cancelLayout(state) {
        state.resizeRequested = false;
        state.snapRequested = false;
        if (state.layoutId) {
            GLib.Source.remove(state.layoutId);
            state.layoutId = 0;
        }
    }

    _release(window, state, restore) {
        const wasManaged = state.managed;
        state.managed = false;
        state.grabbed = false;
        this._cancelLayout(state);
        if (restore && wasManaged && !state.originalAbove)
            window.unmake_above();
    }

    _forget(window, state, restore) {
        this._release(window, state, restore);
        for (const id of state.signals)
            window.disconnect(id);
        this._windows.delete(window);
    }

    destroy() {
        this._settings.disconnect(this._settingsId);
        this._settings = null;
        global.display.disconnect(this._createdId);
        global.display.disconnect(this._workareasId);
        global.display.disconnect(this._monitorId);
        global.display.disconnect(this._grabBeginId);
        global.display.disconnect(this._grabEndId);
        for (const [window, state] of this._windows)
            this._forget(window, state, true);
    }
}
