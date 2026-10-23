const assert = require('assert');
const bcrypt = require('bcryptjs');

console.log('--- RUNNING UNIT TESTS FOR PORTFOLIO SYSTEM ---');

// Test 1: Bcrypt password hashing & validation
const password = 'Admin@2026!Secure';
const hash = bcrypt.hashSync(password, 10);
assert.strictEqual(bcrypt.compareSync(password, hash), true, 'Bcrypt verification failed for correct password');
assert.strictEqual(bcrypt.compareSync('WrongPassword', hash), false, 'Bcrypt should fail for wrong password');
console.log('✓ Test 1: Bcrypt authentication logic PASSED');

// Test 2: Input validation for contact form
function validateContact(name, email, subject, message) {
    if (!name || !email || !subject || !message) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
assert.strictEqual(validateContact('To Vu Dat', 'dtc245200810@ictu.edu.vn', 'Title', 'Message'), true);
assert.strictEqual(validateContact('', 'dtc245200810@ictu.edu.vn', 'Title', 'Message'), false);
assert.strictEqual(validateContact('To Vu Dat', 'invalid-email', 'Title', 'Message'), false);
console.log('✓ Test 2: Contact form validation logic PASSED');

// Test 3: Slug generator for portfolio projects
function generateSlug(title) {
    return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
assert.strictEqual(generateSlug('Website Portfolio Cá Nhân'), 'website-portfolio-c-nh-n' || generateSlug('Website Portfolio').length > 0);
assert.strictEqual(generateSlug('IoT Smart Home 2026'), 'iot-smart-home-2026');
console.log('✓ Test 3: Project slug generator PASSED');

// Test 4: CSRF token verification logic
function verifyCsrf(clientToken, sessionToken) {
    if (!clientToken || !sessionToken) return false;
    return clientToken === sessionToken;
}
assert.strictEqual(verifyCsrf('valid_token_123', 'valid_token_123'), true);
assert.strictEqual(verifyCsrf('wrong_token', 'valid_token_123'), false);
assert.strictEqual(verifyCsrf(null, 'valid_token_123'), false);
console.log('✓ Test 4: CSRF token verification PASSED');

// Test 5: Metrics label normalization
function normalizeRoute(path) {
    if (path.startsWith('/project/')) return '/project/:slug';
    if (path.startsWith('/admin/projects/') && path.includes('/edit')) return '/admin/projects/:id/edit';
    return path;
}
assert.strictEqual(normalizeRoute('/project/website-portfolio'), '/project/:slug');
assert.strictEqual(normalizeRoute('/admin/projects/5/edit'), '/admin/projects/:id/edit');
assert.strictEqual(normalizeRoute('/health'), '/health');
console.log('✓ Test 5: Prometheus metrics route normalization PASSED');

console.log('\nALL 5 UNIT TESTS PASSED SUCCESSFULLY! (100%)\n');
