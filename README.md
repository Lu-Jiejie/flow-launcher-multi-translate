<p align="center">
<img src="./assets/icon.png" height="140">
</p>

<h1 align="center">
MultiTranslate
</h1>

<p align="center">
A Flow-Launcher plugin that translates text using multiple translation services.
</p>

## Supports

### Without configuration
- [Youdao](https://fanyi.youdao.com/)
- [Google](https://translate.google.com/)
- [Bing](https://www.bing.com/translator)
- [DeepL](https://www.deepl.com/translator)
- [Tencent](https://fanyi.qq.com/)
- [Transmart](https://transmart.qq.com)
- [Caiyun](https://fanyi.caiyunapp.com/)
- [Volcengine](https://translate.volcengine.com/)

> [!IMPORTANT]
> The above services are unofficial. Please use with discretion.
> Some services may have request limits.

### Requires configuration
- DeepLX (need personal URL)
- [MTranServer](https://github.com/xxnuo/MTranServer) (need personal URL and token)
- [DeepL](https://www.deepl.com/translator) (set personal auth key, it will use the official API to translate)
- [OpenAI](https://platform.openai.com/) (compatible with OpenAI, and other OpenAI-compatible APIs)

## Features

![example1](./assets/example1.png)

``` bash
#  Basic usage
tr [text]

# Specify a target language
tr >fr [text]
# or
tr fr [text]

# Specify a source language
tr zh> [text]

# Both source and target languages
tr zh>fr [text]
```

Just wait for the translation results, and select one of them to copy into the clipboard.

### Chinese ↔ English mode

Set **Translation Mode** to `Chinese ↔ English` to have the direction chosen for you: Chinese text
is translated into English and English text into Chinese, so `tr [text]` is usually all you need.

The direction is detected locally before any request is sent. Only Chinese and English are
considered, so text in another language is treated as English input.

> Note: in this mode a bare word is never read as a language code, because words such as `is`, `it`,
> `to`, `my` and `he` are ordinary English words that also happen to be language codes. Use the
> `>lang` form, for example `tr >fr [text]`, to force a target language.

## Configuration

See Flow-Launcher plugin settings page.

### Service Configs

+ DeepLX: Set your DeepLX URL.

```ini
DEEPLX_URL=YOUR_DEEPLX_URL
```

+ MTranServer: Set your MTranServer URL and token.

```ini
MTRAN_SERVER_URL=YOUR_MTRAN_SERVER_URL
MTRAN_SERVER_TOKEN=YOUR_MTRAN_SERVER_TOKEN
```

+ DeepL: If you set `DEEPL_KEY`, it will use the official DeepL API to translate, otherwise it will use the free web version (Free version may have request limits).

```ini
DEEPL_KEY=YOUR_DEEPL_KEY
```

+ OpenAI: Set your OpenAI API key, base URL, and model. Compatible with OpenAI, and other OpenAI-compatible APIs.

```ini
OPENAI_API_KEY=sk-YOUR_API_KEY
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-3.5-turbo
```

> Note: `OPENAI_BASE_URL` defaults to `https://api.openai.com` if not set.
> You can use other OpenAI-compatible API like [SiliconFlow](https://www.siliconflow.com/).

> Note: `OPENAI_API_KEY` is optional. Leave it unset for OpenAI-compatible servers that do not
> require authentication, such as a local Ollama or LM Studio instance; the `Authorization` header
> is then omitted from the request.

### OpenAI prompts and language names

+ **OpenAI System Prompt** and **OpenAI User Prompt** override the built-in messages. Both support
  the `{from}`, `{to}` and `{text}` placeholders. A custom user prompt must contain `{text}`,
  otherwise an error is shown and no request is sent.
+ **OpenAI Languages Map** overrides the language names used for `{from}` and `{to}`, as a JSON
  object such as `{"zh": "简体中文", "en": "英语"}`. Languages you leave out keep their built-in
  names.

## Language Codes List

+ I can only ensure the common languages are supported.
+ Each service may support different languages.

```typescript
export const languageCodesArr = [
  'auto',
  'af',
  'sq',
  'am',
  'ar',
  'hy',
  'as',
  'az',
  'bn',
  'ba',
  'eu',
  'bs',
  'bg',
  'yue',
  'ca',
  'zh',
  'zh_hant',
  'hr',
  'cs',
  'da',
  'prs',
  'dv',
  'nl',
  'en',
  'et',
  'fo',
  'fj',
  'fi',
  'fr',
  'gl',
  'ka',
  'de',
  'el',
  'gu',
  'ht',
  'ha',
  'he',
  'hi',
  'mww',
  'hu',
  'is',
  'ig',
  'id',
  'iu',
  'iu-Latn',
  'ga',
  'it',
  'ja',
  'kn',
  'kk',
  'km',
  'rw',
  'tlh-Latn',
  'tlh-Piqd',
  'ko',
  'ku',
  'ky',
  'lo',
  'lv',
  'lt',
  'mk',
  'mg',
  'ms',
  'ml',
  'mt',
  'mi',
  'mr',
  'mn_cy',
  'mn_mo',
  'my',
  'ne',
  'nb',
  'nb_no',
  'nn_no',
  'or',
  'ps',
  'fa',
  'pl',
  'pt',
  'pt_pt',
  'pt_br',
  'pa',
  'otq',
  'ro',
  'ru',
  'sm',
  'sr-Cyrl',
  'sr-Latn',
  'sd',
  'si',
  'sk',
  'sl',
  'so',
  'es',
  'sv',
  'ty',
  'ta',
  'tt',
  'te',
  'th',
  'bo',
  'ti',
  'to',
  'tr',
  'tk',
  'uk',
  'hsb',
  'ur',
  'ug',
  'uz',
  'vi',
  'cy',
  'xh',
  'yo',
  'yua',
  'zu',
] as const
```

## Thanks

[pot-app](https://github.com/pot-app/pot-desktop)
