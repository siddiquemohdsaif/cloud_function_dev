const fs = require('fs');

// Function to convert a value from domain (0, 1000) to domain (-0.3683, 0.3683) and round to four decimal places
function convertDomain(value) {
  const oldMin = 0;
  const oldMax = 1000;
  const newMin = -0.3683;
  const newMax = 0.3683;
  const newValue = ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;
  return Math.round(newValue * 10000) / 10000;
}

// Read input.json
fs.readFile('input.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading input.json:', err);
    return;
  }

  const inputData = JSON.parse(data);

  // Transform the coordinates
  const outputData = inputData.map(item => ({
    ring: {
      x: convertDomain(item.ring.x),
      y: convertDomain(item.ring.y)
    },
    coins: item.coins.map(coin => ({
      coinCode: coin.coinCode,
      x: convertDomain(coin.x),
      y: convertDomain(coin.y)
    }))
  }));

  // Write output.json
  fs.writeFile('output.json', JSON.stringify(outputData, null, 2), 'utf8', err => {
    if (err) {
      console.error('Error writing output.json:', err);
      return;
    }
    //console.log('output.json has been saved.');
  });
});
