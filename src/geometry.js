// SPDX-License-Identifier: GPL-2.0-or-later
export function cornerPosition(area, frame, corner, marginX, marginY) {
    // Reduce margins when the client cannot fit them; never use physical pixels.
    const xMargin = Math.min(marginX, Math.floor(Math.max(0, area.width - frame.width) / 2));
    const yMargin = Math.min(marginY, Math.floor(Math.max(0, area.height - frame.height) / 2));
    const right = corner.endsWith('right');
    const bottom = corner.startsWith('bottom');
    return {
        x: area.x + (right ? Math.max(xMargin, area.width - frame.width - xMargin) : xMargin),
        y: area.y + (bottom ? Math.max(yMargin, area.height - frame.height - yMargin) : yMargin),
    };
}
