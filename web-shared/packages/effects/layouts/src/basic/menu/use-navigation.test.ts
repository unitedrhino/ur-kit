import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAfterEach, mockGetRoutes, mockIsHttpUrl, mockOpenRouteInNewWindow, mockOpenWindow, mockOpenWindowInCurrentTab, mockPush, mockResolve } = vi.hoisted(
  () => ({
    mockAfterEach: vi.fn(),
    mockGetRoutes: vi.fn(),
    mockIsHttpUrl: vi.fn((path: string) => path.startsWith('http')),
    mockOpenRouteInNewWindow: vi.fn(),
    mockOpenWindow: vi.fn(),
    mockOpenWindowInCurrentTab: vi.fn(),
    mockPush: vi.fn(),
    mockResolve: vi.fn(),
  }),
);

vi.mock('vue-router', () => ({
  useRouter: () => ({
    afterEach: mockAfterEach,
    getRoutes: mockGetRoutes,
    push: mockPush,
    resolve: mockResolve,
  }),
}));

vi.mock('@vben/utils', () => ({
  isHttpUrl: mockIsHttpUrl,
  openRouteInNewWindow: mockOpenRouteInNewWindow,
  openWindow: mockOpenWindow,
  openWindowInCurrentTab: mockOpenWindowInCurrentTab,
}));

async function createNavigation() {
  const { useNavigation } = await import('./use-navigation');
  return useNavigation();
}

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolve.mockImplementation((path: string) => ({ href: `/resolved${path}` }));
  });

  it('opens link menus in current tab', async () => {
    mockGetRoutes.mockReturnValue([
      {
        meta: {
          link: 'https://example.com/docs',
        },
        path: '/docs',
      },
    ]);

    const { navigation } = await createNavigation();

    await navigation('/docs');

    expect(mockOpenWindowInCurrentTab).toHaveBeenCalledWith('https://example.com/docs');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates openInNewWindow routes in current tab', async () => {
    mockGetRoutes.mockReturnValue([
      {
        meta: {
          openInNewWindow: true,
          query: {
            source: 'header',
          },
        },
        path: '/tenant',
      },
    ]);

    const { navigation } = await createNavigation();

    await navigation('/tenant');

    expect(mockPush).toHaveBeenCalledWith({
      path: '/tenant',
      query: {
        source: 'header',
      },
    });
    expect(mockOpenRouteInNewWindow).not.toHaveBeenCalled();
  });
});
