// SPDX-License-Identifier: GPL-2.0-or-later
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import {cornerPosition} from './geometry.js';
import {matchesPip} from './matching.js';

export class PipWindowManager {
    constructor(settings) {
        this._settings = settings;
        this._windows = new Map();
        this._settingsId = settings.connect('changed', () => {
            for (const [window, state] of this._windows)
                this._refresh(window, state);
        });
        this._createdId = global.display.connect('window-created', (_display, window) => {
            this._watch(window);
        });
        this._workareasId = global.display.connect('workareas-changed', () => {
            for (const [window, state] of this._windows)
                this._queueLayout(window, state);
        });
        this._monitorId = global.display.connect('window-entered-monitor', (_display, _monitor, window) => {
            const state = this._windows.get(window);
            if (state)
                this._queueLayout(window, state);
        });
        for (const actor of global.get_window_actors())
            this._watch(actor.meta_window);
    }

    _watch(window) {
        if (this._windows.has(window))
            return;

        const state = {signals: [], managed: false, originalAbove: false, layoutId: 0};
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

    _refresh(window, state) {
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
        }
        this._queueLayout(window, state);
    }

    _queueLayout(window, state) {
        if (!state.managed || state.layoutId)
            return;
        state.layoutId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            state.layoutId = 0;
            if (state.managed && window.mapped)
                this._layout(window);
            return GLib.SOURCE_REMOVE;
        });
    }

    _layout(window) {
        const monitor = window.get_monitor();
        if (monitor < 0 || monitor >= global.display.get_n_monitors())
            return;
        const area = window.get_work_area_for_monitor(monitor);
        if (area.width < 1 || area.height < 1)
            return;
        const frame = window.get_frame_rect();
        const {x, y} = cornerPosition(area, frame,
            this._settings.get_string('corner'),
            this._settings.get_int('margin-x'), this._settings.get_int('margin-y'));
        if (frame.x !== x || frame.y !== y)
            window.move_frame(false, x, y);
    }

    _release(window, state, restore) {
        const wasManaged = state.managed;
        state.managed = false;
        if (state.layoutId) {
            GLib.Source.remove(state.layoutId);
            state.layoutId = 0;
        }
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
        for (const [window, state] of this._windows)
            this._forget(window, state, true);
    }
}
