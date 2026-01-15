# Domain

## Core Concepts

### Post
A generated piece of content ready to be posted on Threads.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| type | PostType | One of ag, pro, br, in |
| content | string | Generated text content |
| topic | string | Input topic used for generation |
| createdAt | ISO date | Generation timestamp |

### PostType
Category of post that determines the generation prompt.

| Type | Code | Purpose |
|------|------|---------|
| Aggro | ag | Increase reach with broad topics and strong hooks |
| Proof | pro | Demonstrate abilities, convert interested readers |
| Brand | br | Share values and stories, build brand connection |
| Insight | in | Provide detailed vibe coding information |

### AppConfig
User preferences and settings.

| Field | Type | Description |
|-------|------|-------------|
| geminiApiKey | string | Google Gemini API key |
| autoGenerateEnabled | boolean | Auto generation toggle |
| autoGenerateInterval | number | Minutes between auto generations |
| prompts | Record | Custom prompts for each post type |

## Persona: kimppopp_

The AI-generated content follows a specific persona:
- Expert in vibe coding and AI
- Confident, informal Korean writing style
- Uses numbers and results for authority
- Creates FOMO (fear of missing out)
- Acts as a tough mentor with occasional warmth
