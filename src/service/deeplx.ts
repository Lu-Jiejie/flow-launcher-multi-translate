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
  const deeplxUrl = _options.deepLX.url

  // Validate required configuration
  if (!deeplxUrl || deeplxUrl.trim() === '') {
    return formatError(new Error('DeepLX: URL is not configured. Please set DEEPLX_URL in Service Configs.'))
  }

  try {
    const response = await axiosInstance.post(
      deeplxUrl,
      {
        text,
        source_lang: from,
        target_lang: to,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    return response.data.data
  }
  catch (error) {
    return formatError(error)
  }
}

// https://github.com/missuo/bob-plugin-deeplx/blob/main/src/lang.js
export const languagesMap: LanguagesMap = {
  auto: 'auto',
  zh: 'zh',
  zh_hant: 'zh',
  en: 'en',
  bg: 'bg',
  cs: 'cs',
  da: 'da',
  nl: 'nl',
  et: 'et',
  fi: 'fi',
  fr: 'fr',
  de: 'de',
  el: 'el',
  hu: 'hu',
  id: 'id',
  it: 'it',
  ja: 'ja',
  lv: 'lv',
  lt: 'lt',
  pl: 'pl',
  pt_pt: 'pt',
  pt_br: 'pt',
  ro: 'ro',
  ru: 'ru',
  sk: 'sk',
  sl: 'sl',
  es: 'es',
  sv: 'sv',
  tr: 'tr',
  uk: 'uk',
}
