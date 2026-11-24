/** @hidden Every self-test check, in the order the runner takes them. */
import type { Check } from '../runner';
import { ANALYSIS_CHECKS, APP_CHECKS, AUTOMATION_CHECKS, DEVICE_CHECKS, FOLLOW_UP_CHECKS, HELPER_CHECKS, STRUCTURE_CHECKS } from './more';
import { SESSION_CHECKS } from './session';
import { TRACK_CHECKS } from './tracks';

export const CHECKS: readonly Check[] = [...HELPER_CHECKS, ...SESSION_CHECKS, ...TRACK_CHECKS, ...DEVICE_CHECKS, ...ANALYSIS_CHECKS, ...STRUCTURE_CHECKS, ...AUTOMATION_CHECKS, ...FOLLOW_UP_CHECKS, ...APP_CHECKS];
