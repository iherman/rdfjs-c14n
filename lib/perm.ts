const permutation = require('array-permutation')

const test: string[] = ["aa", "bb", "cc"];

for (const t of permutation(test)) {
    console.log(t);
}
