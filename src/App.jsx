import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { updateLead, fetchAllLeads } from './services/db.js'

const AVATARS = ['#b8955a', '#d4706a', '#8ba89a', '#b8a9d4', '#e8c56d', '#7a7366', '#6b8f7e', '#9b88c2']

const defaultTemplate = "Hi {name}, I am Abir from Byters. I noticed your business does not have a website yet, and in today's digital world, that is costing you customers.\n\nI have created a beautiful, custom website for businesses like yours that gets results. I can build something similar for you in just 2 days for only Rs.5,000.\n\nYour competitors are online. Are you?\n\nPreview what I can do: {demo_link}"

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATARS[Math.abs(hash) % AVATARS.length]
}

function getInitials(name) {
  const parts = (name || '').split(' ')
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0][0] || '?').toUpperCase()
}

function getPriorityClass(p) {
  if (p >= 8) return 'priority-high'
  if (p >= 5) return 'priority-mid'
  if (p >= 1) return 'priority-low'
  return 'priority-none'
}

function DashboardMetrics({ leads }) {
  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched).length
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
    <>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap">&#127919;</div>
          <div className="metric-value">{totalLeads}</div>
          <div className="metric-label">Total Leads</div>
          <div className="metric-trend positive">+{newLeads} pending</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap">&#11088;</div>
          <div className="metric-value">{highPriority}</div>
          <div className="metric-label">High Priority</div>
          <div className="metric-trend">8+/10 Score</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap">&#127760;</div>
          <div className="metric-value">{totalDemos}</div>
          <div className="metric-label">Demos Ready</div>
          <div className="metric-trend">Auto‑generated</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap">&#9989;</div>
          <div className="metric-value">{pitchedLeads}</div>
          <div className="metric-label">Contacted</div>
          <div className="metric-trend positive">{successRate}% Coverage</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="insight-card">
          <h3>Niche Distribution</h3>
          {topNiches.length > 0 ? topNiches.map(([name, count]) => (
            <div key={name} className="insight-row">
              <span>{name}</span>
              <div className="niche-bar-wrap"><div className="niche-bar" style={{ width: String(Math.round((count/totalLeads)*100)) + '%' }} /></div>
              <span className="insight-value">{count}</span>
            </div>
          )) : <p className="empty-text" style={{fontSize: '0.85rem', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center'}}>No data available yet</p>}
        </div>
        <div className="insight-card recent-demos">
          <h3>Recent Demos</h3>
          {leads.filter(l => !!l.demo_url).slice(0, 5).map(lead => (
            <div key={lead.id} className="demo-item">
              <span className="demo-item-icon">&#127760;</span>
              <div className="demo-item-info">
                <span className="demo-item-name">{lead.name}</span>
                <span className="demo-item-niche">{lead.niche || lead.category}</span>
              </div>
              <a href={lead.demo_url} target="_blank" rel="noreferrer" className="demo-item-link">View</a>
            </div>
          ))}
          {totalDemos === 0 && <p className="empty-text" style={{fontSize: '0.85rem', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center'}}>No demos generated yet</p>}
        </div>
      </div>
    </>
  )
}

function DashboardQuickActions({ setActiveTab }) {
  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="action-btns">
        <button className="action-btn primary" onClick={() => setActiveTab('leads')}>&#128269; Find New Leads</button>
        <button className="action-btn" onClick={() => setActiveTab('templates')}>&#9998; Edit Message Template</button>
        <button className="action-btn" onClick={() => window.open('https://supabase.com/dashboard', '_blank')}>&#128451; Open Database</button>
      </div>
    </div>
  )
}

function TopProspects({ leads }) {
  const topLeads = leads.filter(l => (l.priority || 0) >= 9).slice(0, 3)
  return (
    <div className="top-prospects">
      <h3>Top Prospects &#8212; Rank 9&#8211;10</h3>
      {topLeads.map(lead => (
        <div key={lead.id} className="prospect-item">
          <div className="prospect-rank">{lead.priority}/10</div>
          <div className="prospect-info">
            <strong>{lead.name}</strong>
            <span>{lead.city} &#183; {lead.niche || lead.category}</span>
          </div>
          {lead.demo_url && <span className="badge-demo">Demo Ready</span>}
        </div>
      ))}
      {topLeads.length === 0 && <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', padding: '16px', fontStyle: 'italic'}}>No top prospects yet. Run the pipeline to generate leads.</p>}
    </div>
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

  const totalLeads = leads.length
  const pitchedLeads = leads.filter(l => l.pitched).length
  const newLeads = leads.filter(l => !l.pitched).length

  const loadLeadsFromDB = async () => {
    const dbLeads = await fetchAllLeads()
    setLeads(dbLeads)
  }

  useEffect(() => { loadLeadsFromDB(); const _noop = setActiveTab; }, [])

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
      showToast('Triggering pipeline...')

      const response = await fetch('http://localhost:3000/api/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ['Cafe', 'Salon', 'Photographer', 'Restaurant', 'Gym', 'Dentist', 'Spa', 'Bakery', 'Coaching Center', 'Boutique'],
          city: 'India'
        })
      })

      if (!response.ok) throw new Error(`Backend returned ${response.status}`)

      const data = await response.json()

      if (data.success) {
        setAiStatus('complete')
        const processed = (data.stats?.evaluated || 0) + (data.stats?.demos || 0)
        showToast(`Pipeline complete! ${processed} leads processed.`)
      } else {
        throw new Error(data.error || 'Unknown error')
      }

      await loadLeadsFromDB()
      setTimeout(() => setAiStatus('idle'), 3000)
    } catch (error) {
      console.error('Pipeline error:', error)
      setAiStatus('idle')
      if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed')) {
        showToast('Cannot connect to backend. Make sure the server is running on port 3000.')
      } else {
        showToast('Pipeline error: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = async (lead) => {
    const message = template
      .replace(/{name}/g, (lead.name || "").split(" ")[0] || "there")
      .replace(/{demo_link}/g, lead.demo_url || 'https://byters.agency/demo')

    await updateLead(lead.id, { pitched: true, status: 'PITCHED', message })
    window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`, '_blank')
    await loadLeadsFromDB()
    showToast('WhatsApp opened!')
  }

  const handleResetTemplate = () => {
    setTemplate(defaultTemplate)
    showToast('Template reset to default')
  }

  const demoLeads = leads.filter(l => !!l.demo_url)


  return (
    <div className="app">
      <div className="app-inner">

        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <div className="header-icon">&#9830;</div>
            <h1 className="header-title">Byters <span>Lead Finder</span></h1>
          </div>
          <p className="header-subtitle">
            AI-powered lead discovery for web agencies. Find businesses without websites, generate demo sites, and close deals.
          </p>
          <div className="header-meta">
            <div className="header-meta-dot" />
            <span>Pipeline {loading ? 'Active' : 'Standby'}</span>
            <span style={{color: 'var(--ink-300)'}}>&#183;</span>
            <span>{leads.length} leads in database</span>
            <span style={{color: 'var(--ink-300)'}}>&#183;</span>
            <span>{demoLeads.length} demos ready</span>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button className={"tab-btn" + (activeTab === "leads" ? " active" : "")} onClick={() => setActiveTab("leads")}>
            <span className="tab-icon">&#128269;</span> Lead Finder
          </button>
          <button className={"tab-btn" + (activeTab === "dashboard" ? " active" : "")} onClick={() => setActiveTab("dashboard")}>
            <span className="tab-icon">&#128202;</span> Analytics
          </button>
          <button className={"tab-btn" + (activeTab === "templates" ? " active" : "")} onClick={() => setActiveTab("templates")}>
            <span className="tab-icon">&#9998;</span> Template
          </button>
        </nav>

        {/* Lead Finder Tab */}
        {activeTab === 'leads' && (
          <div className="section" key="leads">

            <div className="card search-panel">
              <h2 className="search-title">AI-Powered Lead Generation</h2>
              <p className="search-sub">Discover local businesses without websites. One click triggers the entire pipeline.</p>
              <button className="btn-primary" onClick={handleAISearch} disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> {aiStatus === 'scanning' ? 'Scanning directories…' : aiStatus === 'processing' ? 'Processing data…' : 'Wrapping up…'}</>
                ) : (
                  <><span className="btn-icon">&#9889;</span> Find Leads with AI</>
                )}
              </button>
              {aiStatus !== 'idle' && (
                <div className={`ai-status ${aiStatus}`}>
                  <span className="ai-status-icon">
                    {aiStatus === 'scanning' ? '&#128269;' : aiStatus === 'processing' ? '&#9889;' : '&#9989;'}
                  </span>
                  <span className="ai-status-text">
                    {aiStatus === 'scanning' ? 'Scanning directories…' : aiStatus === 'processing' ? 'Processing data…' : 'Complete!'}
                  </span>
                  <div className="ai-progress"><div className="ai-progress-bar" /></div>
                </div>
              )}
            </div>

            {(searched || leads.length > 0) && (
              <div className="stats-bar">
                <div className="stat-item">
                  <span className="stat-number">{totalLeads}</span>
                  <span className="stat-label">Total Found</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{pitchedLeads}</span>
                  <span className="stat-label">Contacted</span>
                </div>
                <div className="stat-item highlight">
                  <span className="stat-number">{newLeads}</span>
                  <span className="stat-label">Ready Now</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                  {aiStatus === 'scanning' ? 'Searching business directories across India…' : 'Processing and evaluating leads with AI…'}
                </p>
              </div>
            ) : leads.length > 0 ? (
              <div className="leads-table-wrap">
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
                      <tr key={lead.id} className={lead.pitched ? 'row-pitched' : ''}>
                        <td>
                          <div className="td-name">
                            <div className="td-name-avatar" style={{ background: getAvatarColor(lead.name) }}>
                              {getInitials(lead.name)}
                            </div>
                            {lead.name}
                          </div>
                        </td>
                        <td><span className="td-niche">{lead.niche || lead.category || 'Business'}</span></td>
                        <td className="td-city">{lead.city || '—'}</td>
                        <td className={"td-phone" + (!lead.phone ? " td-phone-empty" : "")}>{lead.phone || "No phone"}</td>
                        <td>
                          {lead.priority ? (
                            <span className={"td-priority " + getPriorityClass(lead.priority)}>{lead.priority}</span>
                          ) : <span className="priority-none">—</span>}
                        </td>
                        <td className="td-tagline" title={lead.tagline}>{lead.tagline || '—'}</td>
                        <td>
                          <div className="td-actions">
                            {lead.demo_url ? (
                              <a href={lead.demo_url} target="_blank" rel="noreferrer" className="btn-sm btn-sm-demo">Demo</a>
                            ) : (
                              <span className="btn-sm btn-sm-no-demo">No demo</span>
                            )}
                            <button
                              className={`btn-sm btn-sm-pitch ${(lead.pitched || lead.status === "PITCHED") ? "sent" : ""}`}
                              onClick={() => !lead.pitched && lead.status !== "PITCHED" && handleWhatsAppClick(lead)}
                              disabled={lead.pitched || lead.status === "PITCHED"}>
                              {lead.pitched ? "Sent" : "Pitch"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : searched ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <span className="empty-icon">&#9888;</span>
                <h3>No leads found</h3>
                <p>Try again or check your backend connection.</p>
              </div>
            ) : (
              <div className="card empty-state">
                <span className="empty-icon">&#9889;</span>
                <h3>AI Lead Discovery</h3>
                <p>Click &#8220;Find Leads with AI&#8221; above to discover businesses that need a website.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'dashboard' && (
          <div className="section" key="dashboard">
            <div className="card">
              <div className="dashboard-header">
                <h2>&#128202; Business Analytics</h2>
                <p className="dashboard-subtitle">Real-time pipeline performance &amp; lead intelligence</p>
              </div>
              <DashboardMetrics leads={leads} />
              <DashboardQuickActions setActiveTab={setActiveTab} />
              <TopProspects leads={leads} />
            </div>
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'templates' && (
          <div className="section" key="templates" >
            <div className="card">
              <div className="card-header">
                <h2>Message Template</h2>
                <p className="card-subtitle">Customize your WhatsApp outreach message</p>
              </div>

              <div className="template-preview-header">
                <span className="label">Live Preview</span>
                <span className="var-hint">Variables: {'{name}'}, {'{demo_link}'}</span>
              </div>
              <div className="template-preview">{template}</div>

              <div className="template-edit-section">
                <div className="template-edit-header">
                  <h3>Edit Template</h3>
                  <button className="btn-reset" onClick={handleResetTemplate}>Reset to Default</button>
                </div>
                <textarea
                  className="textarea"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={8}
                  placeholder="Write your message template…"
                />
                <div className="template-vars-info">
                  <span className="var-tag">{'{name}'}</span>
                  <span className="var-desc">Contact name</span>
                  <span className="var-tag">{'{demo_link}'}</span>
                  <span className="var-desc">Demo website link</span>
                </div>
                <button className="btn-save" onClick={() => showToast('Template saved!')}>
                  Save Template
                </button>
              </div>

              {demoLeads.length > 0 && (
                <div className="portfolio-section">
                  <h3>Generated Demos Portfolio</h3>
                  <p className="portfolio-sub">Review and share your AI-generated demo websites</p>
                  <div className="portfolio-grid">
                    {demoLeads.map(lead => (
                      <div key={lead.id} className="portfolio-card">
                        <div className="portfolio-card-header">
                          <span className="pf-niche-badge">{lead.niche || lead.category}</span>
                          <span className="pf-priority">P{lead.priority || '—'}</span>
                        </div>
                        <div className="pf-name">{lead.name}</div>
                        <p className="pf-city">{lead.city}</p>
                        <div className="pf-actions">
                          <a href={lead.demo_url} target="_blank" rel="noreferrer" className="pf-btn">Preview</a>
                          <button className="pf-btn copy" onClick={() => { navigator.clipboard.writeText(lead.demo_url); showToast('Link copied!') }}>Copy Link</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {demoLeads.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--text-muted)' }}>
                  <p>No demos generated yet. Run the pipeline to create demo sites.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>Byters Lead Finder &mdash; Digital Growth for Every Business</p>
          <p style={{ opacity: 0.6 }}>Build 4.2 &middot; Solo Operator Ready</p>
        </footer>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="toast">
          <span className="toast-icon">&#10003;</span> {toast.message}
        </div>
      )}
    </div>
  )
}
