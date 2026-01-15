# Requirements

## Functional Requirements

### Post Generation
- FR-01: Generate posts using Gemini AI API
- FR-02: Support 4 post types (Aggro, Proof, Brand, Insight)
- FR-03: Allow custom topic input for generation
- FR-04: Store generated posts locally

### Auto Generation
- FR-05: Enable/disable automatic generation
- FR-06: Configure generation interval (minutes)
- FR-07: Rotate through post types automatically

### Post Management
- FR-08: Display posts in chronological order
- FR-09: Filter posts by type
- FR-10: Copy post content to clipboard
- FR-11: Delete individual posts

### Settings
- FR-12: Store and manage Gemini API key
- FR-13: Customize prompts for each post type
- FR-14: Persist settings across sessions

## Non-Functional Requirements

### Performance
- NFR-01: App should start within 3 seconds
- NFR-02: Post generation should complete within 30 seconds

### Usability
- NFR-03: Clean, Notion-inspired UI
- NFR-04: Minimal clicks to copy generated content

### Security
- NFR-05: API key stored locally only
- NFR-06: No external data transmission except to Gemini API
