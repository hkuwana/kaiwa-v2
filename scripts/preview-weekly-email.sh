#!/bin/bash

# Quick Weekly Email Preview Script
# Usage: ./scripts/preview-weekly-email.sh

echo "📧 Opening Weekly Email Editor..."
echo ""
echo "1. Opening template file in your editor..."

# Open the template file
if command -v code &> /dev/null; then
    code src/lib/emails/campaigns/product-updates/superhuman-template.ts
elif command -v vim &> /dev/null; then
    vim src/lib/emails/campaigns/product-updates/superhuman-template.ts
else
    echo "Please open this file manually:"
    echo "src/lib/emails/campaigns/product-updates/superhuman-template.ts"
fi

echo ""
echo "2. Once you've edited the content, save the file"
echo ""
echo "3. Preview your changes at:"
echo "   http://localhost:5173/api/admin/send-superhuman-update?preview=true"
echo ""
echo "4. Or use the dev dashboard:"
echo "   http://localhost:5173/dev/email"
echo ""
echo "✨ Happy emailing!"
