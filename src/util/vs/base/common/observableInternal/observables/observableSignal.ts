//!!! DO NOT modify, this file was COPIED from 'microsoft/vscode'

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IObservableWithChange, ITransaction } from '../base';
import { transaction } from '../transaction';
import { DebugNameData } from '../debugName';
import { BaseObservable } from './baseObservable';

/**
 * Creates a signal that can be triggered to invalidate observers.
 * Signals don't have a value - when they are triggered they indicate a change.
 * However, signals can carry a delta that is passed to observers.
 */
export function observableSignal<TDelta = void>(debugName: string): IObservableSignal<TDelta>;
export function observableSignal<TDelta = void>(owner: object): IObservableSignal<TDelta>;
export function observableSignal<TDelta = void>(debugNameOrOwner: string | object): IObservableSignal<TDelta> {
	if (typeof debugNameOrOwner === 'string') {
		return new ObservableSignal<TDelta>(debugNameOrOwner);
	} else {
		return new ObservableSignal<TDelta>(undefined, debugNameOrOwner);
	}
}

export interface IObservableSignal<TChange> extends IObservableWithChange<void, TChange> {
	trigger(tx: ITransaction | undefined, change: TChange): void;
}

class ObservableSignal<TChange> extends BaseObservable<void, TChange> implements IObservableSignal<TChange> {
	public get debugName() {
		return new DebugNameData(this._owner, this._debugName, undefined).getDebugName(this) ?? 'Observable Signal';
	}

	public override toString(): string {
		return this.debugName;
	}

	constructor(
		private readonly _debugName: string | undefined,
		private readonly _owner?: object
	) {
		super();
	}

	public trigger(tx: ITransaction | undefined, change: TChange): void {
		if (!tx) {
			transaction(tx => {
				this.trigger(tx, change);
			}, () => `Trigger signal ${this.debugName}`);
			return;
		}

		for (const o of this._observers) {
			tx.updateObserver(o, this);
			o.handleChange(this, change);
		}
	}

	public override get(): void {
		// NO OP
	}
}
