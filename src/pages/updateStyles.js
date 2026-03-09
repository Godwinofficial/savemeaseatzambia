const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'JAE', 'Desktop', 'savemeaseat', 'src', 'pages', 'AddBirthday.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace("import './AddWedding.css'; // reuse same base styles", "import './AddBirthday.css';");

// 2. Component Class Names
content = content.replace(/className="form-group"/g, 'className="bd-form-group"');
content = content.replace(/className="form-label"/g, 'className="bd-form-label"');
content = content.replace(/className="form-input"/g, 'className="bd-form-input"');
content = content.replace(/className="form-textarea"/g, 'className="bd-form-textarea"');
content = content.replace(/className="image-upload-wrapper"/g, 'className="bd-image-upload-wrapper"');
content = content.replace(/className="image-preview"/g, 'className="bd-image-preview"');
content = content.replace(/className="remove-image"/g, 'className="bd-remove-image"');
content = content.replace(/className="upload-placeholder"/g, 'className="bd-upload-placeholder"');
content = content.replace(/className="grid-2"/g, 'className="bd-grid-2"');

content = content.replace(/className="admin-header"[^>]*>/g, 'className="bd-admin-header">');
content = content.replace(/className="header-container"/g, 'className="bd-header-container"');
content = content.replace(/className="header-main"/g, 'className="bd-header-main"');
content = content.replace(/className="desktop-nav"[^>]*>/g, 'className="bd-desktop-nav">');

content = content.replace(/className="nav-btn outline"[^>]*>/g, 'className="bd-nav-btn outline">');
content = content.replace(/className="nav-btn primary"[^>]*>/g, 'className="bd-nav-btn primary">');

content = content.replace(/className="add-wedding-container"[^>]*>/g, 'className="bd-add-container">');
content = content.replace(/className="page-title-card"[^>]*>/g, 'className="bd-page-title-card">');
content = content.replace(/className="form-content-card"[^>]*>/g, 'className="bd-form-content-card">');

content = content.replace(/<h1 style={{ color: '#c44569', fontSize: '1.8rem', margin: 0 }}>/g, '<h1>');
content = content.replace(/<p style={{ color: '#9b5a72', margin: '8px 0 0', fontSize: '0.9rem' }}>/g, '<p>');
content = content.replace(/<code style={{ background: '#ffd6ea', padding: '2px 6px', borderRadius: 6 }}>/g, '<code>');

content = content.replace(/className="section-title"[^>]*>/g, 'className="bd-section-title">');

// Age label span replacement
content = content.replace(/<span style={{[^}]+background: 'linear-gradient[^}]+}}>/g, '<span style={{ background: "linear-gradient(135deg, var(--bd-secondary) 0%, var(--bd-primary) 100%)", color: "var(--bd-white)", borderRadius: 9999, padding: "6px 16px", fontWeight: 800, fontSize: "1rem", whiteSpace: "nowrap", flexShrink: 0 }}>');

content = content.replace(/className="form-actions"[^>]*>/g, 'className="bd-form-actions">');
content = content.replace(/className="btn btn-secondary"[^>]*>/g, 'className="bd-btn bd-btn-secondary">');
content = content.replace(/className="btn btn-primary"[^>]*>/g, 'className="bd-btn bd-btn-primary">');

fs.writeFileSync(filePath, content, 'utf8');

console.log("AddBirthday.jsx style updated!");
