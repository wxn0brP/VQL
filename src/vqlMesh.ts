import { ValtheraCompatible } from "@wxn0brp/db-core";
import { createValtheraAdapter, ValtheraResolver } from "./apiAbstract";
import { VQLProcessor } from "./processor";

/**
 * Creates a proxy adapter for a database on a remote VQL instance.
 * This allows a local VQL instance to treat a remote database as if it were its own.
 * @param remoteVql The remote VQLProcessor instance to which queries will be sent.
 * @param dbName The name of the database on the remote instance to proxy.
 * @returns A ValtheraCompatible adapter that proxies a remote database.
 */
export function createVqlProxyDb(remoteVql: VQLProcessor, dbName: string): ValtheraCompatible {
    const resolver: ValtheraResolver = {
        meta: { type: "vql-proxy", version: "1.0.0", remote: true, proxiedDB: dbName },

        find: async (collection, search, context, options, findOpts) => {
            const query = { db: dbName, d: { find: { collection, search, options, select: findOpts?.select } } };
            return remoteVql.execute(query, context?.user);
        },

        findOne: async (collection, search, context, findOpts) => {
            const query = { db: dbName, d: { findOne: { collection, search, select: findOpts?.select } } };
            return remoteVql.execute(query, context?.user);
        },

        add: async (collection, data, id_gen, context) => {
            const query = { db: dbName, d: { add: { collection, data, id_gen: id_gen ?? true } } };
            return remoteVql.execute(query, context?.user);
        },

        update: async (collection, search, updater, context) => {
            const query = { db: dbName, d: { update: { collection, search, updater } } };
            return remoteVql.execute(query, context?.user);
        },

        updateOne: async (collection, search, updater, context) => {
            const query = { db: dbName, d: { updateOne: { collection, search, updater } } };
            return remoteVql.execute(query, context?.user);
        },

        remove: async (collection, search, context) => {
            const query = { db: dbName, d: { remove: { collection, search } } };
            return remoteVql.execute(query, context?.user);
        },

        removeOne: async (collection, search, context) => {
            const query = { db: dbName, d: { removeOne: { collection, search } } };
            return remoteVql.execute(query, context?.user);
        },

        updateOneOrAdd: async (collection, search, updater, add_arg, context, id_gen) => {
            const query = { db: dbName, d: { updateOneOrAdd: { collection, search, updater, add_arg, id_gen } } };
            return remoteVql.execute(query, context?.user);
        },

        removeCollection: async (collection, context) => {
            const query = { db: dbName, d: { removeCollection: { collection } } };
            return remoteVql.execute(query, context?.user);
        },

        ensureCollection: async (collection, context) => {
            const query = { db: dbName, d: { ensureCollection: { collection } } };
            return remoteVql.execute(query, context?.user);
        },

        issetCollection: async (collection, context) => {
            const query = { db: dbName, d: { issetCollection: { collection } } };
            return remoteVql.execute(query, context?.user);
        },

        getCollections: async (context) => {
            const query = { db: dbName, d: { getCollections: {} } };
            return remoteVql.execute(query, context?.user);
        },
    };

    // extendedFind is set to false to prevent the proxy from performing client-side filtering/sorting,
    // as this should be handled by the remote VQL instance.
    return createValtheraAdapter(resolver, false);
}
