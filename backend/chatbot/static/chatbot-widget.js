(function () {
  'use strict';

  /* =====================================================
     CONFIG (default values)
  ===================================================== */
  const CONFIG = {
    webhookKey: null,
    apiBaseUrl: null,
    primaryColor: '#2563eb',
    textColor: '#ffffff',
    buttonText: 'Chat',
    placeholder: 'Type your message...',
    title: 'Chat with us'
  };

  let initialized = false;

  /* =====================================================
     PUBLIC INIT
  ===================================================== */
  function init(config) {
    if (initialized) return;

    Object.assign(CONFIG, config);

    if (!CONFIG.webhookKey || !CONFIG.apiBaseUrl) {
      console.error('[ChatbotWidget] webhookKey and apiBaseUrl are required');
      return;
    }

    createWidget();
    injectStyles();
    initialized = true;
  }

  /* =====================================================
     CREATE WIDGET
  ===================================================== */
  function createWidget() {
    if (document.getElementById('chatbot-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    document.body.appendChild(container);

    container.innerHTML = `
      <div id="chatbot-widget-button">${CONFIG.buttonText}</div>

      <div id="chatbot-widget-window">
        <div class="header">
          <span>${CONFIG.title}</span>
          <button id="chatbot-close" type="button">×</button>
        </div>

        <div id="chatbot-messages"></div>

        <div class="input-area">
          <input
            id="chatbot-input"
            placeholder="${CONFIG.placeholder}"
            autocomplete="off"
          />
          <button id="chatbot-send" type="button">Send</button>
        </div>
      </div>
    `;

    bindEvents();
  }

  /* =====================================================
     EVENTS
  ===================================================== */
  function bindEvents() {
    const btn = document.getElementById('chatbot-widget-button');
    const win = document.getElementById('chatbot-widget-window');
    const close = document.getElementById('chatbot-close');
    const send = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');

    btn.onclick = () => toggle(true);
    close.onclick = () => toggle(false);

    send.onclick = (e) => {
      e.preventDefault();
      sendMessage(input);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage(input);
      }
    });
  }

  /* =====================================================
     TOGGLE
  ===================================================== */
  function toggle(open) {
    document.getElementById('chatbot-widget-window').style.display =
      open ? 'flex' : 'none';
    document.getElementById('chatbot-widget-button').style.display =
      open ? 'none' : 'block';
  }

  /* =====================================================
     SEND MESSAGE
  ===================================================== */
  function sendMessage(input) {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;

    addMessage('user', text);
    const typingId = addMessage('bot', 'Typing...');

    fetch(`${CONFIG.apiBaseUrl}/chatbot/webhook/${CONFIG.webhookKey}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then(res => res.json())
      .then(data => {
        removeMessage(typingId);
        addMessage('bot', data.reply || 'No response');
        input.disabled = false;
        input.focus();
      })
      .catch(() => {
        removeMessage(typingId);
        addMessage('bot', 'Error occurred');
        input.disabled = false;
      });
  }

  /* =====================================================
     MESSAGE HELPERS
  ===================================================== */
  function addMessage(role, text) {
    const box = document.getElementById('chatbot-messages');
    const id = 'msg_' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `message ${role}`;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
  }

  function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  /* =====================================================
     STYLES
  ===================================================== */
  function injectStyles() {
    if (document.getElementById('chatbot-widget-style')) return;

    const style = document.createElement('style');
    style.id = 'chatbot-widget-style';
    style.textContent = `
      #chatbot-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        font-family: Arial, sans-serif;
      }

      #chatbot-widget-button {
        background: ${CONFIG.primaryColor};
        color: ${CONFIG.textColor};
        padding: 14px 18px;
        border-radius: 50px;
        cursor: pointer;
      }

      #chatbot-widget-window {
        display: none;
        flex-direction: column;
        width: 360px;
        height: 520px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,.2);
        margin-bottom: 10px;
      }

      .header {
        background: ${CONFIG.primaryColor};
        color: ${CONFIG.textColor};
        padding: 12px;
        display: flex;
        justify-content: space-between;
      }

      #chatbot-messages {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
      }

      .input-area {
        display: flex;
        gap: 6px;
        padding: 10px;
      }

      .input-area input {
        flex: 1;
        padding: 8px;
      }

      .input-area button {
        background: ${CONFIG.primaryColor};
        color: ${CONFIG.textColor};
        border: none;
        padding: 8px 14px;
        cursor: pointer;
      }

      .message.user {
        text-align: right;
        margin: 6px 0;
      }

      .message.bot {
        text-align: left;
        margin: 6px 0;
      }
    `;
    document.head.appendChild(style);
  }

  /* =====================================================
     EXPOSE
  ===================================================== */
  window.ChatbotWidget = { init };

})();
