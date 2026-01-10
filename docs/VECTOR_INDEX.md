# Vector Search Index Requirements

## Atlas Vector Search Index Configuration

### Index Details

**Index Name:** `vector_index`  
**Collection:** `decisions`  
**Field Path:** `embedding`  
**Index Type:** Vector Search

### Critical Requirements

1. **Embedding Dimension MUST Match Voyage Model Output**
   - **Model:** `voyage-large-2` (default in embeddings.ts)
   - **Expected Dimensions:** 1024
   - **Verification:** Run `npx tsx scripts/verify-setup.ts` (if present) or check Voyage AI docs

2. **Field Path Must Be Exact**
   - Path: `embedding` (not `decision.embedding` or `data.embedding`)
   - This is the field in the `decisions` collection documents

3. **Index Type**
   - Must be **Vector Search** index type in MongoDB Atlas
   - Not a regular index or text search index

---

## Creating the Index in MongoDB Atlas

### Via Atlas UI

1. Navigate to your cluster → **Search** → **Vector Search**
2. Click **Create Index**
3. Select collection: `decisions`
4. Index name: `vector_index`
5. Configuration:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1024,
         "similarity": "cosine"
       }
     ]
   }
   ```

### Via MongoDB Shell

```javascript
db.decisions.createSearchIndex({
  "name": "vector_index",
  "definition": {
    "mappings": {
      "dynamic": false,
      "fields": {
        "embedding": {
          "type": "knnVector",
          "dimensions": 1024,
          "similarity": "cosine"
        }
      }
    }
  }
})
```

---

## Verification

### Check Index Exists

Use `scripts/verify-setup.ts` (if present) or check in Atlas UI:

1. Go to **Search** → **Vector Search** tab
2. Verify `vector_index` appears in the list
3. Check field path is `embedding`
4. Verify dimensions match (1024 for voyage-large-2)

### Verify Embedding Dimensions

The embedding dimension **must match** the index dimensions. If they don't match:
- Vector search will fail or return incorrect results
- MongoDB will reject documents or throw errors

**To verify:**
- Check Voyage AI docs for `voyage-large-2` dimensions (should be 1024)
- Or test by calling the embeddings API and checking array length:
  ```typescript
  const embedding = await embedText("test");
  console.log("Embedding dimensions:", embedding.length); // Should be 1024
  ```

---

## Troubleshooting

### Error: "Vector search index error"

**Causes:**
- Index doesn't exist
- Wrong index name (`vector_index`)
- Wrong collection (`decisions`)
- Wrong field path (`embedding`)
- Dimension mismatch

**Fix:**
1. Verify index exists in Atlas UI
2. Check index configuration matches requirements above
3. Verify embedding dimensions match index dimensions

### Error: "Index not found"

**Fix:**
- Create the index using steps above
- Wait for index to finish building (can take a few minutes on free tier)

### Vector Search Returns No Results

**Possible causes:**
1. **Index still building** - Wait 2-5 minutes after creation
2. **Dimension mismatch** - Verify embedding length matches index dimensions
3. **No documents in collection** - Run seed-memory script first
4. **Similarity threshold too high** - Vector search may filter out low-similarity results

**Fix:**
- Wait for indexing to complete
- Verify dimensions match
- Ensure decisions collection has documents
- Check vector search similarity scores in API logs

---

## Reference

- **Vector Search Documentation:** https://www.mongodb.com/docs/atlas/atlas-vector-search/
- **Voyage AI Dimensions:** Check Voyage AI documentation for `voyage-large-2` output dimensions
- **Index Configuration:** See MongoDB Atlas Vector Search index creation guide
