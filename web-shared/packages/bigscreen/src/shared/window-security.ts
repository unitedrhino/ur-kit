export const getTrustedOpener = (): null | Window => {
  try {
    const openerWindow = window.opener;
    if (!openerWindow || openerWindow.closed) return null;
    if (openerWindow.location.origin !== window.location.origin) return null;
    return openerWindow;
  } catch {
    return null;
  }
};

export const openNoOpenerWindow = (url: string) => {
  const nextWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (nextWindow) {
    nextWindow.opener = null;
  }
  return nextWindow;
};
