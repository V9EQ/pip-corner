// SPDX-License-Identifier: GPL-2.0-or-later
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PipCornerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(560, 500);
        const settings = this.getSettings();
        window._settings = settings;
        const page = new Adw.PreferencesPage({title: 'General', icon_name: 'video-display-symbolic'});
        window.add(page);

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
}
