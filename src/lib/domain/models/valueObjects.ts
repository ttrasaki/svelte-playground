/**
 * 出欠状況を表す値オブジェクト
 */
export type Attendance = 'available' | 'unavailable';

/**
 * 候補日を表す値オブジェクト
 */
export class ProposedDate {
	private static readonly DAYS = ['日', '月', '火', '水', '木', '金', '土'];

	constructor(public readonly value: Date) {}

	equals(other: ProposedDate): boolean {
		return this.value.getTime() === other.value.getTime();
	}

	toString(): string {
		return this.value.toISOString().split('T')[0];
	}

	toStringWithDay(): string {
		const dateStr = this.toString();
		const dayOfWeek = ProposedDate.DAYS[this.value.getDay()];
		return `${dateStr} (${dayOfWeek})`;
	}

	static fromString(dateString: string): ProposedDate {
		return new ProposedDate(new Date(dateString));
	}
}

/**
 * 参加者を表す値オブジェクト
 * 氏名のみで識別
 */
export class Member {
	constructor(public readonly name: string) {}

	equals(other: Member): boolean {
		return this.name === other.name;
	}
}

/**
 * 主催者を表す値オブジェクト
 */
export class Organizer {
	constructor(public readonly name: string) {}

	equals(other: Organizer): boolean {
		return this.name === other.name;
	}
}
