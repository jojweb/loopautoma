# OpenAI Integration Guide

Loop Automa includes AI-powered prompt generation via OpenAI's GPT-4 Vision API. This feature allows automations to intelligently analyze screen content and generate appropriate prompts with built-in risk assessment.

## Setup

### 1. Obtain API Key

Get an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 2. Configure Environment

Set the `OPENAI_API_KEY` environment variable:

**Linux/macOS:**
```bash
export OPENAI_API_KEY="sk-..."
```

**Windows:**
```powershell
$env:OPENAI_API_KEY="sk-..."
```

Or add to your shell profile (~/.bashrc, ~/.zshrc) for persistence.

### 3. Optional Configuration

Additional environment variables:

- `OPENAI_API_ENDPOINT`: Custom API endpoint (default: `https://api.openai.com/v1/chat/completions`)
- `OPENAI_MODEL`: Model to use (default: `gpt-4-vision-preview`)

## How It Works

### LLM Prompt Generation Action

The LLMPromptGeneration action captures screen regions, sends them to GPT-4 Vision, and generates prompts with risk assessment.

**Workflow:**

1. **Capture**: Takes screenshots of specified regions
2. **Analyze**: Sends images to GPT-4 Vision with your system prompt
3. **Assess Risk**: LLM returns prompt + risk score (0.0–1.0)
4. **Validate**: Compares risk against threshold
5. **Store**: Saves prompt in variable for subsequent actions
6. **Abort on High Risk**: Plays alarm and stops if risk exceeds threshold

### Risk Levels

The LLM categorizes operations into three risk levels:

| Risk Level | Range | Examples |
|------------|-------|----------|
| **Low** | 0.0–0.33 | Safe operations: reading, basic commands, workspace navigation |
| **Medium** | 0.34–0.66 | Git operations, file management within workspace |
| **High** | 0.67–1.0 | External operations, privilege elevation, installations, deletions |

### Example Configuration

```json
{
  "name": "AI-Powered Agent Monitor",
  "regions": [
    { 
      "id": "chat-out", 
      "name": "Chat Output",
      "rect": { "x": 100, "y": 100, "width": 800, "height": 600 }
    }
  ],
  "trigger": { 
    "type": "IntervalTrigger", 
    "check_interval_sec": 60 
  },
  "condition": { 
    "type": "RegionCondition", 
    "consecutive_checks": 3,
    "expect_change": false
  },
  "actions": [
    {
      "type": "LLMPromptGeneration",
      "region_ids": ["chat-out"],
      "risk_threshold": 0.5,
      "system_prompt": "Analyze the AI agent output. If stuck, suggest 'continue'. If complete, suggest 'done'.",
      "variable_name": "prompt"
    },
    { "type": "MoveCursor", "x": 900, "y": 800 },
    { "type": "Click", "button": "left" },
    { "type": "Type", "text": "$prompt" },
    { "type": "Key", "key": "Enter" }
  ]
}
```

## Variable Expansion

Variables set by LLM actions are available in subsequent Type actions using `$variable_name` syntax.

**Available Variables:**

- `$prompt`: The generated prompt text (configurable via `variable_name` field)
- `$risk`: The risk score returned by the LLM (always available)

**Example Usage:**

```json
{
  "actions": [
    {
      "type": "LLMPromptGeneration",
      "region_ids": ["chat-out"],
      "risk_threshold": 0.6,
      "variable_name": "next_command"
    },
    {
      "type": "Type",
      "text": "$next_command"
    }
  ]
}
```

## Configuration Fields

### LLMPromptGeneration Action

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✓ | Must be "LLMPromptGeneration" |
| `region_ids` | string[] | ✓ | IDs of regions to capture and analyze |
| `risk_threshold` | number | ✓ | Max acceptable risk (0.0–1.0); aborts if exceeded |
| `system_prompt` | string | | Custom instructions for the LLM (optional) |
| `variable_name` | string | | Variable name for storing result (default: "prompt") |

## Testing Without API Key

Loop Automa includes a mock LLM client for testing without an API key.

**Automatic Fallback:**

If `OPENAI_API_KEY` is not set, the app automatically uses the mock client which returns safe, predictable responses:

```json
{
  "prompt": "continue",
  "risk": 0.1
}
```

**Explicit Mock Mode:**

Force mock mode for testing:

```bash
LOOPAUTOMA_BACKEND=fake bun run tauri dev
```

## Best Practices

### 1. Set Appropriate Risk Thresholds

- **Conservative (0.3–0.4)**: For critical systems, production environments
- **Balanced (0.5–0.6)**: General automation, development workflows
- **Permissive (0.7–0.8)**: Trusted environments, advanced use cases

### 2. Write Clear System Prompts

Good prompts guide the LLM to generate appropriate responses:

```json
{
  "system_prompt": "You are monitoring a code review. If comments need addressing, suggest 'fix the issues'. If approved, suggest 'merge'. Keep responses short."
}
```

### 3. Use Multiple Regions

Capture relevant context for better decisions:

```json
{
  "region_ids": ["terminal-output", "file-tree", "error-panel"]
}
```

### 4. Test Before Unattended Use

Run your automation manually several times to verify:
- LLM generates appropriate prompts
- Risk assessment aligns with your threshold
- Actions execute correctly with generated prompts

## Troubleshooting

### API Key Not Working

**Symptoms:** Errors about missing or invalid API key

**Solutions:**
1. Verify key starts with `sk-`
2. Check key is active at platform.openai.com
3. Ensure environment variable is set in the shell running the app
4. Restart the app after setting the variable

### High API Costs

**Symptoms:** Unexpected OpenAI charges

**Solutions:**
1. Increase `check_interval_sec` to reduce API calls
2. Use smaller region captures
3. Add more specific conditions to reduce false triggers
4. Set usage limits in OpenAI dashboard

### Risk Threshold Too Strict

**Symptoms:** Automation frequently aborts with "risk exceeds threshold"

**Solutions:**
1. Review aborted actions to understand risk assessment
2. Adjust threshold incrementally (e.g., 0.5 → 0.6)
3. Refine system prompt to guide LLM toward lower-risk suggestions
4. Consider if operation genuinely requires higher privileges

### Mock Client Used Unintentionally

**Symptoms:** Always getting "continue" with risk 0.1

**Solutions:**
1. Verify `OPENAI_API_KEY` is set
2. Check for `LOOPAUTOMA_BACKEND=fake` in environment
3. Restart app after setting API key

## Architecture Notes

### Implementation Details

- **Backend:** Rust trait `LLMClient` with `OpenAIClient` and `MockLLMClient` implementations
- **Feature Flag:** `llm-integration` enables OpenAI dependency (optional)
- **Context:** Variables stored in `ActionContext`, reset on monitor start
- **Expansion:** Type actions expand variables before execution

### Security Considerations

- API key stored only in environment variables (not in profiles)
- Screenshots sent to OpenAI (consider privacy implications)
- Risk assessment provides safety guardrail but is not foolproof
- Alarm sound plays when high-risk action is blocked

### Testing

Tests use mock client automatically:

```bash
# Rust tests with mock
cargo test

# UI tests
bun test

# E2E tests with mock
bun run test:e2e
```

## Further Reading

- [doc/architecture.md](./architecture.md) — Overall system design
- [doc/userManual.md](./userManual.md) — General usage guide
- [OpenAI Vision API Docs](https://platform.openai.com/docs/guides/vision) — GPT-4 Vision reference
