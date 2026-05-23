import ClassicRoot from './classic/ClassicRoot.jsx';
import RedesignRoot from './redesign/RedesignRoot.jsx';

export const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    blurb: 'The original NOODEL look.',
    Root: ClassicRoot,
  },
  {
    id: 'redesign',
    name: 'Modern',
    blurb: 'Cleaner type, lighter chrome.',
    Root: RedesignRoot,
  },
];

export const DEFAULT_THEME_ID = 'classic';
