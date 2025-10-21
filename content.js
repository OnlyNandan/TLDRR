class TDLRR {
  constructor() {
    this.settings = {
      autoTranslate: true,
      showTLDR: true,
      showELI5: false,
      darkMode: false
    };
    this.apiKey = null;
    this.processedElements = new Set();
    this.overlayContainer = null;
    this.toolbar = null;
    this.isInitialized = false;
    
    this.detectDarkMode();
    this.init();
  }
  
  detectDarkMode() {
    const body = document.body;
    const html = document.documentElement;
    
    const isDark = body.classList.contains('dark') || 
                   html.classList.contains('dark') ||
                   body.getAttribute('data-theme') === 'dark' ||
                   window.getComputedStyle(body).backgroundColor.includes('rgb(26, 26, 27)') ||
                   window.getComputedStyle(body).backgroundColor.includes('rgb(1, 1, 1)');
    
    this.settings.darkMode = isDark;
    console.log('TDLRR: Dark mode detected:', isDark);
  }
  
  async init() {
    await this.loadSettings();
    this.createOverlayContainer();
    this.setupObservers();
    this.processExistingContent();
    this.isInitialized = true;
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'autoTranslate',
        'showTLDR',
        'showELI5',
        'darkMode',
        'apiKey'
      ]);
      
      this.settings = {
        autoTranslate: result.autoTranslate ?? true,
        showTLDR: result.showTLDR ?? true,
        showELI5: result.showELI5 ?? false,
        darkMode: result.darkMode ?? false
      };
      
      this.apiKey = result.apiKey;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  createOverlayContainer() {
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'tdlrr-overlay-container';
    this.overlayContainer.className = 'tdlrr-overlay-container';
    document.body.appendChild(this.overlayContainer);
  }
  
  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'tdlrr-toolbar';
    this.toolbar.className = `tdlrr-toolbar ${this.settings.darkMode ? 'dark' : ''}`;
    this.toolbar.innerHTML = `
      <div class="tdlrr-toolbar-content">
        <button id="tdlrr-tldr-btn" class="tdlrr-btn active" title="TL;DR Summary">
          <span>📝</span>
        </button>
        <button id="tdlrr-translate-btn" class="tdlrr-btn" title="Translate to English">
          <span>🌐</span>
        </button>
        <button id="tdlrr-eli5-btn" class="tdlrr-btn" title="Explain Like I'm 5">
          <span>🧒</span>
        </button>
        <button id="tdlrr-format-btn" class="tdlrr-btn" title="Format & Clean Text">
          <span>✨</span>
        </button>
        <button id="tdlrr-side-by-side-btn" class="tdlrr-btn" title="Toggle Side-by-Side View">
          <span>⚡</span>
        </button>
        <button id="tdlrr-close-btn" class="tdlrr-btn" title="Close Toolbar">
          <span>✕</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(this.toolbar);
    this.setupToolbarEvents();
    console.log('TDLRR: Toolbar created with dark mode:', this.settings.darkMode);
  }
  
  setupToolbarEvents() {
    const buttons = {
      'tdlrr-translate-btn': () => this.toggleTranslation(),
      'tdlrr-tldr-btn': () => this.toggleTLDR(),
      'tdlrr-eli5-btn': () => this.toggleELI5(),
      'tdlrr-format-btn': () => this.toggleFormatting(),
      'tdlrr-side-by-side-btn': () => this.toggleSideBySide(),
      'tdlrr-close-btn': () => this.hideToolbar()
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', handler);
      } else {
        console.warn(`TDLRR: Button ${id} not found`);
      }
    });
  }
  
  setupObservers() {
    const contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNewContent(node);
          }
        });
      });
    });
    
    contentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  processExistingContent() {
    const posts = document.querySelectorAll('shreddit-post');
    posts.forEach(post => {
      this.addControlsToPost(post);
    });
    
    const comments = document.querySelectorAll('shreddit-comment');
    comments.forEach(comment => {
      this.addControlsToComment(comment);
    });
    
    this.addThreadSummarizer();
  }
  
  processNewContent(node) {
    if (node.matches && node.matches('shreddit-post')) {
      this.addControlsToPost(node);
    }
    if (node.matches && node.matches('shreddit-comment')) {
      this.addControlsToComment(node);
    }
    
    if (node.querySelectorAll) {
      const posts = node.querySelectorAll('shreddit-post');
      posts.forEach(post => this.addControlsToPost(post));
      
      const comments = node.querySelectorAll('shreddit-comment');
      comments.forEach(comment => this.addControlsToComment(comment));
    }
  }
  
  addControlsToPost(post) {
    if (post.querySelector('.tdlrr-inline-controls')) {
      return;
    }
    
    const shareButton = post.querySelector('[slot="ssr-share-button"]') || 
                       post.querySelector('.share-dropdown-menu');
    
    if (!shareButton) {
      return;
    }
    
    const controls = document.createElement('div');
    controls.className = 'tdlrr-inline-controls';
    controls.innerHTML = `
      <button class="tdlrr-inline-btn" data-action="tldr" title="TL;DR Summary">
        <span class="tdlrr-icon">📝</span>
        <span class="tdlrr-label">TL;DR</span>
      </button>
      <button class="tdlrr-inline-btn" data-action="eli5" title="Explain Like I'm 5">
        <span class="tdlrr-icon">🧒</span>
        <span class="tdlrr-label">ELI5</span>
      </button>
      <button class="tdlrr-inline-btn" data-action="translate" title="Translate">
        <span class="tdlrr-icon">🌐</span>
        <span class="tdlrr-label">Translate</span>
      </button>
      <button class="tdlrr-inline-btn" data-action="thread-tldr" title="TL;DR of entire thread">
        <span class="tdlrr-icon">📊</span>
        <span class="tdlrr-label">TL;DR ALL</span>
      </button>
    `;
    
    shareButton.parentNode.insertBefore(controls, shareButton.nextSibling);
    
    controls.addEventListener('click', (e) => {
      const button = e.target.closest('.tdlrr-inline-btn');
      if (button) {
        const action = button.dataset.action;
        if (action === 'thread-tldr') {
          this.handleThreadSummarize(button);
        } else {
          const text = post.textContent.trim();
          this.handleElementActionInline(post, action, button);
        }
      }
    });
  }
  
  addControlsToComment(comment) {
    if (comment.querySelector('.tdlrr-inline-controls')) {
      return;
    }
    
    const actionBar = comment.querySelector('.comment-actions') || 
                     comment.querySelector('[slot="comment-actions"]') ||
                     comment.querySelector('.comment-footer');
    
    if (!actionBar) {
      return;
    }
    
    const controls = document.createElement('div');
    controls.className = 'tdlrr-inline-controls';
    controls.innerHTML = `
      <button class="tdlrr-inline-btn" data-action="tldr" title="TL;DR Summary">
        <span class="tdlrr-icon">📝</span>
        <span class="tdlrr-label">TL;DR</span>
      </button>
      <button class="tdlrr-inline-btn" data-action="translate" title="Translate">
        <span class="tdlrr-icon">🌐</span>
        <span class="tdlrr-label">Translate</span>
      </button>
    `;
    
    actionBar.appendChild(controls);
    
    controls.addEventListener('click', (e) => {
      const button = e.target.closest('.tdlrr-inline-btn');
      if (button) {
        const action = button.dataset.action;
        if (action) {
          const text = comment.textContent.trim();
          this.handleElementActionInline(comment, action, button);
        }
      }
    });
  }
  
  containsHindiOrHinglish(text) {
    const hindiRegex = /[\u0900-\u097F]/;
    
    const hinglishPatterns = [
      /acha|accha|bhai|yaar|bro|dude|wtf|omg|lol|haha|hehe/i,
      /kya|kyun|kab|kaise|kahan|kisko|kisne|kisko/i,
      /main|mera|mere|meri|ham|hamara|hamare|hamari/i,
      /tum|tumhara|tumhare|tumhari|aap|aapka|aapke|aapki/i,
      /ho|hai|hain|tha|the|thi|thi|raha|rahi|rahe/i
    ];
    
    return hindiRegex.test(text) || hinglishPatterns.some(pattern => pattern.test(text));
  }
  
  
  addThreadSummarizer() {
    const isPostPage = window.location.pathname.includes('/comments/');
    if (!isPostPage) {
      const existing = document.getElementById('tdlrr-thread-summarizer');
      if (existing) existing.remove();
      return;
    }

    let summarizer = document.getElementById('tdlrr-thread-summarizer');
    if (summarizer) {
      return;
    }

    summarizer = document.createElement('div');
    summarizer.id = 'tdlrr-thread-summarizer';
    summarizer.innerHTML = `
      <button id="tdlrr-summarize-thread-btn" class="tdlrr-summarize-thread-btn">
        <span class="tdlrr-summarize-icon">📊</span>
        <span class="tdlrr-summarize-text">Summarize Thread</span>
      </button>
    `;

    document.body.appendChild(summarizer);

    const button = summarizer.querySelector('#tdlrr-summarize-thread-btn');
    button.addEventListener('click', () => this.handleThreadSummarize());

    this.setupMediaDetection();
  }

  setupMediaDetection() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const lightbox = document.querySelector('shreddit-media-lightbox');
          const summarizer = document.getElementById('tdlrr-thread-summarizer');

          if (lightbox && summarizer) {
            const isOpen = lightbox.style.display !== 'none' ||
                          lightbox.classList.contains('visible') ||
                          lightbox.offsetHeight > 0;

            if (isOpen) {
              summarizer.style.display = 'none';
            } else {
              summarizer.style.display = '';
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  async summarizeThread() {
    const postElement = document.querySelector('shreddit-post');
    let postContent = '';
    
    if (postElement) {
      const postText = postElement.querySelector('[slot="text-body"]') || 
                      postElement.querySelector('.usertext-body') ||
                      postElement.querySelector('.md');
      postContent = postText ? postText.textContent.trim() : postElement.textContent.trim();
    }
    
    const comments = Array.from(document.querySelectorAll('shreddit-comment'))
      .map(comment => {
        const commentText = comment.querySelector('[slot="text-body"]') || 
                           comment.querySelector('.usertext-body') ||
                           comment.querySelector('.md');
        return commentText ? commentText.textContent.trim() : comment.textContent.trim();
      })
      .filter(t => t.length > 20)
      .slice(0, 50); // Limit to first 50 comments
    
    const fullText = `Post: ${postContent}\n\nComments:\n${comments.join('\n\n')}`;
    
    try {
      const result = await this.sendTranslationRequest(fullText, 'thread-tldr');
      return result;
    } catch (error) {
      console.error('Thread summarization error:', error);
      return { success: false, error: 'Failed to generate summary' };
    }
  }
  
  async handleThreadSummarize(button) {
    this.closeAllResultBoxes();
    
    if (button) {
      button.classList.add('loading');
      button.disabled = true;
    }
    
    try {
      const result = await this.summarizeThread();
      if (button) {
        button.classList.remove('loading');
        button.disabled = false;
      }
      
      if (result && result.success) {
        this.showThreadSummary(result.data);
      } else {
        this.showThreadSummary('Could not generate thread summary. Please ensure your API key is configured.');
      }
    } catch (error) {
      if (button) {
        button.classList.remove('loading');
        button.disabled = false;
      }
      this.showThreadSummary('Error generating thread summary. Please try again.');
    }
  }
  
  showThreadSummaryLoading() {
    const existing = document.getElementById('tdlrr-thread-summary-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'tdlrr-thread-summary-modal';
    modal.className = 'tdlrr-modal';
    modal.innerHTML = `
      <div class="tdlrr-modal-content">
        <div class="tdlrr-modal-header">
          <h3>Thread Summary</h3>
        </div>
        <div class="tdlrr-modal-body">
          <div class="tdlrr-loading">
            <div class="tdlrr-spinner"></div>
            <p>Analyzing thread...</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  hideThreadSummaryLoading() {
  }
  
  showThreadSummary(summary) {
    const existing = document.getElementById('tdlrr-thread-summary-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'tdlrr-thread-summary-modal';
    modal.className = `tdlrr-modal ${this.settings.darkMode ? 'dark' : ''}`;
    modal.innerHTML = `
      <div class="tdlrr-modal-content">
        <div class="tdlrr-modal-header">
          <h3>📊 Thread Summary</h3>
          <button class="tdlrr-modal-close">✕</button>
        </div>
        <div class="tdlrr-modal-body">
          <p>${summary}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.tdlrr-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  async handleElementActionInline(element, action, button) {
    let text = '';
    
    if (element.tagName === 'SHREDDIT-POST') {
      const postText = element.querySelector('[slot="text-body"]') || 
                      element.querySelector('.usertext-body') ||
                      element.querySelector('.md');
      text = postText ? postText.textContent.trim() : element.textContent.trim();
    } else if (element.tagName === 'SHREDDIT-COMMENT') {
      const commentText = element.querySelector('[slot="text-body"]') || 
                         element.querySelector('.usertext-body') ||
                         element.querySelector('.md');
      text = commentText ? commentText.textContent.trim() : element.textContent.trim();
    } else {
      text = element.textContent.trim();
    }
    
    this.closeAllResultBoxes();
    
    button.classList.add('loading');
    button.disabled = true;
    
    if (action === 'tldr') {
      try {
        const result = await this.sendTranslationRequest(text, action);
        button.classList.remove('loading');
        button.disabled = false;
        if (result.success) {
          this.showInlineResult(button, result.data, action);
        } else {
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
          const summary = sentences.slice(0, 3).join('. ') + '.';
          this.showInlineResult(button, summary, action);
        }
      } catch (error) {
        button.classList.remove('loading');
        button.disabled = false;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const summary = sentences.slice(0, 3).join('. ') + '.';
        this.showInlineResult(button, summary, action);
      }
      return;
    }
    
    try {
      const result = await this.sendTranslationRequest(text, action);
      button.classList.remove('loading');
      button.disabled = false;
      if (result.success) {
        this.showInlineResult(button, result.data, action);
      } else {
        this.showInlineResult(button, result.error || 'Failed to process. Please check your API key.', 'error');
      }
    } catch (error) {
      button.classList.remove('loading');
      button.disabled = false;
      this.showInlineResult(button, 'Error processing request. Please try again.', 'error');
    }
  }
  
  showInlineResult(button, content, type) {
    const controls = button.closest('.tdlrr-inline-controls');
    if (!controls) return;
    
    const resultBox = document.createElement('div');
    resultBox.className = `tdlrr-result-box tdlrr-result-${type} ${this.settings.darkMode ? 'dark' : ''}`;
    resultBox.innerHTML = `
      <div class="tdlrr-result-header">
        <span class="tdlrr-result-type">${this.getTypeLabel(type)}</span>
        <button class="tdlrr-result-close">✕</button>
      </div>
      <div class="tdlrr-result-content">
        ${content}
      </div>
    `;
    
    controls.parentElement.insertBefore(resultBox, controls.nextSibling);
    
    setTimeout(() => resultBox.classList.add('visible'), 10);
    
    resultBox.querySelector('.tdlrr-result-close').addEventListener('click', () => {
      resultBox.classList.remove('visible');
      setTimeout(() => resultBox.remove(), 300);
    });
    
    setTimeout(() => {
      if (resultBox.parentNode) {
        resultBox.classList.remove('visible');
        setTimeout(() => resultBox.remove(), 300);
      }
    }, 30000);
  }
  
  closeAllResultBoxes() {
    document.querySelectorAll('.tdlrr-result-box').forEach(box => {
      box.classList.remove('visible');
      setTimeout(() => box.remove(), 300);
    });
  }
  
  
  async sendTranslationRequest(text, type) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'translateText',
        text: text,
        type: type
      }, (response) => {
        resolve(response);
      });
    });
  }
  
  
  getTypeLabel(type) {
    const labels = {
      translate: 'Translation',
      tldr: 'TL;DR',
      eli5: 'ELI5',
      'thread-tldr': 'Thread TL;DR',
      format: 'Formatted'
    };
    return labels[type] || 'Translation';
  }
  
  showError(element, message) {
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'tdlrr-error-overlay';
    errorOverlay.textContent = message;
    
    const rect = element.getBoundingClientRect();
    errorOverlay.style.position = 'absolute';
    errorOverlay.style.top = `${rect.top + window.scrollY}px`;
    errorOverlay.style.left = `${rect.left}px`;
    errorOverlay.style.width = `${rect.width}px`;
    errorOverlay.style.zIndex = '10000';
    
    this.overlayContainer.appendChild(errorOverlay);
    
    setTimeout(() => {
      if (errorOverlay.parentNode) {
        errorOverlay.remove();
      }
    }, 5000);
  }
  
  toggleTranslation() {
    this.settings.autoTranslate = !this.settings.autoTranslate;
    this.updateToolbarState();
  }
  
  toggleTLDR() {
    this.settings.showTLDR = !this.settings.showTLDR;
    this.updateToolbarState();
  }
  
  toggleELI5() {
    this.settings.showELI5 = !this.settings.showELI5;
    this.updateToolbarState();
  }
  
  toggleFormatting() {
    this.updateToolbarState();
  }
  
  toggleSideBySide() {
    this.updateToolbarState();
  }
  
  hideToolbar() {
    this.toolbar.style.display = 'none';
  }
  
  updateToolbarState() {
    const buttons = {
      'tdlrr-translate-btn': this.settings.autoTranslate,
      'tdlrr-tldr-btn': this.settings.showTLDR,
      'tdlrr-eli5-btn': this.settings.showELI5
    };
    
    Object.entries(buttons).forEach(([id, isActive]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.toggle('active', isActive);
      }
    });
  }
  
  showLoadingIndicator(element) {
    const loader = document.createElement('div');
    loader.className = 'tdlrr-loading';
    loader.innerHTML = '<div class="tdlrr-spinner"></div>';
    loader.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10001;
      background: rgba(255, 255, 255, 0.9);
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    element.style.position = 'relative';
    element.appendChild(loader);
  }
  
  hideLoadingIndicator(element) {
    const loader = element.querySelector('.tdlrr-loading');
    if (loader) {
      loader.remove();
    }
  }
}

console.log('TDLRR: Content script loaded on:', window.location.href);

function initializeTDLRR() {
  console.log('TDLRR: Initializing...');
  try {
    window.tdlrr = new TDLRR();
    console.log('TDLRR: Successfully initialized');
  } catch (error) {
    console.error('TDLRR: Initialization failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTDLRR);
} else {
  setTimeout(initializeTDLRR, 100);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    if (window.tdlrr) {
      window.tdlrr.loadSettings();
      window.tdlrr.updateToolbarState();
    }
  }
});
