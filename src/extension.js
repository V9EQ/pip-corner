// SPDX-License-Identifier: GPL-2.0-or-later
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {PipWindowManager} from './windowManager.js';

export default class PipCorner extends Extension {
    enable() {
        this._manager = new PipWindowManager(this.getSettings());
    }

    disable() {
        this._manager?.destroy();
        this._manager = null;
    }
}
