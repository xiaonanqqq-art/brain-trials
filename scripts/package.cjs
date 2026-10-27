const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'release', 'site');
const files = ['index.html','styles.css','questions.js','engine.js','app.js','favicon.svg','.nojekyll'];
(async()=>{
  await fs.mkdir(output,{recursive:true});
  for(const name of files)await fs.copyFile(path.join(root,name),path.join(output,name));
  console.log(`Static release prepared: ${output} (${files.length} files)`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
