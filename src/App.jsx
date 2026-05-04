import { useState, useEffect } from 'react'
import './App.css'
import JSZip from 'jszip/dist/jszip.min.js'
import { checkLeadExists, saveNewLead, updateLead, fetchAllLeads } from './services/db.js'

const APIFY_API_KEY = import.meta.env.VITE_APIFY_API_KEY || 'your-apify-api-key-here'

const mockLeads = [
  { id: "jd_001", name: "Glamour Studio", phone: "9876543210", pitched: false },
  { id: "jd_002", name: "Brew & Bean Cafe", phone: "9123456789", pitched: true },
  { id: "jd_003", name: "Iron Paradise Gym", phone: "9812345678", pitched: false },
  { id: "jd_004", name: "Urban Canvas Interiors", phone: "9987654321", pitched: false },
  { id: "jd_005", name: "Lens & Light Photography", phone: "9001122334", pitched: true },
  { id: "jd_006", name: "Curl Up & Dye Salon", phone: "9012345678", pitched: false },
  { id: "jd_007", name: "Spice Garden Restaurant", phone: "9876512340", pitched: false },
  { id: "jd_008", name: "Zen Wellness Spa", phone: "9123098765", pitched: false },
]

const defaultTemplate = `Hi {name}, I'm Abir from Byters. I noticed your business doesn't have a website yet, and in today's digital world, that's costing you customers.

I've created a beautiful, custom website for businesses like yours that gets results. I can build something similar for you in just 2 days for only ₹5,000.

Your competitors are online. Are you?

Preview what I can do: {demo_link}`

function DashboardSection({ leads, uploadedTemplates, setActiveTab }) {
  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched || l.status === 'evaluated' || l.status === 'messaged').length
  const newLeads = leads.filter(l => l.status === 'INGESTED').length
  const highPriority = leads.filter(l => (l.priority || 0) >= 8).length
  const totalDemos = leads.filter(l => !!l.demo_url).length
  const successRate = totalLeads > 0 ? Math.round((pitchedLeads / totalLeads) * 100) : 0

  // Calculate Niche Distribution
  const niches = leads.reduce((acc, lead) => {
    const n = lead.niche || lead.category || 'General'
    acc[n] = (acc[n] || 0) + 1
    return acc
  }, {})
  const topNiches = Object.entries(niches).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>📊 Business Analytics</h2>
          <p className="dashboard-subtitle">Real-time pipeline performance & lead intelligence</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card gold">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">🎯</div>
          </div>
          <div className="metric-value">{totalLeads}</div>
          <div className="metric-label">Total Leads</div>
          <div className="metric-trend positive">+{newLeads} pending</div>
        </div>

        <div className="metric-card rose">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">⭐</div>
          </div>
          <div className="metric-value">{highPriority}</div>
          <div className="metric-label">High Priority</div>
          <div className="metric-trend">8+/10 Rank</div>
        </div>

        <div className="metric-card azure">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">🌐</div>
          </div>
          <div className="metric-value">{totalDemos}</div>
          <div className="metric-label">Demos Ready</div>
          <div className="metric-trend">Automated</div>
        </div>

        <div className="metric-card emerald">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">✅</div>
          </div>
          <div className="metric-value">{pitchedLeads}</div>
          <div className="metric-label">Processed</div>
          <div className="metric-trend">{successRate}% Coverage</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="insight-card">
          <h3>📈 Niche Distribution</h3>
          <div className="insight-content">
            {topNiches.length > 0 ? topNiches.map(([name, count]) => (
              <div key={name} className="insight-row">
                <span>{name}</span>
                <div className="niche-bar-container">
                  <div className="niche-bar" style={{ width: `${(count/totalLeads)*100}%` }}></div>
                </div>
                <span className="insight-value">{count}</span>
              </div>
            )) : (
              <p className="empty-text">No data available yet</p>
            )}
          </div>
        </div>

        <div className="recent-uploads">
          <h3>✨ Recent Demos</h3>
          <div className="upload-list">
            {leads.filter(l => !!l.demo_url).slice(0, 5).map((lead) => (
              <div key={lead.id} className="upload-item demo-item">
                <span className="upload-icon">🌐</span>
                <div className="demo-info">
                  <span className="upload-name">{lead.name}</span>
                  <span className="upload-size">{lead.niche || lead.category}</span>
                </div>
                <a href={lead.demo_url} target="_blank" rel="noreferrer" className="view-demo-small">View</a>
              </div>
            ))}
            {totalDemos === 0 && <p className="empty-text">No demos generated yet</p>}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => setActiveTab('leads')}>
            <span className="btn-icon">🔍</span>
            Start Scraper
          </button>
          <button className="action-btn secondary" onClick={() => setActiveTab('templates')}>
            <span className="btn-icon">📝</span>
            Edit Message
          </button>
          <button className="action-btn accent" onClick={() => window.open('https://supabase.com/dashboard/project/rltcnrkvuyagnnsdywqv', '_blank')}>
            <span className="btn-icon">🗄️</span>
            Database
          </button>
        </div>
      </div>

      <div className="top-leads-section">
        <h3>🏆 Top Prospects (Rank 9-10)</h3>
        <div className="top-leads-list">
          {leads.filter(l => (l.priority || 0) >= 9).slice(0, 3).map(lead => (
            <div key={lead.id} className="top-lead-item">
              <div className="top-lead-rank">{lead.priority}/10</div>
              <div className="top-lead-details">
                <strong>{lead.name}</strong>
                <span>{lead.city} • {lead.niche || lead.category}</span>
              </div>
              {lead.demo_url && <span className="demo-badge">Demo ✨</span>}
            </div>
          ))}
          {highPriority === 0 && <p className="empty-text">No top prospects yet. Run the AI finder!</p>}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState('idle') // idle, scanning, processing, finding, complete
  const [searched, setSearched] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "" })
  const [activeTab, setActiveTab] = useState("leads")
  const [template, setTemplate] = useState(defaultTemplate)
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [uploadedTemplates, setUploadedTemplates] = useState([])
  const [isProcessingZip, setIsProcessingZip] = useState(false)

  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched).length
  const newLeads = leads.filter(l => !l.pitched).length

  const loadLeadsFromDB = async () => {
    const dbLeads = await fetchAllLeads()
    setLeads(dbLeads)
  }

  useEffect(() => {
    loadLeadsFromDB()
  }, [])

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3500)
  }

  const handleAISearch = async () => {
    if (loading) return
    
    setLoading(true)
    setSearched(true)
    
    const statusMessages = {
      scanning: "🤖 Scanning business directories...",
      processing: "⚡ Processing data...",
      finding: "🎯 Qualifying best leads...",
      generating: "✨ Generating personalized messages..."
    }
    
    setAiStatus('scanning')
    showToast(statusMessages.scanning)
    
    try {
      setAiStatus('processing')
      showToast("🚀 Triggering Backend Pipeline...")
      
      // Trigger the backend pipeline (which handles Apify, Database Deduplication, and Groq natively)
      const response = await fetch('http://localhost:3000/api/generate-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: 'Cafe',
          city: 'Mumbai',
          limit: 3
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAiStatus('complete')
        showToast(`✅ Pipeline success! Processed ${data.stats.processed} leads.`)
      } else {
        throw new Error(data.error);
      }
      
      // Refresh leads from the database to see the newly generated ones
      await loadLeadsFromDB()
      
      setTimeout(() => setAiStatus('idle'), 3000)
      
    } catch (error) {
      console.error("Pipeline trigger error:", error)
      setAiStatus('idle')
      showToast("Backend connection failed — ensure server is running")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = async (lead) => {
    const message = template
      .replace(/{name}/g, lead.name.split(' ')[0])
      .replace(/{demo_link}/g, lead.demo_url || "https://your-demo-link.com")
    
    await updateLead(lead.id, { 
      pitched: true, 
      status: 'messaged',
      message: message 
    })
    
    window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`, '_blank')
    
    await loadLeadsFromDB()
    showToast("WhatsApp message opened!")
  }

  const detectCategoriesFromPath = (filePath) => {
    const lowerPath = filePath.toLowerCase()
    const detected = []
    if (lowerPath.includes('salon') || lowerPath.includes('beauty')) detected.push('Beauty')
    if (lowerPath.includes('cafe') || lowerPath.includes('coffee') || lowerPath.includes('restaurant')) detected.push('Food')
    if (lowerPath.includes('gym') || lowerPath.includes('fitness')) detected.push('Fitness')
    if (lowerPath.includes('interior') || lowerPath.includes('design')) detected.push('Design')
    if (lowerPath.includes('photo') || lowerPath.includes('portfolio')) detected.push('Photography')
    return detected.length > 0 ? detected : ['Business']
  }

  const processFiles = (files) => {
    const newTemplates = Array.from(files).filter(f => 
      f.name.endsWith('.html') || f.name.endsWith('.css') || 
      f.name.endsWith('.js') || f.name.endsWith('.json') || f.name.endsWith('.zip')
    ).map(file => ({
      name: file.name,
      size: formatFileSize(file.size),
      file: file,
      type: file.name.endsWith('.zip') ? 'zip' : file.name.split('.').pop()
    }))
    
    setUploadedTemplates(prev => [...prev, ...newTemplates])
    showToast(`Uploaded ${newTemplates.length} file${newTemplates.length > 1 ? 's' : ''}`)
  }

  const processZipFile = async (zipFile) => {
    setIsProcessingZip(true)
    try {
      const zip = await JSZip.loadAsync(zipFile)
      const htmlFiles = []
      
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && 
            (relativePath.endsWith('.html') || 
             relativePath.endsWith('.css') || 
             relativePath.endsWith('.js'))) {
          htmlFiles.push({ path: relativePath, entry: zipEntry })
        }
      })
      
      if (htmlFiles.length === 0) {
        showToast("No HTML/CSS/JS files found in ZIP")
        setIsProcessingZip(false)
        return
      }
      
      const extractedTemplates = await Promise.all(htmlFiles.slice(0, 10).map(async (item) => {
        const content = await item.entry.async('string')
        return { 
          name: `${zipFile.name}/${item.path}`.substring(0, 50),
          size: `${content.length} chars`,
          type: 'extracted',
          path: item.path
        }
      }))
      
      setUploadedTemplates(prev => [...prev, { 
        name: zipFile.name, 
        size: formatFileSize(zipFile.size), 
        file: zipFile, 
        type: 'zip', 
        extractedTemplates,
        isZip: true 
      }])
      
      showToast(`Extracted ${extractedTemplates.length} templates from ${zipFile.name}`)
    } catch (err) {
      console.error('ZIP error:', err)
      showToast("Error extracting ZIP file")
    }
    setIsProcessingZip(false)
  }

  const handleFileDrop = (files) => {
    const zipFiles = Array.from(files).filter(f => f.name.endsWith('.zip'))
    const regularFiles = Array.from(files).filter(f => 
      !f.name.endsWith('.zip') && 
      (f.name.endsWith('.html') || f.name.endsWith('.css') || 
       f.name.endsWith('.js') || f.name.endsWith('.json'))
    )
    
    if (regularFiles.length > 0) processFiles(regularFiles)
    if (zipFiles.length > 0) zipFiles.forEach(zip => processZipFile(zip))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024, sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeTemplate = (index) => {
    setUploadedTemplates(prev => prev.filter((_, i) => i !== index))
    showToast("Template removed")
  }

  const handleSaveTemplate = (content) => {
    setTemplate(content)
    setEditingTemplate(false)
    showToast("Template saved!")
  }

  const handleResetTemplate = () => {
    setTemplate(defaultTemplate)
    showToast("Reset to default")
  }

  const getAIStatusDisplay = () => {
    const statusConfig = {
      scanning: { icon: '🔍', text: 'Scanning directories' },
      processing: { icon: '⚡', text: 'Processing data' },
      finding: { icon: '🎯', text: 'Qualifying leads' },
      generating: { icon: '✨', text: 'Generating messages' },
      complete: { icon: '✅', text: 'Complete!' }
    }
    const config = statusConfig[aiStatus]
    if (!config || aiStatus === 'idle') return null
    return (
      <div className={`ai-status-indicator ${aiStatus}`}>
        <span className="ai-status-icon">{config.icon}</span>
        <span className="ai-status-text">{config.text}</span>
        <div className="ai-progress-bar">
          <div className="ai-progress-fill"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="floating-particles" aria-hidden="true">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--delay': `${i * 0.5}s`, '--duration': `${10 + i * 5}s` }} />
        ))}
      </div>

      <div className="app-container">
        <header className="main-header">
          <div className="logo-group">
            <div className="logo-icon">✦</div>
            <h1 className="logo-text">Byters</h1>
          </div>
          <p className="tagline">Digital Growth for Every Business</p>
        </header>

        <nav className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <span className="tab-icon">🔍</span>
            Lead Finder
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📊</span>
            Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <span className="tab-icon">📝</span>
            Template
          </button>
        </nav>

        {activeTab === 'leads' && (
          <section className="leads-section">
            <div className="search-panel">
              <div className="search-header">
                <h2>AI-Powered Lead Generation</h2>
                <p className="search-subtitle">Click below to find businesses needing website upgrades</p>
              </div>

              <div className="search-controls">
                <button 
                  className="search-button ai-search-btn" 
                  onClick={handleAISearch}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span className="ai-loading-text">
                        {aiStatus === 'scanning' && '🤖 Scanning business directories...'}
                        {aiStatus === 'processing' && '⚡ Processing data...'}
                        {aiStatus === 'finding' && '🎯 Finding qualified leads...'}
                        {aiStatus === 'complete' && '✅ Complete!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🤖</span>
                      Find Leads with AI
                    </>
                  )}
                </button>
              </div>
              
              {getAIStatusDisplay()}
            </div>

            {(searched || leads.length > 0) && (
              <div className="stats-bar">
                <div className="stat-item">
                  <span className="stat-number">{totalLeads}</span>
                  <span className="stat-label">Total Found</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">{pitchedLeads}</span>
                  <span className="stat-label">Contacted</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item highlight">
                  <span className="stat-number accent">{newLeads}</span>
                  <span className="stat-label">Ready Now</span>
                </div>
              </div>
            )}

            <div className="results-container">
              {loading ? (
                <div className="loading-grid">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="lead-card skeleton">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line subtitle"></div>
                      <div className="skeleton-line button"></div>
                    </div>
                  ))}
                </div>
              ) : leads.length > 0 ? (
                <div className="leads-grid">
                  {leads.map(lead => (
                    <div key={lead.id} className={`lead-card ${lead.pitched ? 'pitched' : ''} priority-${Math.floor(lead.priority || 0)}`}>
                      <div className="lead-header">
                        <div className="lead-title-group">
                          <h3 className="lead-name">{lead.name}</h3>
                          <div className="lead-meta">
                            <span className="niche-tag">{lead.niche || lead.category || 'Business'}</span>
                            <span className="city-tag">{lead.city || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="priority-badge" title="AI Priority Score">
                          {lead.priority ? `⭐ ${lead.priority}` : 'New'}
                        </div>
                      </div>
                      
                      {lead.tagline && <p className="lead-tagline">"{lead.tagline}"</p>}
                      
                      <div className="lead-phone">
                        <span className="phone-icon">📞</span>
                        {lead.phone || 'No phone'}
                      </div>

                      <div className="lead-actions">
                        {lead.demo_url ? (
                          <a 
                            href={lead.demo_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="view-demo-btn"
                          >
                            <span className="btn-icon">🌐</span>
                            View Demo
                          </a>
                        ) : (
                          <div className="no-demo-badge">No Demo Yet</div>
                        )}
                        
                        <button
                          className={`whatsapp-button ${lead.pitched ? 'disabled' : ''}`}
                          onClick={() => !lead.pitched && handleWhatsAppClick(lead)}
                          disabled={lead.pitched}
                        >
                          <span className="whatsapp-icon">💬</span>
                          {lead.pitched ? 'Contacted' : 'Send Pitch'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searched && (
                  <div className="empty-state">
                    <div className="empty-icon">✦</div>
                    <h3>No leads found</h3>
                    <p>Try again or check your connection</p>
                  </div>
                )
              )}

              {!searched && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>AI Lead Discovery</h3>
                  <p>Click "Find Leads with AI" to discover businesses automatically</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'dashboard' && (
          <DashboardSection
            leads={leads}
            uploadedTemplates={uploadedTemplates}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'templates' && (
          <section className="templates-section">
            <div className="templates-header">
              <h2>Message Template</h2>
              <p className="templates-subtitle">Customize your outreach message</p>
            </div>

            <div className="template-preview-card">
              <div className="template-preview-header">
                <span className="preview-label">Template Preview</span>
                <span className="var-hint">Variables: name, demo_link</span>
              </div>
              <div className="template-content">
                <p>{template.replace(/\n/g, '<br />')}</p>
              </div>
            </div>

            <div className="template-edit-section">
              <div className="edit-header">
                <h3>Edit Template</h3>
                <div className="edit-actions">
                  <button className="reset-btn" onClick={handleResetTemplate}>
                    Reset
                  </button>
                </div>
              </div>
              <textarea
                className="template-editor"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                placeholder="Write your message template..."
              />
              <div className="template-variables">
                <span className="var-tag">{'{name}'}</span>
                <span className="var-desc">- Contact name</span>
                <span className="var-tag">{'{demo_link}'}</span>
                <span className="var-desc">- Demo website link</span>
              </div>
              <button className="save-button" onClick={() => handleSaveTemplate(template)}>
                Save Template
              </button>
            </div>

            <div className="portfolio-section">
              <h3>🎨 Generated Demos Portfolio</h3>
              <p className="upload-subtitle">Review and manage your AI-generated website demos</p>

              <div className="demo-portfolio-grid">
                {leads.filter(l => !!l.demo_url).map(lead => (
                  <div key={lead.id} className="portfolio-card">
                    <div className="portfolio-card-header">
                      <span className="niche-badge">{lead.niche || lead.category}</span>
                      <span className="priority-pill">P{lead.priority}</span>
                    </div>
                    <h4 className="portfolio-business-name">{lead.name}</h4>
                    <p className="portfolio-location">{lead.city}</p>
                    <div className="portfolio-actions">
                      <a href={lead.demo_url} target="_blank" rel="noreferrer" className="portfolio-btn view">
                        Preview
                      </a>
                      <button 
                        className="portfolio-btn copy"
                        onClick={() => {
                          navigator.clipboard.writeText(lead.demo_url);
                          showToast("Link copied to clipboard!");
                        }}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ))}
                {leads.filter(l => !!l.demo_url).length === 0 && (
                  <div className="empty-portfolio">
                    <div className="empty-icon">📁</div>
                    <p>No demos generated yet. Start the Lead Finder to create your first one!</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {toast.show && (
        <div className="toast-notification">
          <span className="toast-icon">✓</span>
          {toast.message}
        </div>
      )}
    </div>
  )
}
