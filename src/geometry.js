// SPDX-License-Identifier: GPL-2.0-or-later
export function requestedSize(area, options) {
    const {mode, marginX, marginY} = options;
    if (mode === 'browser')
        return null;
    const width = mode === 'relative'
        ? Math.round(area.width * options.widthPercent / 100) : options.width;
    const height = mode === 'relative'
        ? Math.round(area.height * options.heightPercent / 100) : options.height;
    const xMargin = Math.min(marginX, Math.floor((area.width - 1) / 2));
    const yMargin = Math.min(marginY, Math.floor((area.height - 1) / 2));
    return {
        width: Math.max(1, Math.min(width, area.width - 2 * xMargin)),
        height: Math.max(1, Math.min(height, area.height - 2 * yMargin)),
    };
}

export function magneticPosition(area, frame, marginX, marginY, distance) {
    const start = cornerPosition(area, frame, 'top-left', marginX, marginY);
    const end = cornerPosition(area, frame, 'bottom-right', marginX, marginY);
    const snap = (value, first, last) => {
        const target = Math.abs(value - first) <= Math.abs(value - last) ? first : last;
        return Math.abs(value - target) <= distance ? target : value;
    };
    return {
        x: frame.width <= area.width ? snap(frame.x, start.x, end.x) : frame.x,
        y: frame.height <= area.height ? snap(frame.y, start.y, end.y) : frame.y,
    };
}

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
