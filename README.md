# RDF Canonicalization in TypeScript

This is an implementation of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm, also referred to as RDFC-1.0. The algorithm has been published by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch).

## Requirements

### RDF packages and references

The implementation depends on the interfaces defined by the [RDF/JS Data model specification](http://rdf.js.org/data-model-spec/) for RDF terms, named and blank nodes, or quads. It also depends on an instance of an RDF Data Factory, specified by the aforementioned [specification](http://rdf.js.org/data-model-spec/#datafactory-interface). For TypeScript, the necessary type specifications are available through the [`@rdfjs/types` package](https://www.npmjs.com/package/@rdfjs/types); an implementation of the RDF Data Factory is provided by, for example, the [`n3` package](https://www.npmjs.com/package/n3) (but there are others), which also provides a Turtle/TriG parser and serializer to test the library.

By default (i.e., if not explicitly specified) the Data Factory of the [`n3` package](https://www.npmjs.com/package/n3) is used.

### Crypto

The implementation relies on the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/) as implemented by modern browsers, `deno` (version 1.3.82 or higher), or `node.js` (version 21 or higher). A side effect of using Web Crypto is that the canonicalization and hashing interface entries are all asynchronous, and must be used, for example, through the `await` idiom of Javascript/Typescript.


## Usage

An input RDF Dataset may be represented by any object that may be iterated through [quad instances](https://rdf.js.org/data-model-spec/#quad-interface) (e.g., arrays of quads, a set of quads, or any specialized objects storing quads like [RDF `DatasetCore`](https://rdf.js.org/dataset-spec/#datasetcore-interface) implementations), or a string representing an [N-Quads](http://www.w3.org/TR/n-quads/), [Turtle](https://www.w3.org/TR/turtle/), or [TriG](https://www.w3.org/TR/2014/REC-trig-20140225/) document. Formally, the input can be:

```js
Iterable<rdf.Quad> | string
```

The canonicalization process can be invoked by

- the `canonicalize` method, that returns an N-Quads document containing the (sorted) quads of the dataset, using the canonical blank node ids;
- the `canonicalizeDetailed` method, that returns an Object of the form:
  - `canonicalized_dataset`: an [RDF `DatasetCore`](https://rdf.js.org/dataset-spec/#datasetcore-interface) instance, using the canonical blank node ids
  - `canonical_form`: an N-Quads document containing the (sorted) quads of the dataset, using the canonical blank node ids
  - `issued_identifier_map`: a `Map` object, mapping the original blank node ids (as used in the input) to their canonical equivalents
  - `bnode_identifier_map`: `Map` object, mapping a blank node to its (canonical) blank node id

> Note that the `Iterable<rdf.Qad>` instance in the input of these calls is expected to be a _set_ of quads, i.e., it should not have repeated entries. By default, this is not checked (this may be a costly operation for large RDF graphs), but the canonicalization methods can be invoked with an additional boolean flag instructing the system to "de-duplicate" (essentially, create a new dataset instance where duplicate quads are removed).
> 
> If the input is a document parsed by the system, duplicate quads are filtered out automatically.

The separate [testing folder](https://github.com/iherman/rdfjs-c14n/tree/main/testing) includes a tiny application that runs some local tests, and can be used as an example for the additional packages that are required. 

## Installation

For `node.js`, the usual `npm` installation can be used:

```
npm install rdfjs-c14n
```

The package has been written in TypeScript but is distributed in JavaScript; the type definition (i.e., `index.d.ts`) is included in the distribution.

Also, using appropriate tools (e.g., [esbuild](https://esbuild.github.io/)) the package can be included into a module that can be loaded into a browser.

For `deno` a simple

```
import { RDFC10, Quads, InputQuads } from "npm:rdfjs-c14n"
```

will do.

## Usage Examples

There is a more detailed documentation of the classes and types [on github](https://iherman.github.io/rdfjs-c14n/). The basic usage may be as follows:

```js
import * as n3  from 'n3';
import * as rdf from '@rdfjs/types';;
// The definition that are used here:
// export type Quads = rdf.DatasetCore; 
// export type InputQuads = Iterable<rdf.Quad>;
import {RDFC10, Quads, InputQuads } from 'rdf-c14n';

async main() {
    // Any implementation of the data factory will do in the call below.
    // By default, the Data Factory of the `n3` package (i.e., the argument in the call
    // below is not strictly necessary).
    const rdfc10 = new RDFC10(n3.DataFactory);  

    const input: InputQuads = createYourQuads();

    // "normalized" is a dataset of quads with "canonical" blank node labels
    // per the specification. 
    // Alternatively, "input" could also be a string for a Turtle/TriG document
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;

    // If you care only of the N-Quads results, you can make it simpler
    const normalized_N_Quads: string = (await rdfc10.c14n(input)).canonical_form;

    // Or even simpler, using a shortcut:
    const normalized_N_Quads_bis: string = await rdfc10.canonicalize(input);

    // "hash" is the hash value of the canonical dataset, per specification
    const hash: string = await rdfc10.hash(normalized);
}
```

Alternatively, the canonicalization can rely on N-Quads documents only, with all other details hidden:

```js
import { RDFC10 } from 'rdf-c14n';

async main() {
    // Any implementation of the data factory will do in the call below.
    const rdfc10 = new RDFC10();  

    const input: string = fetchYourNQuadsDocument();

    // "normalized" is an N-Quads document with all blank nodes canonicalized 
    const normalized_nquads: string = await rdfc10.canonicalize(input); 
  
    // "hash" is the hash value of the canonical dataset, per specification
    const hash = await rdfc10.hash(normalized_quads);
}
```


### Additional features

#### Choice of hash

The [RDFC 1.0](https://www.w3.org/TR/rdf-canon/) algorithm is based on an extensive usage of hashing. By default, as specified by the specification, the hash function is 'sha256'.
This default hash function can be changed via the

```js
    rdfc10.hash_algorithm = algorithm;
```

attribute, where `algorithm` can be any hash function identification. Examples are 'sha256', 'sha512', etc. The list of available hash algorithms can be retrieved as:

```js
    rdfc10.available_hash_algorithms;
```

which corresponds to the values defined by, and also usually implemented, the [Web Cryptography API specification](https://www.w3.org/TR/WebCryptoAPI/) (as of December 2013), 
namely 'sha1', 'sha256', 'sha384', and 'sha512'. 

#### Controlling the complexity level

On rare occasion, the [RDFC 1.0](https://www.w3.org/TR/rdf-canon/) algorithm has to go through complex
cycles that may also involve a recursive steps. On even more extreme situations, the running of the algorithm could result in an unreasonably long canonicalization process. Although this practically never occurs in practice, attackers may use some "poison graphs" to create such situations (see the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification).

This implementation sets a maximum complexity level (usually set to 50); this level can be accessed by the

```js
    rdfc10.maximum_allowed_complexity_number;
```

(read-only) attribute. This number can be ***lowered*** by setting the 

```js
    rdfc10.maximum_complexity_number
```

attribute. The value of this attribute cannot exceed the system wide maximum level.


---

Maintainer: [@iherman](https://github.com/iherman)
