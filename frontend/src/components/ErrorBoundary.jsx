import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "Frontend error caught by ErrorBoundary:",
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Something went wrong!</h2>
          <p>
            An unexpected error occurred. Please refresh the page or try again
            later.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
