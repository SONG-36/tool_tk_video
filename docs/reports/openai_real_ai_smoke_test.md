# OpenAI Real AI Smoke Test

Check date: 2026-07-05T12:56:01.557Z

## 1. Overall Status

Status: PASS

Exactly one real OpenAI call was attempted through the existing AI Provider layer.

## 2. Environment Check

- AI_API_KEY configured: yes
- AI_MODEL_NAME: gpt-4.1-mini
- HTTP_PROXY configured: yes
- HTTPS_PROXY configured: yes
- ALL_PROXY configured: yes
- NODE_USE_ENV_PROXY: 1

The API key value was not printed or written to this report.

## 3. Prompt Template Used

trend_structuring.md

## 4. Required Fields Validation

Required fields:

- source_type
- fallback_used
- hook_patterns
- content_structures
- pacing_patterns
- ad_formulas

Missing fields:

None

fallback_used is true: yes

## 5. JSON Parse Result

Reached structured output stage.

## 6. Output Summary

```json
{
  "source_type": "fallback",
  "fallback_used": true,
  "hook_patterns": [
    "Struggling to keep your space organized? Check this out!",
    "Busy day? Make life easier with this simple gadget!",
    "Compact, easy, and perfect for your busy lifestyle!"
  ],
  "content_structures": [
    "Show a cluttered space, then reveal the product organizing it quickly.",
    "Demonstrate how easy it is to use the product in a real-life busy scenario.",
    "Highlight the compact design by comparing it to common household items."
  ],
  "pacing_patterns": [
    "Start fast with a problem, then slow down to show the product in action.",
    "Quick cuts between busy scenes and product usage to keep energy high.",
    "Use a steady pace to clearly demonstrate ease of use and compactness."
  ],
  "ad_formulas": [
    "Problem > Solution > Call to Action",
    "Before and After > Product Demo > Benefits Highlight",
    "Relatable Scenario > Product Introduction > Easy Purchase Prompt"
  ],
  "visual_patterns": [
    "Bright, clean backgrounds emphasizing the product's compact size.",
    "Close-up shots of hands using the product effortlessly.",
    "Split-screen showing before and after using the gadget."
  ],
  "audio_or_caption_patterns": [
    "Upbeat, motivating background music.",
    "Clear captions highlighting key benefits: 'Compact', 'Easy to Use'.",
    "Voiceover emphasizing how it fits into a busy lifestyle."
  ],
  "applicability_notes": [
    "Patterns are tailored for TikTok's short video format targeting busy adults in the US.",
    "Focus on conversion by clearly showing product benefits and ease of purchase."
  ],
  "risk_notes": [
    "Avoid making unsupported claims about product performance.",
    "Ensure visuals do not misrepresent the product size or functionality."
  ],
  "needs_user_input": false
}
```

## 7. Error Summary

```text
None
```

## 8. Cost Control Check

- Real AI calls attempted: 1
- Retry attempted: no
- Worker started: no
- Queue job created: no
- Database record written: no
- Scrape Creators called: no
- Full Pipeline started: no

## 9. Recommendation

Continue to limited Pipeline test
