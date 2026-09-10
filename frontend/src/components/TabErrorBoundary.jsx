import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab runtime error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-pane active fade-in" style={{ padding: "2rem", textAlign: "center" }}>
          <div className="glass card" style={{ maxWidth: "560px", margin: "2rem auto", padding: "2rem" }}>
            <AlertTriangle size={36} className="text-cyan" style={{ margin: "0 auto 1rem auto" }} />
            <h3 className="subheading" style={{ marginBottom: "0.5rem" }}>Tab Initialization Notice</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: "1.5rem" }}>
              {this.state.error?.message || "An unexpected telemetry rendering event occurred."}
            </p>
            <button className="btn" onClick={this.handleReset}>
              <RefreshCw size={14} /> Reload Tab
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
