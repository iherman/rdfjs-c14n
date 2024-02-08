# Version 3.0.1

- There was a bug in the config file; the key SHA-512 was mapped on SHA-256.
- Updated the dependency to `@types/rdfjs`
- The type of input to the algorithm has been changed to, essentially `Iterable<rdf.Quad> | string`. This provides extra flexibility and makes the code clearer. (Proposed by @tpluscode, see [github comment](https://github.com/iherman/rdfjs-c14n/issues/10#issuecomment-1932262536))
- The turtle/nquads parsers have been modified to ensure uniqueness of terms. See [github issue](https://github.com/iherman/rdfjs-c14n/issues/10).

# Version 3.0.0

- As `crypto-js` package has been discontinued, switching to the WebCrypto API for hashing (available in `node.js` for versions 21 and upwards). ***This is a backward incompatible change***, because hashing in WebCrypto is an asynchronous function, and this "bubbles up" to the generic interface as well. 

# Version 2.0.4

- Added SHA-384 to the list of available hash functions (missed it the last time)


# Version 2.0.3

- The library has been made "node-independent", ie, removed all dependencies that meant that library can only use on a `node.js` platform (as opposed to, say, a browser). This means:
  - Instead of using the build-in crypto module for hashing, the `crypto-js` library is used. Although it has a slightly smaller set of available hashing functions, that is not really important for RDFC10 (which, formally, is based on sha256, and everything else is just a cherry on the cake)
  - The function that allows the user to set some configuration data via environment variables and/or configuration files has been removed from the core. There is now a separate 'extras' directory on the repository which has this function as a callback example that the application developer can use, and the general structure only relies on callback. The callback itself is `node.js` based, others may want to come up with alternatives for, e.g., `deno` or a browser.


# Version 2.0.2

- The return structure uses bona fide Map-s for the additional mapping information, instead of a bespoke structure. This makes the usage more natural to end-users.
- Handling of poison graphs has changed: instead of looking at the recursion level, it looks at the number of calls to "hash n degree quads".
- The default hash function and complexity levels can also be set via environment variables, and the system also looks for a `.rdfjs_c14n.json` configuration file in the local directory as well as the user's home directory for further values. These are merged using the usual priority (HOME < Local Dir < environment variables).
- The `canonicalizeDetailed` entry point has been renamed `c14n`...
- Code improvement: it is simpler to use `Set<rdf.Quad>` everywhere rather than using a 'Shell' to cover for a Set or an Array. (It may be a bit slower that way, but the complication may not be worth it.)

# Version 2.0.1

- The variable names used in the return structure of the core algorithm have been aligned with the latest version of the spec text

# Version 2.0.0

- Minor editorial changes to be in line with the newest version of eslint
- The name of the hash algorithm, if set explicitly, is checked against a list of names as returned from `openssl list -digest-commands` and implemented by `node.js`. Also, setting the algorithm is now done via accessors, with an extra accessor giving access to the list of available names.
- Removed the references to dataset factories. It is not a widely implemented feature, and just creates extra complications (e.g., is it an `Iteratable`?). The simple union of Set or Array of quads is, in this respect much more usable...)
- Changed the way Loggers are used. Instead of letting the user check in a class instance as a logger (which _may_ be seen as a security risk), the current approach is to use a (text) id to choose among the loggers included in the implementation. Developer can add their own as part of the library, but the lambda user of the library cannot.
- Synching with the latest version of the official draft (June 2023), namely:
  - The input to the algorithm can be either a Quads object (ie, a Set or Array or Quads, or an RDF Dataset) or a string, i.e., an nQuads document. If the latter, it is parsed into a Quad object, keeping the BNode identifiers as used in the nQuad source.
  - The simple output of the algorithm is an N-Quads document; alternatively, the detailed output is a structure containing the N-Quads and rdf.Quads versions of the data, as well as a mappings of blank nodes and their identifiers.
  - The hash function can use the same type of input as the core input.
  - The name of the algorithm is officially RDFC 1.0. As a consequence, the name of the main entry point has been changed from `RDFCanon` to `RDFC10`. The documentation and the tests have also been changed to reflect the new name.
  - The maximum level of recursion in the "Hash N Degree Quads" has a default (currently 50), which can also be set to a lower level by the user. 


# Version 1.0.4

- The section number references in the logs have been synced with the official spec version Febr. 2023

# Version 1.0.3

- The logging system has been changed:
  - it has been more closely integrated to the core library (in line with the evolution of the specification)
  - a logger producing a YAML version of the logs has been added to the core library
- Minor changes to the interface class:
  - default value for a data factory has been added to simplify usage
  - the core interface class includes reference to serialization and hash beyond the canonicalization itself

# Version 1.0.2

- First version of the documentation completed
