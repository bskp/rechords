export interface IBlameLine<T> {
    origin: T extends string ? number : T;
    value: string;
}
export interface IExtractor<T> {
    getCode: (a: T) => string;
    getOrigin: (a: T) => any;
}
export declare function blame<T>(codes: Array<T>, passedOptions?: IExtractor<T>): Array<IBlameLine<T>>;
