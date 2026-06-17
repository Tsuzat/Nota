import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { mode, toggleMode } from 'mode-watcher';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { openAboutDialog, openNewNote } from '$lib/components/dialogs';
import { openNewWorkspace } from '$lib/components/dialogs/new-workspace.svelte';
import { openGlobalSearch } from '$lib/components/global-search';

/**
 * Creates and sets the native app menu bar.
 * Call this once on mount. The theme toggle action
 * rebuilds the menu to keep the label in sync.
 */
export async function setupAppMenu() {
  const isDark = mode.current === 'dark';

  const sep = async () => PredefinedMenuItem.new({ item: 'Separator' });

  // ─── Nota (App) Menu ───────────────────────────────────────
  const services = await PredefinedMenuItem.new({ item: 'Services' });
  const hideNota = await PredefinedMenuItem.new({ item: 'Hide' });
  const hideOthers = await PredefinedMenuItem.new({ item: 'HideOthers' });
  const showAll = await PredefinedMenuItem.new({ item: 'ShowAll' });
  const quitNota = await PredefinedMenuItem.new({
    item: 'Quit',
    text: 'Quit Nota',
  });

  const aboutNota = await MenuItem.new({
    id: 'app-about',
    text: 'About Nota',
    enabled: true,
    action: () => openAboutDialog(),
  });

  const settings = await MenuItem.new({
    id: 'app-settings',
    text: 'Settings...',
    accelerator: 'CmdOrControl+,',
    action: () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ',',
          metaKey: true,
          bubbles: true,
        })
      );
    },
  });

  const notaSubmenu = await Submenu.new({
    text: 'Nota',
    items: [
      aboutNota,
      settings,
      await sep(),
      services,
      await sep(),
      hideNota,
      hideOthers,
      showAll,
      await sep(),
      quitNota,
    ],
  });

  // ─── File Menu ─────────────────────────────────────────────
  const newNote = await MenuItem.new({
    id: 'file-new-note',
    text: 'New Note',
    accelerator: 'CmdOrControl+N',
    action: () => openNewNote(),
  });

  const newWorkspace = await MenuItem.new({
    id: 'file-new-workspace',
    text: 'New Workspace',
    accelerator: 'CmdOrControl+W',
    action: () => openNewWorkspace(),
  });

  const goHome = await MenuItem.new({
    id: 'file-go-home',
    text: 'Go Home',
    accelerator: 'CmdOrControl+Shift+H',
    action: () => goto(resolve('/')),
  });

  const closeWindow = await PredefinedMenuItem.new({
    item: 'CloseWindow',
    text: 'Close Window',
  });

  const fileSubmenu = await Submenu.new({
    text: 'File',
    items: [newNote, newWorkspace, await sep(), goHome, await sep(), closeWindow],
  });

  // ─── Edit Menu ─────────────────────────────────────────────
  const undo = await PredefinedMenuItem.new({ item: 'Undo' });
  const redo = await PredefinedMenuItem.new({ item: 'Redo' });
  const cut = await PredefinedMenuItem.new({ item: 'Cut' });
  const copy = await PredefinedMenuItem.new({ item: 'Copy' });
  const paste = await PredefinedMenuItem.new({ item: 'Paste' });
  const selectAll = await PredefinedMenuItem.new({ item: 'SelectAll' });

  const editSubmenu = await Submenu.new({
    text: 'Edit',
    items: [undo, redo, await sep(), cut, copy, paste, await sep(), selectAll],
  });

  // ─── View Menu ─────────────────────────────────────────────
  const searchItem = await MenuItem.new({
    id: 'view-search',
    text: 'Search',
    accelerator: 'CmdOrControl+K',
    action: () => openGlobalSearch(),
  });

  const toggleTheme = await MenuItem.new({
    id: 'view-toggle-theme',
    text: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
    accelerator: 'CmdOrControl+Shift+T',
    action: toggleMode,
  });

  const toggleSidebar = await MenuItem.new({
    id: 'view-toggle-sidebar',
    text: 'Toggle Sidebar',
    accelerator: 'CmdOrControl+\\',
    action: () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: '\\',
          metaKey: true,
          bubbles: true,
        })
      );
    },
  });

  const fullscreen = await PredefinedMenuItem.new({
    item: 'Fullscreen',
    text: 'Toggle Full Screen',
  });

  const viewSubmenu = await Submenu.new({
    text: 'View',
    items: [searchItem, await sep(), toggleTheme, toggleSidebar, await sep(), fullscreen],
  });

  // ─── Window Menu ───────────────────────────────────────────
  const minimize = await PredefinedMenuItem.new({ item: 'Minimize' });
  const maximize = await PredefinedMenuItem.new({ item: 'Maximize' });
  const bringAllToFront = await PredefinedMenuItem.new({
    item: 'BringAllToFront',
  });

  const windowSubmenu = await Submenu.new({
    text: 'Window',
    items: [minimize, maximize, await sep(), bringAllToFront],
  });

  // ─── Help Menu ─────────────────────────────────────────────
  const version = await MenuItem.new({
    id: 'help-version',
    text: 'Nota Version',
    enabled: false,
  });

  const helpSubmenu = await Submenu.new({
    text: 'Help',
    items: [version],
  });

  // ─── Build & Set Menu ──────────────────────────────────────
  const menu = await Menu.new({
    items: [notaSubmenu, fileSubmenu, editSubmenu, viewSubmenu, windowSubmenu, helpSubmenu],
  });

  await menu.setAsAppMenu();
}
