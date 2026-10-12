export const BIND_CONFIRM_DELAY_MS = 5_000;

interface WaitBeforeBindOptions {
  delay?: (ms: number) => Promise<void>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitBeforeBind(
  operation: () => Promise<void>,
  options: WaitBeforeBindOptions = {},
): Promise<void> {
  const delay = options.delay ?? wait;
  await delay(BIND_CONFIRM_DELAY_MS);
  await operation();
}
