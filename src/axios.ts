import type { Settings } from './settings'
import axios from 'axios'
import { logger } from './logger'
// import { config } from './settings'

type AxiosBaseConfig = Parameters<typeof axios.create>[0]

function parseProxyUrl(proxyUrl: string): AxiosBaseConfig {
  // `127.0.0.1:7890` is just as natural to type as `http://127.0.0.1:7890`, but the URL parser
  // reads the bare form as an invalid scheme, so give it one.
  const normalized = /^[a-z][\w+.-]*:\/\//i.test(proxyUrl) ? proxyUrl : `http://${proxyUrl}`
  const url = new URL(normalized)
  return {
    proxy: {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: Number.parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
    },
  }
}

export function createAxiosInstance(settings: Settings) {
// handle proxy configuration
  const proxyUrl = settings.proxyUrl?.trim() || ''
  const axiosBaseConfig: AxiosBaseConfig = {
    timeout: settings.requestTimeout,
  }
  if (!proxyUrl)
    return axios.create(axiosBaseConfig)

  try {
    return axios.create({
      ...axiosBaseConfig,
      ...parseProxyUrl(proxyUrl),
    })
  }
  catch {
    // A malformed proxy URL must not take the whole query down with it; fall back to no proxy.
    logger.warn(`Ignoring malformed proxy URL: ${proxyUrl}`)
    return axios.create(axiosBaseConfig)
  }
}
