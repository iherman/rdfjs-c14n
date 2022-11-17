import * as rdf from "rdf-js";
import { NS, get_graph, DataFactory, GraphContainer } from './lib/rdfjs';

const rdf_type: rdf.NamedNode     = NS.rdf("type");
const rdfs_class: rdf.NamedNode   = NS.rdfs("Class");
const rdf_property: rdf.NamedNode = NS.rdf("Property");
const owl_ontology: rdf.NamedNode = NS.owl("Ontology");

async function main(fname: string): Promise<void> {
    const graph: GraphContainer = await get_graph(fname);

    const subj: rdf.NamedNode = DataFactory.namedNode("https://www.ivan-herman.net");
    const pred: rdf.NamedNode = NS.rdf("fake_property");
    const obj: rdf.BlankNode = DataFactory.blankNode("c14n_890");

    graph.add(DataFactory.quad(subj, pred, obj));

    const subjects = graph.getSubjects(null,null);

    // We have to filter out the subjects that do _not_ appear as objects.
    // The rest are the possible 'top' level entries that the vocabulary is all about
    const tops = graph.getSubjects(rdf_type, null)

    // Careful. The ontology itself does not appear in the top list, because
    // it is also the object of all the rdfs:isDefinedBy structures...
    const ontologies = Array.from(subjects).filter( (s: rdf.Term): boolean => {
        return graph.match(s,rdf_type, owl_ontology).size > 0
    })
    const classes = Array.from(tops).filter( (s: rdf.Term): boolean => {
        return graph.match(s,rdf_type,rdfs_class).size > 0
    })
    const properties = Array.from(tops).filter( (s: rdf.Term): boolean => {
        return graph.match(s,rdf_type,rdf_property).size > 0
    })
    const individuals = Array.from(tops).filter( (s: rdf.Term): boolean => {
         return !(classes.includes(s) || properties.includes(s) || ontologies.includes(s))
    })

    console.log('\nsubjects:')
    console.log(subjects)
    console.log('\ntops:')
    console.log(tops)
    console.log('\nclasses:')
    console.log(classes);
    console.log('\nproperties:')
    console.log(properties);
    console.log('\nontologies:')
    console.log(ontologies);
    console.log('\nindividuals:')
    console.log(individuals);

    console.log(graph.sorted_nquads);

}

main('test.ttl')
