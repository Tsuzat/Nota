import { getContext, setContext } from 'svelte';

function getLocalStorageValue(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, String(defaultValue));
    return defaultValue;
  }
  return data === 'true';
}

function getLocalStorageString(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, defaultValue);
    return defaultValue;
  }
  return data;
}

class GlobalSettings {
  #open = $state(false);
  #useAI = $state(getLocalStorageValue('useAI', true));
  #useToolBar = $state(getLocalStorageValue('useToolBar', false));
  #useBubbleMenu = $state(getLocalStorageValue('useBubbleMenu', true));
  #useDragHandle = $state(getLocalStorageValue('useDragHandle', true));
  #themeColor = $state(getLocalStorageString('themeColor', 'default'));
  #aiProvider = $state(getLocalStorageString('ai_provider', 'google'));
  #useOwnKeys = $state(getLocalStorageValue('useOwnKeys', false));

  constructor(open = false) {
    this.#open = open;
  }
  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = value;
  }
  get useAI() {
    return this.#useAI;
  }
  set useAI(value) {
    this.#useAI = value;
    if (typeof window !== 'undefined') localStorage.setItem('useAI', String(value));
  }
  get useOwnKeys() {
    return this.#useOwnKeys;
  }
  set useOwnKeys(value) {
    this.#useOwnKeys = value;
    if (typeof window !== 'undefined') localStorage.setItem('useOwnKeys', String(value));
  }
  get useToolBar() {
    return this.#useToolBar;
  }
  set useToolBar(value) {
    this.#useToolBar = value;
    if (typeof window !== 'undefined') localStorage.setItem('useToolBar', String(value));
  }
  get useBubbleMenu() {
    return this.#useBubbleMenu;
  }
  set useBubbleMenu(value) {
    this.#useBubbleMenu = value;
    if (typeof window !== 'undefined') localStorage.setItem('useBubbleMenu', String(value));
  }
  get useDragHandle() {
    return this.#useDragHandle;
  }
  set useDragHandle(value) {
    this.#useDragHandle = value;
    if (typeof window !== 'undefined') localStorage.setItem('useDragHandle', String(value));
  }
  get themeColor() {
    return this.#themeColor;
  }
  set themeColor(value) {
    this.#themeColor = value;
    if (typeof window !== 'undefined') localStorage.setItem('themeColor', value);
  }
  get aiProvider() {
    return this.#aiProvider;
  }
  set aiProvider(value) {
    this.#aiProvider = value;
    if (typeof window !== 'undefined') localStorage.setItem('ai_provider', value);
  }
}

const GLOBALSETTINGSKEY = Symbol('GLOBALSETTINGSKEY');

export const setGlobalSettings = () => {
  return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
  return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
