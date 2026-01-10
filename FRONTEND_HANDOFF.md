# Frontend Handoff

**DO NOT MODIFY THIS API WITHOUT BACKEND APPROVAL**

---

## API Contract

See `API_CONTRACT.md` for full details.

---

## Quick Summary

### Endpoint
```
POST /api/analyze
```

### Request
```json
{
  "artifactContent": "your code here"
}
```

### Response
```json
{
  "toolReport": "string",
  "agentMessages": [
    {
      "agentRole": "analysis" | "review" | "tradeoff" | "historian",
      "message": "string",
      "createdAt": "ISO timestamp string"
    }
  ],
  "decisions": [
    {
      "_id": "string",
      "summary": "string",
      "rationale": "string",
      "createdAt": "ISO timestamp string"
    }
  ]
}
```

---

## UI Mapping

| Field | UI Panel | Display Instructions |
|-------|----------|---------------------|
| `artifactContent` | Editor | User input → send to API |
| `toolReport` | Tool Output panel | Display as plain text |
| `agentMessages` | Agent Dialogue panel | Display in order: analysis → review → tradeoff → historian |
| `decisions` | Decision History panel | Sort by `createdAt` DESC (newest first) |

---

## Important Notes

1. **DO NOT** modify request/response structure
2. **DO NOT** add fields or "improvements"
3. **DO** handle errors (400, 500 status codes)
4. **DO** display messages in order received
5. **DO** sort decisions by `createdAt` descending
6. **DO** use `_id` as unique key for lists

---

## Error Handling

- **400 Bad Request**: Invalid input (missing/empty `artifactContent`)
- **500 Internal Server Error**: Server error (check error message)

Both return:
```json
{
  "error": "error message string"
}
```

---

**That's it. Don't "improve" it.**
