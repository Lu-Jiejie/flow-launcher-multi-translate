import type { AxiosInstance } from 'axios'
import type { LanguageCode } from './service/language'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import clipboard from 'clipboardy'
import { Flow } from 'flow-plugin'
import { createAxiosInstance } from './axios'
import { serviceNamesMap } from './service'
import { services as servicesData } from './service/index'
import { languageCodesArr, languageNamesMap } from './service/language'
import { parseSettings } from './settings'

const _dirname = path.resolve((path.dirname(fileURLToPath(import.meta.url))), '..')
const assetsPath = path.join(_dirname, 'assets')

const messagesMap: Record<string, { en: string, tr: string, zh: string }> = {
  unsupportedSourceLanguage: { en: 'Unsupported source language', tr: 'Desteklenmeyen kaynak dil', zh: '不支持的源语言' },
  unsupportedSourceLanguageSubtitle: { en: 'Please check your configuration.', tr: 'Lütfen yapılandırmanızı kontrol edin.', zh: '请检查您的配置。' },
  unsupportedTargetLanguage: { en: 'Unsupported target language', tr: 'Desteklenmeyen hedef dil', zh: '不支持的目标语言' },
  unsupportedTargetLanguageSubtitle: { en: 'Please check your configuration.', tr: 'Lütfen yapılandırmanızı kontrol edin.', zh: '请检查您的配置。' },
  noServicesConfigured: { en: 'No services configured', tr: 'Yapılandırılmış hizmet yok', zh: '未配置翻译服务' },
  noServicesConfiguredSubtitle: { en: 'Please check your configuration.', tr: 'Lütfen yapılandırmanızı kontrol edin.', zh: '请检查您的配置。' },
  defaultSelected: { en: 'Default selected: ', tr: 'Varsayılan seçili: ', zh: '默认选择: ' },
  quickSelect: { en: 'Quick select: ', tr: 'Hızlı seçim: ', zh: '快速选择: ' },
}

function main() {
  const flow = new Flow({ keepOrder: true })
  let axiosInstance: AxiosInstance | null = null

  flow.on('query', async ({ prompt, settings: rawSettings }, response) => {
    const settings = parseSettings(rawSettings as any)
    const { interfaceLanguage } = settings

    if (axiosInstance === null) {
      axiosInstance = createAxiosInstance(settings)
    }

    // no services configured
    if (!settings.services || settings.services.length === 0) {
      flow.add({
        title: messagesMap.noServicesConfigured[interfaceLanguage],
        subtitle: messagesMap.noServicesConfiguredSubtitle[interfaceLanguage],
        icoPath: `${assetsPath}/warning.png`,
      })
      return
    }
    // unsupported source language
    if (languageNamesMap[settings.sourceLanguageCode] === undefined) {
      flow.add({
        title: `${messagesMap.unsupportedSourceLanguage[interfaceLanguage]} ${settings.sourceLanguageCode}`,
        subtitle: messagesMap.unsupportedSourceLanguageSubtitle[interfaceLanguage],
        icoPath: `${assetsPath}/warning.png`,
      })
      return
    }
    // unsupported target language
    if (languageNamesMap[settings.targetLanguageCode] === undefined) {
      flow.add({
        title: `${messagesMap.unsupportedTargetLanguage[interfaceLanguage]} ${settings.targetLanguageCode}`,
        subtitle: messagesMap.unsupportedTargetLanguageSubtitle[interfaceLanguage],
        icoPath: `${assetsPath}/warning.png`,
      })
      return
    }

    // no prompt and show quick select: language pairs
    if (
      settings.languagePairs
      && settings.languagePairs.length > 0
      && prompt.trim().length === 0
    ) {
      // filter illegal language pairs
      const validPairs = settings.languagePairs.filter((pair) => {
        const [source, target] = pair.split('>').map(i => i.trim())
        return (
          languageCodesArr.includes(source as LanguageCode)
          && languageCodesArr.includes(target as LanguageCode)
        )
      })

      response.add(
        {
          title: `${languageNamesMap[settings.sourceLanguageCode][interfaceLanguage]} → ${languageNamesMap[settings.targetLanguageCode][interfaceLanguage]}`,
          subtitle: `${messagesMap.defaultSelected[interfaceLanguage]} ${settings.sourceLanguageCode} → ${settings.targetLanguageCode}`,
          icoPath: `${assetsPath}/info.png`,
        },
        ...validPairs.map((pair) => {
          const [source, target] = pair.split('>').map(i => i.trim())
          const sourceName = languageNamesMap[source as LanguageCode][interfaceLanguage] || source
          const targetName = languageNamesMap[target as LanguageCode][interfaceLanguage] || target
          return {
            title: `${sourceName} → ${targetName}`,
            subtitle: `${messagesMap.quickSelect[interfaceLanguage]} ${source} → ${target}`,
            icoPath: `${assetsPath}/info.png`,
            jsonRPCAction: Flow.Actions.changeQuery(`${settings.triggerKeyword} ${pair} `, { requery: true }),
          }
        }),
      )
      return
    }

    // parse prompt to prefix and text
    const { sourceLanguageCode, targetLanguageCode, text } = parsePrompt(prompt, settings.sourceLanguageCode, settings.targetLanguageCode)
    if (!text || text.trim().length === 0) {
      response.add({
        title: `${languageNamesMap[sourceLanguageCode][interfaceLanguage]} → ${languageNamesMap[targetLanguageCode][interfaceLanguage]}`,
        subtitle: `${messagesMap.defaultSelected[interfaceLanguage]} ${sourceLanguageCode} → ${targetLanguageCode}`,
        icoPath: `${assetsPath}/info.png`,
      })
      return
    }

    const translatePromises = settings.services.map(async (name) => {
      const service = servicesData[name]
      if (!service)
        return null
      if (service.languagesMap[sourceLanguageCode] === undefined) {
        return { result: messagesMap.unsupportedSourceLanguage[interfaceLanguage], name }
      }
      if (service.languagesMap[targetLanguageCode] === undefined) {
        return { result: messagesMap.unsupportedTargetLanguage[interfaceLanguage], name }
      }
      const result = await service.translate(
        text,
        service.languagesMap[sourceLanguageCode],
        service.languagesMap[targetLanguageCode],
        axiosInstance!,
        settings,
      )
      return { result, name }
    })

    const results = await Promise.all(translatePromises)
    const responseItems = results
      .filter(item => item !== null)
      .map(({ name, result }) => {
        return {
          title: result,
          subtitle: `${languageNamesMap[sourceLanguageCode][interfaceLanguage]} → ${languageNamesMap[targetLanguageCode][interfaceLanguage]}  [${serviceNamesMap[name][interfaceLanguage]}]`,
          icoPath: `${assetsPath}/service_icon/${name}.png`,
          jsonRPCAction: Flow.Actions.custom('copy', [result]),
        }
      })

    response.add(...responseItems)
  })

  flow.on('copy', ({ parameters: [result] }) => {
    // exec(`echo ${result} | clip`)
    clipboard.writeSync(result as string)
  })
}

export function parsePrompt(
  prompt: string,
  oldSourceLanguageCode: LanguageCode,
  oldTargetLanguageCode: LanguageCode,
): {
    sourceLanguageCode: LanguageCode
    targetLanguageCode: LanguageCode
    text: string
  } {
  // Check if there is prefix
  const spaceIndex = prompt.indexOf(' ')

  // prefix too long seems like a text
  if (spaceIndex > 15) {
    return {
      sourceLanguageCode: oldSourceLanguageCode,
      targetLanguageCode: oldTargetLanguageCode,
      text: prompt,
    }
  }

  let prefix = ''
  let rest = ''

  // there is no space
  if (spaceIndex === -1) {
    prefix = prompt
    rest = ''
  }
  else {
    prefix = prompt.substring(0, spaceIndex)
    rest = prompt.substring(spaceIndex + 1).trim()
  }

  // logger.info(`Prefix: "${prefix}", Rest: "${rest}"`)

  // Part 1: A>B
  const match1 = prefix.match(/^([a-z_]+)>([a-z_]+)$/)
  if (match1) {
    const [_, source, target] = match1
    if (languageCodesArr.includes(source as any) && languageCodesArr.includes(target as any)) {
      return {
        sourceLanguageCode: source as LanguageCode,
        targetLanguageCode: target as LanguageCode,
        text: rest,
      }
    }
  }

  // Part 2: A>
  const match2 = prefix.match(/^([a-z_]+)>$/)
  if (match2) {
    const [_, source] = match2
    // console.log(languageCodesArr.includes(source))
    if (languageCodesArr.includes(source as any)) {
      return {
        sourceLanguageCode: source as LanguageCode,
        targetLanguageCode: oldTargetLanguageCode,
        text: rest,
      }
    }
  }

  // Part 3: B or >B
  const match3 = prefix.match(/^>?([a-z_]+)$/)
  if (match3) {
    const [_, target] = match3
    if (languageCodesArr.includes(target as any)) {
      return {
        sourceLanguageCode: oldSourceLanguageCode,
        targetLanguageCode: target as LanguageCode,
        text: rest,
      }
    }
  }

  // Default case
  return {
    sourceLanguageCode: oldSourceLanguageCode,
    targetLanguageCode: oldTargetLanguageCode,
    text: prompt,
  }
}

main()
