import { useState, useEffect, useCallback } from 'react';

export function useTVNavigation(config = {}) {
  const {
    sidebarCount = 20,
    contentCount = 0,
    onSelectChannel = () => {},
    onOpenChannelMenu = () => {},
    onCloseChannelMenu = () => {},
    isChannelMenuOpen = true,
    isSettingsOpen = false
  } = config;

  const [zone, setZone] = useState(isChannelMenuOpen ? 'sidebar' : 'content');
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [settingsIndex, setSettingsIndex] = useState(0);

  // Reset indices when settings open/close - use setTimeout to avoid setState-in-effect warning
  useEffect(() => {
    const cleanup = setTimeout(() => {
      if (isSettingsOpen) {
        setZone('settings');
        setSettingsIndex(0);
      } else {
        setZone(isChannelMenuOpen ? 'sidebar' : 'content');
      }
    }, 0);
    return () => clearTimeout(cleanup);
  }, [isSettingsOpen, isChannelMenuOpen]);

  const handleKeyDown = useCallback((e) => {
    const key = e.key;

    if (zone !== 'settings' && (key === 'Menu' || key === 'ContextMenu' || key === 'm' || key === 'M')) {
      e.preventDefault();
      if (isChannelMenuOpen) {
        onCloseChannelMenu();
        setZone('content');
      } else {
        onOpenChannelMenu();
        setZone('sidebar');
      }
      return;
    }

    // Support standard remote D-pad keys and keyboard arrows
    if (zone === 'settings') {
      if (key === 'ArrowDown') {
        e.preventDefault();
        setSettingsIndex(prev => Math.min(prev + 1, 3));
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        setSettingsIndex(prev => Math.max(prev - 1, 0));
      } else if (key === 'Enter') {
        e.preventDefault();
        // Trigger action based on focused element
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'BUTTON')) {
          activeEl.click();
        }
      }
      return;
    }

    if (!isChannelMenuOpen) {
      if (key === 'ArrowLeft') {
        e.preventDefault();
        onOpenChannelMenu();
        setZone('sidebar');
      }
      return;
    }

    if (zone === 'sidebar') {
      if (key === 'ArrowDown') {
        e.preventDefault();
        setSidebarIndex(prev => Math.min(prev + 1, sidebarCount - 1));
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        setSidebarIndex(prev => Math.max(prev - 1, 0));
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (contentCount > 0) {
          setZone('content');
          setContentIndex(0);
        } else {
          // Go to settings button in content zone if no items
          setZone('content');
          setContentIndex(0);
        }
      } else if (key === 'Enter') {
        e.preventDefault();
        onSelectChannel(sidebarIndex);
      }
    } else if (zone === 'content') {
      if (key === 'ArrowLeft') {
        e.preventDefault();
        setZone('sidebar');
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        setContentIndex(prev => Math.max(prev - 1, 0));
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        setContentIndex(prev => Math.min(prev + 1, Math.max(contentCount - 1, 0)));
      } else if (key === 'Enter') {
        e.preventDefault();
        // Trigger action for active content item
        const focusedElement = document.querySelector('.rail-card.focused, .footer-action.focused, .tv-card.focused, .settings-trigger.focused, .tv-table-row.focused');
        if (focusedElement) {
          focusedElement.click();
        }
      }
    }
  }, [zone, sidebarIndex, sidebarCount, contentCount, onSelectChannel, onOpenChannelMenu, onCloseChannelMenu, isChannelMenuOpen]);

  // Handle global key events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Sync HTML inputs and button focuses for settings modal
  useEffect(() => {
    if (zone === 'settings') {
      const inputs = document.querySelectorAll('.settings-input, .settings-btn');
      if (inputs[settingsIndex]) {
        inputs[settingsIndex].focus();
      }
    }
  }, [zone, settingsIndex]);

  return {
    zone,
    sidebarIndex,
    contentIndex,
    settingsIndex,
    setZone,
    setSidebarIndex,
    setContentIndex,
    setSettingsIndex
  };
}
