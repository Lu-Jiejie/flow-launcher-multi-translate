import { describe, expect, it } from 'vitest'
import { parsePrompt } from '../src/index'

// Both direction modes are pure logic, so they are covered without any network access.

describe('parsePrompt in the configured direction mode', () => {
  it('reads a bare word prefix as the target language', () => {
    expect(parsePrompt('fr hello', 'auto', 'en')).toEqual({
      sourceLanguageCode: 'auto',
      targetLanguageCode: 'fr',
      text: 'hello',
    })
  })

  it('reads the A>B prefix as both languages', () => {
    expect(parsePrompt('zh>fr hello', 'auto', 'en')).toEqual({
      sourceLanguageCode: 'zh',
      targetLanguageCode: 'fr',
      text: 'hello',
    })
  })

  it('reads the A> prefix as the source language only', () => {
    expect(parsePrompt('zh> hello', 'auto', 'en')).toEqual({
      sourceLanguageCode: 'zh',
      targetLanguageCode: 'en',
      text: 'hello',
    })
  })

  it('keeps the configured direction for plain text', () => {
    expect(parsePrompt('hello world', 'auto', 'en')).toEqual({
      sourceLanguageCode: 'auto',
      targetLanguageCode: 'en',
      text: 'hello world',
    })
  })

  it('keeps a long first word as text instead of reading it as a prefix', () => {
    expect(parsePrompt('internationalization is important', 'auto', 'en')).toEqual({
      sourceLanguageCode: 'auto',
      targetLanguageCode: 'en',
      text: 'internationalization is important',
    })
  })
})

describe('parsePrompt in the Chinese-English mode', () => {
  // Bare English words that are also language codes have to stay text: `is` is Icelandic, `to` is
  // Tongan, `my` is Burmese, `he` is Hebrew and so on.
  const englishSentences = [
    'hi there',
    'is this ok',
    'it works fine',
    'my name is bob',
    'he said hello',
    'so what',
    'to be or not to be',
    'am i right',
    'as far as i know',
    'id like coffee',
    'or not',
    'no problem',
    'do it now',
    'go home',
    'we can try',
    'us and them',
    'at the end',
    'on the way',
    'of course',
    'if you want',
    'by the way',
    'yes please',
  ]

  it.each(englishSentences)('translates %j into Chinese', (sentence) => {
    expect(parsePrompt(sentence, 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'en',
      targetLanguageCode: 'zh',
      text: sentence,
    })
  })

  it.each([
    '你好世界',
    '今天天气不错',
    '机器学习是人工智能的一个分支',
    '你好',
  ])('translates %j into English', (sentence) => {
    expect(parsePrompt(sentence, 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'zh',
      targetLanguageCode: 'en',
      text: sentence,
    })
  })

  it('still honors an explicit A>B prefix', () => {
    expect(parsePrompt('zh>fr hello', 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'zh',
      targetLanguageCode: 'fr',
      text: 'hello',
    })
  })

  it('still honors an explicit >B prefix', () => {
    expect(parsePrompt('>ja hello', 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'auto',
      targetLanguageCode: 'ja',
      text: 'hello',
    })
  })

  it('still honors an explicit A> prefix', () => {
    expect(parsePrompt('zh> 你好', 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'zh',
      targetLanguageCode: 'en',
      text: '你好',
    })
  })

  it('falls back to the configured direction for an empty query', () => {
    expect(parsePrompt('', 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'auto',
      targetLanguageCode: 'en',
      text: '',
    })
  })

  it('treats text without Chinese characters as English input', () => {
    // Detection is deliberately restricted to Chinese and English.
    expect(parsePrompt('Bonjour le monde', 'auto', 'en', true)).toEqual({
      sourceLanguageCode: 'en',
      targetLanguageCode: 'zh',
      text: 'Bonjour le monde',
    })
  })
})
