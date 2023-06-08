# RDF Canonicalization in TypeScript

This is an implementation (under development) of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm, also referred to as RDFC-1.0. (The algorithm is being specified by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch).)

> **The [specification](https://www.w3.org/TR/rdf-canon/) is not yet final. This implementations aims at reflecting _exactly_ the specification, which means it may evolve alongside the specification even if changes are editorial only.**

## Requirements

The implementation depends on the interfaces defined by the [RDF/JS Data model specification](http://rdf.js.org/data-model-spec/) for RDF terms, named and blank nodes, or quads. It also depends on an instance of an RDF Data Factory, specified by the aforementioned [specification](http://rdf.js.org/data-model-spec/#datafactory-interface). For TypeScript, the necessary type specifications are available through the [`@rdfjs/types` package](https://www.npmjs.com/package/@rdfjs/types); an implementation of the RDF Data Factory is provided by, for example, the [`n3` package](https://www.npmjs.com/package/n3) (but there are others), which also provides a Turtle/TriG parser and serializer to test the library.

By default (i.e., if not explicitly specified) the Data Factory of the [`n3` package](https://www.npmjs.com/package/n3) is used.

An input RDF Dataset may be represented by: 

- A Set of [Quad instances](https://rdf.js.org/data-model-spec/#quad-interface); or
- An Array of [Quad instances](https://rdf.js.org/data-model-spec/#quad-interface); or
- A string representing an [N-Quads](http://www.w3.org/TR/n-quads/) document.

The canonicalization process can be invoked by

- the `canonicalize` method, that returns an N-Quads document containing the (sorted) quads of the dataset, and using the canonical blank node ids
- the `canonicalizeDetailed` method, that returns an Object of the form:
  - `dataset`: a Set or Array of Quad instances, using the canonical blank node ids
  - `dataset_nquad`: an N-Quads document containing the (sorted) quads of the dataset, and using the canonical blank node ids
  - `bnode_id_map`: a `Map` object, mapping the original blank node ids (as used in the input) to their canonical equivalents

- A Set or an Array of Quad instances, if the input was a Set or an Array, respectively;
- A Set of Quad instances if the input was an N-Quads document.

The separate [testing folder](https://github.com/iherman/rdfjs-c14n/tree/main/testing) includes a tiny application that runs the official specification tests, and can be used as an example for the additional packages that are required. 

## Installation

The usual `npm` installation can be used:

```
npm rdfjs-c14n
```

The package has been written in TypeScript but is distributed in JavaScript; the type definition (i.e., `index.d.ts`) is included in the distribution.

## Usage

There is a more detailed documentation of the classes and types [on github](https://iherman.github.io/rdfjs-c14n/). The basic usage may be as follows:

```js
import * as n3  from 'n3';
import * as rdf from 'rdf-js';
// The definition of "Quads" is:
// export type Quads = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>; 
import {RDFC10, Quads, quadsToNquads } from 'rdf-c14n';

main() {
    // Any implementation of the data factory will do in the call below.
    // By default, the Data Factory of the `n3` package (i.e., the argument in the call
    // below is not strictly necessary).
    // Optionally, an instance of a Dataset Core Factory may be added as a second argument.
    const canonicalizer = new RDFC10(n3.DataFactory);  

    const input = parseYourFavoriteTriGIntoQuads();

    // "normalized" is a dataset of quads with "canonical" blank node labels
    // per the specification 
    const normalized: Quads = canonicalizer.canonicalizeDetailed(input).dataset

    // "hash" is the hash value of the canonical dataset, per specification
    const hash = canonicalizer.hash(normalized);

    // Generate a sorted array of nquads for the normalized dataset
    const nquads = canonicalizer.toNquads(normalized);
}
```

### Additional features

#### Choice of hash

The [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm is based on an extensive usage of hashing. By default, as specified by the document, the hash function is 'sha256'. This default hash function can be changed via the

```js
    canonicalizer.setHashAlgorithm(algorithm);
```

method, where `algorithm` can be any hash function identification that the underlying openssl environment (as used by `node.js`) accepts. Examples are 'sha256', 'sha512', etc. On recent releases of OpenSSL, `openssl list -digest-algorithms` will display the available algorithms.

#### Logging

The canonicalization algorithm has built-in logging points that can be followed via a logger. This is  only of interest for debugging the algorithm itself; it can be safely ignored by the average user. By default, no logging happens.

A built-in logger can be switched on which displays logging information in YAML. To use this YAML logger, do the following:

```js
import { YamlLogger, LogLevels } from 'rdfjs-c14n';

main() {
    …
    const canonicalizer = new RDFC10();
    // `logLevel` may be LogLevels.error, LogLevels.warn, LogLevels.info, LogLevels.debug  
    const logger = new YamlLogger(logLevel);
    canonicalizer.setLogger(logger);
    …
    // "logger.log" is a string containing the full log in YAML format
    console.log(logger.log);
}
```

See the [interface specification for Logger](https://iherman.github.io/rdfjs-c14n/interfaces/lib_logging.Logger.html) to possibly implement your own logger.


---

Maintainer: [@iherman](https://github.com/iherman)
