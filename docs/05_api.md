# API Reference

## Gemini API Integration

ThreadAuto uses Google Gemini API for content generation.

### Model

```
gemini-1.5-flash
```

### Endpoint

```
https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent
```

### Request Format

```typescript
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const result = await model.generateContent(prompt)
```

### Prompt Structure

```
[System Prompt - Persona and Rules]

[Topic] User-provided topic

Write a Threads post about this topic following all the rules above. Write in Korean.
```

---

## IPC Channels

### config:get
Returns current application configuration.

**Returns**: `AppConfig`

### config:set
Updates application configuration.

**Parameters**: `Partial<AppConfig>`

**Returns**: `AppConfig`

### posts:get
Returns all stored posts.

**Returns**: `Post[]`

### posts:delete
Deletes a post by ID.

**Parameters**: `string` (post ID)

**Returns**: `Post[]`

### generate:post
Generates a new post with specified type and topic.

**Parameters**: 
- `type`: `'ag' | 'pro' | 'br' | 'in'`
- `topic`: `string`

**Returns**: `Post`

### generate:auto
Generates a post with random type and topic.

**Returns**: `Post`

---

## Type Definitions

```typescript
interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
}

interface AppConfig {
  geminiApiKey: string
  autoGenerateEnabled: boolean
  autoGenerateInterval: number
  prompts: {
    ag: string
    pro: string
    br: string
    in: string
  }
}
```
