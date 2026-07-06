# OpenAI Transport Diagnostic

Check date: 2026-07-05  
Scope: one minimal connectivity request to the OpenAI Models API following the
failed real AI smoke test.

## 1. Overall Status

**Status: TRANSPORT FAILURE CONFIRMED**

The OpenAI API was not reachable from the current runtime. The diagnostic
request timed out while connecting to `api.openai.com:443`, before any HTTP
response was received.

Exactly one OpenAI diagnostic request was made. The structured generation smoke
test was not retried.

## 2. Environment Check

| Check | Result |
| --- | --- |
| `.env` exists | Pass |
| AI_API_KEY configured | yes |
| AI model configured | Pass |
| AI_API_KEY exposed | No |

The API key value was not printed or written to this report. The `.env` file
was not modified.

## 3. Configured Model

`AI_MODEL_NAME` is configured as:

```text
gpt-4.1-mini
```

Model availability could not be checked because the API connection did not
reach the HTTP response stage.

## 4. Connectivity Check

The diagnostic used Node `fetch` for one authenticated `GET` request to:

```text
https://api.openai.com/v1/models
```

| Check | Result |
| --- | --- |
| OpenAI diagnostic requests | 1 |
| API reachable | No |
| HTTP response received | No |
| HTTP status | Not available |
| Response body | Not available |

No AI generation endpoint was called during this diagnostic.

## 5. Safe Error Summary

```text
Error name: TypeError
Error message: fetch failed
Cause name: ConnectTimeoutError
Cause code: UND_ERR_CONNECT_TIMEOUT
Cause message: Connect Timeout Error
Attempted endpoint: api.openai.com:443
Connection timeout: 10000ms
```

No API key or authorization header is included in this summary.

## 6. Failure Classification

**Classification: `network_unreachable`**

The connection attempt timed out before TLS negotiation or an HTTP response.
This rules out conclusions based on HTTP responses, including:

- `invalid_api_key`
- `insufficient_quota_or_billing`
- `model_not_found`
- `invalid_request_format`
- `unknown_provider_error`

The result is not classified as `dns_or_tls_error` because the observed cause
was a connection timeout rather than a reported DNS lookup or TLS certificate
failure. A local proxy, firewall, VPN, routing rule, or blocked outbound
connection can produce this result.

## 7. `llmClient.ts` Error Handling Check

The existing client catches the original `fetch` exception and throws:

```text
LLM provider request failed
```

It preserves the original exception in the JavaScript `cause` property, but
the top-level message does not include the cause name, cause code, or cause
message. Therefore, callers that only record `error.message` cannot see
`ConnectTimeoutError` or `UND_ERR_CONNECT_TIMEOUT`.

No source change was made as part of this diagnostic.

## 8. Blockers

Outbound HTTPS connectivity from the current Node runtime to
`api.openai.com:443` must be restored before API key, billing, model access, or
request-format behavior can be verified.

Items to inspect outside this task:

1. Local VPN or proxy requirements.
2. Firewall or outbound network policy for TCP port 443.
3. Whether Node is configured to use the required HTTP/HTTPS proxy.
4. Network routing or filtering for `api.openai.com`.

## 9. Recommendation

**Fix network/proxy/DNS**

After Node can receive an HTTP response from the OpenAI API, repeat the
single-call OpenAI smoke test. Do not change the Provider request format based
on this result; the request did not reach the API server.
