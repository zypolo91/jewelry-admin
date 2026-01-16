const { execSync } = require('child_process');

try {
  console.log('Starting build...');
  const output = execSync('pnpm run build', {
    cwd: 'f:\\jewelry\\admin',
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:');
  console.error(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}
