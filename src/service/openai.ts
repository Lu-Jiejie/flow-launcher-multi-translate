import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { formatError } from '../utils'

// OpenAI models support many languages through natural language understanding.
// Using full language names for better prompt comprehension.
const languageNamesMap: LanguagesMap = {
  'auto': 'auto',
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'am': 'Amharic',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'as': 'Assamese',
  'az': 'Azerbaijani',
  'ba': 'Bashkir',
  'eu': 'Basque',
  'bn': 'Bengali',
  'bs': 'Bosnian',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'zh': 'Chinese Simplified',
  'zh_hant': 'Chinese Traditional',
  'yue': 'Cantonese',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'prs': 'Dari',
  'dv': 'Dhivehi',
  'nl': 'Dutch',
  'en': 'English',
  'et': 'Estonian',
  'fo': 'Faroese',
  'fj': 'Fijian',
  'fi': 'Finnish',
  'fr': 'French',
  'gl': 'Galician',
  'ka': 'Georgian',
  'de': 'German',
  'el': 'Greek',
  'gu': 'Gujarati',
  'ht': 'Haitian Creole',
  'ha': 'Hausa',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'mww': 'Hmong Daw',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'ig': 'Igbo',
  'id': 'Indonesian',
  'iu': 'Inuktitut',
  'iu-Latn': 'Inuktitut (Latin)',
  'ga': 'Irish',
  'it': 'Italian',
  'ja': 'Japanese',
  'kn': 'Kannada',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'rw': 'Kinyarwanda',
  'tlh-Latn': 'Klingon (Latin)',
  'tlh-Piqd': 'Klingon (pIqaD)',
  'ko': 'Korean',
  'ku': 'Kurdish',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mk': 'Macedonian',
  'mg': 'Malagasy',
  'ms': 'Malay',
  'ml': 'Malayalam',
  'mt': 'Maltese',
  'mi': 'Maori',
  'mr': 'Marathi',
  'mn_cy': 'Mongolian (Cyrillic)',
  'mn_mo': 'Mongolian (Traditional)',
  'my': 'Burmese',
  'ne': 'Nepali',
  'nb': 'Norwegian (Bokmål)',
  'nb_no': 'Norwegian (Bokmål)',
  'nn_no': 'Norwegian (Nynorsk)',
  'or': 'Oriya',
  'ps': 'Pashto',
  'fa': 'Persian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'pt_pt': 'Portuguese (Portugal)',
  'pt_br': 'Portuguese (Brazil)',
  'pa': 'Punjabi',
  'otq': 'Querétaro Otomi',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sm': 'Samoan',
  'sr-Cyrl': 'Serbian (Cyrillic)',
  'sr-Latn': 'Serbian (Latin)',
  'sd': 'Sindhi',
  'si': 'Sinhala',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'so': 'Somali',
  'es': 'Spanish',
  'sv': 'Swedish',
  'ty': 'Tahitian',
  'ta': 'Tamil',
  'tt': 'Tatar',
  'te': 'Telugu',
  'th': 'Thai',
  'bo': 'Tibetan',
  'ti': 'Tigrinya',
  'to': 'Tongan',
  'tr': 'Turkish',
  'tk': 'Turkmen',
  'uk': 'Ukrainian',
  'hsb': 'Upper Sorbian',
  'ur': 'Urdu',
  'ug': 'Uyghur',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'cy': 'Welsh',
  'xh': 'Xhosa',
  'yo': 'Yoruba',
  'yua': 'Yucatec Maya',
  'zu': 'Zulu',
}

// Resolve names inside the adapter so per-query settings can override them.
export const languagesMap: LanguagesMap = Object.fromEntries(
  Object.keys(languageNamesMap).map(code => [code, code]),
)

function parseLanguageNames(json: string): LanguagesMap {
  if (!json.trim())
    return {}

  let names: unknown
  try {
    names = JSON.parse(json)
  }
  catch {
    throw new Error('OpenAI Languages Map must be valid JSON.')
  }

  if (names === null || typeof names !== 'object' || Array.isArray(names))
    throw new Error('OpenAI Languages Map must be a JSON object mapping language codes to names.')

  const supportedCodes = Object.keys(languageNamesMap)
  for (const [code, name] of Object.entries(names)) {
    if (!supportedCodes.includes(code))
      throw new Error(`OpenAI Languages Map contains an unsupported language code: ${code}`)
    if (typeof name !== 'string' || !name.trim())
      throw new Error(`OpenAI Languages Map requires a non-empty name for ${code}.`)
  }

  return names as LanguagesMap
}

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  const apiKey = _options.openAI.key
  const baseUrl = _options.openAI.baseUrl
  const model = _options.openAI.model

  // Validate required configuration
  if (!apiKey || apiKey.trim() === '') {
    return formatError(new Error('OpenAI: API key is not configured. Please set OPENAI_API_KEY in Service Configs.'))
  }

  if (!model || model.trim() === '') {
    return formatError(new Error('OpenAI: Model is not configured. Please set OPENAI_MODEL in Service Configs.'))
  }

  let customNames: LanguagesMap
  try {
    customNames = parseLanguageNames(_options.openAI.languagesMapJson || '')
  }
  catch (error) {
    return formatError(error)
  }
  const names: Record<string, string | undefined> = { ...languageNamesMap, ...customNames }
  const fromLang = names[from] || from
  const toLang = names[to] || to

  try {
    const response = await axiosInstance.post(
      `${baseUrl}/v1/chat/completions`,
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translation assistant. Translate the given text accurately and naturally. Only return the translated text without any explanations or additional content.`,
          },
          {
            role: 'user',
            content: `Translate the following text from ${fromLang} to ${toLang}:\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
    )

    const data = response.data
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    }
    return formatError(new Error('No translation found.'))
  }
  catch (error) {
    return formatError(error)
  }
}
