import { Change } from 'diff';
export interface IBlameLine<S> {
    origin: S;
    value: string;
    diffentry?: number;
    lineindiff?: number;
    previousOrigin?: S;
    diff?: Change[];
}
export interface IExtractor<T, S> {
    getCode: (a: T) => string;
    getOrigin: (a: T, idx: number) => S;
}
export declare class StringExtractor<T extends string> implements IExtractor<T, number> {
    getCode(a: T): T;
    getOrigin(a: string, idx: number): number;
}
/**
 *
 * @param snapshots idx=0 => most recent snapshot (what is seen in the editor), idx=length-1 => oldest snapshot
 * @param extractor
 */
export declare function blame<T, S>(snapshots: Array<T>, extractor: IExtractor<T, S>): Array<IBlameLine<S>>;
//# sourceMappingURL=blame.d.ts.map