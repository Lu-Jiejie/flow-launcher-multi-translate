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
  const url = `http://res.d.hjfile.cn/v10/dict/translation/${from}/${to}`

  try {
    const formData = new FormData()
    formData.append('content', text)

    const response = await axiosInstance.post(url, formData, {
      headers: {
        'Host': 'res.d.hjfile.cn',
        'Origin': 'http://res.d.hjfile.cn',
        'Referer': 'http://res.d.hjfile.cn/app/trans',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': 'HJ_UID=390f25c7-c9f3-b237-f639-62bd23cd431f; HJC_USRC=uzhi; HJC_NUID=1',
      },
    })

    const result = response.data.data.content
    return result
  }
  catch (error) {
    return formatError(error)
  }
}

// https://fanyi-api.baidu.com/product/113
export const languagesMap: LanguagesMap = {
  auto: 'auto',
  zh: 'zh',
  zh_hant: 'cht',
  yue: 'yue',
  en: 'en',
  ja: 'jp',
  ko: 'kor',
  fr: 'fra',
  es: 'spa',
  ru: 'ru',
  de: 'de',
  it: 'it',
  tr: 'tr',
  pt_pt: 'pt',
  pt_br: 'pot',
  vi: 'vie',
  ro: 'rom',
  id: 'id',
  th: 'th',
  ms: 'may',
  ar: 'ar',
  hi: 'hi',
  km: 'hkm',
  nb_no: 'nob',
  nn_no: 'nno',
  fa: 'per',
  sv: 'swe',
  pl: 'pl',
  nl: 'nl',
  uk: 'ukr',
  he: 'heb',
}
