import React from 'react'
import logger from '../services/logger'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ReactErrorBoundary', error.message || 'React render crash', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo?.componentStack
    })
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="card max-w-lg w-full p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
            <p className="text-sm text-slate-600">
              An unexpected application error occurred. Details have been logged to the debug system.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-mono rounded-lg text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={this.handleReload} className="btn btn-primary gap-2">
                <RefreshCw size={15} /> Reload Application
              </button>
              <a href="/debug" className="btn btn-secondary">
                View Debug Logs
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
