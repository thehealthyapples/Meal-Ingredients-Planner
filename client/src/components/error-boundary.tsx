// PX1-W0 — the canonical error boundary.
//
// There was none. `grep -r ErrorBoundary client/src` returned zero files, so any
// render-time throw on a household page took the whole app to a white screen — no
// words, no way back, no evidence for us that it happened.
//
// It wraps the routed page (App.tsx), inside the shell, so the header and the
// bottom nav survive the failure: the household is never stranded on a page they
// cannot leave. Resetting on navigation means a broken surface does not stay
// broken once they have walked away from it.
//
// It renders the canonical `LoadError` — the same voice a failed query speaks in —
// so a crash and a failed fetch say the same kind of thing, and neither can be
// mistaken for an empty household.

import { Component, type ErrorInfo, type ReactNode } from "react";
import { LoadError } from "@/components/ui/load-error";

interface Props {
  children: ReactNode;
  /** Changing this resets the boundary — App passes the current location. */
  resetKey?: string;
  /** What this boundary is protecting, in the household's words. */
  what?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The household gets plain words; the console gets the truth.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10" data-testid="page-error-boundary">
        <LoadError
          what={this.props.what ?? "this page"}
          description="Something went wrong while showing this page. Nothing has been lost — your data is safe."
          onRetry={() => this.setState({ hasError: false })}
          data-testid="page-error"
        />
      </div>
    );
  }
}

export default ErrorBoundary;
