import type { Schedule } from '../models/Schedule';

/**
 * スケジュールのリポジトリインターフェース
 */
export interface IScheduleRepository {
	/**
	 * スケジュールを保存
	 */
	save(schedule: Schedule): Promise<void>;

	/**
	 * IDでスケジュールを取得
	 */
	findById(id: string): Promise<Schedule | null>;

	/**
	 * すべてのスケジュールを取得
	 */
	findAll(): Promise<Schedule[]>;

	/**
	 * スケジュールを削除
	 */
	delete(id: string): Promise<void>;
}
