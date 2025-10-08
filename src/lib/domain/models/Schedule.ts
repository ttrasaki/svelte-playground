import { Organizer, ProposedDate } from './valueObjects';
import { AttendanceStatusTable } from './AttendanceStatusTable';

/**
 * スケジュールエンティティ
 */
export class Schedule {
	constructor(
		public readonly id: string,
		public readonly title: string,
		public readonly organizer: Organizer,
		public readonly attendanceTable: AttendanceStatusTable
	) {}

	/**
	 * 候補日のリストを取得
	 */
	get proposedDates(): ProposedDate[] {
		return this.attendanceTable.proposedDates;
	}

	/**
	 * スケジュールを新規作成
	 */
	static create(title: string, organizer: Organizer, proposedDates: ProposedDate[]): Schedule {
		const id = crypto.randomUUID();
		const attendanceTable = new AttendanceStatusTable(proposedDates, []);
		return new Schedule(id, title, organizer, attendanceTable);
	}
}
