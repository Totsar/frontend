export const clampPreviewY = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 50;
    return Math.max(0, Math.min(100, parsed));
};
