import type { AttendanceStatusTable } from '../models/AttendanceStatusTable';
import type { ProposedDate } from '../models/valueObjects';

/**
 * 日程調整の結果
 */
export type ScheduleDecisionResult =
	| { status: 'decided'; mostSuitableDate: ProposedDate }
	| { status: 'rescheduleRequired'; reason: string }
	| { status: 'pending'; reason: string };

/**
 * 最適日程を決定するドメインサービス
 */
export class ScheduleDecisionService {
	/**
	 * 最適な日程を決定する
	 */
	decide(table: AttendanceStatusTable): ScheduleDecisionResult {
		// 全員の回答が集まっているかチェック
		if (!table.hasAllResponses()) {
			return {
				status: 'pending',
				reason: 'Not all members have responded'
			};
		}

		// 全員が出席可能な候補日を探す
		const availableDates: number[] = [];
		for (let i = 0; i < table.proposedDates.length; i++) {
			if (table.isAllAvailable(i)) {
				availableDates.push(i);
			}
		}

		// 全員が出席可能な候補日が1つに決まれば確定
		if (availableDates.length === 1) {
			return {
				status: 'decided',
				mostSuitableDate: table.proposedDates[availableDates[0]]
			};
		}

		// 全員が出席可能な候補日が複数ある場合は最初の日付を選択
		if (availableDates.length > 1) {
			return {
				status: 'decided',
				mostSuitableDate: table.proposedDates[availableDates[0]]
			};
		}

		// 全員が出席可能な候補日がない場合は再調整が必要
		return {
			status: 'rescheduleRequired',
			reason: 'No date available for all members'
		};
	}
}
