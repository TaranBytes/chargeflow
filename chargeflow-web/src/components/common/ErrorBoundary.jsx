import { Component } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

/**
 * Catches render errors in any child subtree.
 * Renders a friendly fallback so the whole app doesn't disappear.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // In production wire this up to Sentry / Datadog / your error sink.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    if (typeof this.props.onReset === 'function') this.props.onReset()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 grid place-items-center mx-auto text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Something broke</h1>
          <p className="mt-1 text-sm text-slate-500">
            The app hit an unexpected error. You can refresh and try again.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-[11px] text-left bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-40 text-rose-700">
              {String(this.state.error?.stack || this.state.error?.message)}
            </pre>
          )}
          <div className="mt-5 flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg"
            >
              <RotateCw className="w-4 h-4" /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
