import { AggregationComputer, AggregationGroupComputer, IValue, _ISelection, _IType, _Transaction } from '../../interfaces-private';
import { ExprCall } from 'pgsql-ast-parser';
declare class SumExpr implements AggregationComputer<number> {
    private exp;
    constructor(exp: IValue);
    get type(): _IType<any>;
    createGroup(t: _Transaction): AggregationGroupComputer<number>;
}
declare class SumDistinct implements AggregationComputer<number> {
    private exp;
    constructor(exp: IValue);
    get type(): _IType<any>;
    createGroup(t: _Transaction): AggregationGroupComputer<number>;
}
export declare function buildSum(this: void, base: _ISelection, call: ExprCall): SumExpr | SumDistinct;
export {};
//# sourceMappingURL=sum.d.ts.map