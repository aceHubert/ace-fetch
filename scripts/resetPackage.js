/**
 * 移除 learn publish 后 package.json 中生成的 head 字段
 */

const fs = require('fs');
const path = require('path');
const { runInContext } = require('vm');
const listChangedFiles = require('./listChangedFiles');

async function run() {
  try {
    const changedFiles = await listChangedFiles();
    changedFiles.forEach((filename) => {
      if (path.basename(filename) === 'package.json') {
        const packagePath = path.resolve(__dirname, '../', filename);
        fs.access(packagePath, (err) => {
          if (err) return;

          const jsonPackage = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));
          // private 不为 true 时 npm publish 会生成 head 的 guid 字段
          if (!jsonPackage.private && jsonPackage.gitHead) {
            delete jsonPackage.gitHead;
            fs.writeFileSync(packagePath, JSON.stringify(jsonPackage, null, 2) + '\n');
          }
        });
      }
    });
  } catch (err) {
    console.error(err);
  }
}

run();
