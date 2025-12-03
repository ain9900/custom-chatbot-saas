(function() {
  'use strict';

  // Widget configuration
  const WIDGET_CONFIG = {
    webhookKey: null,
    apiBaseUrl: null,
    position: 'bottom-right',
    primaryColor: '#2563eb',
    textColor: '#ffffff',
    buttonText: 'Chat',
    placeholder: 'Type your message...',
    title: 'Chat with us'
  };

  // Initialize widget
  function initWidget(config) {
    WIDGET_CONFIG.webhookKey = config.webhookKey || WIDGET_CONFIG.webhookKey;
    WIDGET_CONFIG.apiBaseUrl = config.apiBaseUrl || WIDGET_CONFIG.apiBaseUrl;
    if (config.primaryColor) WIDGET_CONFIG.primaryColor = config.primaryColor;
    if (config.textColor) WIDGET_CONFIG.textColor = config.textColor;
    if (config.buttonText) WIDGET_CONFIG.buttonText = config.buttonText;
    if (config.placeholder) WIDGET_CONFIG.placeholder = config.placeholder;
    if (config.title) WIDGET_CONFIG.title = config.title;

    if (!WIDGET_CONFIG.webhookKey || !WIDGET_CONFIG.apiBaseUrl) {
      console.error('Chatbot Widget: webhookKey and apiBaseUrl are required');
      return;
    }

    createWidget();
  }

  // Create widget HTML
  function createWidget() {
    // Remove existing widget if any
    const existing = document.getElementById('chatbot-widget-container');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    document.body.appendChild(container);

    // Inject styles
    injectStyles();

    // Create chat button
    const chatButton = createChatButton();
    container.appendChild(chatButton);

    // Create chat window
    const chatWindow = createChatWindow();
    container.appendChild(chatWindow);

    // Event listeners
    chatButton.addEventListener('click', () => toggleChatWindow(chatWindow));
  }

  // Create chat button
  function createChatButton() {
    const button = document.createElement('div');
    button.id = 'chatbot-widget-button';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>${WIDGET_CONFIG.buttonText}</span>
    `;
    return button;
  }

  // Create chat window
  function createChatWindow() {
    const window = document.createElement('div');
    window.id = 'chatbot-widget-window';
    window.innerHTML = `
      <div class="chatbot-widget-header">
        <div class="chatbot-widget-header-content">
          <h3>${WIDGET_CONFIG.title}</h3>
          <button class="chatbot-widget-close" aria-label="Close chat">×</button>
        </div>
      </div>
      <div class="chatbot-widget-messages" id="chatbot-widget-messages"></div>
      <div class="chatbot-widget-input-container">
        <input 
          type="text" 
          id="chatbot-widget-input" 
          placeholder="${WIDGET_CONFIG.placeholder}"
          autocomplete="off"
        />
        <button id="chatbot-widget-send">Send</button>
      </div>
    `;
    
    // Event listeners
    const closeBtn = window.querySelector('.chatbot-widget-close');
    const sendBtn = window.querySelector('#chatbot-widget-send');
    const input = window.querySelector('#chatbot-widget-input');
    
    closeBtn.addEventListener('click', () => toggleChatWindow(window));
    sendBtn.addEventListener('click', () => sendMessage(input, window));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage(input, window);
    });

    return window;
  }

  // Toggle chat window
  function toggleChatWindow(chatWindow) {
    const isOpen = chatWindow.classList.contains('chatbot-widget-open');
    if (isOpen) {
      chatWindow.classList.remove('chatbot-widget-open');
      document.getElementById('chatbot-widget-button').classList.remove('chatbot-widget-hidden');
    } else {
      chatWindow.classList.add('chatbot-widget-open');
      document.getElementById('chatbot-widget-button').classList.add('chatbot-widget-hidden');
    }
  }

  // Send message
  function sendMessage(input, chatWindow) {
    const message = input.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage('user', message, chatWindow);
    input.value = '';
    input.disabled = true;

    // Show typing indicator
    const typingId = addMessage('assistant', '...', chatWindow, true);

    // Generate unique sender ID
    const senderId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Send to backend
    fetch(`${WIDGET_CONFIG.apiBaseUrl}/chatbot/webhook/${WIDGET_CONFIG.webhookKey}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        sender_id: senderId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      // Add assistant response
      addMessage('assistant', data.reply || data.message || 'Sorry, I encountered an error.', chatWindow);
      input.disabled = false;
      input.focus();
    })
    .catch(error => {
      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      // Show error
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.', chatWindow);
      input.disabled = false;
      input.focus();
      console.error('Chatbot Widget Error:', error);
    });
  }

  // Add message to chat
  function addMessage(role, text, chatWindow, isTyping = false) {
    const messagesContainer = chatWindow.querySelector('#chatbot-widget-messages');
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const messageEl = document.createElement('div');
    messageEl.id = messageId;
    messageEl.className = `chatbot-widget-message chatbot-widget-message-${role}`;
    
    if (isTyping) {
      messageEl.innerHTML = '<div class="chatbot-widget-typing"><span></span><span></span><span></span></div>';
    } else {
      messageEl.textContent = text;
    }
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
  }

  // Inject CSS styles
  function injectStyles() {
    if (document.getElementById('chatbot-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'chatbot-widget-styles';
    style.textContent = `
      #chatbot-widget-container {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      #chatbot-widget-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: ${WIDGET_CONFIG.primaryColor};
        color: ${WIDGET_CONFIG.textColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 10000;
      }

      #chatbot-widget-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      #chatbot-widget-button.chatbot-widget-hidden {
        display: none;
      }

      #chatbot-widget-button svg {
        width: 24px;
        height: 24px;
      }

      #chatbot-widget-button span {
        display: none;
      }

      #chatbot-widget-window {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 40px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        transform: translateY(100%) scale(0.8);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s, opacity 0.3s;
        z-index: 10001;
      }

      #chatbot-widget-window.chatbot-widget-open {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: all;
      }

      .chatbot-widget-header {
        background: ${WIDGET_CONFIG.primaryColor};
        color: ${WIDGET_CONFIG.textColor};
        padding: 16px 20px;
        border-radius: 12px 12px 0 0;
      }

      .chatbot-widget-header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chatbot-widget-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .chatbot-widget-close {
        background: none;
        border: none;
        color: ${WIDGET_CONFIG.textColor};
        font-size: 28px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .chatbot-widget-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .chatbot-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chatbot-widget-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        word-wrap: break-word;
        line-height: 1.4;
      }

      .chatbot-widget-message-user {
        align-self: flex-end;
        background: ${WIDGET_CONFIG.primaryColor};
        color: ${WIDGET_CONFIG.textColor};
        border-bottom-right-radius: 4px;
      }

      .chatbot-widget-message-assistant {
        align-self: flex-start;
        background: #f3f4f6;
        color: #1f2937;
        border-bottom-left-radius: 4px;
      }

      .chatbot-widget-typing {
        display: flex;
        gap: 4px;
        padding: 8px 0;
      }

      .chatbot-widget-typing span {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: chatbot-widget-typing 1.4s infinite;
      }

      .chatbot-widget-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .chatbot-widget-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes chatbot-widget-typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }

      .chatbot-widget-input-container {
        display: flex;
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        gap: 8px;
      }

      #chatbot-widget-input {
        flex: 1;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      #chatbot-widget-input:focus {
        border-color: ${WIDGET_CONFIG.primaryColor};
      }

      #chatbot-widget-input:disabled {
        background: #f3f4f6;
        cursor: not-allowed;
      }

      #chatbot-widget-send {
        padding: 12px 24px;
        background: ${WIDGET_CONFIG.primaryColor};
        color: ${WIDGET_CONFIG.textColor};
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      #chatbot-widget-send:hover:not(:disabled) {
        opacity: 0.9;
      }

      #chatbot-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 480px) {
        #chatbot-widget-window {
          width: calc(100vw - 20px);
          height: calc(100vh - 20px);
          bottom: 10px;
          right: 10px;
        }

        #chatbot-widget-button {
          bottom: 10px;
          right: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-initialize if script has data attributes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const script = document.querySelector('script[data-chatbot-webhook-key]');
      if (script) {
        const webhookKey = script.getAttribute('data-chatbot-webhook-key');
        const apiBaseUrl = script.getAttribute('data-chatbot-api-url') || window.location.origin + '/api';
        initWidget({ webhookKey, apiBaseUrl });
      }
    });
  } else {
    const script = document.querySelector('script[data-chatbot-webhook-key]');
    if (script) {
      const webhookKey = script.getAttribute('data-chatbot-webhook-key');
      const apiBaseUrl = script.getAttribute('data-chatbot-api-url') || window.location.origin + '/api';
      initWidget({ webhookKey, apiBaseUrl });
    }
  }

  // Expose global function for manual initialization
  window.ChatbotWidget = {
    init: initWidget
  };
})();

