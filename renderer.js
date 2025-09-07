// Enhanced Electron Browser - Renderer Process
// Features: Tab management, bookmarks, history, downloads, settings

/**
 * Default home page for the browser.
 */
const HOME_URL = 'https://www.google.com';

/**
 * Browser state management
 */
class BrowserState {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.history = this.loadHistory();
    this.settings = this.loadSettings();
    this.nextTabId = 1;
  }

  // Tab management
  createTab(url = HOME_URL, title = 'New Tab') {
    const tab = {
      id: this.nextTabId++,
      url: url,
      title: title,
      favicon: null,
      loading: false,
      canGoBack: false,
      canGoForward: false
    };
    this.tabs.push(tab);
    return tab;
  }

  removeTab(tabId) {
    const index = this.tabs.findIndex(tab => tab.id === tabId);
    if (index !== -1) {
      this.tabs.splice(index, 1);
      if (this.activeTabId === tabId) {
        this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
      }
    }
  }

  getActiveTab() {
    return this.tabs.find(tab => tab.id === this.activeTabId);
  }

  setActiveTab(tabId) {
    this.activeTabId = tabId;
  }

  updateTab(tabId, updates) {
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (tab) {
      Object.assign(tab, updates);
    }
  }



  // History management
  addToHistory(url, title) {
    // Remove any existing entry with the same URL to prevent duplicates
    this.history = this.history.filter(entry => entry.url !== url);
    
    // Add the new entry at the beginning of the history
    const historyEntry = { url, title, date: new Date().toISOString() };
    this.history.unshift(historyEntry);
    
    // Keep only last 1000 entries
    if (this.history.length > 1000) {
      this.history = this.history.slice(0, 1000);
    }
    this.saveHistory();
  }

  // Settings management
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }



  loadHistory() {
    try {
      const stored = localStorage.getItem('browser_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    localStorage.setItem('browser_history', JSON.stringify(this.history));
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('browser_settings');
      return stored ? JSON.parse(stored) : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  saveSettings() {
    localStorage.setItem('browser_settings', JSON.stringify(this.settings));
  }



  getDefaultSettings() {
    return {
      homePage: HOME_URL,
      searchEngine: 'https://www.google.com/search?q=',
      showBookmarksBar: true,
      showStatusBar: true,
      theme: 'dark'
    };
  }

  // Group history entries by date (returns {date: [entries]})
  getHistoryGroupedByDate() {
    const grouped = {};
    for (const entry of this.history) {
      const date = entry.date.slice(0, 10); // YYYY-MM-DD
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    }
    return grouped;
  }
}

/**
 * Tab management UI
 */
class TabManager {
  constructor(browserState) {
    this.browserState = browserState;
    this.tabBar = document.getElementById('tab-bar');
    this.tabsContainer = document.querySelector('.tabs-container');
    this.content = document.getElementById('content');
    this.webviews = new Map();
    this.eventListeners = {}; // For custom events
    this.setupEventListeners();
    this.setupSidebarEvents();
    window.addEventListener('resize', () => this.adjustTabWidths());
  }

  setupEventListeners() {
    // New tab button
    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'new-tab-btn';
    newTabBtn.innerHTML = '+';
    newTabBtn.title = 'New Tab';
    newTabBtn.onclick = () => this.createNewTab();
    this.tabsContainer.appendChild(newTabBtn);

    // Enable drag and drop on tab bar
    this.setupDragAndDrop();
  }

  createNewTab(url = HOME_URL, title = 'New Tab') {
    const tab = this.browserState.createTab(url, title);
    this.createTabElement(tab);
    this.createWebview(tab);
    this.switchToTab(tab.id);
    return tab;
  }

  createTabElement(tab) {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = tab.id;

    tabElement.innerHTML = `
      <img src="${tab.favicon || ''}" class="tab-favicon">
      <span class="tab-title">${tab.title}</span>
      <button class="tab-close" title="Close Tab">×</button>
    `;

    tabElement.onclick = (e) => {
      if (e.target.classList.contains('tab-close')) {
        this.closeTab(tab.id);
      } else {
        this.switchToTab(tab.id);
      }
    };

    this.tabsContainer.insertBefore(tabElement, this.tabsContainer.lastElementChild);
    this.adjustTabWidths();
    return tabElement;
  }

  createWebview(tab) {
    const container = document.createElement('div');
    container.className = 'webview-container';
    container.dataset.tabId = tab.id;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    container.appendChild(progressBar);

    const webview = document.createElement('webview');
    webview.src = tab.url;
    webview.allowpopups = true;
    container.appendChild(webview);

    // Track readiness
    webview._isReady = false;
    webview.addEventListener('dom-ready', () => {
      webview._isReady = true;
      this.updateNavigationButtons();
    });

    this.content.insertBefore(container, document.getElementById('global-webview-sidebar'));
    this.webviews.set(tab.id, { webview, container, progressBar });

    this.setupWebviewEvents(tab.id, webview, progressBar);
  }

  setupWebviewEvents(tabId, webview, progressBar) {
    // Add wheel event listener for zoom with Ctrl/Cmd key
    webview.addEventListener('wheel', (e) => {
      // Only zoom when Ctrl or Cmd key is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const zoomDelta = e.deltaY > 0 ? -5 : 5;
        const currentZoom = webview.getZoomFactor() * 100;
        const newZoom = Math.max(25, Math.min(500, currentZoom + zoomDelta));
        
        webview.setZoomFactor(newZoom / 100);
        this.browserState.zoomLevels.set(tabId, newZoom);
        
        // Find and update the zoom level display if it exists
        const zoomDisplay = document.querySelector('.zoom-level-input');
        if (zoomDisplay) {
          zoomDisplay.value = Math.round(newZoom) + '%';
        }
      }
    }, { passive: false });

    webview.addEventListener('did-start-loading', () => {
      progressBar.style.width = '0%';
      progressBar.style.opacity = '1';
      this.browserState.updateTab(tabId, { loading: true });
      this.updateTabUI(tabId);
    });

    webview.addEventListener('did-stop-loading', () => {
      this.browserState.updateTab(tabId, { loading: false });
      this.updateTabUI(tabId);
      progressBar.style.width = '0%';
    });

    webview.addEventListener('did-finish-load', () => {
      const url = webview.getURL();
      const title = webview.getTitle();
      const favicon = webview.FaviconURL || `${new URL(url).origin}/favicon.ico`
      this.browserState.updateTab(tabId, {
        url,
        title: title || 'New Tab',
        loading: false, 
        favicon: favicon
      });
      
      this.browserState.addToHistory(url, title);
      this.updateTabUI(tabId);
      this.updateAddressBar();
      this.updateNavigationButtons();
    });

    webview.addEventListener('page-title-updated', (e) => {
      this.browserState.updateTab(tabId, { title: e.title });
      this.updateTabUI(tabId);
    });

    webview.addEventListener('did-navigate', () => {
      this.updateNavigationButtons();
    });

    webview.addEventListener('did-navigate-in-page', () => {
      this.updateNavigationButtons();
    });

    // Progress tracking
    webview.addEventListener('did-start-loading', () => {
      progressBar.style.width = '10%';
    });

    webview.addEventListener('did-commit', () => {
      progressBar.style.width = '50%';
    });

    webview.addEventListener('did-finish-load', () => {
      progressBar.style.width = '100%';
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 200);
    });
  }

  setupSidebarEvents() {
    const sidebar = document.getElementById('global-webview-sidebar');
    const menuDotBtn = document.getElementById('menuDot');
  
    // Handle menu dot button click to toggle sidebar
    menuDotBtn.addEventListener('click', () => {
      const activeTab = this.browserState.getActiveTab();
      if (!activeTab) return;
      const webviewData = this.webviews.get(activeTab.id);
      if (!webviewData) return;
      const isOpen = sidebar.classList.toggle('open');
      if (isOpen) {
        webviewData.container.classList.add('sidebar-open');
      } else {
        webviewData.container.classList.remove('sidebar-open');
      }
    });

    // Handle menu item clicks
    sidebar.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (!menuItem) return;
      
      const action = menuItem.dataset.action;
      if (action === 'newTab') {
        this.createNewTab();
        // Close the sidebar after creating a new tab
        sidebar.classList.remove('open');
        const activeTab = this.browserState.getActiveTab();
        if (activeTab) {
          const webviewData = this.webviews.get(activeTab.id);
          if (webviewData) {
            webviewData.container.classList.remove('sidebar-open');
          }
        }
      }
    });

    // Clicking outside sidebar closes it
    document.addEventListener('mousedown', (e) => {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target.id !== 'menuDot' &&
        !e.target.closest('.menu-item')
      ) {
        sidebar.classList.remove('open');
        // Remove sidebar-open from all webview-containers
        this.webviews.forEach(({ container }) => container.classList.remove('sidebar-open'));
      }
    });
  }

  // Theme Toggle Function
  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme. Current theme:', currentTheme, 'New theme:', newTheme);
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('browser_theme', newTheme);
  }

  // Apply stored theme on startup
  applyTheme() {
    const storedTheme = localStorage.getItem('browser_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
  }

  switchToTab(tabId) {
    // Hide all webviews
    this.webviews.forEach(({ container }) => {
      container.classList.add('hidden');
    });

    // Show active webview
    const activeWebview = this.webviews.get(tabId);
    if (activeWebview) {
      activeWebview.container.classList.remove('hidden');
    }

    // Update tab states
    this.tabsContainer.querySelectorAll('.tab').forEach(tabEl => {
      tabEl.classList.remove('active');
    });

    const activeTabEl = this.tabBar.querySelector(`[data-tab-id="${tabId}"]`);
    if (activeTabEl) {
      activeTabEl.classList.add('active');
    }

    this.browserState.setActiveTab(tabId);
    this.updateAddressBar();
    this.updateNavigationButtons();
    this.emit('tab-changed', tabId);
  }

  closeTab(tabId) {
    const tabs = this.browserState.tabs;
    const isActive = this.browserState.activeTabId === tabId;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);

    // If only one tab, close the window
    if (tabs.length === 1) {
      // Remove webview
      const webviewData = this.webviews.get(tabId);
      if (webviewData) {
        webviewData.container.remove();
        this.webviews.delete(tabId);
      }
      // Remove tab element
      const tabElement = this.tabBar.querySelector(`[data-tab-id="${tabId}"]`);
      if (tabElement) {
        tabElement.remove();
      }
      this.browserState.removeTab(tabId);
      // Close the window
      window.electronAPI?.windowClose();
      return;
    }

    // Remove webview
    const webviewData = this.webviews.get(tabId);
    if (webviewData) {
      webviewData.container.remove();
      this.webviews.delete(tabId);
    }
    // Remove tab element
    const tabElement = this.tabBar.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }
    this.browserState.removeTab(tabId);

    // If the closed tab was active, switch to previous tab (left), or next if no previous
    if (isActive) {
      let newActiveTab = null;
      if (tabIndex > 0) {
        newActiveTab = tabs[tabIndex - 1];
      } else if (tabs.length > 0) {
        newActiveTab = tabs[0];
      }
      if (newActiveTab) {
        this.switchToTab(newActiveTab.id);
      }
    }
    
    if (activeTab) {
      addressInput.value = activeTab.url;
    }
  }

  updateNavigationButtons() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const webview = this.webviews.get(activeTab.id)?.webview;
    if (!webview) return;

    // Update back/forward buttons
    document.getElementById('back').disabled = !webview.canGoBack();
    document.getElementById('forward').disabled = !webview.canGoForward();
  }

  updateAddressBar() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const addressInput = document.getElementById('address');
    if (addressInput) {
      addressInput.value = activeTab.url || '';
    }
  }

  getActiveWebview() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return null;
    const webviewData = this.webviews.get(activeTab.id);
    return webviewData ? webviewData.webview : null;
  }

  getActiveTabId() {
    const activeTab = this.browserState.getActiveTab();
    return activeTab ? activeTab.id : null;
  }

  updateTabUI(tabId) {
    const tab = this.browserState.tabs.find(t => t.id === tabId);
    const tabElement = this.tabBar.querySelector(`[data-tab-id="${tabId}"]`);

    if (tab && tabElement) {
      const titleElement = tabElement.querySelector('.tab-title');
      titleElement.textContent = tab.loading ? 'Loading...' : tab.title;
      const faviconElement = tabElement.querySelector('.tab-favicon');
      if (faviconElement) {
        // If tab has a favicon, use it, otherwise try to get the website's favicon
        // If that fails, use the Prism logo as fallback
        const faviconUrl = tab.favicon || `${new URL(tab.url).origin}/favicon.ico`;
        faviconElement.src = faviconUrl;
        faviconElement.onerror = () => {
          // If favicon fails to load, use the Prism logo
          faviconElement.src = 'assets/Prizm_Logo.png';
          faviconElement.onerror = null; // Prevent infinite loop if the fallback also fails
        };
      }
    }
  }

  getWebview(tabId) {
    const webviewData = this.webviews.get(tabId);
    return webviewData ? webviewData.webview : null;
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, ...args) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  zoomIn() {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.setZoomLevel(webview.getZoomLevel() + 0.1);
    }
  }

  zoomOut() {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.setZoomLevel(webview.getZoomLevel() - 0.1);
    }
  }

  resetZoom() {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.setZoomLevel(1);
    }
  }

  navigateToUrl(url) {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const webviewData = this.webviews.get(activeTab.id);
    if (webviewData) {
      webviewData.webview.loadURL(url);
    }
  }

  goBack() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const webviewData = this.webviews.get(activeTab.id);
    if (webviewData && webviewData.webview.canGoBack()) {
      webviewData.webview.goBack();
    }
  }

  goForward() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const webviewData = this.webviews.get(activeTab.id);
    if (webviewData && webviewData.webview.canGoForward()) {
      webviewData.webview.goForward();
    }
  }

  refresh() {
    const activeTab = this.browserState.getActiveTab();
    if (!activeTab) return;

    const webviewData = this.webviews.get(activeTab.id);
    if (webviewData) {
      webviewData.webview.reload();
    }
  }

  goHome() {
    const homeUrl = this.browserState.settings.homePage;
    this.navigateToUrl(homeUrl);
  }

  setupDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.tabBar.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Handle drop event
    this.tabBar.addEventListener('drop', (e) => {
      // Only handle text drops
      if (e.dataTransfer.types.includes('text/plain')) {
        e.dataTransfer.dropEffect = 'copy';
        
        // Get the dropped text
        const text = e.dataTransfer.getData('text/plain').trim();
        
        if (text) {
          // Create a new tab with the dropped text as search query
          const searchUrl = this.browserState.settings.searchEngine + encodeURIComponent(text);
          this.createNewTab(searchUrl, `Search: ${text}`);
        }
      }
    });

    // Add visual feedback on drag over
    this.tabBar.addEventListener('dragover', (e) => {
      e.dataTransfer.dropEffect = 'copy';
      this.tabBar.style.opacity = '0.8';
      this.tabBar.style.transition = 'opacity 0.2s';
    });

    // Reset styles on drag leave
    this.tabBar.addEventListener('dragleave', () => {
      this.tabBar.style.opacity = '1';
    });
  }

  adjustTabWidths() {
    // Fit all tabs in 80% of window width
    const container = this.tabsContainer;
    const tabs = Array.from(container.querySelectorAll('.tab'));
    if (tabs.length === 0) return;
    const maxWidth = window.innerWidth * 0.8;
    const minTabWidth = 48;
    let tabWidth = Math.floor(maxWidth / tabs.length) - 4; // 4px gap
    let tooFull = false;
    if (tabWidth < minTabWidth) {
      tabWidth = minTabWidth;
      tooFull = true;
    }
    tabs.forEach(tab => {
      tab.style.width = tabWidth + 'px';
      const title = tab.querySelector('.tab-title');
      const favicon = tab.querySelector('.tab-favicon');
      if (title) {
        if (tabWidth <= 80) {
          title.style.display = 'none';
        } else {
          title.style.display = '';
        }
      }
      if (favicon) {
        if (tabWidth <= 70) {
          favicon.style.display = 'none';
        } else {
          favicon.style.display = '';
        }
      }
    });
    if (tooFull) {
      container.classList.add('too-full');
    } else {
      container.classList.remove('too-full');
    }
  }
}

/**
 * UI management
 */
class UIManager {
  constructor(browserState, tabManager) {
    this.browserState = browserState;
    this.tabManager = tabManager;
    this.suggestionsBox = document.getElementById('suggestions-box');
    this.selectedSuggestionIndex = -1;
    this.zoomLevels = new Map(); // Store zoom levels per URL
    this.setupEventListeners();
    this.setupHistorySection();
    this.setupZoomControls();
    this.toggleTheme = tabManager.toggleTheme.bind(tabManager);
    
    // Initialize fullscreen change listener
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
  }

  setupEventListeners() {
    // Navigation buttons
    document.getElementById('back').onclick = () => this.tabManager.goBack();
    document.getElementById('forward').onclick = () => this.tabManager.goForward();
    document.getElementById('refresh').onclick = () => this.tabManager.refresh();

    // Sidebar menu actions
    const sidebar = document.getElementById('global-webview-sidebar');
    sidebar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'toggleTheme') {
        this.toggleTheme();
      }
    });

    // Address bar events
    const addressInput = document.getElementById('address');
    
    addressInput.addEventListener('input', (e) => {
      this.showSuggestions(e.target.value);
    });
    
    addressInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.hideSuggestions();
        this.navigateToAddress();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectSuggestion('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectSuggestion('up');
      } else if (e.key === 'Escape') {
        this.hideSuggestions();
      }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target !== addressInput) {
        this.hideSuggestions();
      }
    });

    // Window control buttons
    document.getElementById('minimize-btn').onclick = () => window.electronAPI?.windowMinimize();
    document.getElementById('maximize-btn').onclick = () => window.electronAPI?.windowMaximize();
    document.getElementById('close-btn').onclick = () => window.electronAPI?.windowClose();

    // Global click listener to close history dropdowns
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('.history-menu')) {
            document.querySelectorAll('.history-menu-content.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
  }

  setupHistorySection() {
    const historyMenuItem = document.querySelector('.menu-item[data-action="history"]');
    const historySection = document.getElementById('history-section');
    const searchInput = document.getElementById('history-search-input');

    // Search listener
    searchInput?.addEventListener('input', () => {
        this.renderHistory(searchInput.value);
    });

    // Show history when the menu item is clicked
    historyMenuItem?.addEventListener('click', () => {
      if(searchInput) {
        searchInput.value = '';
      }
      this.renderHistory();
    });

    // Also render when the section is shown (e.g., via back button)
    const observer = new MutationObserver(() => {
      if (historySection.style.display !== 'none') {
        if(searchInput) {
            searchInput.value = '';
        }
        this.renderHistory();
      } 
    });
    observer.observe(historySection, { attributes: true, attributeFilter: ['style'] });
  }

  createHistoryRow(entry) {
    const row = document.createElement('div');
    row.className = 'history-row';

    const name = document.createElement('span');
    name.className = 'history-title';
    name.textContent = entry.title || entry.url;
    
    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = this.formatTime(entry.date);

    const menuContainer = document.createElement('div');
    menuContainer.className = 'history-menu';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'history-menu-btn';
    menuBtn.innerHTML = '⋮';
    menuContainer.appendChild(menuBtn);

    const menuContent = document.createElement('div');
    menuContent.className = 'history-menu-content';
    
    const openBtn = document.createElement('button');
    openBtn.className = 'history-menu-item';
    openBtn.textContent = 'Open';
    openBtn.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('menuDot').click();
        this.tabManager.createNewTab(entry.url, entry.title);
        document.getElementById('menuDot').click();
        menuContent.classList.remove('show');
    };
    menuContent.appendChild(openBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'history-menu-item history-delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteHistoryEntry(entry);
    };
    menuContent.appendChild(delBtn);
    
    menuContainer.appendChild(menuContent);

    menuBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.history-menu-content.show').forEach(m => {
            if (m !== menuContent) m.classList.remove('show');
        });
        menuContent.classList.toggle('show');
    };

    row.onclick = () => {
        document.getElementById('menuDot').click();
        this.tabManager.createNewTab(entry.url, entry.title);
        document.getElementById('menuDot').click();
    };

    row.appendChild(name);
    row.appendChild(time);
    row.appendChild(menuContainer);

    return row;
  }

  renderHistory(searchQuery = '') {
    const historyDiv = document.getElementById('history');
    if (!historyDiv) return;

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    historyDiv.innerHTML = ''; // Clear previous content

    if (lowerCaseQuery) {
        // --- SEARCH MODE: Render a flat list ---
        const filteredHistory = this.browserState.history.filter(entry => {
            const titleMatch = (entry.title || '').toLowerCase().includes(lowerCaseQuery);
            const urlMatch = (entry.url || '').toLowerCase().includes(lowerCaseQuery);
            const dateMatch = this.formatDate(entry.date).toLowerCase().includes(lowerCaseQuery);
            return titleMatch || urlMatch || dateMatch;
        });

        if (filteredHistory.length === 0) {
            historyDiv.innerHTML = `<div class="history-empty">No results found.</div>`;
            return;
        }

        const table = document.createElement('div');
        table.className = 'history-table';
        filteredHistory.forEach(entry => {
            table.appendChild(this.createHistoryRow(entry));
        });
        historyDiv.appendChild(table);
    } else {
        // --- NORMAL MODE: Render grouped by date ---
        const grouped = this.browserState.getHistoryGroupedByDate(this.browserState.history);

        if (Object.keys(grouped).length === 0) {
            historyDiv.innerHTML = '<div class="history-empty">No browsing history.</div>';
            return;
        }

        Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(date => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'history-date-header';
            dateHeader.textContent = this.formatDate(date);
            historyDiv.appendChild(dateHeader);

            const table = document.createElement('div');
            table.className = 'history-table';
            grouped[date].forEach(entry => {
                table.appendChild(this.createHistoryRow(entry));
            });
            historyDiv.appendChild(table);
        });
    }
  }

  deleteHistoryEntry(entryToDelete) {
    const searchInput = document.getElementById('history-search-input');
    const currentSearch = searchInput ? searchInput.value : '';

    this.browserState.history = this.browserState.history.filter(
      e => e.date !== entryToDelete.date || e.url !== entryToDelete.url
    );
    this.browserState.saveHistory();
    this.renderHistory(currentSearch); // Re-render with the same search query
  }

  formatDate(dateStr) {
    // Format YYYY-MM-DD to readable date
    const today = new Date();
    const date = new Date(dateStr);
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    ) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  }

  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  showSuggestions(query) {
    if (!query) {
      this.hideSuggestions();
      return;
    }

    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Add history matches
    this.browserState.history.forEach(entry => {
      if (entry.title.toLowerCase().includes(lowerQuery) || 
          entry.url.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'history',
          title: entry.title,
          url: entry.url,
          icon: 'history'
        });
      }
    });

    // Add search suggestion if no history matches
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'search',
        title: `Search for "${query}"`,
        url: this.browserState.settings.searchEngine + encodeURIComponent(query),
        icon: 'search'
      });
    }

    this.renderSuggestions(suggestions);
  }

  renderSuggestions(suggestions) {
    const suggestionsBox = document.getElementById('suggestions-box');
    if (!suggestionsBox) return;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    // Store suggestions in the instance for keyboard navigation
    this.suggestions = suggestions;
    suggestionsBox.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = index;
      item.innerHTML = `
        <span class="suggestion-icon">${this.getSuggestionIcon(suggestion.icon)}</span>
        <span class="suggestion-text">${suggestion.title}</span>
        <span class="suggestion-url">${new URL(suggestion.url).hostname}</span>
        <span class="suggestion-type">${suggestion.type}</span>
      `;
      
      item.addEventListener('click', () => this.selectSuggestionItem(suggestion));
      suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = 'block';
    this.selectedSuggestionIndex = -1;
  }

  getSuggestionIcon(iconType) {
    const icons = {
      history: '🕒',
      search: '🔍',
      star: '★',
      globe: '🌐'
    };
    return icons[iconType] || '→';
  }

  selectSuggestion(direction) {
    const items = document.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    // Remove previous selection
    if (this.selectedSuggestionIndex >= 0) {
      items[this.selectedSuggestionIndex].classList.remove('selected');
    }

    // Calculate new index
    if (direction === 'down') {
      this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % items.length;
    } else if (direction === 'up') {
      this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + items.length) % items.length;
    }

    // Apply new selection
    const selectedItem = items[this.selectedSuggestionIndex];
    if (selectedItem) {
      selectedItem.classList.add('selected');
      selectedItem.scrollIntoView({ block: 'nearest' });
      
      // Update address bar with selected suggestion
      const addressInput = document.getElementById('address');
      const suggestionType = selectedItem.querySelector('.suggestion-type').textContent;
      const suggestionUrl = this.suggestions[this.selectedSuggestionIndex]?.url || '';
      
      if (suggestionType === 'search') {
        // For search suggestions, show the query
        const query = decodeURIComponent(suggestionUrl.replace(this.browserState.settings.searchEngine, ''));
        addressInput.value = query;
      } else {
        // For history items, show the full URL
        addressInput.value = suggestionUrl;
      }
    }
  }

  selectSuggestionItem(suggestion) {
    this.hideSuggestions();
    const addressInput = document.getElementById('address');
    
    // For search suggestions, show the decoded query in the address bar
    if (suggestion.type === 'search') {
      const query = decodeURIComponent(suggestion.url.replace(this.browserState.settings.searchEngine, ''));
      addressInput.value = query;
    } else {
      // For history items, show the full URL
      addressInput.value = suggestion.url;
    }
    
    // Decode the URL before navigation to handle encoded characters
    const decodedUrl = decodeURIComponent(suggestion.url);
    this.tabManager.navigateToUrl(decodedUrl);
  }

  hideSuggestions() {
    const suggestionsBox = document.getElementById('suggestions-box');
    if (suggestionsBox) {
      suggestionsBox.style.display = 'none';
    }
    this.selectedSuggestionIndex = -1;
  }

  navigateToAddress() {
    const address = document.getElementById('address').value;
    const url = this.normalizeToUrl(address);
    this.tabManager.navigateToUrl(url);
    this.hideSuggestions();
  }

  normalizeToUrl(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return this.browserState.settings.homePage;

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      return trimmed;
    }

    if (/\./.test(trimmed) || /^localhost(?::\d+)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    return `${this.browserState.settings.searchEngine}${encodeURIComponent(trimmed)}`;
  }

  setupSubMenuScroll() {
    const subMenu = document.querySelector('.sub-menu-section');
    const header = subMenu.querySelector('.sub-menu-header');
    subMenu.addEventListener('scroll', () => {
        if (subMenu.scrollTop > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
  }

  handleFullscreenMouseMove = (e) => {
    const exitBar = document.getElementById('fullscreen-exit-bar');
    if (!exitBar) return;
    
    // Show exit bar when mouse is near the top of the screen
    if (e.clientY < 40) {
      exitBar.classList.add('visible');
      this.hideExitBarTimeout && clearTimeout(this.hideExitBarTimeout);
      this.hideExitBarTimeout = setTimeout(() => {
        exitBar.classList.remove('visible');
      }, 2000);
    }
  }

  handleFullscreenChange() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    const fullscreenBtn = document.querySelector('.zoom-fullscreen');
    const tabBar = document.querySelector('.tab-bar');
    const navBar = document.querySelector('.nav');
    const exitBar = document.getElementById('fullscreen-exit-bar');
    
    if (isFullscreen) {
      // Hide UI elements in fullscreen
      if (tabBar) tabBar.style.display = 'none';
      if (navBar) navBar.style.display = 'none';
      
      // Add click handlers for fullscreen controls
      const exitBtn = document.getElementById('exit-fullscreen-btn');
      const menuDots = document.querySelectorAll('#menuDot');
      const originalMenuDot = document.querySelector('.nav #menuDot');
      const fullscreenMenuDot = document.querySelector('.fullscreen-controls #menuDot');
      
      if (exitBtn) exitBtn.onclick = this.toggleFullscreen.bind(this);
      
      // Handle fullscreen menu button click
      if (fullscreenMenuDot) {
        fullscreenMenuDot.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Check if menu is already open
          const menu = document.querySelector('.menu-container');
          if (menu && menu.style.display === 'block') {
            // If menu is open, close it by triggering click outside
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            document.body.dispatchEvent(clickEvent);
          } else {
            // If menu is closed, open it by clicking the original menu button
            originalMenuDot.click();
          }
          return false;
        };
      }
      
      // Add mousemove event listener when in fullscreen
      document.addEventListener('mousemove', this.handleFullscreenMouseMove);
    } else {
      // Show UI elements when exiting fullscreen
      if (tabBar) tabBar.style.display = '';
      if (navBar) navBar.style.display = '';
      
      // Hide exit bar when exiting fullscreen
      if (exitBar) exitBar.classList.remove('visible');
      
      // Remove mousemove event listener when not in fullscreen
      document.removeEventListener('mousemove', this.handleFullscreenMouseMove);
    }
    
    if (fullscreenBtn) {
      fullscreenBtn.title = isFullscreen ? 'Exit full screen (F11)' : 'Full screen (F11)';
    }
  }

  toggleFullscreen() {
    const tabBar = document.querySelector('.tab-bar');
    const navBar = document.querySelector('.nav');
    const exitBar = document.getElementById('fullscreen-exit-bar');
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // Entering fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.webkitRequestFullscreen();
      }
      // Hide tab bar and nav when entering fullscreen
      if (tabBar) tabBar.style.display = 'none';
      if (navBar) navBar.style.display = 'none';
      
      // Add mousemove event listener when entering fullscreen
      document.addEventListener('mousemove', this.handleFullscreenMouseMove);
    } else {
      // Exiting fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      // Show tab bar and nav when exiting fullscreen
      if (tabBar) tabBar.style.display = '';
      if (navBar) navBar.style.display = '';
      
      // Remove mousemove event listener when exiting fullscreen
      document.removeEventListener('mousemove', this.handleFullscreenMouseMove);
      
      // Hide exit bar
      if (exitBar) exitBar.classList.remove('visible');
    }
  }

  updateZoomForTab(tabId, zoomLevel) {
    if (!tabId) return;
    this.zoomLevels.set(tabId, zoomLevel);
  }

  getZoomForTab(tabId) {
    return this.zoomLevels.get(tabId) ?? 100; // Default to 100%
  }

  setupZoomControls() {
    // Handle mouse wheel zoom with Ctrl/Cmd key
    document.addEventListener('wheel', (e) => {
      // Only zoom when Ctrl or Cmd key is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const webview = this.tabManager.getActiveWebview();
        if (!webview) return;
        
        const tabId = this.tabManager.getActiveTabId();
        let currentZoom = webview.getZoomFactor() * 100;
        
        // Zoom in/out based on scroll direction
        const zoomDelta = e.deltaY > 0 ? -5 : 5;
        const newZoom = Math.max(25, Math.min(500, currentZoom + zoomDelta));
        
        webview.setZoomFactor(newZoom / 100);
        this.updateZoomForTab(tabId, newZoom);
        this.updateZoomLevel(newZoom);
      }
    }, { passive: false });
    
    // Handle zoom in/out buttons
    document.addEventListener('click', (e) => {
      const zoomBtn = e.target.closest('.zoom-btn');
      if (zoomBtn) {
        const webview = this.tabManager.getActiveWebview();
        if (!webview) return;
        
        const tabId = this.tabManager.getActiveTabId();
        let currentZoom = webview.getZoomFactor() * 100;
        
        if (zoomBtn.dataset.zoom === 'in') {
          currentZoom = Math.min(currentZoom + 10, 500); // Max zoom 500%
        } else if (zoomBtn.dataset.zoom === 'out') {
          currentZoom = Math.max(currentZoom - 10, 25); // Min zoom 25%
        }
        
        webview.setZoomFactor(currentZoom / 100);
        this.updateZoomForTab(tabId, currentZoom);
        this.updateZoomLevel(currentZoom);
      } else if (e.target.closest('.zoom-fullscreen')) {
        this.toggleFullscreen();
      }
    });
    
    // Handle manual zoom level input
    const zoomInput = document.querySelector('.zoom-level-input');
    if (zoomInput) {
      zoomInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 100;
        value = Math.min(500, Math.max(25, value)); // Clamp between 25% and 500%
        
        const webview = this.tabManager.getActiveWebview();
        if (webview) {
          const tabId = this.tabManager.getActiveTabId();
          webview.setZoomFactor(value / 100);
          this.updateZoomForTab(tabId, value);
          this.updateZoomLevel(value);
        }
      });
      
      zoomInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    }
    
    // Listen for F11 key for fullscreen
    document.addEventListener('keydown', (e) => {
      // F11 - Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
      // Ctrl+Shift+I - Open developer tools
      else if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        const activeTab = this.browserState.getActiveTab();
        if (activeTab) {
          const webview = this.tabManager.getWebview(activeTab.id);
          if (webview) {
            webview.openDevTools();
          }
        }
      }
      // Ctrl+T - New Tab
      else if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        this.tabManager.createNewTab();
        // Close the sidebar after creating a new tab
        sidebar.classList.remove('open');
        const activeTab = this.browserState.getActiveTab();
        if (activeTab) {
          const webviewData = this.tabManager.webviews.get(activeTab.id);
          if (webviewData) {
            webviewData.container.classList.remove('sidebar-open');
          }
        }
      }
      // Ctrl+N - New Window
      else if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        if (window.electronAPI && window.electronAPI.newWindow) {
          window.electronAPI.newWindow();
        }
      }
      // Ctrl+Shift+N - New Incognito Window
      else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (window.electronAPI && window.electronAPI.newIncognitoWindow) {
          window.electronAPI.newIncognitoWindow();
        }
      }
      else if (e.ctrlKey) {
        document.body.classList.add('zoom-mode');
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (!e.ctrlKey) {
        document.body.classList.remove('zoom-mode');
      }
    });
    
    // Update zoom level when tab changes or URL changes within tab
    this.tabManager.on('tab-changed', (tabId) => {
      const webview = this.tabManager.getWebview(tabId);
      if (webview) {
        // Get or initialize zoom level for this tab
        let savedZoom = this.getZoomForTab(tabId);
        if (savedZoom === 100) {
          // If this is first time, check if we have a saved zoom for this tab
          savedZoom = this.getZoomForTab(tabId);
        }
        
        // Wait for webview to be ready
        const setZoom = () => {
          try {
            if (webview.getWebContentsId) {
              webview.setZoomFactor(savedZoom / 100);
              this.updateZoomLevel(savedZoom);
            } else {
              setTimeout(setZoom, 100);
            }
          } catch (e) {
            setTimeout(setZoom, 100);
          }
        };
        setZoom();
        
        // Update zoom when URL changes within the same tab
        const onNavigation = (e) => {
          // Keep the same zoom level for all navigations within this tab
          const currentZoom = this.getZoomForTab(tabId);
          webview.setZoomFactor(currentZoom / 100);
          this.updateZoomLevel(currentZoom);
        };
        
        // Remove any existing listeners to prevent duplicates
        webview.removeEventListener('did-navigate', onNavigation);
        webview.addEventListener('did-navigate', onNavigation);
      }
    });
    
    // Handle new tab creation
    this.tabManager.on('tab-created', (tabId) => {
      const webview = this.tabManager.getWebview(tabId);
      if (webview) {
        // Initialize zoom level for this tab
        this.updateZoomForTab(tabId, 100);
        
        // Set default zoom for new tabs
        const setInitialZoom = () => {
          try {
            if (webview.getWebContentsId) {
              webview.setZoomFactor(1.0);
              this.updateZoomLevel(100);
            } else {
              setTimeout(setInitialZoom, 100);
            }
          } catch (e) {
            setTimeout(setInitialZoom, 100);
          }
        };
        setInitialZoom();
      }
    });
  }
  
  updateZoomLevel(percent) {
    const zoomInput = document.querySelector('.zoom-level-input');
    if (zoomInput) {
      zoomInput.value = Math.round(percent);
    }
  }
}



window.electronAPI.getHistory().then(history => {
  console.log('Download History:', history);

  // Display in downloads list
  const list = document.getElementById('downloads');
  list.innerHTML = ''; // Clear existing items
  
  if (history.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'downloads-empty';
    emptyState.textContent = 'No downloads yet';
    list.appendChild(emptyState);
    return;
  }

  history.forEach(download => {
    const item = document.createElement('div');
    item.className = 'download-item';
    
    const details = document.createElement('div');
    details.className = 'download-details';
    
    const name = document.createElement('div');
    name.className = 'download-name';
    name.textContent = download.name;
    
    const meta = document.createElement('div');
    meta.className = 'download-meta';
    
    const size = document.createElement('span');
    size.className = 'download-size';
    size.textContent = formatFileSize(download.size);
    
    const time = document.createElement('span');
    time.className = 'download-time';
    time.textContent = new Date(download.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    meta.appendChild(size);
    meta.appendChild(time);
    
    details.appendChild(name);
    details.appendChild(meta);
    
    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'download-actions';
    
    // Open folder button
    const folderBtn = document.createElement('button');
    folderBtn.className = 'download-action folder-btn';
    folderBtn.title = 'Show in folder';
    folderBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    folderBtn.onclick = async (e) => {
      e.stopPropagation();
      if (download.path) {
        const result = await window.electronAPI.showItemInFolder(download.path);
        if (!result.success) {
          console.error('Failed to show item in folder:', result.error);
          // Optional: Show error message to user
          alert(`Could not find the file. It may have been moved or deleted.`);
        }
      } else {
        console.error('No file path available for this download');
        // Optional: Show message to user
        alert('File location is not available for this download.');
      }
    };
    
    // Disable folder button if no path is available
    if (!download.path) {
      folderBtn.disabled = true;
      folderBtn.style.opacity = '0.5';
      folderBtn.style.cursor = 'not-allowed';
      folderBtn.title = 'File location not available';
    }
    
    // Menu button (3 dots)
    const menuBtn = document.createElement('button');
    menuBtn.className = 'download-action menu-btn';
    menuBtn.title = 'More options';
    menuBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
      </svg>
    `;
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      // TODO: Implement menu actions
      console.log('Menu clicked for:', download.name);
    };
    
    actions.appendChild(folderBtn);
    actions.appendChild(menuBtn);
    
    item.appendChild(details);
    item.appendChild(actions);
    
    list.appendChild(item);
  });
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}






/**
 * Initialize the browser
 */
// Listen for window type changes
if (window.electronAPI) {
    window.electronAPI.onWindowType((event, windowType) => {
        if (windowType === 'incognito') {
            document.documentElement.classList.add('incognito-window');
        } else {
            document.documentElement.classList.remove('incognito-window');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const browserState = new BrowserState();
  const tabManager = new TabManager(browserState);
  const uiManager = new UIManager(browserState, tabManager);

  // Listen for new tab requests from main process
  if (window.electronAPI) {
    window.electronAPI.onOpenNewTab((event, url) => {
      // Close sidebar if open
      const sidebar = document.getElementById('global-webview-sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        // Remove sidebar-open from all webview-containers
        document.querySelectorAll('.webview-container').forEach(container => {
          container.classList.remove('sidebar-open');
        });
      }
      // Create new tab
      tabManager.createNewTab(url);
    });
  }

  // Apply theme
  tabManager.applyTheme();

  // Create initial tab
  tabManager.createNewTab();

  // Expose for debugging
  window.browserState = browserState;
  window.tabManager = tabManager;

  // --- Maximize/Restore icon logic ---
  const maximizeBtn = document.getElementById('maximize-btn');
  const maximizeIcon = maximizeBtn.querySelector('svg');

  // Helper to set icon
  function setMaximizeIcon(isMaximized) {
    if (isMaximized) {
      // Restore icon (two overlapping squares)
      maximizeIcon.innerHTML = '<rect x="3" y="5" width="6" height="4" rx="1" stroke="currentColor" fill="none"/><rect x="5" y="3" width="4" height="4" rx="1" stroke="currentColor" fill="none"/>';
    } else {
      // Maximize icon (single square)
      maximizeIcon.innerHTML = '<rect x="2.5" y="2.5" width="7" height="7" rx="1" stroke="currentColor" fill="none"/>';
    }
  }

  // Listen for maximize/unmaximize events from main process
  if (window.electronAPI && window.electronAPI.onWindowMaximizeChanged) {
    window.electronAPI.onWindowMaximizeChanged((event, isMaximized) => {
      setMaximizeIcon(isMaximized);
    });
  }

  // Initial state: ask main process if maximized
  if (window.electronAPI && window.electronAPI.isWindowMaximized) {
    window.electronAPI.isWindowMaximized().then(setMaximizeIcon);
  }

  // Also update icon on click (toggle)
  maximizeBtn.addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.isWindow_maximized) {
      setTimeout(() => {
        window.electronAPI.isWindowMaximized().then(setMaximizeIcon);
      }, 200);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const menuSection = document.querySelector(".menu-section");
  const subMenuSection = document.querySelector(".sub-menu-section");
  const backButton = document.getElementById("back-to-menu");
  const subMenuTitle = document.getElementById("sub-menu-title");
  const historySearchInput = document.getElementById("history-search-input");

  const subSections = subMenuSection.querySelectorAll("div[id$='-section']");
  subSections.forEach(sec => sec.style.display = "none");
  subMenuSection.style.display = "none";

  // Handle menu clicks
  document.querySelectorAll(".menu-item").forEach(item => {
      item.addEventListener("click", () => {
          const action = item.dataset.action;
          const targetSection = document.getElementById(action + "-section");

          if (targetSection) {
              // Case 1: It's a submenu item
              menuSection.style.display = "none";
              subMenuSection.style.display = "block";
              subMenuTitle.textContent = item.textContent.replace(/<span.*$/,'').trim();

              if (action === 'history') {
                historySearchInput.style.display = 'block';
              } else {
                historySearchInput.style.display = 'none';
              }

              subSections.forEach(sec => sec.style.display = "none");
              targetSection.style.display = "block";
          } else {
              // Case 2: It's a direct function
              switch (action) {
                  case "newTab": 
                    document.getElementById('menuDot').click(); 
                    tabManager.createNewTab(); 
                    document.getElementById('menuDot').click(); 
                    break;
                  case "newWindow":
                    window.electronAPI?.newWindow();
                    break;
                  case "newIncognito":
                    window.electronAPI?.newIncognitoWindow();
                    break;
                  case "devTools":
                    const activeTab = browserState.getActiveTab();
                    if (activeTab) {
                      const webview = tabManager.getWebview(activeTab.id);
                      if (webview) {
                        webview.openDevTools();
                      }
                    }
                    break;
                  // Add more menu actions here
              }
          }
      });
  });

  // Back button
  backButton.addEventListener("click", () => {
      subSections.forEach(sec => sec.style.display = "none");
      subMenuSection.style.display = "none";
      menuSection.style.display = "block";
      historySearchInput.style.display = 'none';
  });
});