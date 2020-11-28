export interface IBlameLine<T> {
    origin: T extends string ? number : T;
    value: string;
}
export interface IExtractor<T, S> {
    getCode: (a: T) => string;
    getOrigin: (a: T) => S;
}
export declare function blame<T, S>(codes: Array<T>, passedOptions?: IExtractor<T, S>): Array<IBlameLine<T>>;
//# sourceMappingURL=blame.d.ts.map