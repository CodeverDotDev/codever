export type HomeTabId = 'feed' | 'history' | 'pinned' | 'read-later';

export interface HomeTab {
  id: HomeTabId;
  label: string;
  icon: string;
  path: string;
  title?: string;
}

export const DEFAULT_HOME_TABS: readonly HomeTabId[] = [
  'feed',
  'history',
  'pinned',
  'read-later',
];

export const HOME_TABS: readonly HomeTab[] = [
  {
    id: 'feed',
    label: 'Feed',
    icon: 'fas fa-home',
    path: '/feed',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'fas fa-history',
    path: '/history',
    title: 'Ctrl/Cmd+Shift+H for quick access',
  },
  {
    id: 'pinned',
    label: 'Pinned',
    icon: 'fas fa-thumbtack',
    path: '/pinned',
    title: 'Ctrl/Cmd+Shift+P for quick access',
  },
  {
    id: 'read-later',
    label: 'Read Later',
    icon: 'fas fa-clock',
    path: '/read-later',
  },
];

const validHomeTabIds: readonly string[] = DEFAULT_HOME_TABS;

export function resolveHomeTabs(saved?: readonly string[]): HomeTabId[] {
  if (
    saved?.length === DEFAULT_HOME_TABS.length &&
    new Set(saved).size === DEFAULT_HOME_TABS.length &&
    saved.every((tab) => validHomeTabIds.includes(tab))
  ) {
    return [...saved] as HomeTabId[];
  }

  return [...DEFAULT_HOME_TABS];
}
