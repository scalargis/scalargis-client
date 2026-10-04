import React from 'react';

/** Catches a render error in its children, logs it, and renders the fallback in their place. */
export default class ErrorBoundary extends React.Component {

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Component "${this.props.name || 'unknown'}" failed to render`, error, info?.componentStack);
  }

  render() {
    if (this.state.error) return this.props.fallback ?? null;
    return this.props.children;
  }
}
