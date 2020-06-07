
export interface ClassEvent<T extends string> {
	type: T;
}

export interface ClassEventListener<T extends string, E extends ClassEvent<T>> {
	(evt: E): void;
}

export class ClassEventTarget<T extends string, E extends ClassEvent<T>> {
	private listeners: { [type: string]: ClassEventListener<T, E>[]; } = {};

	public addEventListener(type: T, listener: ClassEventListener<T, E>) {
		if (!(type in this.listeners)) {
			this.listeners[type] = [];
		}
		this.listeners[type].push(listener);
	};

	public removeEventListener(type: T, listener: ClassEventListener<T, E>) {
		if (!(type in this.listeners)) {
			return;
		}
		var stack = this.listeners[type];
		for (var i = 0, l = stack.length; i < l; i++) {
			if (stack[i] === listener) {
				stack.splice(i, 1);
				return;
			}
		}
	};

	public dispatchEvent(event: E) {
		if (!(event.type in this.listeners)) {
			return true;
		}
		var stack = this.listeners[event.type].slice();

		for (var i = 0, l = stack.length; i < l; i++) {
			stack[i].call(this, event);
		}
	};

}

