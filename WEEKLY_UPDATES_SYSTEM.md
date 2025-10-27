# Weekly Updates System

This system allows you to create weekly newsletters by writing markdown files instead of manually updating code. The system automatically parses your markdown files and includes them in the weekly digest emails.

## Quick Start

1. **Create a new weekly update:**

   ```bash
   pnpm run create-weekly-update
   ```

2. **Edit the generated file** in `weekly-updates/Updates-MM-DD-YYYY.md`

3. **The system automatically includes it** in the next weekly digest email

## How It Works

### 1. File Organization

- Weekly update files are stored in `weekly-updates/` directory
- Files follow the naming convention: `Updates-MM-DD-YYYY.md`
- The system automatically finds the most recent file

### 2. Content Structure

Each markdown file should have these sections:

```markdown
# Week of [Date]

## What Shipped

- **Feature Name**: Description with [optional link](URL)
- **Another Feature**: Description of what was built

## Highlights

- **Improvement**: What got better this week
- **Performance**: Any performance improvements

## Coming Up Next

- **Next Feature**: What's being worked on
- **Planned Improvement**: Future enhancements

## Notes

Any additional context or notes about the week.
```

### 3. Automatic Integration

- The weekly digest endpoint (`/api/cron/weekly-digest`) automatically loads content from markdown files
- If no markdown file is found, it falls back to default content
- Content is parsed and converted to the newsletter format

## Usage

### Creating Weekly Updates

**Option 1: Use the script (recommended)**

```bash
# Create for current week
pnpm run create-weekly-update

# Create for specific date
pnpm run create-weekly-update -- --date 2025-01-25

# Use custom template
pnpm run create-weekly-update -- --template custom-template
```

**Option 2: Manual creation**

1. Copy `weekly-updates/templates/weekly-update-template.md`
2. Rename to `Updates-MM-DD-YYYY.md`
3. Edit the content

### Writing Content

**Best Practices:**

- Use descriptive titles that clearly explain what was done
- Include links where relevant: `[link text](URL)`
- Keep descriptions concise but informative
- Use consistent formatting for better parsing
- Add emojis sparingly for visual appeal

**Section Guidelines:**

- **What Shipped**: Focus on user-facing features and improvements
- **Highlights**: Technical achievements, performance improvements, UX enhancements
- **Coming Up Next**: Planned work, research, or experimental features
- **Notes**: Additional context, challenges, lessons learned, or team updates

### Templates

The system includes a default template at `weekly-updates/templates/weekly-update-template.md`. You can create custom templates by adding new `.md` files to the `templates/` directory.

## Technical Details

### File Parsing

The `WeeklyUpdatesParserService` handles:

- Finding the most recent update file
- Parsing markdown sections into structured data
- Converting content to newsletter format
- Handling links and formatting

### Integration Points

- **Weekly Digest Endpoint**: `/api/cron/weekly-digest` loads content from markdown files
- **Email Service**: Content is passed to `WeeklyUpdatesEmailService`
- **Cron Schedule**: Runs every Monday at 10:00 AM UTC

### Fallback Behavior

If no markdown file is found, the system uses fallback content to ensure the newsletter is always sent.

## File Structure

```
weekly-updates/
├── README.md                           # System documentation
├── templates/
│   └── weekly-update-template.md      # Default template
├── Updates-01-25-2025.md             # Example weekly update
└── Updates-02-01-2025.md             # Another weekly update
```

## Troubleshooting

### Common Issues

**"No weekly update file found"**

- Check that files follow the naming convention: `Updates-MM-DD-YYYY.md`
- Ensure files are in the `weekly-updates/` directory
- Verify the file is not empty

**Content not appearing in newsletter**

- Check the markdown formatting matches the expected structure
- Ensure section headers use `##` (two hashes)
- Verify list items start with `-` or `*`

**Parsing errors**

- Check for malformed markdown links: `[text](url)`
- Ensure consistent indentation
- Avoid special characters in section headers

### Debug Mode

To test the parser locally:

```bash
# Test the weekly digest endpoint
pnpm run cron:weekly-digest

# Check if files are being found
ls -la weekly-updates/Updates-*.md
```

## Migration from Manual Updates

If you were previously updating the weekly digest content manually in code:

1. **Create your first weekly update file** using the script
2. **Copy existing content** from the old system into the markdown file
3. **Test the system** by running the weekly digest endpoint
4. **Remove old manual content** from the codebase

## Future Enhancements

Planned improvements:

- **Enhanced Parsing**: More sophisticated markdown parsing for better content formatting
- **Template System**: Pre-built templates for different types of updates
- **Analytics Integration**: Track which weekly updates perform best with users
- **Preview Mode**: Preview how content will look in the newsletter
- **Batch Operations**: Create multiple weekly updates at once

## Support

If you encounter issues:

1. Check the console logs for parsing errors
2. Verify your markdown formatting
3. Test with the fallback content to isolate issues
4. Review the template for proper structure
