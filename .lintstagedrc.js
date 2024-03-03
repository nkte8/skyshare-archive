const path = require('path');

module.exports = {
  '*.ts': (absolutePaths) => {
    const cwd = process.cwd();
    const relativePaths = absolutePaths
      .map((file) => path.relative(cwd, file))
      .join(' ');
    return [`prettier --write ${relativePaths}`];
  },
};
