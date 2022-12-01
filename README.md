# RDF Canonicalization in TypeScript

This is an implementation (under development) of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm. (The algorithm is being specified by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch), and nothing is final…)

The core library is (in TypeScript) in the `lib` directory, and "indexed" via the `index.ts` file. This library is only dependent on the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). A separate `tester` library includes a small "application", relying on the [`n3`](https://github.com/rdfjs/N3.js) library implementing the generic `rdf.js` interface to run the library on specific Turtle/TriG files.  

A proper documentation will come further when the code ready to be published on npm.

---

Maintainer: [@iherman](https://github.com/iherman)
