import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { formatError } from '../utils'

const tokenApi = 'https://edge.microsoft.com/translate/auth'
const translateApi = 'https://api-edge.cognitive.microsofttranslator.com/translate'

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  try {
    const tokenResponse = await axiosInstance.get(
      tokenApi,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edg/113.0.1774.42',
        },
        // responseType: 'json',
      },
    )

    const token = tokenResponse.data

    const translateResponse = await axiosInstance.post(
      translateApi,
      [
        {
          Text: text,
        },
      ],
      {
        params: {
          from,
          to,
          'api-version': '3.0',
          'includeSentenceLength': 'true',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edg/113.0.1774.42',
        },
      },
    )

    const data = translateResponse.data
    if (data[0].translations[0])
      return data[0].translations[0].text.trim()
    return JSON.stringify(data)
  }
  catch (error) {
    return formatError(error)
  }
}

// https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support
export const languagesMap: LanguagesMap = {
  auto: '',
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
