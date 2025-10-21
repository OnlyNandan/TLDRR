document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
  document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
  
  updateStatus();
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiKey']);
    document.getElementById('apiKey').value = result.apiKey ?? '';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveApiKey() {
  try {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
      showNotification('Please enter a valid API key', 'error');
      return;
    }
    
    await chrome.storage.sync.set({ apiKey });
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url.includes('reddit.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'apiKeyUpdated', apiKey });
    }
    
    updateStatus();
    showNotification('API key saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving API key:', error);
    showNotification('Error saving API key. Please try again.', 'error');
  }
}


function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById('apiKey');
  const toggleBtn = document.getElementById('toggleApiKey');
  
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    toggleBtn.textContent = '👁️';
  }
}

async function updateStatus() {
  try {
    const result = await chrome.storage.sync.get(['apiKey']);
    const statusElement = document.getElementById('extensionStatus');
    
    if (result.apiKey) {
      statusElement.textContent = '✅ Active';
      statusElement.style.color = '#4caf50';
    } else {
      statusElement.textContent = '⚠️ API Key Required';
      statusElement.style.color = '#ff9800';
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
