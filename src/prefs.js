// SPDX-License-Identifier: GPL-2.0-or-later
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PipCornerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(560, 500);
        const settings = this.getSettings();
        window._settings = settings;
        const page = new Adw.PreferencesPage({title: 'General', icon_name: 'video-display-symbolic'});
        window.add(page);

        const placement = new Adw.PreferencesGroup({
            title: 'Placement',
            description: 'Use the PiP window’s current monitor, excluding panels and reserved space. All dimensions are logical pixels.',
        });
        page.add(placement);
        this._addChoice(window, settings, placement, 'corner', 'Corner', [
            ['top-left', 'Top left'], ['top-right', 'Top right'],
            ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right'],
        ]);
        this._addSpin(settings, placement, 'margin-x', 'Horizontal margin', 0, 500);
        this._addSpin(settings, placement, 'margin-y', 'Vertical margin', 0, 500);

        const snapping = new Adw.PreferencesGroup({
            title: 'Edge magnetism',
            description: 'Release PiP near an edge to align it with the margin. Movement stays free; distant edges do not attract the window.',
        });
        page.add(snapping);
        const snap = new Adw.SwitchRow({title: 'Snap to nearby edges'});
        snapping.add(snap);
        settings.bind('snap-enabled', snap, 'active', Gio.SettingsBindFlags.DEFAULT);
        const distance = this._addSpin(settings, snapping, 'snap-distance', 'Snap distance', 4, 96);
        settings.bind('snap-enabled', distance, 'sensitive', Gio.SettingsBindFlags.GET);

        const sizing = new Adw.PreferencesGroup({
            title: 'Size',
            description: 'Requested dimensions include the window frame. Chromium may enforce its own minimum, maximum or aspect ratio.',
        });
        page.add(sizing);
        this._addChoice(window, settings, sizing, 'size-mode', 'Size mode', [
            ['browser', 'Keep browser size'], ['fixed', 'Fixed size'],
            ['relative', 'Monitor-relative size'],
        ]);
        const fixed = new Adw.PreferencesGroup({title: 'Fixed dimensions'});
        page.add(fixed);
        this._addSpin(settings, fixed, 'window-width', 'Width', 160, 7680);
        this._addSpin(settings, fixed, 'window-height', 'Height', 90, 4320);
        const relative = new Adw.PreferencesGroup({
            title: 'Monitor-relative dimensions',
            description: 'Percentages of the current monitor’s usable work area, capped to leave room for margins.',
        });
        page.add(relative);
        this._addSpin(settings, relative, 'width-percent', 'Width (%)', 5, 100);
        this._addSpin(settings, relative, 'height-percent', 'Height (%)', 5, 100);
        const updateSensitivity = () => {
            const mode = settings.get_string('size-mode');
            fixed.sensitive = mode === 'fixed';
            relative.sensitive = mode === 'relative';
        };
        updateSensitivity();
        const modeId = settings.connect('changed::size-mode', updateSensitivity);
        window.connect('close-request', () => {
            settings.disconnect(modeId);
            return false;
        });

        const detection = new Adw.PreferencesGroup({
            title: 'Window detection',
            description: 'English “Picture in picture” is recognized automatically. Optional fields extend the defaults; both browser and title must match.',
        });
        page.add(detection);
        for (const [key, title] of [
            ['custom-title', 'Additional PiP window title'],
            ['custom-browser-id', 'Additional browser app ID / WM class'],
        ]) {
            const row = new Adw.EntryRow({title});
            detection.add(row);
            settings.bind(key, row, 'text', Gio.SettingsBindFlags.DEFAULT);
        }
    }

    _addChoice(window, settings, group, key, title, choices) {
        const values = choices.map(([value]) => value);
        const row = new Adw.ComboRow({
            title,
            model: Gtk.StringList.new(choices.map(([, label]) => label)),
            selected: values.indexOf(settings.get_string(key)),
        });
        group.add(row);
        row.connect('notify::selected', () => {
            if (row.selected < values.length)
                settings.set_string(key, values[row.selected]);
        });
        const id = settings.connect(`changed::${key}`, () => {
            row.selected = values.indexOf(settings.get_string(key));
        });
        window.connect('close-request', () => {
            settings.disconnect(id);
            return false;
        });
        return row;
    }

    _addSpin(settings, group, key, title, lower, upper) {
        const row = new Adw.SpinRow({
            title,
            adjustment: new Gtk.Adjustment({lower, upper, step_increment: 1, page_increment: 10}),
            digits: 0,
        });
        group.add(row);
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }
}
