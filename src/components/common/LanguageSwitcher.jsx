import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe } from 'lucide-react'

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <div className="relative">
      <Select value={i18n.language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>{currentLanguage.flag}</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {languages.map((language) => (
            <SelectItem
              key={language.code}
              value={language.code}
              className="text-white hover:bg-white/10 focus:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default LanguageSwitcher
