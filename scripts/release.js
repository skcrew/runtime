#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const version = args.find(arg => !arg.startsWith('--'));

if (!version) {
  console.error('Usage: node scripts/release.js <version> [--dry-run]');
  console.error('Example: node scripts/release.js 0.2.1');
  console.error('Example: node scripts/release.js 0.2.1 --dry-run');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Version must be in format x.y.z (e.g., 0.2.0)');
  process.exit(1);
}

const tag = `v${version}`;

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No changes will be made');
  console.log('');
}

console.log(`🚀 Preparing release ${tag}...`);

// Helper function to execute commands (with dry-run support)
function execute(command, options = {}) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would execute: ${command}`);
    return '';
  }
  return execSync(command, options);
}

// Helper function to write files (with dry-run support)
function writeFile(path, content) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would write to: ${path}`);
    return;
  }
  writeFileSync(path, content);
}

try {
  // 1. Check if we're on main branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'main') {
    console.error(`❌ Must be on main branch (currently on ${currentBranch})`);
    process.exit(1);
  }

  // 2. Check if working directory is clean
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (status) {
    console.error('❌ Working directory must be clean');
    console.error('Uncommitted changes:');
    console.error(status);
    process.exit(1);
  }

  // 3. Check if tag already exists
  try {
    const existingTag = execSync(`git tag -l "${tag}"`, { encoding: 'utf8' }).trim();
    if (existingTag) {
      console.error(`❌ Tag ${tag} already exists`);
      process.exit(1);
    }
  } catch (error) {
    // Tag doesn't exist, which is what we want
  }

  // 4. Update package.json version
  console.log('📝 Checking package.json version...');
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

  let versionChanged = false;
  if (packageJson.version !== version) {
    console.log(`📝 Updating package.json version from ${packageJson.version} to ${version}...`);
    if (!isDryRun) {
      packageJson.version = version;
      writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    }
    versionChanged = true;
  } else {
    console.log(`📝 Version ${version} already set in package.json`);
  }

  // 5. Update CHANGELOG.md
  console.log('📝 Checking CHANGELOG.md...');
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  const changelogContent = readFileSync(changelogPath, 'utf8');
  const date = new Date().toISOString().split('T')[0];
  const newHeader = `## [${version}] - ${date}`;

  if (changelogContent.includes(newHeader)) {
    console.log(`📝 Changelog entry for ${version} already exists`);
  } else {
    console.log(`📝 Adding new changelog entry for ${version}...`);
    // Find the first release header (## [x.y.z]) to insert before it
    const firstEntryIndex = changelogContent.search(/^## \[\d+\.\d+\.\d+\]/m);

    if (firstEntryIndex !== -1) {
      if (!isDryRun) {
        const newContent = changelogContent.slice(0, firstEntryIndex) +
          `${newHeader}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n` +
          changelogContent.slice(firstEntryIndex);
        writeFile(changelogPath, newContent);
      }
      versionChanged = true; // Ensure we commit even if only changelog changed (though usually pkg json changes too)
    } else {
      console.warn('⚠️  Could not find existing changelog entries to prepend to');
    }
  }

  // 6. Run tests
  console.log('🧪 Running tests...');
  try {
    execute('npm test', { stdio: isDryRun ? 'pipe' : 'inherit' });

    // Check test results from JSON output
    if (!isDryRun) {
      try {
        const testOutput = JSON.parse(readFileSync('test-output.json', 'utf8'));
        if (!testOutput.success || testOutput.numFailedTests > 0) {
          console.error(`❌ Tests failed: ${testOutput.numFailedTests} failed tests`);
          process.exit(1);
        }
        console.log(`✅ All tests passed: ${testOutput.numPassedTests} tests`);
      } catch (error) {
        console.warn('⚠️  Could not parse test output, but npm test succeeded');
      }
    }
  } catch (error) {
    console.error('❌ Tests failed');
    throw error;
  }

  // 7. Build
  console.log('🔨 Building...');
  execute('npm run build', { stdio: isDryRun ? 'pipe' : 'inherit' });

  // 8. Commit version bump (only if version changed)
  if (versionChanged) {
    console.log('💾 Committing version bump...');
    execute(`git add package.json CHANGELOG.md`);
    execute(`git commit -m "chore: bump version to ${version}"`);
  } else {
    console.log('💾 No version bump needed');
  }

  // 9. Create and push tag
  console.log(`🏷️  Creating tag ${tag}...`);
  execute(`git tag ${tag}`);

  // 10. Push to origin (skcrew)
  console.log('📤 Pushing to origin...');
  execute('git push origin main');
  execute(`git push origin refs/tags/${tag}`);

  // 11. Also push to backup
  console.log('📤 Pushing to backup...');
  execute('git push backup main');
  execute(`git push backup refs/tags/${tag}`);

  if (isDryRun) {
    console.log('');
    console.log('🧪 DRY RUN COMPLETE - No actual changes were made');
    console.log('');
    console.log('To perform the actual release, run:');
    console.log(`   node scripts/release.js ${version}`);
  } else {
    console.log(`✅ Release ${tag} created successfully!`);
    console.log('');
    console.log('🎉 The GitHub Action will now:');
    console.log('   1. Run tests and build');
    console.log('   2. Publish to npm');
    console.log('   3. Create GitHub release');
    console.log('');
    console.log(`📦 Track progress: https://github.com/skcrew/runtime/actions`);
  }

} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}