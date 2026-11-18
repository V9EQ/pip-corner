// SPDX-License-Identifier: GPL-2.0-or-later
const BROWSER_IDS = new Set([
    'chromium', 'chromium-browser', 'org.chromium.chromium',
    'google-chrome', 'google-chrome-stable', 'google-chrome-beta',
    'google-chrome-unstable', 'com.google.chrome',
]);

const DEFAULT_TITLE = 'picture in picture';

function normalize(value) {
    return (value ?? '').trim().normalize('NFC').toLowerCase();
}

export function matchesBrowser(identities, extraBrowser = '') {
    return identities.some(identity => {
        const id = normalize(identity);
        return BROWSER_IDS.has(id) || (id !== '' && id === normalize(extraBrowser));
    });
}

export function matchesTitle(title, extraTitle = '') {
    const name = normalize(title);
    return name === DEFAULT_TITLE || (name !== '' && name === normalize(extraTitle));
}
