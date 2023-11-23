# RDF Canonicalization in TypeScript

This is an implementation of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm, also referred to as RDFC-1.0. The algorithm has been published by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch).

## Requirements

### RDF packages and references

The implementation depends on the interfaces defined by the [RDF/JS Data model specification](http://rdf.js.org/data-model-spec/) for RDF terms, named and blank nodes, or quads. It also depends on an instance of an RDF Data Factory, specified by the aforementioned [specification](http://rdf.js.org/data-model-spec/#datafactory-interface). For TypeScript, the necessary type specifications are available through the [`@rdfjs/types` package](https://www.npmjs.com/package/@rdfjs/types); an implementation of the RDF Data Factory is provided by, for example, the [`n3` package](https://www.npmjs.com/package/n3) (but there are others), which also provides a Turtle/TriG parser and serializer to test the library.

By default (i.e., if not explicitly specified) the Data Factory of the [`n3` package](https://www.npmjs.com/package/n3) is used.

### Crypto

The implementation relies on the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/) as implemented by modern browsers, `deno` (version 1.3.82 or higher), or `node.js` (version 21 or higher). A side effect of using Web Crypto is that the canonicalization and hashing interface entries are all asynchronous, and must be used, for example, through the `await` idiom of Javascript/Typescript.



## Usage

An input RDF Dataset may be represented by: 

- A Set of [Quad instances](https://rdf.js.org/data-model-spec/#quad-interface); or
- An Array of [Quad instances](https://rdf.js.org/data-model-spec/#quad-interface); or
- A string representing an [N-Quads](http://www.w3.org/TR/n-quads/) document.

The canonicalization process can be invoked by

- the `canonicalize` method, that returns an N-Quads document containing the (sorted) quads of the dataset, and using the canonical blank node ids
- the `canonicalizeDetailed` method, that returns an Object of the form:
  - `canonicalized_dataset`: a Set or Array of Quad instances, using the canonical blank node ids
  - `canonical_form`: an N-Quads document containing the (sorted) quads of the dataset, using the canonical blank node ids
  - `issued_identifier_map`: a `Map` object, mapping the original blank node ids (as used in the input) to their canonical equivalents
  - `bnode_identifier_map`: `Map` object, mapping a blank node to its (canonical) blank node id

- A Set or an Array of Quad instances, if the input was a Set or an Array, respectively;
- A Set of Quad instances if the input was an N-Quads document.

The separate [testing folder](https://github.com/iherman/rdfjs-c14n/tree/main/testing) includes a tiny application that runs some specification tests, and can be used as an example for the additional packages that are required. 

## Installation

For `node.js`, the usual `npm` installation can be used:

```
npm rdfjs-c14n
```

The package has been written in TypeScript but is distributed in JavaScript; the type definition (i.e., `index.d.ts`) is included in the distribution.

Also, using appropriate tools (e.g., [esbuild](https://esbuild.github.io/)) the package can be included into a module that can be loaded into a browser.

For `deno` a simple

```
import { RDFC10, Quads } from "npm:rdfjs-c14n"
```

will do.

## Usage Examples

There is a more detailed documentation of the classes and types [on github](https://iherman.github.io/rdfjs-c14n/). The basic usage may be as follows:

```js
import * as n3  from 'n3';
import * as rdf from 'rdf-js';
// The definition of "Quads" is:
// export type Quads = rdf.Quad[] | Set<rdf.Quad>; 
import {RDFC10, Quads } from 'rdf-c14n';

main() {
    // Any implementation of the data factory will do in the call below.
    // By default, the Data Factory of the `n3` package (i.e., the argument in the call
    // below is not strictly necessary).
    // Optionally, an instance of a Dataset Core Factory may be added as a second argument.
    const rdfc10 = new RDFC10(n3.DataFactory);  

    const input: Quads = createYourQuads();

    // "normalized" is a dataset of quads with "canonical" blank node labels
    // per the specification. 
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;

    // If you care only of the N-Quads results only, you can make it simpler
    const normalized_N_Quads: string = (await rdfc10.c14n(input)).canonical_form;

    // Or even simpler, using a shortcut:
    const normalized_N_Quads_bis: string = await rdfc10.canonicalize(input);

    // "hash" is the hash value of the canonical dataset, per specification
    const hash: string = await rdfc10.hash(normalized);
}
```

Alternatively, the canonicalization can rely on N-Quads documents only, with all other details hidden:

```js
import * as n3  from 'n3';
import * as rdf from 'rdf-js';
// The definition of "Quads" is:
// export type Quads = rdf.Quad[] | Set<rdf.Quad>; 
import {RDFC10, Quads, quadsToNquads } from 'rdf-c14n';

main() {
    // Any implementation of the data factory will do in the call below.
    const rdfc10 = new RDFC10();  

    const input: string = fetchYourNQuadsDocument();

    // "normalized" is an N-Quads document with all blank nodes canonicalized 
    const normalized: string = await rdfc10.canonicalize(input);

    // "hash" is the hash value of the canonical dataset, per specification
    const hash = await rdfc10.hash(normalized);
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

This implementation sets a maximum level; this level can be accessed by the

```js
    rdfc10.maximum_allowed_complexity_number;
```

(read-only) attribute. This number can be lowered by setting the 

```js
    rdfc10.maximum_complexity_number
```

attribute. The value of this attribute cannot exceed the system wide maximum level.

#### Logging

The canonicalization algorithm has built-in logging points that can be followed via a logger. This is only of interest for debugging the algorithm itself; it can be safely ignored by the average user. By default, no logging happens.

A built-in logger can be switched on which displays logging information in YAML. To use this YAML logger, do the following:

```js
import { LogLevels } from 'rdfjs-c14n';
…
main() {
    …
    const rdfc10 = new RDFC10();
    // `logLevel` may be LogLevels.error, LogLevels.warn, LogLevels.info, LogLevels.debug  
    const logger = rdfc10.setLogger("YamlLogger", logLevel);
    …
    // "logger.log" is a string containing the full log in YAML format
    console.log(logger.log);
}
```

Implementers may add their own loggers to the system by implementing a new Logger instance. See the [interface specification for Logger](https://iherman.github.io/rdfjs-c14n/interfaces/lib_logging.Logger.html) to possibly implement your own logger, and the general documentation on how to add this logger to the list of available loggers. In case there are more loggers, the list of available loggers is also available to the end user via:

```js
    rdfc10.available_logger_types;
```

that returns the loggers that are included in the distribution.

#### Configurations

The default complexity value and the hash algorithm are both set in the code, see the [configuration module](https://iherman.github.io/rdfjs-c14n/modules/lib_config.html).

Specific applications may want to add the possibility to let the user configure these values, e.g., via environment variables or configuration files. This requires specific features (e.g., file access) depending on the platform used to run the algorithm (e.g., node.js, deno, or a browser platform), i.e., this requires some extra code that should not be included in the library. However, the library _is_ prepared to run such an external configuration setting via a callback when constructing the RDFC10 instance, as follows:

```js
    …
    const rdfc10 = new RDFC10(null, getConfigData);
    …
```

where `null` stands for a possible `DataFactory` instance (or `null` if the default is used) and `getConfigData` stands for a callback returning the configuration data. An example [callback](https://github.com/iherman/rdfjs-c14n/blob/main/extras/nodeConfiguration.ts) (using a combination of environment variables and configuration files and relying on the `node.js` platform) is available, and can be easily adapted to other platforms (e.g., `deno`). (A [javascript version](https://github.com/iherman/rdfjs-c14n/blob/main/extras/nodeConfiguration.js) of the callback is also available.)

---

Maintainer: [@iherman](https://github.com/iherman)
