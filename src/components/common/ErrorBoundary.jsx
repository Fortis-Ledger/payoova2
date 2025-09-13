import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.logError(error, errorInfo)
  }

  logError = (error, errorInfo) => {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      errorId: this.state.errorId
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', errorData)
    }

    // Send to logging service (replace with your logging service)
    this.sendToLoggingService(errorData)
  }

  getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('payoova_user'))
      return user?.id || 'anonymous'
    } catch {
      return 'anonymous'
    }
  }

  sendToLoggingService = async (errorData) => {
    try {
      // This would be replaced with your actual logging service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
      
      // For now, just store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('payoova_errors') || '[]')
      existingErrors.push(errorData)
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10)
      }
      localStorage.setItem('payoova_errors', JSON.stringify(existingErrors))
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-white text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-300">
                <p>We're sorry, but something unexpected happened.</p>
                <p className="text-sm mt-2">Error ID: <code className="bg-white/10 px-2 py-1 rounded">{this.state.errorId}</code></p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <summary className="text-red-400 cursor-pointer">Error Details (Development)</summary>
                  <div className="mt-2 text-xs text-gray-400 font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                </details>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-center text-sm text-gray-400">
                If the problem persists, please contact support with the error ID above.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
