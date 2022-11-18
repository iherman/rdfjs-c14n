import * as rdf_impl from './rdfn3';
import * as rdf from 'rdf-js';
import {promises as fs} from 'fs';

/** Re-export the low level implementation of the RDF DataFactory */
export const DataFactory = rdf_impl.DataFactory;

/** An RDF graph is a set of triples/quads, says the spec... */
export type Graph = Set<rdf.Quad>;

export function quad_to_nquad(quad: rdf.Quad): string {
    return rdf_impl.write_nquads([quad])[0];
}

/* ****************** Convenience types to make the implementation more readable *********** */
type CURIE = (arg: string) => rdf.NamedNode;
interface prefix_item {
    key: string;
    url: string;
};


/* ****************** Graph Container, to collect the basic search functions *********** */

/**
 * A hopelessly simple and inefficient implementation of a full graph. 
 * 
 * The usage of all this is to implement the canonicalization algorithm, which is not expected to run on large graphs anyway...
 */
export class GraphContainer {
    private _graph: Graph = new Set();
    constructor(input: Graph | GraphContainer | rdf.Quad[] = new Set() as Graph) {
        if (input instanceof GraphContainer) {
            for (const quad of input._graph) {
                this._graph.add(quad)
            }
        } else if (Array.isArray(input)) {
            this._graph = new Set(input);
        } else {
            this._graph = input;
        }
    }

    /* ***************************************** Essentially, the Set functions repeated on the container level ***************** */
    add(q: rdf.Quad): void {
        this._graph.add(q);
    }

    delete(q: rdf.Quad): void {
        if (this._graph.has(q)) {
            this._graph.delete(q)
        }
    }

    clear(): void {
        this._graph.clear();
    }

    has(q: rdf.Quad): boolean {
        return this._graph.has(q);
    }

    get size(): number {
        return this._graph.size;
    }

    get values(): rdf.Quad[] {
        return Array.from(this._graph.values());
    }

    forEach(callback: (val: rdf.Quad) => void): void {
        this._graph.forEach(callback);
    }

    /* ***************************************** The usual, simple triple/quad search methods ************************************ */

    match(subject: rdf.Term|null, predicate: rdf.Term|null, object: rdf.Term|null, graph: rdf.Term|null = null): Graph {
        const retval: Graph = new Set();
        this._graph.forEach((q: rdf.Quad): void => {
            if ((subject === null   || q.subject.equals(subject)) &&
                (predicate === null || q.predicate.equals(predicate)) &&
                (object === null    || q.object.equals(object)) &&
                (graph === null     || q.graph.equals(graph))) {
                    retval.add(q);
            }
        });
        return retval;
    }

    getSubjects(predicate: rdf.Term|null, object: rdf.Term|null, graph: rdf.Term|null = null): Set<rdf.Term> {
        const quads = this.match(null, predicate, object, graph);
        const retval: Set<rdf.Term> = new Set();
        quads.forEach((q: rdf.Quad): void => { retval.add (q.subject) });
        return retval;
    }

    getPredicates(subject: rdf.Term|null, object: rdf.Term|null, graph: rdf.Term|null = null): Set<rdf.Term> {
        const quads = this.match(subject, null, object, graph);
        const retval: Set<rdf.Term> = new Set();
        quads.forEach((q: rdf.Quad): void => { retval.add (q.predicate) });
        return retval;
    }

    getObjects(subject: rdf.Term|null, predicate: rdf.Term|null, graph: rdf.Term|null = null): Set<rdf.Term> {
        const quads = this.match(subject, predicate, null, graph);
        const retval: Set<rdf.Term> = new Set();
        quads.forEach((q: rdf.Quad): void => { retval.add (q.object) });
        return retval;
    }

    getGraphs(subject: rdf.Term|null, predicate: rdf.Term|null, object: rdf.Term|null): Set<rdf.Term> {
        const quads = this.match(subject, predicate, object, null);
        const retval: Set<rdf.Term> = new Set();
        quads.forEach((q: rdf.Quad): void => { retval.add (q.graph) });
        return retval;
    }

    /**
     * Return the quads in an array of strings representing the nquads of the dataset.
     *
     * @returns: array of strings in N-Quads syntax
     */
    get nquads(): string[] {
        return rdf_impl.write_nquads(this.values);
    }

    /**
     * Return the quads in a _lexicographically ordered_ array of strings representing the nquads of the dataset.
     *
     * @returns: array of strings in N-Quads syntax
     */
    get sorted_nquads() {
        return this.nquads.sort();
    }
    
    /* ******************************************* Trivial utility methods ******************* */
    get graph(): Graph {
        return this._graph;
    }

    *[Symbol.iterator](): IterableIterator<rdf.Quad> {
        for (const q of this._graph) {
            yield q;
        }
    }
}

/* *********************************** Parsing a TriG file  *********************************/


/**
 * Parse a turtle/trig file and return the result in a set of RDF Quads. The prefix declarations are also added to the list of prefixes.
 * 
 * @param fname TriG file name
 * @returns 
 */
export async function get_graph(fname: string): Promise<GraphContainer> {
    // The function is called by the parser for each quad; it is used to store the data in the final set of quads.
    const add_quad = (error: Error, quad: rdf.Quad, prefixes: any): void => {
        if (error) {
            throw(error);
        } else if( quad !== null) {
            quads.add(quad);
        } 
    };
    
    // The prefix value is stored in the local prefix store
    const add_prefix = (prefix: string, url: rdf.NamedNode): void => {
        NS.ns(prefix, url.value);
    };

    const quads: GraphContainer = new GraphContainer();
    const trig: string = await fs.readFile(fname, 'utf-8');
    rdf_impl.parse_trig(trig, add_quad, add_prefix);
    return quads;
}

/* *********************************** Namespace management *********************************/

/* To be seen whether this is used at all elsewhere... *************************/

/**
 * My own implementation of the CURIE/Namespace handling, which works through the
 * maze of undocumented (or badly documented) rdf.js structures...
 */
export class NS {
    private static prefixes: {[key: string]: string} = {};

    static ns(prefix: string, url:string): CURIE {
        NS.prefixes[prefix] = url;
        const curie = NS.get_curie(prefix);
        if (curie !== undefined) {
            return curie;
        } else {
            throw ("THIS SHOULD NOT HAPPEN, BUT TS DOES NOT KNOW...")
        }
    }

    static get_curie(prefix: string): CURIE|undefined {
        if (NS.prefix_keys().includes(prefix)) {
            return (suffix:string): rdf.NamedNode => {
                const url = NS.prefixes[prefix].concat(suffix);
                return DataFactory.namedNode(url);
            };
        } else {
            return undefined
        }
    }

    static prefixed_items() : prefix_item[] {
        return Object.keys(NS.prefixes).map( (key: string): prefix_item => {
            return {
                key: key,
                url: NS.prefixes[key],
            }
        });
    }

    static prefix_keys(): string[] {
        return Object.keys(NS.prefixes);
    }

    static prefix_values(): string[] {
        return Object.values(NS.prefixes)
    }

    static foaf   = NS.ns("foaf",   "http://xmlns.com/foaf/0.1/");
    static schema = NS.ns("schema", "http://schema.org/");
    static rdf    = NS.ns("rdf",    "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    static rdfs   = NS.ns("rdfs",   "http://www.w3.org/2000/01/rdf-schema#");
    static owl    = NS.ns("owl",    "http://www.w3.org/2002/07/owl#");
    static xsd    = NS.ns("xsd",    "http://www.w3.org/2001/XMLSchema#");
    static dc     = NS.ns("dc",     "http://purl.org/dc/terms/");
}

/**
 * Useful links...
 * 
 * https://rdf.js.org/data-model-spec/
 * https://rdf.js.org/dataset-spec/
 *
 */
