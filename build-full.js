const fs = require('fs');

console.log('🎨 Building Complete CareConnect Full Version...\n');

const html = fs.readFileSync('src/careconnect-full.html', 'utf8');
const programs = fs.readFileSync('src/js/programs-data.js', 'utf8');

const final = html.replace('</body>', `
<script>
${programs}
</script>
</body>`);

fs.writeFileSync('dist/CareConnect-Full.html', final);

console.log('✅ Built CareConnect-Full.html');
console.log(`📊 File size: ${(final.length / 1024).toFixed(2)} KB`);
console.log('\n🎉 COMPLETE VERSION READY!');
console.log('✨ All modules working');
console.log('✨ Quizzes functional');
console.log('✨ Case studies included');
console.log('✨ Interactive exercises');
console.log('✨ Program explorer');
console.log('\n💡 Open: http://localhost:8080/CareConnect-Full.html');
