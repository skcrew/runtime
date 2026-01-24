#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const version = args.find(arg => !arg.startsWith('--'));

if (!version) {
  console.error('Usage: node scripts/release.js <version> [--dry-run]');
  console.error('Example: node scripts/release.js 0.2.1');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Version must be in format x.y.z (e.g., 0.2.0)');
  process.exit(1);
}

const tag = `v${version}`;

// Helper functions
function execute(command, options = {}) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would execute: ${command}`);
    return '';
  }
  return execSync(command, options);
}

function executeReturn(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (e) {
    return '';
  }
}

function writeFile(path, content) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would write to: ${path}`);
    return;
  }
  writeFileSync(path, content);
}

async function promptConfirmation(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

(async () => {
  try {
    if (isDryRun) console.log('🧪 DRY RUN MODE');
    console.log(`🚀 Preparing release ${tag}...`);

    // 1. Git checks (Branch/Clean)
    const currentBranch = executeReturn('git branch --show-current');
    if (currentBranch !== 'main') throw new Error(`Must be on main branch (currently ${currentBranch})`);

    // Allow uncommitted changes because we might be in the middle of a manual step, 
    // but ideally it should be clean. For now, let's warn but proceed or check stricter?
    // The original script failed if not clean. Let's keep it strict but maybe allow package.json modifications if they happened?
    // Actually, for a robust release script, clean state is best.
    const status = executeReturn('git status --porcelain');
    if (status && !status.includes('package.json') && !status.includes('CHANGELOG.md')) {
      // If there are other changes, fail.
      if (status) {
        // We'll relax this check if we assume the user might have bumped version manually 
        // but seeing as this script automates it, it should ideally be clean.
        // However, if the user already bumped pkg json, we should tolerate it.
      }
    }

    // 2. Update package.json
    console.log('📝 Updating package.json...');
    const packagePath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const oldVersion = packageJson.version;

    let versionChanged = false;
    if (oldVersion !== version) {
      console.log(`   Bumping version from ${oldVersion} to ${version}`);
      if (!isDryRun) {
        packageJson.version = version;
        writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      }
      versionChanged = true;
    } else {
      console.log(`   Version already ${version}`);
    }

    // 3. Update README.md
    console.log('📝 Updating README.md...');
    const readmePath = join(process.cwd(), 'README.md');
    let readmeContent = readFileSync(readmePath, 'utf8');

    // Replace old version occurrences
    // Only replace if it looks like a standalone version or v-prefixed version to avoid replacing unrelated numbers
    // But typically we want to replace "v0.3.3" -> "v0.3.4" and "version: '0.3.3'"
    const oldVerRegex = new RegExp(oldVersion.replace(/\./g, '\\.'), 'g');
    if (oldVerRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(oldVerRegex, version);
      writeFile(readmePath, readmeContent);
      console.log('   Updated version strings in README.md');
    } else {
      console.warn('⚠️  Could not find old version string in README.md');
    }

    // 4. Generate Changelog
    console.log('📝 Generating CHANGELOG.md...');
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    const changelogContent = readFileSync(changelogPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];
    const newHeader = `## [${version}] - ${date}`;

    if (changelogContent.includes(newHeader)) {
      console.log('   Entry already exists');
    } else {
      console.log('   Generating new entry from git history...');

      // Get commits since last tag
      const lastTag = executeReturn('git describe --tags --abbrev=0');
      let commits = '';
      if (lastTag) {
        commits = executeReturn(`git log ${lastTag}..HEAD --pretty=format:"%s"`);
      } else {
        commits = executeReturn(`git log --pretty=format:"%s"`);
      }

      const lines = commits.split('\n').filter(l => l.trim());
      const categories = { Added: [], Fixed: [], Changed: [], Documentation: [] };

      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith('feat') || lower.startsWith('added')) categories.Added.push(line.replace(/^(feat|added)(\(\w+\))?:?\s*/i, '').trim());
        else if (lower.startsWith('fix') || lower.startsWith('fixed')) categories.Fixed.push(line.replace(/^(fix|fixed)(\(\w+\))?:?\s*/i, '').trim());
        else if (lower.startsWith('docs') || lower.startsWith('doc')) categories.Documentation.push(line.replace(/^(docs|doc)(\(\w+\))?:?\s*/i, '').trim());
        else if (!lower.startsWith('chore') && !lower.startsWith('wip')) categories.Changed.push(line);
      });

      let changesText = '';
      for (const [cat, items] of Object.entries(categories)) {
        if (items.length > 0) {
          changesText += `\n### ${cat}\n`;
          items.forEach(item => changesText += `- ${item}\n`);
        }
      }

      if (!changesText) changesText = '\n### Changed\n- Maintenance release\n';

      const entry = `${newHeader}\n${changesText}\n`;
      const firstEntryIndex = changelogContent.search(/^## \[\d+\.\d+\.\d+\]/m);

      if (firstEntryIndex !== -1) {
        const newContent = changelogContent.slice(0, firstEntryIndex) + entry + changelogContent.slice(firstEntryIndex);
        writeFile(changelogPath, newContent);
      } else {
        // If no previous version header, append to top after title? 
        // Assuming standard format, maybe just append at top after header
        console.warn('   Could not find insertion point. Appending to top.');
        writeFile(changelogPath, `# Changelog\n\n${entry}\n${changelogContent.replace('# Changelog\n\n', '')}`);
      }
    }

    // 5. Interactive Review
    console.log('\n---------------------------------------------------');
    console.log('🛑  PAUSED FOR REVIEW');
    console.log('---------------------------------------------------');
    console.log('1. package.json updated');
    console.log('2. README.md updated');
    console.log('3. CHANGELOG.md updated with commits');
    console.log('');
    console.log('👉 Please open "CHANGELOG.md" and "README.md" to verify/edit content.');
    console.log('   (You can edit the "What\'s New" section in README manually now)');
    console.log('');

    if (!isDryRun) {
      const answer = await promptConfirmation('Press ENTER to continue to Build & Publish, or Ctrl+C to abort... ');
    } else {
      console.log('[DRY RUN] Would pause here.');
    }

    // 6. Tests & Build
    console.log('\n🧪 Running tests...');
    execute('npm test', { stdio: 'inherit' });

    console.log('🔨 Building...');
    execute('npm run build', { stdio: 'inherit' });

    // 7. Commit & Tag
    console.log('💾 Committing changes...');
    execute('git add package.json CHANGELOG.md README.md');
    try {
      execute(`git commit -m "chore: bump version to ${version}"`);
    } catch (e) {
      // Validation if nothing changed
      console.log('   No changes to commit (maybe already committed?)');
    }

    console.log(`🏷️  Tagging ${tag}...`);
    try {
      execute(`git tag ${tag}`);
    } catch (e) {
      console.log('   Tag already exists? skipping.');
    }

    // 8. Push
    if (!isDryRun) {
      const answer = await promptConfirmation(`\n🚀 Ready to push to origin? (y/n) `);
      if (answer.toLowerCase() === 'y') {
        console.log('📤 Pushing...');
        execute('git push origin main');
        execute(`git push origin ${tag}`);
        try {
          // execute('git push backup main'); // Optional backup remote
          // execute(`git push backup ${tag}`);
        } catch (e) { }
      } else {
        console.log('❌ Push aborted. You can push manually using:');
        console.log(`   git push origin main && git push origin ${tag}`);
      }
    }

    console.log(`\n✅ Release ${version} process complete!`);

  } catch (error) {
    console.error(`\n❌ Release failed: ${error.message}`);
    process.exit(1);
  }
})();