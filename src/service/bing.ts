import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { isAxiosError } from 'axios'
import { formatError } from '../utils'

// The token endpoint this service used to call (`https://edge.microsoft.com/translate/auth`) now
// answers 404, and `api-edge.cognitive.microsofttranslator.com` is deprecated. Microsoft's own Edge
// translate extension uses a token-free endpoint instead, and it returns the same response shape:
//
//   POST https://edge.microsoft.com/translate/translatetext?isEnterpriseClient=false&to=<target>
//   body: ["text"]
//
// The source language goes in a `from` query parameter. It has to be left out entirely for
// automatic detection, because `from=auto` is rejected with HTTP 400.
const translateApi = 'https://edge.microsoft.com/translate/translatetext'

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'

// What `languagesMap.auto` resolves to. It is never sent: an absent `from` is what asks this
// endpoint to detect the source language itself.
const autoDetect = 'auto-detect'

export function buildTranslateUrl(from: string, to: string): string {
  const params = new URLSearchParams({ isEnterpriseClient: 'false', to })
  if (from !== autoDetect)
    params.set('from', from)

  return `${translateApi}?${params.toString()}`
}

/** Reads the `[{ translations: [{ text }] }]` array the endpoint answers with. */
export function parseTranslationResult(data: unknown): string {
  let result = ''
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item !== 'object' || item === null)
        continue
      const translations = (item as { translations?: unknown }).translations
      if (!Array.isArray(translations))
        continue
      const text = (translations[0] as { text?: unknown } | undefined)?.text
      if (typeof text === 'string')
        result += text
    }
  }

  const trimmed = result.trim()
  if (trimmed.length === 0)
    throw new Error('Bing Translator returned an empty translation')

  return trimmed
}

/** The endpoint answers HTTP 400 with an empty body when it does not accept a language code. */
function toReadableError(error: unknown): unknown {
  if (!isAxiosError(error) || !error.response)
    return error

  if (error.response.status === 400)
    return new Error('Bing Translator rejected the language pair, check the language codes in the plugin settings.')

  return error
}

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  try {
    const response = await axiosInstance.post(
      buildTranslateUrl(from, to),
      JSON.stringify([text]),
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
      },
    )

    return parseTranslationResult(response.data)
  }
  catch (error) {
    return formatError(toReadableError(error))
  }
}

// https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support
export const languagesMap: LanguagesMap = {
  auto: autoDetect,
  zh: 'zh-Hans',
  zh_hant: 'zh-Hant',
  yue: 'yue',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  es: 'es',
  ru: 'ru',
  de: 'de',
  it: 'it',
  tr: 'tr',
  pt_br: 'pt',
  pt_pt: 'pt',
  vi: 'vi',
  id: 'id',
  th: 'th',
  ms: 'ms',
  ar: 'ar',
  hi: 'hi',
  ml: 'ml',
  mn_cy: 'mn-Cyrl',
  km: 'km',
  nb_no: 'nb',
  fa: 'fa',
  sv: 'sv',
  pl: 'pl',
  nl: 'nl',
  uk: 'uk',
  he: 'he',
  bg: 'bg',
  cs: 'cs',
  da: 'da',
  et: 'et',
  fi: 'fi',
  el: 'el',
  hu: 'hu',
  lv: 'lv',
  lt: 'lt',
  ro: 'ro',
  sk: 'sk',
  sl: 'sl',
}
