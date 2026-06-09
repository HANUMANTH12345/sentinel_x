import { _Transaction } from './interfaces-private';
import { Map as ImMap, Set as ImSet } from 'immutable';
export declare class Transaction implements _Transaction {
    private parent;
    private data;
    private origData;
    static root(): Transaction;
    get isChild(): boolean;
    private constructor();
    clone(): Transaction;
    fork(): _Transaction;
    commit(): _Transaction;
    delete(identity: symbol): void;
    set<T>(identity: symbol, data: T): T;
    get<T>(identity: symbol): T;
    getMap<T extends ImMap<any, any>>(identity: symbol): T;
    getSet<T>(identity: symbol): ImSet<T>;
    fullCommit(): _Transaction;
    rollback(): Transaction;
}
//# sourceMappingURL=transaction.d.ts.map