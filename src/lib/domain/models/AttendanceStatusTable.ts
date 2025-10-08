import type { Attendance } from './valueObjects';
import { ProposedDate, Member } from './valueObjects';

/**
 * 出欠回答のエントリ
 */
export interface AttendanceEntry {
	memberName: string;
	dateIndex: number;
	attendance: Attendance;
}

/**
 * 出欠回答状況テーブル (候補日 × 参加者の出欠表)
 */
export class AttendanceStatusTable {
	private responses: Map<string, Map<number, Attendance>> = new Map();
	private _members: Member[] = [];

	constructor(
		public readonly proposedDates: ProposedDate[],
		members: Member[]
	) {
		this._members = members;
	}

	get members(): Member[] {
		return [...this._members];
	}

	/**
	 * 参加者を追加
	 */
	addMember(member: Member): void {
		if (this._members.some((m) => m.equals(member))) {
			return; // すでに存在する場合は追加しない
		}
		this._members.push(member);
	}

	/**
	 * 出欠を登録する（参加者が未登録の場合は自動追加）
	 */
	setAttendance(memberName: string, dateIndex: number, attendance: Attendance): void {
		if (dateIndex < 0 || dateIndex >= this.proposedDates.length) {
			throw new Error('Invalid date index');
		}

		// 参加者が未登録の場合は追加
		const member = new Member(memberName);
		this.addMember(member);

		if (!this.responses.has(memberName)) {
			this.responses.set(memberName, new Map());
		}
		this.responses.get(memberName)!.set(dateIndex, attendance);
	}

	/**
	 * 出欠を取得する
	 */
	getAttendance(memberName: string, dateIndex: number): Attendance | undefined {
		return this.responses.get(memberName)?.get(dateIndex);
	}

	/**
	 * 全員の出欠が集まっているかチェック
	 */
	hasAllResponses(): boolean {
		return this._members.every((member) => {
			const memberResponses = this.responses.get(member.name);
			if (!memberResponses) return false;
			return this.proposedDates.every((_, dateIndex) => memberResponses.has(dateIndex));
		});
	}

	/**
	 * 指定した候補日に全員が出席可能かチェック
	 */
	isAllAvailable(dateIndex: number): boolean {
		return this._members.every((member) => {
			const attendance = this.getAttendance(member.name, dateIndex);
			return attendance === 'available';
		});
	}

	/**
	 * 全回答を取得
	 */
	getAllResponses(): AttendanceEntry[] {
		const entries: AttendanceEntry[] = [];
		this.responses.forEach((dateMap, memberName) => {
			dateMap.forEach((attendance, dateIndex) => {
				entries.push({ memberName, dateIndex, attendance });
			});
		});
		return entries;
	}
}
