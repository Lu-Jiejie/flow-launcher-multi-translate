import { describe, expect, it } from 'vitest'
import { languagesMap as bingLanguages, buildTranslateUrl, parseTranslationResult } from '../src/service/bing'
import { parseBatchexecuteResponse, parseGtxResponse } from '../src/service/google'

// The payload snippets below are trimmed copies of what the live services actually return, so these
// tests keep working without network access.

describe('bing', () => {
  it('asks the token-free endpoint for a translation', () => {
    expect(buildTranslateUrl('en', 'zh-Hans'))
      .toBe('https://edge.microsoft.com/translate/translatetext?isEnterpriseClient=false&to=zh-Hans&from=en')
  })

  it('omits the source language when it is set to automatic detection', () => {
    // `from=auto` is rejected by the endpoint, so auto detection has to send no `from` at all.
    const url = buildTranslateUrl(bingLanguages.auto!, 'zh-Hans')
    expect(url).toBe('https://edge.microsoft.com/translate/translatetext?isEnterpriseClient=false&to=zh-Hans')
    expect(url).not.toContain('from=')
  })

  it('reads a translation out of the response', () => {
    expect(parseTranslationResult([
      {
        detectedLanguage: { language: 'en', score: 0.9 },
        translations: [{ text: 'Hola mundo', to: 'es', sentLen: { srcSentLen: [11], transSentLen: [10] } }],
      },
    ])).toBe('Hola mundo')
  })

  it('joins every translated item of the response', () => {
    expect(parseTranslationResult([
      { translations: [{ text: '你好' }] },
      { translations: [{ text: '再见' }] },
    ])).toBe('你好再见')
  })

  it('reports a response that carries no translation', () => {
    expect(() => parseTranslationResult('')).toThrow()
    expect(() => parseTranslationResult([])).toThrow()
    expect(() => parseTranslationResult([{ detectedLanguage: { language: 'en' } }])).toThrow()
  })
})

describe('google', () => {
  const okChunk = JSON.stringify([
    ['wrb.fr', 'MkEWBc', JSON.stringify([
      null,
      [
        [[null, null, null, null, null, [['你好世界', null, null, null, null, null, 'hello world', 1]], null, null, null, []]],
        'zh-CN',
        1,
        'en',
        ['hello world', 'en', 'zh-CN', true],
      ],
      'en',
      null,
      null,
      null,
      null,
      [[[0]]],
    ]), null, null, null, 'generic'],
    ['di', 37],
  ])

  it('reads a translation out of the batchexecute response', () => {
    expect(parseBatchexecuteResponse(`)]}'\n\n380\n${okChunk}\n25\n[["e",4,null,null,420]]\n`))
      .toEqual({ kind: 'translation', text: '你好世界' })
  })

  it('reports a language pair that Google refuses', () => {
    expect(parseBatchexecuteResponse(`)]}'\n\n105\n[["wrb.fr","MkEWBc",null,null,null,[13],"generic"]]\n`))
      .toEqual({ kind: 'rejected', code: 13 })
  })

  it('does not mistake an HTML error page for a translation', () => {
    expect(parseBatchexecuteResponse('<html>429</html>')).toEqual({ kind: 'unknown' })
    expect(parseBatchexecuteResponse('')).toEqual({ kind: 'unknown' })
  })

  it('reads a translation out of the client=gtx response', () => {
    expect(parseGtxResponse([[['你好世界', 'hello world', null, null, 10]], null, 'en'])).toBe('你好世界')
    expect(parseGtxResponse([[['一天一个苹果，医生远离你。']]])).toBe('一天一个苹果，医生远离你。')
  })

  it('does not mistake the google.com/sorry page for a translation', () => {
    expect(parseGtxResponse('<!DOCTYPE html><html>Error 403 (Forbidden)!!1</html>')).toBeNull()
  })
})
