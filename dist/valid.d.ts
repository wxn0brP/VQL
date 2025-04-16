import Ajv from 'ajv';
import { VQL, VQLR } from './types/vql.js';
export declare const ajv: Ajv;
export declare function validateRaw(query: VQLR): boolean;
export declare function validateVql(query: VQL): boolean;
