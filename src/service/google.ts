import type { AxiosInstance } from 'axios'
import type { Settings } from '../settings'
import type { LanguagesMap } from './language'
import { isAxiosError } from 'axios'
import { formatError } from '../utils'

// `translate_a/single?client=gtx` is the classic free endpoint, but Google answers it with
// HTTP 429 (or a redirect to google.com/sorry) for rate limited addresses, and the HTML error page
// that comes back used to be read as if it were a translation.
//
// The RPC the translate.google.com web app itself calls is not affected by that block, so it is
// tried first; `client=gtx` stays as a fallback in case Google rebuilds that RPC.
const batchexecuteApi = 'https://translate.google.com/_/TranslateWebserverUi/data/batchexecute'
const gtxApi = 'https://translate.google.com/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t'

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// The RPC reports "unsupported language pair" as a status code next to the empty payload.
const rpcStatusIndex = [5, 0]

/**
 * What a `batchexecute` call told us: `translation` carries the translated text, `rejected` means
 * Google understood the call but refused it (e.g. an unsupported language pair), and `unknown`
 * means the response does not have the shape this implementation expects.
 */
export type GoogleWebResponse
  = | { kind: 'translation', text: string }
    | { kind: 'rejected', code: number }
    | { kind: 'unknown' }

function nested(value: unknown, path: number[]): unknown {
  let current = value
  for (const index of path) {
    if (!Array.isArray(current))
      return undefined
    current = current[index]
  }
  return current
}

function joinTexts(items: unknown, path: number[]): string {
  if (!Array.isArray(items))
    return ''

  let result = ''
  for (const item of items) {
    const text = nested(item, path)
    if (typeof text === 'string')
      result += text
  }

  return result
}

/** Reads the `)]}'\n<length>\n<json>` chunked response of a `batchexecute` call. */
export function parseBatchexecuteResponse(data: unknown): GoogleWebResponse {
  if (typeof data !== 'string')
    return { kind: 'unknown' }

  for (const line of data.split('\n')) {
    if (!line.startsWith('[['))
      continue

    let entries: unknown
    try {
      entries = JSON.parse(line)
    }
    catch {
      continue
    }
    if (!Array.isArray(entries))
      continue

    const call = entries.find(entry => nested(entry, [0]) === 'wrb.fr' && nested(entry, [1]) === 'MkEWBc')
    if (call === undefined)
      continue

    const payload = nested(call, [2])
    if (typeof payload !== 'string') {
      const code = nested(call, rpcStatusIndex)
      return typeof code === 'number' ? { kind: 'rejected', code } : { kind: 'unknown' }
    }

    let translation: unknown
    try {
      translation = JSON.parse(payload)
    }
    catch {
      return { kind: 'unknown' }
    }

    // The translated sentences live in `translation[1][0][0][5]`, as `[text, ..., original]` tuples.
    const text = joinTexts(nested(translation, [1, 0, 0, 5]), [0]).trim()
    if (text.length === 0)
      return { kind: 'unknown' }

    return { kind: 'translation', text }
  }

  return { kind: 'unknown' }
}

/** Reads the array `translate_a/single` answers with. */
export function parseGtxResponse(data: unknown): string | null {
  const text = joinTexts(nested(data, [0]), [0])
  return text.length > 0 ? text : null
}

async function requestBatchexecute(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
): Promise<string | null> {
  // `MkEWBc` takes `[[text, from, to, true], [null]]`; no session token is needed, only the
  // parameters and headers the web app itself sends.
  const rpcRequest = JSON.stringify([[['MkEWBc', JSON.stringify([[text, from, to, true], [null]]), null, 'generic']]])

  const query = new URLSearchParams({
    'rpcids': 'MkEWBc',
    'source-path': '/',
    'f.sid': '',
    'bl': '',
    'hl': 'en',
    'soc-app': '1',
    'soc-platform': '1',
    'soc-device': '1',
    '_reqid': '1000',
    'rt': 'c',
  })

  const response = await axiosInstance.post(
    `${batchexecuteApi}?${query.toString()}`,
    `f.req=${encodeURIComponent(rpcRequest)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Referer': 'https://translate.google.com/',
        'Origin': 'https://translate.google.com',
        'X-Same-Domain': '1',
        'User-Agent': userAgent,
      },
    },
  )

  const result = parseBatchexecuteResponse(response.data)
  if (result.kind === 'translation')
    return result.text
  if (result.kind === 'rejected')
    throw new Error(`Google Translate does not support this language pair (status ${result.code})`)

  // An unrecognised shape is what the `client=gtx` fallback is for.
  return null
}

async function requestGtx(
  text: string,
  from: string,
  to: string,
  axiosInstance: AxiosInstance,
): Promise<string | null> {
  const response = await axiosInstance.get(
    gtxApi,
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
        'Accept': '*/*',
        'Accept-Language': `${to},en;q=0.9`,
        'Referer': 'https://translate.google.com/',
        'User-Agent': userAgent,
      },
    },
  )

  return parseGtxResponse(response.data)
}

/** Turns Google's anti-bot HTML error pages into a message that says what actually happened. */
function toReadableError(error: unknown): unknown {
  if (!isAxiosError(error) || !error.response)
    return error

  const { status, data } = error.response
  if (status === 429 || status === 403) {
    return new Error(
      `Google Translate rejected this request (HTTP ${status}), which usually means the IP or proxy is rate limited. Check the proxy in the plugin settings or use another service.`,
    )
  }
  if (typeof data === 'string' && data.includes('/sorry/'))
    return new Error('Google Translate flagged this request as automated traffic.')

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
    const attempts = [requestBatchexecute, requestGtx]

    for (const [index, attempt] of attempts.entries()) {
      try {
        const result = await attempt(text, from, to, axiosInstance)
        if (result !== null)
          return result
      }
      catch (error) {
        // Both endpoints live on translate.google.com, so a connection level failure means the
        // fallback cannot succeed either and retrying would only double the wait.
        const lastAttempt = index === attempts.length - 1
        if (lastAttempt || !isAxiosError(error) || !error.response)
          throw error
      }
    }

    return formatError(new Error('Google Translate returned an unexpected response'))
  }
  catch (error) {
    return formatError(toReadableError(error))
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
  // Google only translates Norwegian as a whole: `nno` is not a known code and is echoed back.
  nn_no: 'no',
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
