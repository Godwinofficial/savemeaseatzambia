const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Admin', 'AdminDashboard.jsx');
console.log('Reading file:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

// Find the index of <style jsx>{
const styleStartTag = '<style jsx>{`';
const styleEndTag = '`}</style>';

const startIndex = content.lastIndexOf(styleStartTag);
const endIndex = content.lastIndexOf(styleEndTag);

if (startIndex === -1 || endIndex === -1) {
    console.error('Error: Could not find style tags in AdminDashboard.jsx');
    process.exit(1);
}

console.log(`Found style block at indices: ${startIndex} to ${endIndex}`);

const beforeStyle = content.substring(0, startIndex);
const afterStyle = content.substring(endIndex + styleEndTag.length);

// Join them
const newContent = beforeStyle.trimEnd() + '\n' + afterStyle.trimStart();

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully removed style block and saved file!');
