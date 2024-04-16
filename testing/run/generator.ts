/**
 * See original https://github.com/iherman/rdfjs-c14n/issues/13 for original bug report
 */
import * as n3 from 'n3';
import * as rdf from '@rdfjs/types';
import { RDFC10, Quads, InputQuads } from '../../index';

function* createYourQuads(): Iterable<rdf.Quad> {
    yield n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate'),
        n3.DataFactory.literal('object')
    );
    yield n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate2'),
        n3.DataFactory.literal('object2')
    );
}

async function useGenerator() {
    const rdfc10 = new RDFC10(n3.DataFactory);
    const input: InputQuads = createYourQuads();
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;
    console.log('Normalized dataset size:', normalized.size);
}

async function useDataset() {
    const quads = new n3.Store();
    quads.add(n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate'),
        n3.DataFactory.literal('object')
    ));
    quads.add(n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate2'),
        n3.DataFactory.literal('object2')
    ));
    const rdfc10 = new RDFC10(n3.DataFactory);
    const normalized: Quads = (await rdfc10.c14n(quads)).canonicalized_dataset;
    console.log('Normalized dataset size:', normalized.size);
}

async function useArray() {
    const quads = [
    n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate'),
        n3.DataFactory.literal('object')
    ),
    n3.DataFactory.quad(
        n3.DataFactory.namedNode('http://example.org/subject'),
        n3.DataFactory.namedNode('http://example.org/predicate2'),
        n3.DataFactory.literal('object2')
    )];
    const rdfc10 = new RDFC10(n3.DataFactory);
    const normalized: Quads = (await rdfc10.c14n(quads, false)).canonicalized_dataset;
    console.log('Normalized dataset size:', normalized.size);
}


async function main() {
    console.log("Use generator");
    await useGenerator();
    console.log("\nUse dataset");
    await useDataset();
    console.log("\nUse Array");
    await useArray();
}

main();
