// Advanced Logging Service for Payoova

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development'
    this.logLevel = this.isDevelopment ? 'debug' : 'error'
    this.maxLogs = 100
    this.sessionId = this.generateSessionId()
    
    // Initialize logging service
    this.init()
  }

  init() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })

    // Performance monitoring
    this.startPerformanceMonitoring()
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getLogContext() {
    const user = this.getCurrentUser()
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: user?.id || 'anonymous',
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo()
    }
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('payoova_user'))
    } catch {
      return null
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      }
    }
    return null
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  createLogEntry(level, message, data = {}) {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      data,
      context: this.getLogContext()
    }
  }

  async sendToLogService(logEntry) {
    try {
      // In production, this would send to your logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // })

      // For now, store in localStorage with size limits
      this.storeLogLocally(logEntry)
    } catch (error) {
      console.error('Failed to send log:', error)
    }
  }

  storeLogLocally(logEntry) {
    try {
      const key = 'payoova_logs'
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]')
      
      existingLogs.push(logEntry)
      
      // Keep only the most recent logs
      if (existingLogs.length > this.maxLogs) {
        existingLogs.splice(0, existingLogs.length - this.maxLogs)
      }
      
      localStorage.setItem(key, JSON.stringify(existingLogs))
    } catch (error) {
      console.error('Failed to store log locally:', error)
    }
  }

  debug(message, data) {
    if (!this.shouldLog('debug')) return
    
    const logEntry = this.createLogEntry('debug', message, data)
    console.debug(`[Payoova Debug] ${message}`, data)
    this.sendToLogService(logEntry)
  }

  info(message, data) {
    if (!this.shouldLog('info')) return
    
    const logEntry = this.createLogEntry('info', message, data)
    console.info(`[Payoova Info] ${message}`, data)
    this.sendToLogService(logEntry)
  }

  warn(message, data) {
    if (!this.shouldLog('warn')) return
    
    const logEntry = this.createLogEntry('warn', message, data)
    console.warn(`[Payoova Warning] ${message}`, data)
    this.sendToLogService(logEntry)
  }

  error(message, data) {
    if (!this.shouldLog('error')) return
    
    const logEntry = this.createLogEntry('error', message, data)
    console.error(`[Payoova Error] ${message}`, data)
    this.sendToLogService(logEntry)
  }

  // Business logic specific logging
  logTransaction(action, transactionData) {
    this.info(`Transaction ${action}`, {
      type: 'transaction',
      action,
      ...transactionData
    })
  }

  logWalletAction(action, walletData) {
    this.info(`Wallet ${action}`, {
      type: 'wallet',
      action,
      ...walletData
    })
  }

  logUserAction(action, userData) {
    this.info(`User ${action}`, {
      type: 'user',
      action,
      ...userData
    })
  }

  logAPICall(endpoint, method, response, duration) {
    const isError = response.status >= 400
    const logData = {
      type: 'api',
      endpoint,
      method,
      status: response.status,
      duration,
      size: response.headers?.get('content-length')
    }

    if (isError) {
      this.error(`API Error: ${method} ${endpoint}`, logData)
    } else {
      this.debug(`API Call: ${method} ${endpoint}`, logData)
    }
  }

  logPerformanceMetric(name, value, context = {}) {
    this.debug(`Performance: ${name}`, {
      type: 'performance',
      metric: name,
      value,
      ...context
    })
  }

  startPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        if (navigation) {
          this.logPerformanceMetric('page_load', navigation.loadEventEnd - navigation.fetchStart, {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd
          })
        }
      }, 0)
    })

    // Monitor resource loading
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Log slow resources
          this.warn(`Slow resource load: ${entry.name}`, {
            type: 'performance',
            duration: entry.duration,
            size: entry.transferSize
          })
        }
      })
    }).observe({ entryTypes: ['resource'] })

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.warn('Long task detected', {
              type: 'performance',
              duration: entry.duration,
              startTime: entry.startTime
            })
          })
        }).observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // longtask not supported in all browsers
      }
    }
  }

  // Get logs for debugging
  getLogs(level = null, limit = 50) {
    try {
      const logs = JSON.parse(localStorage.getItem('payoova_logs') || '[]')
      let filteredLogs = logs

      if (level) {
        filteredLogs = logs.filter(log => log.level === level)
      }

      return filteredLogs.slice(-limit).reverse()
    } catch {
      return []
    }
  }

  // Clear logs
  clearLogs() {
    localStorage.removeItem('payoova_logs')
    this.info('Logs cleared')
  }

  // Export logs for support
  exportLogs() {
    const logs = this.getLogs()
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payoova-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    this.info('Logs exported')
  }
}

// Create singleton instance
const logger = new Logger()

export default logger
