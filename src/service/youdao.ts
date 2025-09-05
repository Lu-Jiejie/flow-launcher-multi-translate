import type { AxiosInstance } from 'axios'
import type { Buffer } from 'node:buffer'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import * as crypto from 'node:crypto'
import { formatError, getRandomInt } from '../utils'

export async function translate(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
  _options: Settings,
): Promise<string> {
  const client = createHttpClient(axiosInstance)
  try {
    // get secret key
    const secretKey = await fetchSecretKey(client)
    if (!secretKey) {
      throw new Error('Failed to get secret key')
    }

    // initialize encryption parameters
    const { encryptKey, iv } = initEncrypt()

    // translate request
    const response = await client.post(
      'https://dict.youdao.com/webtranslate',
      prepareTranslateParams(text, from, to, secretKey).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    // decrypt response data
    const data = decryptResponse(response.data, encryptKey, iv)

    if (!data.translateResult[0][0]) {
      return JSON.stringify(data)
    }

    const resultArr = data.translateResult[0] as Array<{ tgt: string }>
    let result = ''
    for (const data of resultArr)
      result += data.tgt
    return result
  }
  catch (error) {
    return formatError(error)
  }
}

function createHttpClient(axiosInstance: AxiosInstance): AxiosInstance {
  const client = axiosInstance.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3 Edg/113.0.1774.42',
      'Referer': 'https://fanyi.youdao.com/',
      'Origin': 'https://fanyi.youdao.com',
      'Cookie': generateCookies(),
    },
  })
  return client
}

function generateCookies(): string {
  const OUTFOX_SEARCH_USER_ID_NCOO = `OUTFOX_SEARCH_USER_ID_NCOO=${getRandomInt(100000000, 999999999)}.${getRandomInt(100000000, 999999999)}`
  const OUTFOX_SEARCH_USER_ID = `OUTFOX_SEARCH_USER_ID=${getRandomInt(100000000, 999999999)}@${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`
  return `${OUTFOX_SEARCH_USER_ID_NCOO};${OUTFOX_SEARCH_USER_ID}`
}

async function fetchSecretKey(client: AxiosInstance): Promise<string> {
  const baseParams = prepareBaseParams('asdjnjfenknafdfsdfsd')
  const response = await client.get('https://dict.youdao.com/webtranslate/key', {
    params: {
      keyid: 'webfanyi-key-getter',
      ...baseParams,
    },
  })

  return response.data.data.secretKey
}

function initEncrypt(): { encryptKey: Buffer, iv: Buffer } {
  const getKeyBytes = (key: string): Buffer => {
    const hash = crypto.createHash('md5').update(key).digest()
    return hash.subarray(0, 16)
  }

  return {
    encryptKey: getKeyBytes('ydsecret://query/key/B*RGygVywfNBwpmBaZg*WT7SIOUP2T0C9WHMZN39j^DAdaZhAnxvGcCY6VYFwnHl'),
    iv: getKeyBytes('ydsecret://query/iv/C@lZe2YzHtZ2CYgaXKSVfsb7Y4QWHjITPPZ0nQp87fBeJ!Iv6v^6fvi2WN@bYpJ4'),
  }
}

function prepareTranslateParams(text: string, from: string, to: string, secretKey: string): URLSearchParams {
  const params = new URLSearchParams()

  params.append('i', text)
  params.append('from', from)
  params.append('to', to)
  params.append('dictResult', 'true')
  params.append('keyid', 'webfanyi')

  const baseParams = prepareBaseParams(secretKey)
  for (const [key, value] of Object.entries(baseParams)) {
    params.append(key, value)
  }

  return params
}

function prepareBaseParams(key: string): Record<string, string> {
  const now = Date.now().toString()
  return {
    sign: md5Sign(now, key),
    client: 'fanyideskweb',
    product: 'webfanyi',
    appVersion: '1.0.0',
    vendor: 'web',
    pointParam: 'client,mysticTime,product',
    mysticTime: now,
    keyfrom: 'fanyi.web',
  }
}

// get sign
function md5Sign(t: string, key: string): string {
  const str = `client=fanyideskweb&mysticTime=${t}&product=webfanyi&key=${key}`
  return crypto.createHash('md5').update(str).digest('hex')
}

function decryptResponse(encrypted: string, key: Buffer, iv: Buffer) {
  const data = encrypted.replace(/-/g, '+').replace(/_/g, '/')
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
  let decrypted = decipher.update(data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
}

// https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html
export const languagesMap: LanguagesMap = {
  auto: 'auto',
  zh: 'zh-CHS',
  zh_hant: 'zh-CHT',
  yue: 'yue',
  en: 'en',
  ja: 'ja',
  ko: 'kor',
  fr: 'fr',
  es: 'es',
  ru: 'ru',
  am: 'am',
  hy: 'hy',
  ig: 'ig',
  ka: 'ka',
  ku: 'ku',
  mi: 'mi',
  mg: 'mg',
  otq: 'otq',
  sd: 'sd',
  si: 'si',
  sm: 'sm',
  to: 'to',
  ty: 'ty',
  de: 'de',
  it: 'it',
  tr: 'tr',
  pt_pt: 'pt',
  pt_br: 'pt',
  vi: 'vi',
  ro: 'ro',
  id: 'id',
  th: 'th',
  ms: 'may',
  ar: 'ar',
  hi: 'hi',
  mn_mo: 'mn',
  km: 'km',
  nb_no: 'no',
  nn_no: 'no',
  fa: 'fa',
  sv: 'sv',
  pl: 'pl',
  nl: 'nl',
  uk: 'uk',
  he: 'he',
}
