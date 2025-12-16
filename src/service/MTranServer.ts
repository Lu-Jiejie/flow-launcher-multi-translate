import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { formatError } from '../utils'

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  const url = _options.mTranServer.url
  const token = _options.mTranServer.token

  // Validate required configuration
  if (!url || url.trim() === '') {
    return formatError(new Error('MTranServer: URL is not configured. Please set MTRANSERVER_URL in Service Configs.'))
  }

  if (!token || token.trim() === '') {
    return formatError(new Error('MTranServer: Token is not configured. Please set MTRANSERVER_TOKEN in Service Configs.'))
  }

  const endpoint = url.endsWith('/')
    ? `${url}translate`
    : `${url}/translate`

  try {
    const response = await axiosInstance.post(
      endpoint,
      {
        text,
        from,
        to,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `${token}`,
        },
        params: token !== '' ? { token } : undefined,
      },
    )

    return response.data.result
  }
  catch (error) {
    return formatError(error)
  }
}

// api/languages
export const languagesMap: LanguagesMap = {
  auto: 'auto',
  zh: 'zh-CN',
  zh_hant: 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  es: 'es',
  ru: 'ru',
  de: 'de',
  it: 'it',
  tr: 'tr',
  pt_pt: 'pt',
  pt_br: 'pt',
  vi: 'vi',
  id: 'id',
  th: 'th',
  ml: 'ml',
  ms: 'ms',
  ar: 'ar',
  hi: 'hi',
  km: 'km',
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
