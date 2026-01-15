# Use Cases

## UC-01: Manual Post Generation

**Actor**: User

**Preconditions**:
- Gemini API key is configured

**Flow**:
1. User navigates to Generate page
2. User selects post type
3. User enters topic
4. User clicks Generate
5. System calls Gemini API with prompt and topic
6. System stores generated post
7. System shows success message

**Postconditions**:
- New post is stored and visible in Posts page

---

## UC-02: Auto Post Generation

**Actor**: System

**Preconditions**:
- Gemini API key is configured
- Auto generation is enabled
- Interval is set

**Flow**:
1. Timer triggers at configured interval
2. System selects random post type
3. System selects random topic from predefined list
4. System calls Gemini API
5. System stores generated post

**Postconditions**:
- New post is added to storage

---

## UC-03: Copy Post to Clipboard

**Actor**: User

**Flow**:
1. User views post in Posts page
2. User clicks Copy button
3. System copies content to clipboard
4. System shows "Copied!" feedback

**Postconditions**:
- Post content is in system clipboard

---

## UC-04: Configure Settings

**Actor**: User

**Flow**:
1. User navigates to Settings page
2. User enters/updates API key
3. User toggles auto generation
4. User sets interval
5. User modifies prompts
6. User clicks Save
7. System persists configuration

**Postconditions**:
- Settings are saved and applied
