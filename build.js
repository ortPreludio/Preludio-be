import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const functionsDir = path.join(distDir, 'functions');

// 1. Clean/Create dist
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(functionsDir, { recursive: true });

// 2. Bundle Function
console.log('Bundling function...');
try {
    await esbuild.build({
        entryPoints: ['netlify/functions/api.js'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outdir: functionsDir,
        packages: undefined, // Bundle everything
        plugins: [{
            name: 'ignore-optional-deps',
            setup(build) {
                const deps = [
                    'kerberos',
                    '@mongodb-js/zstd',
                    '@aws-sdk/credential-providers',
                    'gcp-metadata',
                    'snappy',
                    'socks',
                    'aws-crt',
                    'mongodb-client-encryption',
                    'aws4'
                ];
                const filter = new RegExp(`^(${deps.join('|')})$`);
                build.onResolve({ filter }, args => ({ path: args.path, namespace: 'ignore-ns' }));
                build.onLoad({ filter: /.*/, namespace: 'ignore-ns' }, () => ({ contents: 'module.exports = {}', loader: 'js' }));
            },
        }],
    });
} catch (e) {
    console.error("Build failed:", e);
    process.exit(1);
}

// 3. Copy Public files
console.log('Copying public files...');
if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
}

// 4. Create netlify.toml for the DIST folder
console.log('Creating dist/netlify.toml...');
const netlifyConfig = `[build]
  functions = "functions"
  publish = "."

[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "PORT,APP_ENV"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200
`;

fs.writeFileSync(path.join(distDir, 'netlify.toml'), netlifyConfig);

console.log('Build complete! Upload the "dist" folder to Netlify.');
