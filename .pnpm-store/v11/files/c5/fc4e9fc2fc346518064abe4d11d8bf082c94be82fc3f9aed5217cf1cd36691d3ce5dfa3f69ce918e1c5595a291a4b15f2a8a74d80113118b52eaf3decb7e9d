import { IValue, _ISelection, _Transaction, _Explainer, _SelectExplanation, Stats } from '../interfaces-private';
import { FilterBase } from './transform-base';
import { OrderByStatement } from 'pgsql-ast-parser';
export declare function buildOrderBy(on: _ISelection, order: OrderByStatement[]): OrderBy<any>;
declare class OrderBy<T> extends FilterBase<any> {
    private selection;
    order: {
        by: IValue<any>;
        order: 'ASC' | 'DESC';
    }[];
    get index(): null;
    entropy(t: _Transaction): number;
    hasItem(raw: T, t: _Transaction): boolean;
    constructor(selection: _ISelection<T>, order: OrderByStatement[]);
    stats(t: _Transaction): Stats | null;
    enumerate(t: _Transaction): Iterable<T>;
    explain(e: _Explainer): _SelectExplanation;
}
export {};
//# sourceMappingURL=order-by.d.ts.map