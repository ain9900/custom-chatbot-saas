import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { chatbotAPI } from '../services/api'

function Dashboard() {
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChatbot, setNewChatbot] = useState({ name: '', system_prompt: '' })
  const [documents, setDocuments] = useState([])
  const [documentText, setDocumentText] = useState('')
  const [creating, setCreating] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchChatbots()
  }, [])

  const fetchChatbots = async () => {
    try {
      const data = await chatbotAPI.list()
      setChatbots(data)
    } catch (error) {
      console.error('Error fetching chatbots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const formData = new FormData()
      formData.append('name', newChatbot.name)
      formData.append('system_prompt', newChatbot.system_prompt)
      
      // Add uploaded files
      documents.forEach((file, index) => {
        formData.append('documents', file)
      })
      
      // Add text document if provided
      if (documentText.trim()) {
        formData.append('document_texts', documentText.trim())
      }
      
      const response = await chatbotAPI.createWithDocuments(formData)
      
      // Show ingestion status if available
      if (response.ingestion_status) {
        const status = response.ingestion_status
        if (status.success) {
          alert(`✅ Chatbot created successfully!\n\n📚 Vector Database: ${status.message}`)
        } else if (status.message) {
          alert(`✅ Chatbot created successfully!\n\n⚠️ Vector Database Warning: ${status.message}\n\nYou can add documents later via the ingest endpoint.`)
        }
      } else {
        alert('✅ Chatbot created successfully!')
      }
      
      setShowCreateModal(false)
      setNewChatbot({ name: '', system_prompt: '' })
      setDocuments([])
      setDocumentText('')
      fetchChatbots()
    } catch (error) {
      console.error('Error creating chatbot:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Unknown error'
      alert('❌ Failed to create chatbot: ' + errorMsg)
    } finally {
      setCreating(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setDocuments(files)
  }

  const copyToClipboard = (text, type = 'URL') => {
    navigator.clipboard.writeText(text)
    // Show a more user-friendly notification
    const notification = document.createElement('div')
    notification.textContent = `${type} copied to clipboard!`
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.remove()
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Chatbot Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Your Chatbots</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Create Chatbot
          </button>
        </div>

        {/* Chatbots Grid */}
        {chatbots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No chatbots yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Chatbot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <div
                key={chatbot.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{chatbot.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(chatbot.created_at).toLocaleDateString()}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/chatbot/${chatbot.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Open Chat
                  </button>
                  <button
                    onClick={() => copyToClipboard(chatbot.widget_snippet, 'Widget Snippet')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Widget Snippet
                  </button>
                  <button
                    onClick={() => copyToClipboard(chatbot.webhook_url, 'Webhook URL')}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Copy Webhook URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Chatbot</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chatbot Name
                </label>
                <input
                  type="text"
                  value={newChatbot.name}
                  onChange={(e) => setNewChatbot({ ...newChatbot, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="My Chatbot"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={newChatbot.system_prompt}
                  onChange={(e) => setNewChatbot({ ...newChatbot, system_prompt: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="You are a helpful assistant..."
                />
              </div>
              
              {/* Vector Database Section */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Vector Database (Optional - Makes chatbot smarter about your products)
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Upload product documents, descriptions, or knowledge base content to make your chatbot more intelligent.
                </p>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Documents (TXT, MD)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  {documents.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {documents.length} file(s) selected
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Paste Text Content
                  </label>
                  <textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder="Paste product descriptions, FAQs, or any knowledge base content here..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Chatbot'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setDocuments([])
                    setDocumentText('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

