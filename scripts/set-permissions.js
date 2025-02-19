import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, '..', 'build', 'index.js');

// 只在非Windows系统上设置可执行权限
if (os.platform() !== 'win32') {
  try {
    fs.chmodSync(buildPath, '755');
    console.log('Successfully set executable permissions on build/index.js');
  } catch (error) {
    console.warn('Warning: Could not set executable permissions on build/index.js');
    console.warn(error);
  }
} else {
  console.log('Skipping permission setting on Windows');
} 