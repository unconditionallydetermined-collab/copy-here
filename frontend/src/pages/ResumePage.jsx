import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { resumeApi, aiApi, skillsApi } from '../services/api'
import logger from '../services/logger'
import { Upload, FileText, CheckCircle2, Loader2, Zap, Brain, RefreshCw, ExternalLink, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

function MarkdownText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-bold text-slate-900 mt-4 first:mt-0">{line.slice(3)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-semibold text-slate-800 mt-2">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="text-sm text-slate-600 ml-4 list-disc">{line.slice(2)}</li>
        }
        if (/^\d+\./.test(line)) {
          return <li key={i} className="text-sm text-slate-600 ml-4 list-disc">{line.replace(/^\d+\.\s*/, '')}</li>
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm text-slate-600">{line}</p>
      })}
    </div>
  )
}

export default function ResumePage() {
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [importingSkills, setImportingSkills] = useState(false)

  useEffect(() => {
    logger.debug('ResumePage', 'Loading existing resume')
    resumeApi.get()
      .then(r => {
        setResume(r.data)
        logger.info('ResumePage', 'Loaded existing resume', { fileName: r.data?.fileName, skillsCount: r.data?.extractedSkills?.length })
      })
      .catch((err) => {
        logger.debug('ResumePage', 'No existing resume or fetch error', { message: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return

    logger.info('ResumeUpload', 'File selected for upload', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
      logger.warn('ResumeUpload', 'File rejected: unsupported extension', { fileName: file.name, type: file.type })
      toast.error('Only PDF, DOCX or TXT files are supported')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading... server may take a moment to wake up')
    const formData = new FormData()
    formData.append('file', file)
    const startTime = Date.now()

    try {
      logger.info('ResumeUpload', 'Sending upload request to backend', { fileName: file.name, size: file.size })
      const { data } = await resumeApi.upload(formData)
      const durationMs = Date.now() - startTime
      setResume(data)
      setAnalysis(null)
      logger.info('ResumeUpload', `Upload and extraction completed in ${durationMs}ms`, {
        fileName: data.fileName,
        skillsCount: data.extractedSkills?.length || 0,
        durationMs
      })
      toast.success('Resume uploaded successfully!', { id: toastId })
    } catch (err) {
      const durationMs = Date.now() - startTime
      let errorMsg = 'Failed to upload resume'
      if (!err.response) {
        errorMsg = "Can't reach the server. It may be waking up, so try again in 30 seconds."
      } else if (err.response.status === 401) {
        errorMsg = 'Session expired, please sign in again.'
      } else if (err.response.status === 413) {
        errorMsg = 'File too large (max 10 MB).'
      } else if (err.response.data?.message) {
        errorMsg = err.response.data.message
      } else if (typeof err.response.data === 'string') {
        errorMsg = err.response.data
      }

      logger.error('ResumeUpload', `Upload failed after ${durationMs}ms: ${errorMsg}`, {
        fileName: file.name,
        size: file.size,
        status: err.response?.status,
        durationMs,
        response: err.response?.data
      })

      toast.error(errorMsg, { id: toastId })
    } finally {
      setUploading(false)
    }
  }, [])

  const onDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections[0]
    if (!rejection) return
    const error = rejection.errors[0]

    logger.warn('ResumeUpload', 'Dropzone rejected file', {
      fileName: rejection.file?.name,
      fileSize: rejection.file?.size,
      fileType: rejection.file?.type,
      rejectionCode: error?.code,
      rejectionMessage: error?.message
    })

    if (error?.code === 'file-too-large') {
      toast.error('File is larger than 10 MB')
    } else if (error?.code === 'file-invalid-type') {
      toast.error('Only PDF, DOCX or TXT files are supported')
    } else if (error?.code === 'too-many-files') {
      toast.error('Upload one file at a time')
    } else {
      toast.error(error?.message || 'Rejected file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const startTime = Date.now()
    logger.info('AI', 'AI Resume Review started', { resumeId: resume?.id })
    try {
      const { data } = await aiApi.resumeReview()
      const durationMs = Date.now() - startTime
      setAnalysis(data)
      logger.info('AI', `AI Resume Review succeeded in ${durationMs}ms`)
      toast.success('AI analysis complete!')
    } catch (err) {
      const durationMs = Date.now() - startTime
      logger.error('AI', `AI Resume Review failed after ${durationMs}ms`, { error: err.message, response: err.response?.data })
      toast.error('Analysis failed. Make sure you have a resume uploaded.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImportSkills = async () => {
    if (!resume?.extractedSkills || resume.extractedSkills.length === 0) return
    setImportingSkills(true)
    try {
      await skillsApi.addBatch(resume.extractedSkills)
      logger.info('Skills', `Imported ${resume.extractedSkills.length} skills from resume`)
      toast.success(`Successfully imported ${resume.extractedSkills.length} skills to your profile!`)
    } catch (err) {
      logger.error('Skills', 'Failed to import skills from resume', { error: err.message })
      toast.error('Failed to import skills.')
    } finally {
      setImportingSkills(false)
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Left: Upload */}
      <div className="space-y-5">
        {/* Upload zone */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Upload size={15} className="text-blue-600" /> Upload Resume
          </h3>

          <div
            {...getRootProps()}
            id="resume-dropzone"
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
          >
            <input {...getInputProps()} id="resume-file-input" />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-blue-600 animate-spin" />
                <p className="text-sm text-slate-600">Uploading & extracting text...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Upload size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resume info */}
        {resume && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{resume.fileName}</p>
                <p className="text-xs text-slate-500">Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {resume.fileUrl && (
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="View uploaded resume"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
            </div>

            {resume.extractedSkills?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">Extracted Skills ({resume.extractedSkills.length})</p>
                  <button
                    onClick={handleImportSkills}
                    disabled={importingSkills}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {importingSkills ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                    Import to Skills
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resume.extractedSkills.map(s => (
                    <span key={s} className="badge badge-blue">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              id="ai-resume-analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn btn-primary w-full justify-center"
            >
              {analyzing
                ? <><Loader2 size={15} className="animate-spin" /> Analyzing with AI...</>
                : <><Brain size={15} /> Analyze with AI</>}
            </button>
          </div>
        )}
      </div>

      {/* Right: AI Analysis */}
      <div className="space-y-5">
        {analysis ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Brain size={15} className="text-blue-600" /> AI Resume Analysis
              </h3>
              <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-secondary btn-sm gap-1.5">
                <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} /> Re-analyze
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
              <MarkdownText text={analysis.result} />
            </div>
          </div>
        ) : (
          <div className="card p-6 flex flex-col items-center justify-center text-center min-h-64">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Brain size={28} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">AI Resume Analysis</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs">
              {resume
                ? 'Click "Analyze with AI" to get personalized feedback on your resume.'
                : 'Upload your resume first, then get AI-powered analysis and improvement suggestions.'}
            </p>
            {resume && (
              <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary">
                {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
