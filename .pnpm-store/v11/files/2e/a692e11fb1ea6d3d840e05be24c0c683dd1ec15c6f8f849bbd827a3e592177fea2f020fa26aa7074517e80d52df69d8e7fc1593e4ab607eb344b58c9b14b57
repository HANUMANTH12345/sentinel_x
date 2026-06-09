import { TransformBase } from './transform-base';
import { _Transaction, IValue, _Explainer, _ISelection, _SelectExplanation, Stats, nil, _IAlias } from '../interfaces-private';
import { ExprRef } from 'pgsql-ast-parser';
export declare function buildAlias(on: _ISelection, alias?: string): _ISelection<any>;
export declare class Alias<T> extends TransformBase<T> implements _IAlias {
    name: string;
    private oldToThis;
    private thisToOld;
    private _columns;
    private asRecord;
    constructor(sel: _ISelection, name: string);
    listSelectableIdentities(): Iterable<IValue>;
    rebuild(): void;
    selectAlias(alias: string): _IAlias | nil;
    listColumns(): Iterable<IValue>;
    get debugId(): string | undefined;
    get columns(): ReadonlyArray<IValue<any>>;
    init(): void;
    stats(t: _Transaction): Stats | null;
    enumerate(t: _Transaction): Iterable<T>;
    hasItem(value: T, t: _Transaction): boolean;
    getColumn(column: string | ExprRef): IValue;
    getColumn(column: string | ExprRef, nullIfNotFound?: boolean): IValue | nil;
    private _getColumn;
    explain(e: _Explainer): _SelectExplanation;
    getIndex(...forValue: IValue[]): import("../interfaces-private")._IIndex<any> | null | undefined;
}
//# sourceMappingURL=alias.d.ts.map