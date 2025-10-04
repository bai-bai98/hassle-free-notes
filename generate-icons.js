/**
 * Generate placeholder icons for the Chrome extension
 * Run with Node.js: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to create placeholder icons
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 2h16v20H3V2h2zm14 18V4H5v16h14zM7 6h10v2H7V6zm10 4H7v2h10v-2zM7 14h7v2H7v-2z" fill="#000000"/>
</svg>`;
}

const iconsDir = path.join(__dirname, 'icons');

// Create SVG icons as temporary solution
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('\nNote: Chrome extensions prefer PNG icons.');
console.log('To convert SVG to PNG, either:');
console.log('1. Use an online converter like https://cloudconvert.com/svg-to-png');
console.log('2. Use ImageMagick: convert icon.svg icon.png');
console.log('3. Open SVG in browser and screenshot at exact size');
