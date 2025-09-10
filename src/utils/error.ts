import { log_error } from "./log";

export class SlidesRupAssistantError extends Error {
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
		if (!(e instanceof SlidesRupAssistantError)) {
			log_error(new SlidesRupAssistantError(msg, e.message));
		} else {
			log_error(e);
		}
		throw new SlidesRupAssistantError(msg, e.message);
	}
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
	try {
		return fn();
	} catch (e) {
		log_error(new SlidesRupAssistantError(msg, e.message));
		throw new SlidesRupAssistantError(msg, e.message);
	}
}
