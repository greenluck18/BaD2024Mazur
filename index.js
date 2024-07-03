const fs = require('fs');
const { performance } = require('perf_hooks');

console.log('### Script started ###\n');

const filePath = './10m.txt'; 
let maxNumber = -Infinity;
let minNumber = Infinity;
let sum = 0;
let numbersCount = 0;

let maxHeap = [];
let minHeap = [];

let longestIncreasingSequence = [];
let currentIncreasingSequence = [];

let longestDecreasingSequence = [];
let currentDecreasingSequence = [];

function readFileWithChunkSize(chunkSize, callback) {
  const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
  let leftover = ''; 

  readStream.on('data', (chunk) => {
    let chunkStr = leftover + chunk.toString();
    const numbersStr = chunkStr.split(/[\s,]+/); // Розділяємо за комами і пробілами/новими рядками

    leftover = numbersStr.pop(); // Залишаємо останній елемент в буфері
    numbersCount += numbersStr.length;

    const numbers = numbersStr.map(Number).filter(num => !isNaN(num));
    for (let num of numbers) {
      processNumber(num);
    }
  });

  readStream.on('end', () => {
    if (leftover) {
      const leftoverNumber = Number(leftover);
      if (!isNaN(leftoverNumber)) {
        processNumber(leftoverNumber);
        numbersCount += 1;
      }
    }
    callback();
  });

  readStream.on('error', (err) => {
    console.error('Error reading file:', err);
  });
}

function processNumber(num) {
  if (num > maxNumber) maxNumber = num;
  if (num < minNumber) minNumber = num;
  sum += num;
  addNumberToHeaps(num);
  updateSequences(num);
}

function addNumberToHeaps(num) {
  if (maxHeap.length === 0 || num <= maxHeap[0]) {
    insertMaxHeap(num);
  } else {
    insertMinHeap(num);
  }

  // Балансування heaps
  if (maxHeap.length > minHeap.length + 1) {
    insertMinHeap(extractMaxHeap());
  } else if (minHeap.length > maxHeap.length) {
    insertMaxHeap(extractMinHeap());
  }
}

function insertMaxHeap(num) {
  maxHeap.push(num);
  let i = maxHeap.length - 1;
  while (i > 0 && maxHeap[Math.floor((i - 1) / 2)] < maxHeap[i]) {
    [maxHeap[i], maxHeap[Math.floor((i - 1) / 2)]] = [maxHeap[Math.floor((i - 1) / 2)], maxHeap[i]];
    i = Math.floor((i - 1) / 2);
  }
}

function insertMinHeap(num) {
  minHeap.push(num);
  let i = minHeap.length - 1;
  while (i > 0 && minHeap[Math.floor((i - 1) / 2)] > minHeap[i]) {
    [minHeap[i], minHeap[Math.floor((i - 1) / 2)]] = [minHeap[Math.floor((i - 1) / 2)], minHeap[i]];
    i = Math.floor((i - 1) / 2);
  }
}

function extractMaxHeap() {
  const max = maxHeap[0];
  if (maxHeap.length > 1) {
    maxHeap[0] = maxHeap.pop();
    maxHeapify(0);
  } else {
    maxHeap.pop();
  }
  return max;
}

function extractMinHeap() {
  const min = minHeap[0];
  if (minHeap.length > 1) {
    minHeap[0] = minHeap.pop();
    minHeapify(0);
  } else {
    minHeap.pop();
  }
  return min;
}

function maxHeapify(i) {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let largest = i;
  if (left < maxHeap.length && maxHeap[left] > maxHeap[largest]) {
    largest = left;
  }
  if (right < maxHeap.length && maxHeap[right] > maxHeap[largest]) {
    largest = right;
  }
  if (largest !== i) {
    [maxHeap[i], maxHeap[largest]] = [maxHeap[largest], maxHeap[i]];
    maxHeapify(largest);
  }
}

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

function minHeapify(i) {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let smallest = i;
  if (left < minHeap.length && minHeap[left] < minHeap[smallest]) {
    smallest = left;
  }
  if (right < minHeap.length && minHeap[right] < minHeap[smallest]) {
    smallest = right;
  }
  if (smallest !== i) {
    [minHeap[i], minHeap[smallest]] = [minHeap[smallest], minHeap[i]];
    minHeapify(smallest);
  }
}

const start64 = performance.now();

readFileWithChunkSize(64 * 1024, () => {
  const mean = sum / numbersCount;
  let median;

  if (numbersCount % 2 === 0) {
    median = (maxHeap[0] + minHeap[0]) / 2;
  } else {
    median = maxHeap[0];
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
