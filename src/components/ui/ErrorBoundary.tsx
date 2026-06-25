import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  label?: string
}
interface State {
  error: Error | null
}

// Catches render errors in a subtree so one broken page never blanks the app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[Personal OS] caught render error:', error)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="glass max-w-md rounded-2xl p-8 text-center">
            <div className="mb-3 text-4xl">🧩</div>
            <h2 className="text-lg font-semibold">Something hiccuped</h2>
            <p className="mt-2 text-sm text-white/50">
              {this.props.label ? `The ${this.props.label} view` : 'This view'} hit an unexpected
              state. Your data is safe in local storage.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={this.reset} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold shadow-glow">
                Try again
              </button>
              <button onClick={() => location.assign('/')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
