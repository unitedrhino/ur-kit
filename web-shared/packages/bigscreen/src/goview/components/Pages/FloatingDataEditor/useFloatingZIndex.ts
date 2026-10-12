let globalFloatingZIndex = 10_000;

export const ensureFloatingZIndex = (value: number): number => {
  if (value > globalFloatingZIndex) {
    globalFloatingZIndex = value;
  }
  return globalFloatingZIndex;
};

export const getNextFloatingZIndex = (): number => {
  globalFloatingZIndex += 1;
  return globalFloatingZIndex;
};
