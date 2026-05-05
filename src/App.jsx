import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { updateLead, fetchAllLeads } from './services/db.js'

const defaultTemplate = `Hi {name}, I am Abir from Byters. I noticed your business does not have a website yet, and in today's digital world, that is costing you customers.

I have created a beautiful, custom website for businesses like yours that gets results. I can build something similar for you in just 2 days for only Rs.5,000.

Your competitors are online. Are you?

Preview what I can do: {demo_link}`

function WinWindow({ title, children, style }) {
  return (
    <div className="win-window" style={style}>
      <div className="win-titlebar">
        <span className="win-titlebar-text">
          <i className="hourglass">&#9203;</i> {title}
        </span>
        <div className="win-titlebar-buttons">
          <button className="win-titlebar-btn">_</button>
          <button className="win-titlebar-btn">&#9633;</button>
          <button className="win-titlebar-btn">&#10005;</button>
        </div>
      </div>
      <div className="win-window-body">{children}</div>
    </div>
  )
}

function ErrorDialog({ title, message, onClose }) {
  return (
    <div className="error-dialog-overlay" onClick={onClose}>
      <div className="error-dialog" onClick={e => e.stopPropagation()}>
        <div className="win-titlebar">
          <span className="win-titlebar-text">{title || 'Byters.exe'}</span>
          <div className="win-titlebar-buttons">
            <button className="win-titlebar-btn" onClick={onClose}>&#10005;</button>
          </div>
        </div>
        <div className="error-dialog-body">
          <span className="error-icon">&#9888;</span>
          <span className="error-text">{message}</span>
        </div>
        <div className="error-dialog-footer">
          <button className="win-btn win-btn-primary" onClick={onClose}>OK</button>
          <button className="win-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function DashboardSection({ leads, setActiveTab }) {
  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched || l.status === 'EVALUATED' || l.status === 'PITCHED').length
  const newLeads = leads.filter(l => l.status === 'INGESTED').length
  const highPriority = leads.filter(l => (l.priority || 0) >= 8).length
  const totalDemos = leads.filter(l => !!l.demo_url).length
  const successRate = totalLeads > 0 ? Math.round((pitchedLeads / totalLeads) * 100) : 0

  const niches = leads.reduce((acc, lead) => {
    const n = lead.niche || lead.category || 'General'
    acc[n] = (acc[n] || 0) + 1
    return acc
  }, {})
  const topNiches = Object.entries(niches).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <WinWindow title="Analytics.exe — Not Responding">
      <div className="dashboard-header">
        <h2>Business Analytics</h2>
        <p className="dashboard-subtitle">Real-time pipeline performance</p>
      </div>

      <div className="frozen-progress">
        <div className="frozen-progress-fill"></div>
        <span className="frozen-progress-text">Scanning... 67%</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-icon-wrapper"><span className="metric-icon">&#127919;</span></div><div className="metric-value">{totalLeads}</div><div className="metric-label">Total Leads</div><div className="metric-trend positive">+{newLeads} pending</div></div>
        <div className="metric-card"><div className="metric-icon-wrapper"><span className="metric-icon">&#11088;</span></div><div className="metric-value">{highPriority}</div><div className="metric-label">High Priority</div><div className="metric-trend">8+/10 Rank</div></div>
        <div className="metric-card"><div className="metric-icon-wrapper"><span className="metric-icon">&#127760;</span></div><div className="metric-value">{totalDemos}</div><div className="metric-label">Demos Ready</div><div className="metric-trend">Automated</div></div>
        <div className="metric-card"><div className="metric-icon-wrapper"><span className="metric-icon">&#9989;</span></div><div className="metric-value">{pitchedLeads}</div><div className="metric-label">Processed</div><div className="metric-trend">{successRate}% Coverage</div></div>
      </div>

      <div className="dashboard-grid">
        <div className="insight-card">
          <h3>Niche Distribution</h3>
          <div className="insight-content">
            {topNiches.length > 0 ? topNiches.map(([name, count]) => (
              <div key={name} className="insight-row">
                <span>{name}</span>
                <div className="niche-bar-container"><div className="niche-bar" style={{ width: `${(count/totalLeads)*100}%` }}></div></div>
                <span className="insight-value">{count}</span>
              </div>
            )) : <p className="empty-text">No data available yet</p>}
          </div>
        </div>
        <div className="recent-uploads">
          <h3>Recent Demos</h3>
          <div className="upload-list">
            {leads.filter(l => !!l.demo_url).slice(0, 5).map((lead) => (
              <div key={lead.id} className="upload-item">
                <span className="upload-icon">&#127760;</span>
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
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => setActiveTab('leads')}>&#128269; Start Scraper</button>
          <button className="action-btn" onClick={() => setActiveTab('templates')}>&#9998; Edit Message</button>
          <button className="action-btn" onClick={() => window.open('https://supabase.com/dashboard', '_blank')}>&#128451; Database</button>
        </div>
      </div>

      <div className="top-leads-section">
        <h3>Top Prospects (Rank 9-10)</h3>
        <div className="top-leads-list">
          {leads.filter(l => (l.priority || 0) >= 9).slice(0, 3).map(lead => (
            <div key={lead.id} className="top-lead-item">
              <div className="top-lead-rank">{lead.priority}/10</div>
              <div className="top-lead-details">
                <strong>{lead.name}</strong>
                <span>{lead.city} - {lead.niche || lead.category}</span>
              </div>
              {lead.demo_url && <span className="demo-badge">Demo</span>}
            </div>
          ))}
          {highPriority === 0 && <p className="empty-text">No top prospects yet.</p>}
        </div>
      </div>
    </WinWindow>
  )
}

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState('idle')
  const [searched, setSearched] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [activeTab, setActiveTab] = useState('leads')
  const [template, setTemplate] = useState(defaultTemplate)
  const [showBsod, setShowBsod] = useState(true)
  const [errorDialog, setErrorDialog] = useState(null)
  const [clockTime, setClockTime] = useState('')

  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched).length
  const newLeads = leads.filter(l => !l.pitched).length

  const loadLeadsFromDB = async () => {
    const dbLeads = await fetchAllLeads()
    setLeads(dbLeads)
  }

  useEffect(() => {
    loadLeadsFromDB()
    const timer = setInterval(() => {
      const now = new Date()
      setClockTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const showToast = useCallback((message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3500)
  }, [])

  const handleAISearch = async () => {
    if (loading) return
    setLoading(true)
    setSearched(true)
    setAiStatus('scanning')
    showToast('Scanning business directories...')

    try {
      setAiStatus('processing')
      showToast('Triggering Backend Pipeline...')

      const response = await fetch('http://localhost:3000/api/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: ['Cafe', 'Salon', 'Photographer', 'Restaurant', 'Gym', 'Dentist', 'Spa', 'Bakery', 'Coaching Center', 'Boutique'], city: 'India' })
      })

      if (!response.ok) throw new Error(`Backend API error: ${response.status}`)

      const data = await response.json()

      if (data.success) {
        setAiStatus('complete')
        const processed = data.stats.evaluated + data.stats.demos
        showToast(`Pipeline success! ${processed} leads processed.`)
      } else {
        throw new Error(data.error)
      }

      await loadLeadsFromDB()
      setTimeout(() => setAiStatus('idle'), 3000)

    } catch (error) {
      console.error('Pipeline trigger error:', error)
      setAiStatus('idle')
      setErrorDialog({
        title: 'Byters.exe - Application Error',
        message: `The instruction at 0x${Math.random().toString(16).slice(2,10)} referenced memory at 0x00000000. The memory could not be "read".\n\n${error.message}\n\nClick OK to terminate the application.`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = async (lead) => {
    const message = template
      .replace(/{name}/g, lead.name.split(' ')[0])
      .replace(/{demo_link}/g, lead.demo_url || 'https://your-demo-link.com')

    await updateLead(lead.id, { pitched: true, status: 'PITCHED', message })
    window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`, '_blank')
    await loadLeadsFromDB()
    showToast('WhatsApp message opened!')
  }

  const handleResetTemplate = () => {
    setTemplate(defaultTemplate)
    showToast('Reset to default')
  }

  const getAIStatusDisplay = () => {
    const statusConfig = {
      scanning:   { icon: '&#128269;', text: 'Scanning directories...' },
      processing: { icon: '&#9889;', text: 'Processing data...' },
      complete:   { icon: '&#9989;', text: 'Complete!' },
    }
    const config = statusConfig[aiStatus]
    if (!config || aiStatus === 'idle') return null
    return (
      <div className={`ai-status-indicator ${aiStatus}`}>
        <span className="ai-status-icon">&#9203;</span>
        <span className="ai-status-text">{config.text}</span>
        <div className="ai-progress-bar"><div className="ai-progress-fill"></div></div>
      </div>
    )
  }

  const getPriorityClass = (p) => {
    if (p >= 8) return 'high'
    if (p <= 3) return 'low'
    return ''
  }

  if (showBsod) {
    return (
      <div className="bsod-splash" onClick={() => setShowBsod(false)}>
        <div className="bsod-header">Windows</div>
        <div className="bsod-text">
          A fatal exception 0E has occurred at 0028:C0034B03 in VXD VWIN32(01)<br />
          + 00010E36. The current application will be terminated.<br /><br />
          * A lead generation process was running and has not been saved.<br />
          * Press any key to terminate the current application.<br />
          * Press CTRL+ALT+DEL again to restart your computer. You will<br />
          &nbsp;&nbsp;lose any unsaved information in all applications.<br /><br />
          <small>Press any key to continue _</small>
          <span className="bsod-cursor"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {errorDialog && (
        <ErrorDialog
          title={errorDialog.title}
          message={errorDialog.message}
          onClose={() => setErrorDialog(null)}
        />
      )}

      <div className="xwave-scroll-container">
        {/* Panel 1: Lead Finder */}
        <div className="xwave-panel">
          <WinWindow title="Byters.exe — Not Responding">
            <div className="main-header" style={{padding: 0, margin: 0}}>
              <div style={{display:'flex', alignItems:'center', gap: 8, marginBottom: 8}}>
                <span style={{fontSize: 24, fontFamily: 'var(--font-mono)', color: 'var(--win-blue-dark)', fontWeight: 'bold'}}>Byters.exe</span>
              </div>
              <p style={{fontSize: 11, color: 'var(--win-grey-dark)', fontFamily: 'var(--font-system)'}}>Digital Growth for Every Business - Build: 4.2.1998</p>
            </div>
          </WinWindow>

          <div className="tab-nav">
            <button className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
              <span className="tab-icon">&#128269;</span> Lead Finder
            </button>
            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span className="tab-icon">&#128202;</span> Analytics
            </button>
            <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
              <span className="tab-icon">&#9998;</span> Template
            </button>
          </div>

          {activeTab === 'leads' && (
            <div style={{paddingTop: 12}}>
              <WinWindow title="AI Lead Generation — Not Responding">
                <div className="search-panel">
                  <div className="search-header">
                    <h2>AI-Powered Lead Generation</h2>
                    <p className="search-subtitle">Click below to find businesses needing website upgrades</p>
                  </div>
                  <div className="search-controls">
                    <button className="ai-search-btn" onClick={handleAISearch} disabled={loading}>
                      {loading ? (
                        <><span className="spinner"></span><span className="ai-loading-text">
                          {aiStatus === 'scanning' && 'Scanning...'}
                          {aiStatus === 'processing' && 'Processing...'}
                          {aiStatus === 'complete' && 'Complete!'}
                        </span></>
                      ) : (
                        <><span className="btn-icon">&#129302;</span> Find Leads with AI</>
                      )}
                    </button>
                  </div>
                  {getAIStatusDisplay()}
                </div>

                {(searched || leads.length > 0) && (
                  <div className="stats-bar">
                    <div className="stat-item"><span className="stat-number">{totalLeads}</span><span className="stat-label">Total Found</span></div>
                    <div className="stat-item"><span className="stat-number">{pitchedLeads}</span><span className="stat-label">Contacted</span></div>
                    <div className="stat-item highlight"><span className="stat-number">{newLeads}</span><span className="stat-label">Ready Now</span></div>
                  </div>
                )}

                <div className="results-container">
                  {loading ? (
                    <div style={{textAlign: 'center', padding: 40, fontFamily: 'var(--font-mono)', fontSize: 14}}>
                      <p>&#9203; Please wait while Windows searches for leads...</p>
                      <div className="frozen-progress" style={{marginTop: 12}}>
                        <div className="frozen-progress-fill"></div>
                        <span className="frozen-progress-text">Loading... 67%</span>
                      </div>
                    </div>
                  ) : leads.length > 0 ? (
                    <div className="leads-table-wrapper">
                      <table className="leads-table">
                        <thead>
                          <tr>
                            <th>Business</th>
                            <th>Niche</th>
                            <th>City</th>
                            <th>Phone</th>
                            <th>Priority</th>
                            <th>Tagline</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map(lead => (
                            <tr key={lead.id} className={lead.pitched ? 'pitched' : ''}>
                              <td><span className="table-name">{lead.name}</span></td>
                              <td><span className="table-niche">{lead.niche || lead.category || 'Business'}</span></td>
                              <td><span className="table-city">{lead.city || '--'}</span></td>
                              <td><span className={`table-phone ${!lead.phone ? 'empty' : ''}`}>{lead.phone || 'No phone'}</span></td>
                              <td><span className={`table-priority ${getPriorityClass(lead.priority || 0)}`}>{lead.priority ? `${lead.priority}/10` : '--'}</span></td>
                              <td><span className="table-tagline" title={lead.tagline}>{lead.tagline || '--'}</span></td>
                              <td>
                                <div className="table-actions">
                                  {lead.demo_url ? (
                                    <a href={lead.demo_url} target="_blank" rel="noreferrer" className="btn-sm demo">Demo</a>
                                  ) : (
                                    <span className="btn-sm no-demo">No demo</span>
                                  )}
                                  <button className={`btn-sm whatsapp ${lead.pitched ? 'disabled' : ''}`} onClick={() => !lead.pitched && handleWhatsAppClick(lead)} disabled={lead.pitched}>
                                    {lead.pitched ? 'Sent' : 'Pitch'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : searched ? (
                    <div className="empty-state">
                      <div className="empty-icon">&#9888;</div>
                      <h3>No leads found</h3>
                      <p>Try again or check your connection</p>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">&#129302;</div>
                      <h3>AI Lead Discovery</h3>
                      <p>Click "Find Leads with AI" to discover businesses</p>
                    </div>
                  )}
                </div>
              </WinWindow>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardSection leads={leads} setActiveTab={setActiveTab} />}
          {activeTab === 'templates' && (
            <WinWindow title="Template.doc — Not Responding">
              <div style={{paddingTop: 0}}>
                <div className="templates-header">
                  <h2>Message Template</h2>
                  <p className="templates-subtitle">Customize your outreach message</p>
                </div>

                <div className="template-preview-card">
                  <div className="template-preview-header">
                    <span className="preview-label">Template Preview</span>
                    <span className="var-hint">Variables: name, demo_link</span>
                  </div>
                  <div className="template-content">{template}</div>
                </div>

                <div className="template-edit-section">
                  <div className="edit-header">
                    <h3>Edit Template</h3>
                    <div className="edit-actions">
                      <button className="reset-btn" onClick={handleResetTemplate}>Reset</button>
                    </div>
                  </div>
                  <textarea className="win-textarea" value={template} onChange={(e) => setTemplate(e.target.value)} rows={8} placeholder="Write your message template..." />
                  <div className="template-variables">
                    <span className="var-tag">{'{name}'}</span>
                    <span className="var-desc">- Contact name</span>
                    <span className="var-tag">{'{demo_link}'}</span>
                    <span className="var-desc">- Demo website link</span>
                  </div>
                  <button className="save-button" onClick={() => showToast('Template saved!')}>Save Template</button>
                </div>

                <div className="portfolio-section">
                  <h3>Generated Demos Portfolio</h3>
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
                          <a href={lead.demo_url} target="_blank" rel="noreferrer" className="portfolio-btn view">Preview</a>
                          <button className="portfolio-btn copy" onClick={() => { navigator.clipboard.writeText(lead.demo_url); showToast('Link copied!') }}>Copy Link</button>
                        </div>
                      </div>
                    ))}
                    {leads.filter(l => !!l.demo_url).length === 0 && (
                      <div className="empty-portfolio">No demos generated yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </WinWindow>
          )}
        </div>

        {/* Panel 2: System Monitor / Extra Info */}
        <div className="xwave-panel">
          <WinWindow title="System Monitor — Not Responding">
            <div style={{padding: 8}}>
              <h3 style={{fontFamily: 'var(--font-system)', fontSize: 11, fontWeight: 'bold', color: 'var(--win-blue-dark)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, borderBottom: '1px solid var(--win-grey-dark)', paddingBottom: 4}}>System Resources</h3>
              <div style={{marginBottom: 12}}>
                <p style={{fontFamily: 'var(--font-system)', fontSize: 11, marginBottom: 4, color: 'var(--win-black)'}}>CPU Usage: <strong style={{color: 'var(--win-error-red)'}}>67%</strong></p>
                <div className="frozen-progress"><div className="frozen-progress-fill" style={{animationDuration: '5s'}}></div><span className="frozen-progress-text">67%</span></div>
              </div>
              <div style={{marginBottom: 12}}>
                <p style={{fontFamily: 'var(--font-system)', fontSize: 11, marginBottom: 4, color: 'var(--win-black)'}}>Memory: <strong style={{color: 'var(--win-error-red)'}}>89%</strong></p>
                <div className="frozen-progress"><div className="frozen-progress-fill" style={{animationDuration: '6s', background: 'var(--win-error-red)'}}></div><span className="frozen-progress-text">89%</span></div>
              </div>
              <div style={{marginBottom: 12}}>
                <p style={{fontFamily: 'var(--font-system)', fontSize: 11, marginBottom: 4, color: 'var(--win-black)'}}>Lead Pipeline: <strong style={{color: 'var(--win-green)'}}>{leads.length > 0 ? Math.min(95, Math.round((pitchedLeads / totalLeads) * 100)) : 0}%</strong></p>
                <div className="frozen-progress"><div className="frozen-progress-fill" style={{animationDuration: '7s', background: 'var(--win-green)', width: leads.length > 0 ? `${Math.min(95, Math.round((pitchedLeads / totalLeads) * 100))}%` : '0%'}}></div></div>
              </div>
            </div>
          </WinWindow>

          <WinWindow title="Event Log — Not Responding">
            <div style={{padding: 4, maxHeight: 200, overflowY: 'auto', background: 'var(--win-white)', border: '2px solid', borderColor: 'var(--win-btn-dk-shadow) var(--win-btn-highlight) var(--win-btn-highlight) var(--win-btn-dk-shadow)', fontFamily: 'var(--font-mono)', fontSize: 12}}>
              <p>[{new Date().toLocaleDateString()}] Byters.exe started</p>
              <p>[INFO] Connected to Apify pipeline</p>
              <p>[WARN] countryCode validation corrected</p>
              <p>[INFO] Scraping India with single API call</p>
              <p>[WARN] Memory usage exceeds recommended</p>
              <p>[ERROR] Not Responding... (false alarm)</p>
              <p>[INFO] {leads.length} leads loaded from database</p>
              <p>[INFO] {leads.filter(l => l.demo_url).length} demos generated</p>
              <p style={{color: 'var(--win-grey-dark)'}}>_</p>
            </div>
          </WinWindow>

          <WinWindow title="About Byters.exe">
            <div style={{padding: 8, fontFamily: 'var(--font-system)', fontSize: 12, lineHeight: 1.6}}>
              <p style={{fontWeight: 'bold', fontSize: 14, marginBottom: 8}}>Byters.exe</p>
              <p>Version 4.2.1998 (Build: 6.00.2479.1)</p>
              <p style={{marginTop: 4}}>Digital Growth for Every Business</p>
              <p style={{marginTop: 4, color: 'var(--win-grey-dark)'}}>This product is licensed to:</p>
              <p style={{fontWeight: 'bold'}}>ABIR</p>
              <p style={{marginTop: 8, fontSize: 10, color: 'var(--win-grey-dark)'}}>Physical memory available to Windows: 128 MB</p>
              <p style={{fontSize: 10, color: 'var(--win-grey-dark)'}}>System Resources: 42% free</p>
              <div style={{marginTop: 8}}>
                <button className="win-btn win-btn-primary" style={{width: '100%'}}>OK</button>
              </div>
            </div>
          </WinWindow>
        </div>

        {/* Panel 3: More Windows */}
        <div className="xwave-panel">
          <WinWindow title="Lead Details — Not Responding">
            <div style={{padding: 8}}>
              <p style={{fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--win-grey-dark)', marginBottom: 8, borderBottom: '1px solid var(--win-grey-dark)', paddingBottom: 4}}>SCROLL RIGHT TO SEE MORE PANELS &gt;&gt;&gt;</p>
              {leads.slice(0, 5).map((lead, i) => (
                <div key={lead.id} style={{padding: 6, marginBottom: 4, background: i % 2 === 0 ? 'var(--win-white)' : 'var(--win-grey-light)', border: '1px solid var(--win-grey-dark)', fontFamily: 'var(--font-system)', fontSize: 11}}>
                  <strong>{lead.name}</strong><br />
                  <span style={{color: 'var(--win-grey-dark)'}}>{lead.niche || lead.category} | {lead.city || 'India'}</span><br />
                  <span style={{fontFamily: 'var(--font-mono)', fontSize: 12}}>{lead.phone || 'No phone'}</span>
                </div>
              ))}
              {leads.length === 0 && <p style={{fontFamily: 'var(--font-system)', fontSize: 12, color: 'var(--win-grey-dark)', textAlign: 'center', padding: 20}}>No leads loaded yet.</p>}
            </div>
          </WinWindow>

          <WinWindow title="Diagnostics — Not Responding">
            <div style={{padding: 8}}>
              <div style={{background: 'var(--win-white)', border: '2px solid', borderColor: 'var(--win-btn-dk-shadow) var(--win-btn-highlight) var(--win-btn-highlight) var(--win-btn-dk-shadow)', padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8}}>
                <p>BYTERS DIAGNOSTIC REPORT</p>
                <p>========================</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
                <p>Leads in DB: {leads.length}</p>
                <p>Demos ready: {leads.filter(l => l.demo_url).length}</p>
                <p>Pitched: {leads.filter(l => l.pitched).length}</p>
                <p>Pipeline: {loading ? 'RUNNING' : 'IDLE'}</p>
                <p>Status: NOT RESPONDING</p>
                <p>========================</p>
                <p style={{color: 'var(--win-grey-dark)'}}>End of report.</p>
              </div>
            </div>
          </WinWindow>
        </div>

        {/* Panel 4: Overflow / Extra */}
        <div className="xwave-panel">
          <WinWindow title="Clipboard Viewer — Not Responding">
            <div style={{padding: 8}}>
              <p style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--win-black)', lineHeight: 1.6}}>
                The contents of the clipboard have not been saved.<br />
                Do you want to save the clipboard contents before quitting?<br /><br />
                <strong>Warning:</strong> Scrolling to the right may cause<br />
                additional horizontal displacement. The X-Wave<br />
                distortion field is active and cannot be disabled.<br /><br />
                If you are experiencing difficulty reading this text,<br />
                please adjust your monitor resolution to 640x480.<br /><br />
                This panel intentionally has no vertical scroll.<br />
                You must scroll horizontally to navigate between<br />
                panels. This is a feature, not a bug.
              </p>
            </div>
          </WinWindow>

          <WinWindow title="Phone Dialer — Not Responding">
            <div style={{padding: 8, textAlign: 'center'}}>
              <div style={{background: 'var(--win-white)', border: '2px solid', borderColor: 'var(--win-btn-dk-shadow) var(--win-btn-highlight) var(--win-btn-highlight) var(--win-btn-dk-shadow)', padding: 8, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 18, letterSpacing: 2}}>
                {leads.length > 0 ? (leads[0].phone || 'No number') : '-- -- -- --'}
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4}}>
                {['1','2','3','4','5','6','7','8','9','*','0','#'].map(n => (
                  <button key={n} className="win-btn" style={{justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14}}>{n}</button>
                ))}
              </div>
              <button className="win-btn win-btn-primary" style={{width: '100%', marginTop: 8, justifyContent: 'center'}}>Dial</button>
            </div>
          </WinWindow>
        </div>
      </div>

      <div className="win-taskbar">
        <button className="taskbar-start">&#91;START&#93;</button>
        <div className="taskbar-divider"></div>
        <div className="taskbar-app">&#9203; Byters.exe - Not Responding</div>
        <div className="taskbar-spacer"></div>
        <div className="taskbar-clock">{clockTime}</div>
      </div>

      {toast.show && (
        <div className="toast-notification">
          <span className="toast-icon">&#10003;</span> {toast.message}
        </div>
      )}
    </div>
  )
}