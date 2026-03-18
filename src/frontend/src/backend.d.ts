import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BarcodeSeries {
    id: bigint;
    name: string;
    createdAt: bigint;
    values: Array<string>;
    format: string;
}
export interface backendInterface {
    createSeries(name: string, format: string, values: Array<string>): Promise<bigint>;
    deleteSeries(id: bigint): Promise<void>;
    getSeries(id: bigint): Promise<BarcodeSeries>;
    listSeries(): Promise<Array<BarcodeSeries>>;
}
