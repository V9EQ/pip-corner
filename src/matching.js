// SPDX-License-Identifier: GPL-2.0-or-later
const BROWSER_IDS = new Set([
    'chromium', 'chromium-browser', 'org.chromium.chromium',
    'google-chrome', 'google-chrome-stable', 'google-chrome-beta',
    'google-chrome-unstable', 'com.google.chrome',
]);

const TITLES = new Set([
    'picture in picture',
    'картинка в картинке',
    'картинка в картинці',
]);

function normalize(value) {
    return (value ?? '').trim().normalize('NFC').toLowerCase();
}

export function matchesPip(identities, title, extraBrowser = '', extraTitle = '') {
    const browser = identities.some(identity => {
        const id = normalize(identity);
        return BROWSER_IDS.has(id) || (id !== '' && id === normalize(extraBrowser));
    });
    const name = normalize(title);
    return browser && (TITLES.has(name) || (name !== '' && name === normalize(extraTitle)));
}
