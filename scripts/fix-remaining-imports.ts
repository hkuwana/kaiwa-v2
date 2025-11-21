#!/usr/bin/env tsx
/**
 * Fix Remaining Import Paths
 * Updates any remaining old import paths after migration
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Import replacements (class names and types)
const additionalReplacements = [
  // Shared utilities
  {
    from: "from '$lib/server/email/email-permission.service'",
    to: "from '$lib/emails/shared/email-permission'"
  },
  {
    from: "from '$lib/server/email/email-send-guard.service'",
    to: "from '$lib/emails/shared/email-guard'"
  },

  // Campaign services
  {
    from: "from '$lib/server/email/email-reminder.service'",
    to: "from '$lib/emails/campaigns/reminders/reminder.service'"
  },
  {
    from: "from '$lib/server/email/founder-email.service'",
    to: "from '$lib/emails/campaigns/founder-sequence/founder.service'"
  },
  {
    from: "from '$lib/server/email/weekly-updates-email.service'",
    to: "from '$lib/emails/campaigns/weekly-digest/digest.service'"
  },
  {
    from: "from '$lib/server/email/weekly-stats-email.service'",
    to: "from '$lib/emails/campaigns/weekly-stats/stats.service'"
  },
  {
    from: "from '$lib/server/email/scenario-inspiration-email.service'",
    to: "from '$lib/emails/campaigns/scenario-inspiration/inspiration.service'"
  },
  {
    from: "from '$lib/server/email/community-story-email.service'",
    to: "from '$lib/emails/campaigns/community-stories/story.service'"
  },
  {
    from: "from '$lib/server/email/product-updates-email.service'",
    to: "from '$lib/emails/campaigns/product-updates/update.service'"
  },
  {
    from: "from '$lib/server/email/progress-reports-email.service'",
    to: "from '$lib/emails/campaigns/progress-reports/progress.service'"
  }
];

function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte'))) {
        files.push(fullPath);
      }
    });
  }

  walk(dir);
  return files;
}

async function main() {
  console.log('🔧 Fixing remaining import paths...\n');

  const filesToUpdate = findTypeScriptFiles('src');
  let updatedFiles = 0;
  let totalReplacements = 0;

  filesToUpdate.forEach(file => {
    let content = readFileSync(file, 'utf-8');
    let fileChanged = false;
    let fileReplacements = 0;

    additionalReplacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/'/g, "\\'"), 'g'), to);
        fileChanged = true;
        fileReplacements++;
      }
    });

    if (fileChanged) {
      writeFileSync(file, content, 'utf-8');
      console.log(`  ✓ Updated ${file} (${fileReplacements} replacements)`);
      updatedFiles++;
      totalReplacements += fileReplacements;
    }
  });

  console.log(`\n✅ Fixed ${updatedFiles} files`);
  console.log(`📊 Total replacements: ${totalReplacements}\n`);
}

main().catch(error => {
  console.error(`\n✗ Failed: ${error.message}`);
  process.exit(1);
});
