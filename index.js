import fs from 'fs';
import { performance } from 'perf_hooks';

console.log('### Script started ###\n');

const filePath = './10m.txt'; 
let maxNumber = -Infinity;
let minNumber = Infinity;
let sum = 0;
let numbersCount = 0;
let allNumbers = [];  // Для зберігання всіх чисел для обчислення медіани

let longestIncreasingSequence = [];
let currentIncreasingSequence = [];

let longestDecreasingSequence = [];
let currentDecreasingSequence = [];

function updateSequences(num) {
  if (currentIncreasingSequence.length === 0 || num > currentIncreasingSequence[currentIncreasingSequence.length - 1]) {
    currentIncreasingSequence.push(num);
  } else {
    if (currentIncreasingSequence.length > longestIncreasingSequence.length) {
      longestIncreasingSequence = currentIncreasingSequence;
    }
    currentIncreasingSequence = [num];
  }

  if (currentDecreasingSequence.length === 0 || num < currentDecreasingSequence[currentDecreasingSequence.length - 1]) {
    currentDecreasingSequence.push(num);
  } else {
    if (currentDecreasingSequence.length > longestDecreasingSequence.length) {
      longestDecreasingSequence = currentDecreasingSequence;
    }
    currentDecreasingSequence = [num];
  }
}

function readFileWithChunkSize(chunkSize, callback) {
  const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
  let leftover = ''; 

  readStream.on('data', (chunk) => {
    let chunkStr = leftover + chunk.toString();
    const numbersStr = chunkStr.split('\n'); // Розділяємо за комами і пробілами/новими рядками

    leftover = numbersStr.pop(); // Залишаємо останній елемент в буфері
    numbersCount += numbersStr.length;

    const numbers = numbersStr.map(Number).filter(num => !isNaN(num));
    for (let num of numbers) {
      if (num > maxNumber) maxNumber = num;
      if (num < minNumber) minNumber = num;
      sum += num;
      allNumbers.push(num);
      updateSequences(num);
      
    }
  });

  readStream.on('end', () => {
    if (leftover) {
      const leftoverNumber = Number(leftover);
      if (!isNaN(leftoverNumber)) {
        if (leftoverNumber > maxNumber) maxNumber = leftoverNumber;
        if (leftoverNumber < minNumber) minNumber = leftoverNumber;
        sum += leftoverNumber;
        allNumbers.push(leftoverNumber); 
        updateSequences(leftoverNumber);
        numbersCount += 1;
      }
    }
    callback();
  });

  readStream.on('error', (err) => {
    console.error('Error reading file:', err);
  });
}

const start64 = performance.now();

readFileWithChunkSize(64 * 1024, () => {

  const mean = sum / numbersCount;
  let median;

  allNumbers.sort((a, b) => a - b);

  if (numbersCount % 2 === 0) {
    median = (allNumbers[numbersCount / 2 - 1] + allNumbers[numbersCount / 2]) / 2;
  } else {
    median = allNumbers[Math.floor(numbersCount / 2)];
  }

  if (currentIncreasingSequence.length > longestIncreasingSequence.length) {
    longestIncreasingSequence = currentIncreasingSequence;
  }
  if (currentDecreasingSequence.length > longestDecreasingSequence.length) {
    longestDecreasingSequence = currentDecreasingSequence;
  }

  console.log('\n### Results ### \n');
  console.log('Maximum number in file:', maxNumber);
  console.log('Minimum number in file:', minNumber);
  console.log('Median:', median);
  console.log('Mean:', mean.toFixed(2));
  console.log('Longest Increasing Sequence:', JSON.stringify(longestIncreasingSequence, 2, null));
  console.log('Longest Decreasing Sequence:', JSON.stringify(longestDecreasingSequence, 2, null));
  
  const end64 = performance.now();
  console.log(`\n### Time for processing 64 kB chunks ${((end64 - start64) / 1000).toFixed(3)} seconds ###`);
  console.log(`\n### Script ended ###`);
});
