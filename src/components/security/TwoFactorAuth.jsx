import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Smartphone, 
  Copy, 
  Download,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

const TwoFactorAuth = ({ user }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('status') // status, setup, verify, complete
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Check current 2FA status
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      const response = await fetch('/api/security/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIs2FAEnabled(data.enabled)
        setBackupCodes(data.backup_codes || [])
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error)
    }
  }

  const setup2FA = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/security/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qr_code_url)
        setSecretKey(data.secret_key)
        setStep('setup')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        },
        body: JSON.stringify({ code: verificationCode })
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backup_codes)
        setIs2FAEnabled(true)
        setStep('complete')
        setSuccess('Two-factor authentication has been successfully enabled!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/security/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        setIs2FAEnabled(false)
        setStep('status')
        setBackupCodes([])
        setSuccess('Two-factor authentication has been disabled')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateNewBackupCodes = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/security/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backup_codes)
        setSuccess('New backup codes generated successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate backup codes')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard')
    }).catch(() => {
      setError('Failed to copy to clipboard')
    })
  }

  const downloadBackupCodes = () => {
    const content = `Payoova Wallet - 2FA Backup Codes
Generated: ${new Date().toISOString()}
User: ${user.email}

IMPORTANT: Store these codes securely. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Keep these codes safe and secure!`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payoova-2fa-backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderStatus = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {is2FAEnabled ? (
            <ShieldCheck className="w-8 h-8 text-green-400" />
          ) : (
            <ShieldX className="w-8 h-8 text-red-400" />
          )}
          <div>
            <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
            <p className="text-gray-400 text-sm">
              {is2FAEnabled ? 'Enabled and active' : 'Not enabled'}
            </p>
          </div>
        </div>
        <Badge variant={is2FAEnabled ? 'success' : 'destructive'}>
          {is2FAEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <p className="text-gray-300 text-sm mb-4">
          Two-factor authentication adds an extra layer of security to your account. 
          When enabled, you'll need both your password and a code from your phone to sign in.
        </p>
        
        {is2FAEnabled ? (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {showBackupCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showBackupCodes ? 'Hide' : 'View'} Backup Codes
              </Button>
              <Button
                onClick={generateNewBackupCodes}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Codes
              </Button>
              <Button
                onClick={disable2FA}
                variant="destructive"
                size="sm"
                disabled={loading}
              >
                Disable 2FA
              </Button>
            </div>

            {showBackupCodes && backupCodes.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">Backup Codes</h4>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={downloadBackupCodes}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-gray-800 rounded px-3 py-2 font-mono text-sm text-gray-300">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  ⚠️ Each code can only be used once. Store these codes securely!
                </p>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={setup2FA}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <Shield className="w-4 h-4 mr-2" />
            Enable Two-Factor Authentication
          </Button>
        )}
      </div>
    </div>
  )

  const renderSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Setup Authenticator App</h3>
        <p className="text-gray-400 text-sm">
          Scan the QR code below with your authenticator app (like Google Authenticator, Authy, or 1Password)
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg mx-auto max-w-xs">
        <img src={qrCodeUrl} alt="2FA QR Code" className="w-full" />
      </div>

      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <p className="text-white text-sm mb-2">Can't scan the QR code? Enter this key manually:</p>
        <div className="flex items-center space-x-2">
          <code className="bg-gray-800 px-3 py-2 rounded font-mono text-green-400 text-sm flex-1 break-all">
            {secretKey}
          </code>
          <Button
            onClick={() => copyToClipboard(secretKey)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white text-sm font-medium block mb-2">
            Enter the 6-digit code from your authenticator app:
          </label>
          <Input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="bg-white/10 border-white/20 text-white text-center text-lg tracking-wider"
            maxLength={6}
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => setStep('status')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={verify2FA}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div>
        <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">2FA Successfully Enabled!</h3>
        <p className="text-gray-400 text-sm">
          Your account is now protected with two-factor authentication
        </p>
      </div>

      {backupCodes.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-medium mb-3">⚠️ Important: Save Your Backup Codes</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-gray-800 rounded px-3 py-2 font-mono text-sm text-gray-300">
                {code}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-2 mb-3">
            <Button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Codes
            </Button>
            <Button
              onClick={downloadBackupCodes}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Codes
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Store these backup codes securely. You can use them to access your account if you lose your phone.
          </p>
        </div>
      )}

      <Button
        onClick={() => setStep('status')}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Complete Setup
      </Button>
    </div>
  )

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-gray-400">
          Enhance your account security with 2FA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 mb-6">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-6">
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {step === 'status' && renderStatus()}
        {step === 'setup' && renderSetup()}
        {step === 'complete' && renderComplete()}
      </CardContent>
    </Card>
  )
}

export default TwoFactorAuth
