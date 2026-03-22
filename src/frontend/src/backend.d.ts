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
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSeries(name: string, format: string, values: Array<string>): Promise<bigint>;
    deleteSeries(id: bigint): Promise<void>;
    getAllSeriesByUser(): Promise<Array<[Principal, Array<BarcodeSeries>]>>;
    getAllSeriesCount(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSeries(id: bigint): Promise<BarcodeSeries>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSettings(): Promise<string | null>;
    isCallerAdmin(): Promise<boolean>;
    listSeries(): Promise<Array<BarcodeSeries>>;
    renameSeries(id: bigint, newName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserSettings(settings: string): Promise<void>;
}
