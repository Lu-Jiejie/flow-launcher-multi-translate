import type { LanguageCode } from './service/language'

export interface Settings {
  services: string[]
  requestTimeout: number
  translateDelay: number
  proxyUrl: string
  translationMode: 'configured' | 'zh-en'
  sourceLanguageCode: LanguageCode
  targetLanguageCode: LanguageCode
  languagePairs: string[]
  triggerKeyword: string
  interfaceLanguage: 'en' | 'tr' | 'zh'
  deepL: {
    key: string
  }
  deepLX: {
    url: string
  }
  mTranServer: {
    url: string
    token: string
  }
  openAI: {
    key: string
    baseUrl: string
    model: string
    systemPrompt: string
    userPrompt: string
  }
}

export function parseSettings(settings: Record<string, string>): Settings {
  const services = (settings.services as string).split('\n').map(i => i.trim().toLowerCase()).filter(i => i)
  let requestTimeout = Number.parseInt(settings.requestTimeout, 10)
  if (Number.isNaN(requestTimeout))
    requestTimeout = 5000
  let translateDelay = Number.parseInt(settings.translateDelay, 10)
  if (Number.isNaN(translateDelay))
    translateDelay = 700
  const proxyUrl = settings.proxyUrl || ''
  const translationMode = settings.translationMode === 'Chinese ↔ English' ? 'zh-en' : 'configured'
  const sourceLanguageCode = settings.sourceLanguageCode as LanguageCode || 'auto'
  const targetLanguageCode = settings.targetLanguageCode as LanguageCode || 'zh'
  const languagePairs = (settings.languagePairs || '').split('\n').map(i => i.trim()).filter(i => i)
  const triggerKeyword = settings.triggerKeyword || 'tr'
  const interfaceLanguage = settings.interfaceLanguage === 'English'
    ? 'en'
    : settings.interfaceLanguage === 'Türkçe' ? 'tr' : 'zh'

  const serviceConfigs: Record<string, string> = {}
  settings.serviceConfigs
    .split('\n')
    .map(i => i.trim())
    .filter(i => i)
    .forEach((i) => {
      const eqIndex = i.indexOf('=')
      if (eqIndex === -1) {
        return null
      }
      const key = i.slice(0, eqIndex).trim().toUpperCase()
      const value = i.slice(eqIndex + 1).trim()
      serviceConfigs[key] = value
    })
  const deepL = {
    key: serviceConfigs.DEEPL_KEY || '',
  }
  const deepLX = {
    url: serviceConfigs.DEEPLX_URL || '',
  }
  const mTranServer = {
    url: serviceConfigs.MTRANSERVER_URL || '',
    token: serviceConfigs.MTRANSERVER_TOKEN || '',
  }
  const openAI = {
    key: serviceConfigs.OPENAI_API_KEY || '',
    baseUrl: serviceConfigs.OPENAI_BASE_URL || 'https://api.openai.com',
    model: serviceConfigs.OPENAI_MODEL || 'gpt-3.5-turbo',
    systemPrompt: settings.openaiSystemPrompt || '',
    userPrompt: settings.openaiUserPrompt || '',
  }

  return {
    services,
    requestTimeout,
    translateDelay,
    proxyUrl,
    translationMode,
    sourceLanguageCode,
    targetLanguageCode,
    languagePairs,
    triggerKeyword,
    interfaceLanguage,
    deepL,
    deepLX,
    mTranServer,
    openAI,
  }
}
