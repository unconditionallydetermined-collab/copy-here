import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../services/api'
import { Bot, Send, Loader2, User, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const SUGGESTED = [
  'Am I ready for an SDE internship?',
  'What skills should I learn next?',
  'Which DSA topics should I focus on?',
  'How can I improve my resume?',
  'What projects should I build for a Java developer role?',
  'How do I prepare for technical interviews?',
]

function MarkdownText({ text }) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-slate-900 mt-2">{line.slice(3)}</h3>
        if (line.startsWith('# '))  return <h2 key={i} className="text-base font-bold text-slate-900 mt-2">{line.slice(2)}</h2>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold">{line.slice(2, -2)}</p>
        if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4 list-disc leading-relaxed">{line.slice(2)}</li>
        if (/^\d+\./.test(line)) return <li key={i} className="text-sm ml-4 list-decimal leading-relaxed">{line.replace(/^\d+\.\s/, '')}</li>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI Career Assistant powered by Gemini. I can help you with career advice, skill recommendations, interview prep, and more. What would you like to know?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [skillGapMode, setSkillGapMode] = useState(false)
  const [jobDesc, setJobDesc] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const { data } = await aiApi.chat(msg)
      setMessages(prev => [...prev, { role: 'ai', text: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Sorry, I encountered an error. Please check your API configuration.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSkillGap = async () => {
    if (!jobDesc.trim()) { toast.error('Paste a job description first'); return }
    setAnalyzing(true)
    try {
      const { data } = await aiApi.skillGap(jobDesc)
      setMessages(prev => [...prev,
        { role: 'user', text: 'Analyze skill gap for this job description...' },
        { role: 'ai', text: data.result }
      ])
      setSkillGapMode(false)
      setJobDesc('')
    } catch {
      toast.error('Skill gap analysis failed')
    } finally {
      setAnalyzing(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="page-title">AI Career Assistant</h2>
          <p className="page-subtitle">Powered by Gemini · Context-aware career guidance</p>
        </div>
        <button
          onClick={() => setSkillGapMode(!skillGapMode)}
          className={`btn btn-sm ${skillGapMode ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={13} /> Skill Gap Analysis
        </button>
      </div>

      {/* Skill Gap Panel */}
      {skillGapMode && (
        <div className="card p-4 mb-4 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-600" /> Job Description Skill-Gap Analysis
          </h3>
          <textarea
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            className="input mb-3"
            rows={5}
            placeholder="Paste the full job description here. AI will compare it with your skills and identify gaps..."
          />
          <div className="flex gap-3">
            <button onClick={() => { setSkillGapMode(false); setJobDesc('') }} className="btn btn-secondary btn-sm">Cancel</button>
            <button onClick={handleSkillGap} disabled={analyzing} className="btn btn-primary btn-sm gap-1.5">
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {analyzing ? 'Analyzing...' : 'Analyze Gap'}
            </button>
          </div>
        </div>
      )}

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.role === 'ai' ? 'bg-blue-600' : 'bg-slate-200'}`}>
              {m.role === 'ai' ? <Bot size={15} className="text-white" /> : <User size={15} className="text-slate-600" />}
            </div>
            <div className={`max-w-[80%] p-4 ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              {m.role === 'ai' ? <MarkdownText text={m.text} /> : <p className="text-sm">{m.text}</p>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="chat-bubble-ai p-4 flex items-center gap-2">
              <Loader2 size={14} className="text-blue-600 animate-spin" />
              <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex gap-3 items-end">
        <textarea
          id="ai-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask about your career, skills, interview prep..."
          className="flex-1 text-sm border-0 outline-none resize-none font-sans text-slate-800 placeholder-slate-400 max-h-32 leading-relaxed"
          rows={1}
        />
        <button
          id="ai-send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn btn-primary p-2.5 rounded-xl flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
