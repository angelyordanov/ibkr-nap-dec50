const { Command } = require('commander');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const program = new Command();
program.name('string-util').argument('<path>', 'path to IBKR annual csv', (value, _) =>
  fs.existsSync(value)
    ? value
    : (() => {
        throw new commander.InvalidArgumentError('Not a number.');
      })()
);

program.parse();

const csvPath = program.processedArgs[0];

let dividendsHeader;
const dividendsData = [];

let withholdingTaxHeader;
const withholdingTaxData = [];

fs.createReadStream(csvPath)
  .pipe(csv({ headers: false }))
  .on('data', (data) => {
    if (data[0] === 'Dividends' && data[1] === 'Header') {
      dividendsHeader = data;
    } else if (data[0] === 'Dividends' && data[1] === 'Data' && !data[2].startsWith('Total')) {
      dividendsData.push(
        Object.fromEntries(
          Object.entries(data)
            .filter(([k, _]) => k !== '0' && k !== '1')
            .map(([k, v]) => [dividendsHeader[k], v])
        )
      );
    } else if (data[0] === 'Withholding Tax' && data[1] === 'Header') {
      withholdingTaxHeader = data;
    } else if (data[0] === 'Withholding Tax' && data[1] === 'Data' && !data[2].startsWith('Total')) {
      withholdingTaxData.push(
        Object.fromEntries(
          Object.entries(data)
            .filter(([k, _]) => k !== '0' && k !== '1')
            .map(([k, v]) => [withholdingTaxHeader[k], v])
        )
      );
    }
  })
  .on('end', () => {
    console.log(dividendsData);
    console.log(withholdingTaxData);
  });
