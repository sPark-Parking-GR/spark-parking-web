'use client'

import { Component } from 'react'
import type { ReactNode } from 'react'
import { SectionError } from './SectionError'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: (Error & { digest?: string }) | null
}

// Framework control-flow errors (redirect, notFound) carry a NEXT_ digest and must reach
// the framework's own boundaries untouched; only genuine failures stay inside the section.
function isControlFlow(error: Error & { digest?: string }): boolean {
  return typeof error.digest === 'string' && error.digest.startsWith('NEXT_')
}

export class SectionBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.children !== this.props.children) this.setState({ error: null })
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (isControlFlow(error)) throw error
    return this.props.fallback ?? <SectionError onRetry={this.reset} />
  }
}
