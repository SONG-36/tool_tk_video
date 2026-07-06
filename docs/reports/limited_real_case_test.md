# Limited Real Case AI Test

Check date: 2026-07-05T13:02:47.507Z

## Overall Status

PASS

## Product Case

```json
{
  "product_name": "Portable Neck Fan",
  "category": "Personal Cooling Gadget",
  "target_platform": "TikTok",
  "target_market": "US",
  "target_language": "English",
  "objective": "conversion",
  "description": "A lightweight rechargeable neck fan for hot weather and outdoor activities.",
  "selling_points": [
    "hands-free cooling",
    "lightweight design",
    "USB rechargeable",
    "three speed settings"
  ],
  "target_audience": "commuters, outdoor workers, travelers, and people who feel hot easily",
  "usage_scenarios": [
    "commuting",
    "walking outdoors",
    "travel",
    "working in warm spaces"
  ],
  "price": "29.99",
  "currency": "USD",
  "known_claims": [],
  "unknown_fields": []
}
```

## Results

- Trend fallback generated: yes
- Scripts generated: 5
- First script has hook: yes
- First script has CTA: yes
- Shots generated for first script: 4
- First shot has required fields: yes
- Model prompt generated: yes

## First Script Summary

```json
{
  "script_index": 1,
  "title": "Beat the Heat Hands-Free",
  "creative_angle": "Problem > Solution > Features > Call to Action",
  "hook": "Tired of feeling hot and sticky? Check this out!",
  "problem": "Feeling uncomfortable and sweaty during hot weather or outdoor activities.",
  "solution": "Use the Portable Neck Fan for hands-free, lightweight cooling wherever you go.",
  "proof_or_demo": "unknown",
  "cta": "Get your Portable Neck Fan today for just $29.99!",
  "voiceover": "Tired of the heat? Stay cool hands-free with our lightweight Portable Neck Fan. Rechargeable via USB and with three speed settings, it’s perfect for commuting, travel, or working outdoors. Grab yours now for only twenty-nine ninety-nine!",
  "on_screen_text": "Hands-Free Cooling\nLightweight Design\nUSB Rechargeable\n3 Speed Settings\n$29.99",
  "estimated_duration": 15,
  "asset_usage_plan": [
    "Show product photo with close-up on lightweight design and controls",
    "Overlay text highlighting hands-free, USB rechargeable, and 3 speed settings",
    "Use upbeat music and quick cuts between heat discomfort and relief",
    "End with price and call to action text"
  ],
  "risk_notes": [
    "No proof or demo video available; cooling effect not visually demonstrated",
    "Avoid making unsupported health or cooling claims"
  ]
}
```

## First Shot Summary

```json
{
  "shot_index": 1,
  "duration": 3,
  "visual": "Close-up of a person wiping sweat from their forehead, looking uncomfortable in a hot outdoor setting",
  "action": "Person shows discomfort from heat, fanning themselves with a hand",
  "camera": "Medium close-up, steady",
  "on_screen_text": "Tired of feeling hot and sticky?",
  "voiceover_segment": "Tired of the heat?",
  "shot_type": "REAL",
  "purpose": "Establish the problem of heat discomfort",
  "required_asset": "none",
  "asset_availability": "not_required",
  "risk_notes": []
}
```

## Model Prompt Summary

```json
{
  "shot_id": "1",
  "model": "kling",
  "prompt": "Create a vertical 9:16 close-up shot of a person outdoors in hot weather, wiping sweat from their forehead and looking uncomfortable. The person is fanning themselves with one hand to show heat discomfort. The camera framing is a medium close-up, steady shot. Overlay the on-screen text 'Tired of feeling hot and sticky?' in clear, readable font near the top or bottom of the frame. The scene should convey the problem of heat discomfort naturally without showing the product yet.",
  "negative_prompt": "No product visible, no logos, no unrealistic elements, no other people, no indoor settings, no cold or cool imagery.",
  "duration": 3,
  "aspect_ratio": "9:16",
  "camera_instruction": "Medium close-up, steady framing focused on the person's face and upper torso.",
  "motion_instruction": "Minimal motion, slight natural movements as the person wipes sweat and fans themselves.",
  "style_instruction": "Natural outdoor lighting, realistic and relatable depiction of heat discomfort.",
  "product_constraints": [],
  "safety_constraints": [],
  "source_asset_requirements": [],
  "risk_notes": [],
  "needs_user_input": false
}
```

## Errors

None

## Recommendation

Continue to local DB/Worker pipeline test
