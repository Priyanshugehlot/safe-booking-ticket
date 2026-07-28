/**
 * Node.js GitHub Repository Direct Uploader
 * Uploads all project files to GitHub via REST API
 */

const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'Priyanshugehlot';
const REPO_NAME = 'safe-booking-ticket';
const PROJECT_DIR = __dirname;

// Read token from environment variable or command argument
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.argv[2];

if (!GITHUB_TOKEN) {
  console.log('Usage: node upload_to_github.js <YOUR_GITHUB_TOKEN>');
  process.exit(1);
}

async function getRef() {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'RailPulse-Uploader' }
  });
  if (res.status === 404) {
    // Try master
    const resMaster = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/master`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'RailPulse-Uploader' }
    });
    return await resMaster.json();
  }
  return await res.json();
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file === 'node_modules' || file === '.git') return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function uploadFiles() {
  console.log(`Starting upload to https://github.com/${REPO_OWNER}/${REPO_NAME}...`);
  const files = getAllFiles(PROJECT_DIR);
  
  for (const filePath of files) {
    const relativePath = path.relative(PROJECT_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'base64');
    
    // Check if file exists to get SHA
    const checkRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativePath}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'RailPulse-Uploader' }
    });
    
    let sha = null;
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      sha = checkData.sha;
    }

    const payload = {
      message: `Add ${relativePath} for RailPulse Railway System`,
      content: content,
      ...(sha ? { sha } : {})
    };

    const uploadRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RailPulse-Uploader'
      },
      body: JSON.stringify(payload)
    });

    if (uploadRes.ok) {
      console.log(`[SUCCESS] Uploaded: ${relativePath}`);
    } else {
      const errData = await uploadRes.json();
      console.error(`[FAILED] ${relativePath}:`, errData.message);
    }
  }
  console.log('All files processed!');
}

uploadFiles();
