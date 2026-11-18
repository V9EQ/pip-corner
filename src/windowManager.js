// SPDX-License-Identifier: GPL-2.0-or-later
import Meta from 'gi://Meta';

import {matchesPip} from './matching.js';

export class PipWindowManager {
    constructor() {
        this._windows = new Map();
        this._createdId = global.display.connect('window-created', (_display, window) => {
            this._watch(window);
        });
        for (const actor of global.get_window_actors())
            this._watch(actor.meta_window);
    }

    _watch(window) {
        if (this._windows.has(window))
            return;

        const state = {signals: [], managed: false, originalAbove: false};
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
        state.signals.push(window.connect('unmanaged', () => {
            this._forget(window, state, false);
        }));
        this._refresh(window, state);
    }

    _refresh(window, state) {
        const matches = window.get_window_type() === Meta.WindowType.NORMAL && matchesPip([
            window.get_wm_class(), window.get_gtk_application_id(),
        ], window.get_title());

        if (!matches) {
            this._release(window, state, true);
            return;
        }
        if (!window.mapped || state.managed)
            return;

        state.originalAbove = window.is_above();
        state.managed = true;
        window.make_above();
    }

    _release(window, state, restore) {
        const wasManaged = state.managed;
        state.managed = false;
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
        global.display.disconnect(this._createdId);
        for (const [window, state] of this._windows)
            this._forget(window, state, true);
    }
}
