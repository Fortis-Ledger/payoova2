import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Key, 
  Download, 
  Upload, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Lock,
  Unlock
} from 'lucide-react'

const WalletBackup = ({ user }) => {
  const [seedPhrase, setSeedPhrase] = useState([])
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [verificationWords, setVerificationWords] = useState([])
  const [selectedWords, setSelectedWords] = useState([])
  const [restorePhrase, setRestorePhrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState('intro') // intro, generate, verify, complete, restore

  useEffect(() => {
    checkBackupStatus()
  }, [])

  const checkBackupStatus = async () => {
    try {
      const response = await fetch('/api/wallet/backup/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackupConfirmed(data.backup_confirmed)
      }
    } catch (error) {
      console.error('Failed to check backup status:', error)
    }
  }

  const generateSeedPhrase = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/wallet/backup/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSeedPhrase(data.seed_phrase.split(' '))
        setStep('generate')
        
        // Generate verification words (random 3 words from the phrase)
        const indices = []
        while (indices.length < 3) {
          const randomIndex = Math.floor(Math.random() * 12)
          if (!indices.includes(randomIndex)) {
            indices.push(randomIndex)
          }
        }
        setVerificationWords(indices.sort((a, b) => a - b))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate seed phrase')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const verifySeedPhrase = () => {
    const isCorrect = verificationWords.every((wordIndex, i) => {
      return selectedWords[i] === seedPhrase[wordIndex]
    })

    if (isCorrect) {
      setStep('complete')
      confirmBackup()
    } else {
      setError('Verification failed. Please select the correct words.')
      setSelectedWords([])
    }
  }

  const confirmBackup = async () => {
    try {
      const response = await fetch('/api/wallet/backup/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        }
      })
      
      if (response.ok) {
        setBackupConfirmed(true)
        setSuccess('Wallet backup completed successfully!')
      }
    } catch (error) {
      console.error('Failed to confirm backup:', error)
    }
  }

  const restoreWallet = async () => {
    if (!restorePhrase.trim()) {
      setError('Please enter your recovery phrase')
      return
    }

    const words = restorePhrase.trim().toLowerCase().split(/\s+/)
    if (words.length !== 12) {
      setError('Recovery phrase must be exactly 12 words')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/wallet/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('payoova_token')}`
        },
        body: JSON.stringify({ recovery_phrase: words.join(' ') })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(`Wallet restored successfully! ${data.wallets_restored} wallet(s) recovered.`)
        setRestorePhrase('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to restore wallet')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadSeedPhrase = () => {
    const content = `Payoova Wallet - Recovery Phrase
Generated: ${new Date().toISOString()}
User: ${user.email}

⚠️ CRITICAL SECURITY INFORMATION ⚠️

This recovery phrase allows FULL ACCESS to your cryptocurrency wallets.
NEVER share this phrase with anyone. Store it securely offline.

Recovery Phrase (12 words):
${seedPhrase.map((word, i) => `${i + 1}. ${word}`).join('\n')}

IMPORTANT SECURITY REMINDERS:
- Store this in a safe, secure location
- Never share with anyone
- Never store digitally or take screenshots
- Consider making multiple physical copies
- Keep separate from your device

If you lose this phrase, you may permanently lose access to your funds.`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payoova-recovery-phrase-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard - Remember to clear your clipboard after use!')
    }).catch(() => {
      setError('Failed to copy to clipboard')
    })
  }

  const renderIntro = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-xl mb-2">Secure Your Wallet</h3>
        <p className="text-gray-400">
          Create a backup of your wallet to ensure you never lose access to your funds
        </p>
      </div>

      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertTriangle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <strong>Important:</strong> Your recovery phrase is the master key to your wallet. 
          Keep it safe and never share it with anyone.
        </AlertDescription>
      </Alert>

      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h4 className="text-white font-medium mb-4">What you'll get:</h4>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-blue-400" />
            <span>12-word recovery phrase</span>
          </li>
          <li className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Complete wallet backup</span>
          </li>
          <li className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-yellow-400" />
            <span>Secure offline storage options</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={generateSeedPhrase}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Recovery Phrase'}
        </Button>
      </div>
    </div>
  )

  const renderGenerate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Your Recovery Phrase</h3>
        <p className="text-gray-400 text-sm">
          Write down these 12 words in exact order and store them safely
        </p>
      </div>

      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-400">
          <strong>Never share your recovery phrase!</strong> Anyone with access to these words 
          can steal your cryptocurrency.
        </AlertDescription>
      </Alert>

      <div className="bg-gray-900 rounded-lg p-6 border-2 border-yellow-500/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Recovery Phrase</h4>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowSeedPhrase(!showSeedPhrase)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              {showSeedPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => copyToClipboard(seedPhrase.join(' '))}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={downloadSeedPhrase}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {seedPhrase.map((word, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-3 border border-gray-600"
            >
              <div className="text-xs text-gray-400 mb-1">{index + 1}</div>
              <div className="text-white font-mono">
                {showSeedPhrase ? word : '•'.repeat(word.length)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          💡 Tip: Write these words on paper and store in a safe place. Never store digitally.
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        <Button
          onClick={() => setStep('intro')}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep('verify')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          I've Written It Down
        </Button>
      </div>
    </div>
  )

  const renderVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Verify Your Backup</h3>
        <p className="text-gray-400 text-sm">
          Select the correct words to verify you've written down your recovery phrase
        </p>
      </div>

      <div className="space-y-4">
        {verificationWords.map((wordIndex, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <Label className="text-white text-sm mb-3 block">
              Word #{wordIndex + 1}:
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Show correct word and 2 random distractors */}
              {[
                seedPhrase[wordIndex],
                seedPhrase[(wordIndex + 3) % 12],
                seedPhrase[(wordIndex + 7) % 12]
              ].sort().map((word, j) => (
                <Button
                  key={j}
                  onClick={() => {
                    const newSelected = [...selectedWords]
                    newSelected[i] = word
                    setSelectedWords(newSelected)
                  }}
                  variant={selectedWords[i] === word ? 'default' : 'outline'}
                  className={
                    selectedWords[i] === word
                      ? 'bg-blue-600 text-white'
                      : 'border-white/20 text-white hover:bg-white/10'
                  }
                >
                  {word}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-3">
        <Button
          onClick={() => {
            setStep('generate')
            setSelectedWords([])
            setError('')
          }}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={verifySeedPhrase}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={selectedWords.length !== verificationWords.length}
        >
          Verify Backup
        </Button>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-xl mb-2">Backup Complete! 🎉</h3>
        <p className="text-gray-400">
          Your wallet is now securely backed up. Keep your recovery phrase safe!
        </p>
      </div>

      <Alert className="bg-green-500/10 border-green-500/20">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <AlertDescription className="text-green-400">
          <strong>Success!</strong> Your wallet backup is confirmed. You can now recover your 
          wallets using your 12-word recovery phrase.
        </AlertDescription>
      </Alert>

      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h4 className="text-white font-medium mb-4">Security Reminders:</h4>
        <ul className="text-gray-300 text-sm space-y-2 text-left">
          <li>🔐 Store your recovery phrase in a secure, offline location</li>
          <li>📝 Consider making multiple physical copies</li>
          <li>🚫 Never share your recovery phrase with anyone</li>
          <li>💻 Never store it digitally or take screenshots</li>
          <li>🔄 Test wallet recovery occasionally with small amounts</li>
        </ul>
      </div>

      <Button
        onClick={() => window.location.reload()}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Continue to Dashboard
      </Button>
    </div>
  )

  const renderRestore = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Unlock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Restore Wallet</h3>
        <p className="text-gray-400 text-sm">
          Enter your 12-word recovery phrase to restore your wallets
        </p>
      </div>

      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertTriangle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <strong>Note:</strong> This will restore all wallets associated with your recovery phrase.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label className="text-white text-sm mb-2 block">
            Recovery Phrase (12 words, separated by spaces):
          </Label>
          <textarea
            value={restorePhrase}
            onChange={(e) => setRestorePhrase(e.target.value)}
            placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
            className="w-full h-24 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder:text-gray-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            Enter exactly 12 words separated by spaces
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={restoreWallet}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading || !restorePhrase.trim()}
        >
          {loading ? 'Restoring...' : 'Restore Wallet'}
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Wallet Backup & Recovery</CardTitle>
        <CardDescription className="text-gray-400">
          Secure your wallet with a recovery phrase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 mb-6">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-6">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {backupConfirmed && step === 'intro' && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-6">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Your wallet is already backed up. You can restore wallets using your recovery phrase.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={backupConfirmed && step === 'intro' ? 'restore' : 'backup'} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="backup" className="text-white">
              {backupConfirmed ? 'Create New Backup' : 'Backup Wallet'}
            </TabsTrigger>
            <TabsTrigger value="restore" className="text-white">Restore Wallet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="mt-6">
            {step === 'intro' && renderIntro()}
            {step === 'generate' && renderGenerate()}
            {step === 'verify' && renderVerify()}
            {step === 'complete' && renderComplete()}
          </TabsContent>
          
          <TabsContent value="restore" className="mt-6">
            {renderRestore()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default WalletBackup
