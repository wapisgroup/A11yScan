# Development Documentation Browser

This is a localhost-only documentation browser for internal project documentation.

## Usage

1. **Access the browser**: Navigate to `http://localhost:3000/dev/docs` in your browser
2. **Add documentation**: Place any `.md` (Markdown) files in the `dev/docs/` directory
3. **View documentation**: Click on any document in the list to view it with full markdown rendering

## Features

- 📝 Full markdown support with GitHub Flavored Markdown (GFM)
- � **Mermaid diagram support** - Render flowcharts, sequence diagrams, and more
- �🔒 Localhost only - automatically redirects in production
- 📱 Responsive design with Tailwind CSS
- 🎨 Beautiful typography using @tailwindcss/typography
- 📂 Automatic file listing with metadata (size, modified date)
- 🔙 Easy navigation between documents

## Security

This feature is designed for **development use only**:
- Only accessible on `localhost`
- Automatically returns 404 in production environments
- No links in the main navigation menu
- Direct URL access only

## Adding Documents

Simply drop any `.md` file into the `dev/docs/` directory and it will automatically appear in the documentation browser.

### Mermaid Diagrams

You can add interactive diagrams to your documentation using Mermaid syntax:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[Decision]
    C -->|Yes| D[Success]
    C -->|No| E[Retry]
\`\`\`

Supported diagram types:
- Flowcharts (`graph`)
- Sequence diagrams (`sequenceDiagram`)
- Class diagrams (`classDiagram`)
- State diagrams (`stateDiagram-v2`)
- Gantt charts (`gantt`)
- Pie charts (`pie`)
- Entity relationship diagrams (`erDiagram`)
- Git graphs (`gitGraph`)

See `MERMAID_EXAMPLES.md` for comprehensive examples of all diagram types.

## Technical Details

- **Frontend**: Next.js App Router with React Server Components
- **Markdown Rendering**: react-markdown with remark-gfm
- **Styling**: Tailwind CSS with typography plugin
- **API Routes**: Custom Next.js API routes for file system access

## File Structure

```
dashboard-app/
  app/
    dev/
      docs/
        page.tsx              # Main documentation list page
        [slug]/
          page.tsx            # Individual document viewer
    api/
      dev/
        docs/
          route.ts            # API to list all markdown files
          [slug]/
            route.ts          # API to get individual file content
```
