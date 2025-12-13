type Theme = {
  name: string;
  label: string;
  color: {
    light: string;
    dark: string;
  };
};

export const themes: Theme[] = [
  {
    name: 'default',
    label: 'Default',
    color: {
      light: 'oklch(0.205 0 0)',
      dark: 'oklch(0.922 0 0)',
    },
  },
  {
    name: 'red',
    label: 'Red',
    color: {
      light: 'oklch(0.637 0.237 25.331)',
      dark: 'oklch(0.637 0.237 25.331)',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    color: {
      light: 'oklch(0.645 0.246 16.439)',
      dark: 'oklch(0.645 0.246 16.439)',
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    color: {
      light: 'oklch(0.705 0.213 47.604)',
      dark: 'oklch(0.646 0.222 41.116)',
    },
  },
  {
    name: 'green',
    label: 'Green',
    color: {
      light: 'oklch(0.723 0.219 149.579)',
      dark: 'oklch(0.696 0.17 162.48)',
    },
  },
  {
    name: 'blue',
    label: 'Blue',
    color: {
      light: 'oklch(0.623 0.214 259.815)',
      dark: 'oklch(0.546 0.245 262.881)',
    },
  },
  {
    name: 'yellow',
    label: 'Yellow',
    color: {
      light: 'oklch(0.795 0.184 86.047)',
      dark: 'oklch(0.795 0.184 86.047)',
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    color: {
      light: 'oklch(0.606 0.25 292.717)',
      dark: 'oklch(0.541 0.281 293.009)',
    },
  },
];

export function setTheme(themeName: string) {
  const body = document.body;
  // Remove any existing theme classes
  for (const theme of themes) {
    body.classList.remove(`theme-${theme.name}`);
  }
  // Add the new theme class
  if (themeName !== 'default') {
    body.classList.add(`theme-${themeName}`);
  }
}
