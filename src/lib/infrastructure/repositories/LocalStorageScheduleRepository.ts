import type { IScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { Schedule } from '../../domain/models/Schedule';
import { AttendanceStatusTable } from '../../domain/models/AttendanceStatusTable';
import { Organizer, ProposedDate, Member } from '../../domain/models/valueObjects';
import type { Attendance } from '../../domain/models/valueObjects';

const STORAGE_KEY = 'schedules';

interface ScheduleDto {
	id: string;
	title: string;
	organizerName: string;
	proposedDates: string[];
	members: string[];
	responses: { memberName: string; dateIndex: number; attendance: Attendance }[];
}

/**
 * LocalStorageを使用したスケジュールリポジトリの実装
 */
export class LocalStorageScheduleRepository implements IScheduleRepository {
	private isClient(): boolean {
		return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
	}

	async save(schedule: Schedule): Promise<void> {
		if (!this.isClient()) return;

		const schedules = await this.findAll();
		const index = schedules.findIndex((s) => s.id === schedule.id);

		if (index >= 0) {
			schedules[index] = schedule;
		} else {
			schedules.push(schedule);
		}

		const dtos = schedules.map(this.toDto);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(dtos));
	}

	async findById(id: string): Promise<Schedule | null> {
		const schedules = await this.findAll();
		return schedules.find((s) => s.id === id) || null;
	}

	async findAll(): Promise<Schedule[]> {
		if (!this.isClient()) return [];

		const data = localStorage.getItem(STORAGE_KEY);
		if (!data) return [];

		const dtos: ScheduleDto[] = JSON.parse(data);
		return dtos.map(this.fromDto);
	}

	async delete(id: string): Promise<void> {
		if (!this.isClient()) return;

		const schedules = await this.findAll();
		const filtered = schedules.filter((s) => s.id !== id);
		const dtos = filtered.map(this.toDto);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(dtos));
	}

	private toDto(schedule: Schedule): ScheduleDto {
		return {
			id: schedule.id,
			title: schedule.title,
			organizerName: schedule.organizer.name,
			proposedDates: schedule.proposedDates.map((d) => d.toString()),
			members: schedule.attendanceTable.members.map((m) => m.name),
			responses: schedule.attendanceTable.getAllResponses()
		};
	}

	private fromDto(dto: ScheduleDto): Schedule {
		const organizer = new Organizer(dto.organizerName);
		const proposedDates = dto.proposedDates.map((d) => ProposedDate.fromString(d));
		const members = dto.members.map((name) => new Member(name));

		const attendanceTable = new AttendanceStatusTable(proposedDates, members);

		// 回答を復元
		dto.responses.forEach((response) => {
			attendanceTable.setAttendance(response.memberName, response.dateIndex, response.attendance);
		});

		return new Schedule(dto.id, dto.title, organizer, attendanceTable);
	}
}
