import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { formatError } from '../utils'

const api = 'https://translate.google.com/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t'

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  try {
    const response = await axiosInstance.get(
      api,
      {
        params: {
          q: text,
          sl: from,
          tl: to,
          hl: to,
          client: 'gtx',
          ie: 'UTF-8',
          oe: 'UTF-8',
          otf: '1',
          ssel: '0',
          tsel: '0',
          kc: '7',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const data = response.data
    let result = ''
    for (const centence of data[0]) {
      result += centence[0] || ''
    }

    return result
  }
  catch (error) {
    return formatError(error)
  }
}

// https://cloud.google.com/translate/docs/languages?hl=zh-cn
export const languagesMap: LanguagesMap = {
  auto: 'auto',
  zh: 'zh-CN',
  zh_hant: 'zh-TW',
  yue: 'yue',
  ja: 'ja',
  en: 'en',
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
  ms: 'ms',
  ar: 'ar',
  hi: 'hi',
  ml: 'ml',
  mn_cy: 'mn',
  mn_mo: 'mn',
  km: 'km',
  nb_no: 'nb',
  fa: 'fa',
  sv: 'sv',
  pl: 'pl',
  nn_no: 'nno',
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
