import { getContext, setContext } from 'svelte';
import { GEMINI_MODELS } from '$lib/ai';

function getLocalStorageValue(key: string, defaultValue: boolean): boolean {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, String(defaultValue));
    return defaultValue;
  }
  return data === 'true';
}

class GlobalSettings {
  #open = $state(false);
  #useAI = $state(getLocalStorageValue('useAI', true));
  #useToolBar = $state(getLocalStorageValue('useToolBar', false));
  #useBubbleMenu = $state(getLocalStorageValue('useBubbleMenu', true));
  #useDragHandle = $state(getLocalStorageValue('useDragHandle', true));
  #themeColor = $state(localStorage.getItem('themeColor') || 'default');
  #useMyOwnAI = $state(getLocalStorageValue('useMyOwnAI', false));
  #geminiModel = $state(localStorage.getItem('geminiModel') || GEMINI_MODELS.GEMINI_2_5_FLASH_LITE);

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
    localStorage.setItem('useAI', String(value));
  }
  get useToolBar() {
    return this.#useToolBar;
  }
  set useToolBar(value) {
    this.#useToolBar = value;
    localStorage.setItem('useToolBar', String(value));
  }
  get useBubbleMenu() {
    return this.#useBubbleMenu;
  }
  set useBubbleMenu(value) {
    this.#useBubbleMenu = value;
    localStorage.setItem('useBubbleMenu', String(value));
  }
  get useDragHandle() {
    return this.#useDragHandle;
  }
  set useDragHandle(value) {
    this.#useDragHandle = value;
    localStorage.setItem('useDragHandle', String(value));
  }
  get themeColor() {
    return this.#themeColor;
  }
  set themeColor(value) {
    this.#themeColor = value;
    localStorage.setItem('themeColor', value);
  }
  get useMyOwnAI() {
    return this.#useMyOwnAI;
  }
  set useMyOwnAI(value) {
    this.#useMyOwnAI = value;
    localStorage.setItem('useMyOwnAI', String(value));
  }
  get geminiModel() {
    return this.#geminiModel;
  }
  set geminiModel(value: string) {
    this.#geminiModel = value;
    localStorage.setItem('geminiModel', value);
  }
}

const GLOBALSETTINGSKEY = Symbol('GLOBALSETTINGSKEY');

export const setGlobalSettings = () => {
  return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
  return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
