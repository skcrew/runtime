#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const version = args[0];

if (!version) {
  console.error('Usage: node scripts/release.js <version>');
  console.error('Example: node scripts/release.js 0.2.0');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Version must be in format x.y.z (e.g., 0.2.0)');
  process.exit(1);
}

const tag = `v${version}`;

console.log(`🚀 Preparing release ${tag}...`);

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

  // 3. Update package.json version
  console.log('📝 Checking package.json version...');
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  let versionChanged = false;
  if (packageJson.version !== version) {
    console.log(`📝 Updating package.json version from ${packageJson.version} to ${version}...`);
    packageJson.version = version;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    versionChanged = true;
  } else {
    console.log(`📝 Version ${version} already set in package.json`);
  }

  // 4. Run tests
  console.log('🧪 Running tests...');
  execSync('npm test', { stdio: 'inherit' });

  // 5. Build
  console.log('🔨 Building...');
  execSync('npm run build', { stdio: 'inherit' });

  // 6. Commit version bump (only if version changed)
  if (versionChanged) {
    console.log('💾 Committing version bump...');
    execSync(`git add package.json`);
    execSync(`git commit -m "chore: bump version to ${version}"`);
  } else {
    console.log('💾 No version bump needed');
  }

  // 7. Create and push tag
  console.log(`🏷️  Creating tag ${tag}...`);
  execSync(`git tag ${tag}`);

  // 8. Push to origin (skcrew)
  console.log('📤 Pushing to origin...');
  execSync('git push origin main');
  execSync(`git push origin ${tag}`);

  // 9. Also push to backup
  console.log('📤 Pushing to backup...');
  execSync('git push backup main');
  execSync(`git push backup ${tag}`);

  console.log(`✅ Release ${tag} created successfully!`);
  console.log('');
  console.log('🎉 The GitHub Action will now:');
  console.log('   1. Run tests and build');
  console.log('   2. Publish to npm');
  console.log('   3. Create GitHub release');
  console.log('');
  console.log(`📦 Track progress: https://github.com/skcrew/runtime/actions`);

} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}