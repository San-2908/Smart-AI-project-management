import { useState } from 'react'
import axios from 'axios'
import { Rocket, CheckCircle, List, Code, ShieldCheck, Loader2 } from 'lucide-react'
import Auth from './components/Auth/Auth'

function App() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [tasks, setTasks] = useState([])
  const [notionPageId, setNotionPageId] = useState(null)
  const [projectId, setProjectId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [codeReview, setCodeReview] = useState(null)
  const [error, setError] = useState(null)
  const [view, setView] = useState('projects') // 'projects' or 'crm'
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(localStorage.getItem('user'))
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '' })
  const [currentStep, setCurrentStep] = useState(1) // 1: Idea, 2: Plan, 3: Tasks, 4: Code


  const handleAuth = async (formData, mode) => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData)
      if (mode === 'login') {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', response.data.username)
        setToken(response.data.token)
        setUser(response.data.username)
      } else {
        setAuthMode('login')
        alert("Registration successful! Please login.")
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const [leads, setLeads] = useState([
    { name: "John Doe", email: "john@example.com", inquiry: "Needs a mobile app for a startup", score: 85, category: "Hot" },
    { name: "Jane Smith", email: "jane@corp.com", inquiry: "Looking for an enterprise CRM update", score: 60, category: "Warm" }
  ])
  const [newLead, setNewLead] = useState({ name: '', inquiry: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setPlan(null)
    setTasks([])
    setNotionPageId(null)
    setProjectId(null)
    setSelectedTask(null)
    setGeneratedCode(null)
    setCodeReview(null)
    setError(null)
    try {
      const response = await axios.post('http://localhost:5000/api/plan', { idea })
      setPlan(response.data.plan)
      setProjectId(response.data.plan._id)
      setNotionPageId(response.data.notionPageId)
      setCurrentStep(2)
    } catch (err) {
      console.error("API Error:", err);
      const msg = err.response?.data?.error || err.message || 'Failed to generate plan';
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  const handleAddLead = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:5000/api/crm/score', { leadData: newLead })
      const analyzedLead = { 
        ...newLead, 
        ...response.data.analysis, 
        email: `${newLead.name.toLowerCase().replace(' ', '.')}@example.com` 
      }
      setLeads([...leads, analyzedLead])
      setNewLead({ name: '', inquiry: '' })
    } catch (err) {
      setError('Failed to analyze lead')
    } finally {
      setLoading(false)
    }
  }

  const generateTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('http://localhost:5000/api/tasks', { plan })
      setTasks(response.data.tasks)
      setCurrentStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate tasks')
    } finally {
      setLoading(false)
    }
  }

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );


  const handleTaskClick = async (task) => {
    setSelectedTask(task)
    setGeneratedCode(null)
    setCodeReview(null)
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:5000/api/generate-code', { 
        task, 
        techStack: plan.techStack 
      })
      setGeneratedCode(response.data.code)
      setCodeReview(response.data.review)
      setCurrentStep(4)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate code')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Auth 
        mode={authMode} 
        setMode={setAuthMode} 
        onAuth={handleAuth} 
        loading={loading} 
        error={error} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <nav style={{maxWidth:'56rem', margin:'0 auto 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1.25rem', background:'rgba(30,41,59,0.5)', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(12px)'}}>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('projects')}
            style={{padding:'0.625rem 1.25rem', borderRadius:'0.5rem', fontWeight:700, fontSize:'0.875rem', border:'none', cursor:'pointer', transition:'all 0.3s', background: view === 'projects' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent', color: view === 'projects' ? 'white' : '#94a3b8', boxShadow: view === 'projects' ? '0 4px 12px -2px rgba(37,99,235,0.3)' : 'none'}}
          >
            🚀 Project Manager
          </button>
          <button 
            onClick={() => setView('crm')}
            style={{padding:'0.625rem 1.25rem', borderRadius:'0.5rem', fontWeight:700, fontSize:'0.875rem', border:'none', cursor:'pointer', transition:'all 0.3s', background: view === 'crm' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent', color: view === 'crm' ? 'white' : '#94a3b8', boxShadow: view === 'crm' ? '0 4px 12px -2px rgba(37,99,235,0.3)' : 'none'}}
          >
            📊 CRM Dashboard
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Logged in as <span className="text-slate-300 font-bold">{user}</span></span>
          <button 
            onClick={handleLogout}
            style={{fontSize:'0.75rem', background:'rgba(127,29,29,0.2)', color:'#f87171', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', border:'1px solid rgba(127,29,29,0.4)', cursor:'pointer', transition:'all 0.3s', fontWeight:600}}
          >
            Logout
          </button>
        </div>
      </nav>

      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          {view === 'projects' ? 'Agentic AI Project Manager' : 'Intelligent CRM System'}
        </h1>
        <p className="text-slate-400">
          {view === 'projects' ? 'Turn your ideas into production-ready project plans.' : 'Manage leads and automate communications with AI.'}
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        {view === 'projects' ? (
          <div className="animate-in">
            {/* Stepper */}
            <div className="stepper max-w-2xl mx-auto">
              {[
                { n: 1, l: 'Ideation', icon: <Rocket size={16} /> },
                { n: 2, l: 'Blueprint', icon: <List size={16} /> },
                { n: 3, l: 'Task Factory', icon: <ShieldCheck size={16} /> },
                { n: 4, l: 'Coding Lab', icon: <Code size={16} /> }
              ].map(s => (
                <div key={s.n} className={`step-item ${currentStep === s.n ? 'active' : ''} ${currentStep > s.n ? 'completed' : ''}`}>
                  <div className="step-circle">{currentStep > s.n ? '✓' : s.icon}</div>
                  <span className="step-label">{s.l}</span>
                </div>
              ))}
            </div>

            {currentStep === 1 && (
              <section className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 mb-8 max-w-2xl mx-auto animate-in">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">What are we building today?</h2>
                    <p className="text-slate-400 text-sm">Describe your project idea and the Planner Agent will generate a blueprint.</p>
                  </div>
                  <textarea
                    className="bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] text-lg"
                    placeholder="e.g. A marketplace for digital art with NFT integration..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 flex items-center justify-center gap-3 disabled:opacity-50 text-lg shadow-lg"
                  >
                    {loading ? 'Planner Agent is thinking...' : <><Rocket size={24} /> Generate Blueprint</>}
                  </button>
                </form>
              </section>
            )}

            {currentStep === 2 && plan && (
              <div className="space-y-8 animate-in">
                <div className="agent-card p-10 shadow-2xl border border-white/5">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', gap:'1.5rem'}}>
                    <div style={{flex:1, minWidth:0}}>
                      <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-500/20" style={{display:'inline-block', marginBottom:'0.75rem'}}>Agent Blueprint</span>
                      <h2 className="text-3xl font-black text-white mb-2" style={{wordBreak:'break-word'}}>{plan.title}</h2>
                      <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="btn-ghost"
                    >
                      ← Edit Idea
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition">
                      <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-emerald-400">
                        <CheckCircle size={20} /> Strategic Objectives
                      </h3>
                      <ul className="space-y-3">
                        {plan.objectives?.map((obj, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-3 leading-relaxed">
                            <span className="text-emerald-500/50 mt-1">✔</span> {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-purple-500/20 transition">
                      <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-purple-400">
                        <Code size={20} /> Tech Architecture
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {plan.techStack?.map((tech, i) => (
                          <span key={i} className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-mono text-purple-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="flex items-center gap-2 text-lg font-bold mb-6 text-orange-400">
                      <List size={20} /> Execution Roadmap
                    </h3>
                    <div className="grid gap-6">
                      {plan.phases?.map((phase, i) => (
                        <div key={i} className="group flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all duration-300">
                           <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400">
                              {i + 1}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-100 text-lg mb-1 group-hover:text-orange-400 transition">{phase.name}</h4>
                              <p className="text-sm text-slate-400 leading-relaxed">{phase.description}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-blue-500/5 border border-blue-500/20 rounded-2xl mt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <ClockIcon />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Estimated Timeline</p>
                        <p className="text-xl font-black text-blue-400">{plan.estimatedTimeline || "Calculating..."}</p>
                      </div>
                    </div>
                    <button
                      onClick={generateTasks}
                      disabled={loading}
                      className="btn-primary px-10 py-4 text-lg w-full sm:w-auto"
                    >
                      {loading ? 'Agent Processing...' : <><ShieldCheck size={24} /> Approve & Breakdown Tasks</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && tasks.length > 0 && (
              <div className="animate-in max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-emerald-400 flex items-center gap-3">
                      <ShieldCheck size={32} /> Task Factory
                    </h2>
                    <p className="text-slate-400 mt-1">Click a task card to start implementation lab.</p>
                  </div>
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="btn-ghost"
                  >
                    ← Back to Blueprint
                  </button>
                </div>
                <div className="grid gap-4">
                  {tasks.map((task, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleTaskClick(task)}
                      className="group agent-card p-6 cursor-pointer hover:border-blue-500/50 transition-all flex justify-between items-center relative overflow-hidden"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-100 text-xl group-hover:text-blue-400 transition">{task.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                            task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {task.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
                      </div>
                      <div className="ml-6 flex-shrink-0">
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Code size={24} />
                        </div>
                      </div>
                      {/* Decorative background element */}
                      <div className="absolute -right-4 -bottom-4 text-white/5 transform rotate-12 pointer-events-none">
                         <Code size={100} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && selectedTask && (
              <div className="animate-in" style={{maxWidth:'64rem', margin:'0 auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-400" style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <Code size={24} /> Coding Lab
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Implementing: <span className="text-slate-300 font-semibold">{selectedTask.title}</span></p>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="btn-ghost">
                    ← Back to Tasks
                  </button>
                </div>

                <div className="agent-card overflow-hidden shadow-2xl">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.5rem', background:'rgba(51,65,85,0.4)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <div className="flex gap-2">
                      <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#ef4444'}}></div>
                      <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#eab308'}}></div>
                      <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#22c55e'}}></div>
                    </div>
                    {codeReview && (
                      <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                        codeReview.score > 80 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-orange-900/50 text-orange-400'
                      }`}>
                        Review Score: {codeReview.score}/100
                      </div>
                    )}
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 320px', minHeight:'450px'}}>
                    <div style={{padding:'1.5rem', background:'#0d1117', fontFamily:"'JetBrains Mono', monospace", fontSize:'0.8125rem', overflowX:'auto'}}>
                      {loading && !generatedCode ? (
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#64748b'}}>
                          <Loader2 className="animate-spin" size={36} style={{marginBottom:'1rem'}} />
                          <p>Code Agent is writing & Review Agent is analyzing...</p>
                        </div>
                      ) : (
                        <pre className="text-slate-300 leading-relaxed" style={{margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{generatedCode || 'No code generated yet.'}</pre>
                      )}
                    </div>
                    
                    <div style={{padding:'1.5rem', background:'rgba(30,41,59,0.5)', borderLeft:'1px solid rgba(255,255,255,0.06)'}}>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                        ✦ Agent Suggestions
                      </h4>
                      {codeReview ? (
                        <div>
                          <ul className="space-y-4">
                            {codeReview.suggestions?.map((s, i) => (
                              <li key={i} className="text-sm text-slate-300 leading-relaxed" style={{display:'flex', gap:'0.75rem'}}>
                                <span className="text-blue-500" style={{flexShrink:0, marginTop:'2px'}}>✦</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div style={{marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                            <p className="text-xs text-slate-500 leading-relaxed italic">{codeReview.summary}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-600 text-sm italic">Waiting for agents to complete their review...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (

          <section className="animate-in">
            {/* CRM Analytics Header */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem', marginBottom:'2rem'}}>
              <div className="agent-card p-6 text-center">
                <div className="text-3xl font-black text-emerald-400 mb-1">{leads.filter(l => l.category === 'Hot').length}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Hot Leads</div>
              </div>
              <div className="agent-card p-6 text-center">
                <div className="text-3xl font-black text-orange-400 mb-1">{leads.filter(l => l.category === 'Warm').length}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Warm Leads</div>
              </div>
              <div className="agent-card p-6 text-center">
                <div className="text-3xl font-black text-blue-400 mb-1">{leads.length}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Inquiries</div>
              </div>
            </div>

            {/* Add Lead Form */}
            <div className="agent-card p-8 mb-8">
              <h3 className="text-lg font-bold mb-6 text-blue-400" style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <Rocket size={20} /> Add New Lead
              </h3>
              <form onSubmit={handleAddLead} style={{display:'grid', gap:'1rem'}}>
                <input 
                  style={{background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.875rem 1rem', color:'white', fontSize:'0.9375rem', outline:'none', transition:'border-color 0.3s'}}
                  placeholder="Lead Name"
                  value={newLead.name}
                  onChange={e => setNewLead({...newLead, name: e.target.value})}
                  required
                />
                <textarea 
                  style={{background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.875rem 1rem', color:'white', fontSize:'0.9375rem', outline:'none', minHeight:'80px', resize:'vertical', transition:'border-color 0.3s', fontFamily:'inherit'}}
                  placeholder="Project Inquiry / Context"
                  value={newLead.inquiry}
                  onChange={e => setNewLead({...newLead, inquiry: e.target.value})}
                  required
                />
                <button className="btn-primary" style={{justifyContent:'center', padding:'0.875rem'}}>
                  {loading ? 'Analyzing...' : '✦ Analyze & Add Lead'}
                </button>
              </form>
            </div>

            {/* Lead Cards */}
            <div style={{display:'grid', gap:'1.25rem'}}>
              {leads.map((lead, i) => (
                <div key={i} className="agent-card p-6 relative overflow-hidden">
                  <div style={{position:'absolute', top:0, right:0, width:'3px', height:'100%', background: lead.score > 70 ? '#10b981' : '#fb923c', borderRadius:'0 0 0 4px'}}></div>
                  
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
                    <div>
                      <h4 className="font-bold text-xl text-slate-100">{lead.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${lead.score > 70 ? 'text-emerald-400' : 'text-orange-400'}`}>{lead.score}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Score</div>
                    </div>
                  </div>

                  <div style={{background:'rgba(15,23,42,0.4)', padding:'1rem', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'1rem'}}>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"{lead.inquiry}"</p>
                    <div style={{marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                      <p className="text-xs text-slate-400"><span className="text-blue-400 font-bold uppercase">AI Reasoning:</span> {lead.reasoning || "Analyzing budget and requirements..."}</p>
                    </div>
                  </div>

                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem'}}>
                    <div style={{flex:1}}>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Recommended Next Step</p>
                      <p className="text-sm text-emerald-400 font-medium">{lead.nextStep || "Schedule discovery call"}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axios.post('http://localhost:5000/api/crm/communicate', { lead, context: lead.inquiry })
                          const emailStatus = res.data.emailSent 
                            ? `✅ Email sent to ${lead.email}` 
                            : `⚠️ Email not sent: ${res.data.emailInfo}`;
                          alert(`FOLLOW-UP MESSAGE:\n\n${res.data.message}\n\n─────────────\n${emailStatus}`)
                        } catch (err) {
                          alert('Failed to generate follow-up: ' + (err.response?.data?.error || err.message))
                        }
                      }}
                      className="btn-ghost"
                      style={{borderColor:'rgba(59,130,246,0.3)', color:'#60a5fa'}}
                    >
                      Generate Follow-up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
