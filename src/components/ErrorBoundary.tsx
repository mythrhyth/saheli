import { Component, type ErrorInfo, type ReactNode } from "react"
import { Icon } from "@/components/ui"
import { clearAll } from "@/lib/storage"

type State = { error: Error | null }

/** Catches render errors and offers to reset local data (the usual cause is stale saved state). */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Saheli render error", error, info)
  }

  private recover = () => {
    clearAll()
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="recovery-screen">
        <div className="brandmark">
          <Icon name="shield" />
        </div>
        <h1>Let’s refresh Saheli</h1>
        <p>
          Saved data on this device prevented this screen from loading. Resetting only clears data stored on this
          device.
        </p>
        <button type="button" className="primary" onClick={this.recover}>
          Reset and reopen
        </button>
        <details>
          <summary>Technical details</summary>
          <code>{this.state.error.message}</code>
        </details>
      </main>
    )
  }
}
