# Version 2.0.0

- Minor editorial changes to be in line with the newest version of eslint
- The name of the hash algorithm, if set explicitly, is checked against a list of names as returned from `openssl list -digest-commands`
- Removed the references to dataset factories. It is not a widely implemented feature, and just creates extra complications (e.g., is it an `Iteratable`?). The simple union of Set or Array of quads is, in this respect much more usable...)
- Synching with the latest version of the official draft (June 2023), namely:
  - The input to the algorithm can be either a Quads object (ie, a Set or Array or Quads, or an RDF Dataset) or a string, i.e., an nQuads document. If the latter, it is parsed into a Quad object, keeping the BNode identifiers as used in the nQuad source.
  - The simple output of the algorithm is an N-Quads document; alternatively, the detailed output is a structure containing the N-Quads and rdf.Quads versions of the data, as well as a mappings of blank nodes and their identifiers.
  - The hash function can use the same type of input as the core input.
  - The name of the algorithm is officially RDFC 1.0. As a consequence, the name of the main entry point has been changed from `RDFCanon` to `RDFC10`. The documentation has also been changed to reflect the new name.


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
