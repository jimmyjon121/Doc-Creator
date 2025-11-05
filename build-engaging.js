const fs = require('fs');

console.log('🎨 Building CareConnect Engaging Version...\n');

const html = fs.readFileSync('src/careconnect-engaging.html', 'utf8');
const programsJS = fs.readFileSync('src/js/programs-data.js', 'utf8');

const final = html.replace('</body>', `
<script>
${programsJS}
</script>
</body>`);

fs.writeFileSync('dist/CareConnect-Engaging.html', final);

console.log('✅ Built CareConnect-Engaging.html');
console.log(`📊 File size: ${(final.length / 1024).toFixed(2)} KB`);
console.log('\n🎉 Build complete! Open http://localhost:8080/CareConnect-Engaging.html to preview');
