# Image Upload Test Suggestions

## Good Test Images for Chipper

The image upload feature works best with engineering diagrams, blueprints, architecture diagrams, or any image containing text, labels, and structured information.

### Example Image Types:

1. **System Architecture Diagrams**
   - Boxes with labels (e.g., "API Gateway", "Database", "Cache")
   - Arrows showing data flow
   - Text annotations
   - Example: A simple microservices diagram with 3-4 boxes connected by arrows

2. **API Blueprint/Documentation**
   - Screenshot of Swagger/OpenAPI documentation
   - Hand-drawn API flow diagrams
   - REST endpoint diagrams with HTTP methods

3. **Database Schema Diagrams**
   - Entity-relationship diagrams
   - Table structures with column names
   - SQL schema visualizations

4. **Hardware/Electronic Diagrams**
   - Circuit diagrams with component labels
   - Block diagrams
   - Signal flow diagrams

5. **Flowcharts/Process Diagrams**
   - Decision trees
   - Process flows with text boxes
   - Sequence diagrams

### Quick Test - Create Your Own:

You can create a simple test image by:

1. **Using any drawing tool** (even Paint, Preview, or online tools like Excalidraw):
   - Draw a few boxes
   - Add text labels like:
     - "User Service"
     - "Auth Service"  
     - "Database"
   - Connect them with arrows
   - Add a title like "System Architecture"
   - Save as PNG or JPG

2. **Screenshot a diagram** from:
   - Documentation sites
   - Design tools (Figma, Draw.io)
   - Architecture diagrams from GitHub repos

3. **Simple text diagram** (hand-drawn and photographed):
   - Draw boxes with labels on paper
   - Take a photo with your phone
   - Upload the photo

### What Makes a Good Test Image:

✅ **Good for extraction:**
- Clear, readable text
- Structured layout (boxes, arrows, labels)
- High contrast text on background
- Text size large enough to read (at least 12pt equivalent)

❌ **Not ideal:**
- Very blurry or low resolution
- Text too small to read
- Handwriting that's hard to parse (though modern models handle this well)
- Images with no text (pure diagrams may not extract meaningful text)

### Example Structure (What the Vision Model Will Extract):

For a diagram like this:
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌─────┐  ┌─────┐
│ DB  │  │Cache│
└─────┘  └─────┘
```

The extracted text might look like:
```
System Architecture Diagram
- Client
- API Gateway
- Database (DB)
- Cache
Flow: Client -> API Gateway -> (Database | Cache)
```

### Test Image Ideas:

1. **Simple 3-box architecture**: User → API → Database
2. **API endpoints diagram**: GET /users, POST /auth, etc.
3. **Database schema**: Users table, Posts table, Relationships
4. **Circuit diagram**: Input → Processor → Output (with component labels)

Remember: The extracted text will be appended to your artifact content, so you can edit it before running the full analysis!

