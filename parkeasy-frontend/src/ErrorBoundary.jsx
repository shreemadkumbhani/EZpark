import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            color: "#f87171",
            padding: "20px",
            backgroundColor: "#1a1a1a",
            minHeight: "100vh",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ color: "#ef4444" }}>⚠️ Something went wrong</h2>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "16px" }}>
            <summary style={{ cursor: "pointer", color: "#fbbf24" }}>
              Error Details
            </summary>
            <p style={{ marginTop: "8px" }}>{this.state.error.toString()}</p>
            {this.state.errorInfo && (
              <pre style={{ fontSize: "0.85rem", overflow: "auto" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
