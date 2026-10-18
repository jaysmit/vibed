#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, '..', '..', 'custom stories', 'assets', 'img', 'styles');
const rootImgDir = path.join(__dirname, '..', '..', 'custom stories', 'assets', 'img');

async function convertToWebp(inputPath) {
  const outputPath = inputPath.replace(/\.jpg$/, '.webp');
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log('Created:', path.basename(outputPath));
  } catch (err) {
    console.error('Error converting', path.basename(inputPath), ':', err.message);
  }
}

async function main() {
  // Convert style images in styles folder
  const styleFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.jpg'));
  console.log('Converting style images from styles folder...');
  for (const file of styleFiles) {
    await convertToWebp(path.join(stylesDir, file));
  }

  // Convert style images in root img folder (style-*.jpg)
  console.log('\nConverting style images from root img folder...');
  const rootFiles = fs.readdirSync(rootImgDir).filter(f => f.startsWith('style-') && f.endsWith('.jpg'));
  for (const file of rootFiles) {
    await convertToWebp(path.join(rootImgDir, file));
  }

  console.log('\nDone!');
}

main().catch(console.error);
