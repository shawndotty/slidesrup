import { log_error } from "./log";

export class OBASAssistantError extends Error {
	constructor(msg: string, public console_msg?: string) {
		super(msg);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export async function errorWrapper<T>(
	fn: () => Promise<T>,
	msg: string
): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (!(e instanceof OBASAssistantError)) {
			log_error(new OBASAssistantError(msg, e.message));
		} else {
			log_error(e);
		}
		return null as T;
	}
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
	try {
		return fn();
	} catch (e) {
		log_error(new OBASAssistantError(msg, e.message));
		return null as T;
	}
}
