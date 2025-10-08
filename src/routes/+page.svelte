<script lang="ts">
	import { onMount } from 'svelte';
	import { Schedule } from '$lib/domain/models/Schedule';
	import { Organizer, ProposedDate } from '$lib/domain/models/valueObjects';
	import { LocalStorageScheduleRepository } from '$lib/infrastructure/repositories/LocalStorageScheduleRepository';
	import { ScheduleDecisionService } from '$lib/domain/services/ScheduleDecisionService';
	import type { Attendance } from '$lib/domain/models/valueObjects';
	import MultiDatePicker from '$lib/components/MultiDatePicker.svelte';

	let scheduleTitle = '';
	let organizerName = '';
	let proposedDates: string[] = [];
	let savedSchedules: Schedule[] = [];
	let selectedSchedule: Schedule | null = null;
	let memberName = '';
	let attendanceResponses: Attendance[] = [];

	const repository = new LocalStorageScheduleRepository();
	const decisionService = new ScheduleDecisionService();

	async function createSchedule() {
		if (!scheduleTitle.trim() || !organizerName.trim()) {
			alert('タイトルと主催者名を入力してください');
			return;
		}

		if (proposedDates.length === 0) {
			alert('少なくとも1つの候補日を選択してください');
			return;
		}

		const organizer = new Organizer(organizerName.trim());
		const dates = proposedDates.map((d) => ProposedDate.fromString(d));
		const schedule = Schedule.create(scheduleTitle.trim(), organizer, dates);

		await repository.save(schedule);
		await loadSchedules();

		// フォームをリセット
		scheduleTitle = '';
		organizerName = '';
		proposedDates = [];

		alert('スケジュールを作成しました！');
	}

	async function loadSchedules() {
		savedSchedules = await repository.findAll();
	}

	async function deleteSchedule(id: string) {
		if (confirm('このスケジュールを削除しますか？')) {
			await repository.delete(id);
			await loadSchedules();
		}
	}

	function openResponseForm(schedule: Schedule) {
		selectedSchedule = schedule;
		memberName = '';
		attendanceResponses = schedule.proposedDates.map(() => 'unavailable');
	}

	function closeResponseForm() {
		selectedSchedule = null;
		memberName = '';
		attendanceResponses = [];
	}

	async function submitResponse() {
		if (!selectedSchedule) return;

		if (!memberName.trim()) {
			alert('氏名を入力してください');
			return;
		}

		// 出欠を登録
		attendanceResponses.forEach((attendance, index) => {
			selectedSchedule!.attendanceTable.setAttendance(memberName.trim(), index, attendance);
		});

		await repository.save(selectedSchedule);
		await loadSchedules();

		alert('回答を送信しました！');
		closeResponseForm();
	}

	function getDateAggregation(schedule: Schedule, dateIndex: number) {
		const members = schedule.attendanceTable.members;
		if (members.length === 0) return { available: 0, unavailable: 0, allAvailable: false, allUnavailable: false };

		const availableCount = members.filter(m =>
			schedule.attendanceTable.getAttendance(m.name, dateIndex) === 'available'
		).length;
		const unavailableCount = members.length - availableCount;

		return {
			available: availableCount,
			unavailable: unavailableCount,
			allAvailable: availableCount === members.length,
			allUnavailable: unavailableCount === members.length
		};
	}

	onMount(() => {
		loadSchedules();
	});
</script>

<div class="container">
	<h1>日程調整アプリ - 主催者画面</h1>

	<div class="create-section">
		<h2>新しいスケジュールを作成</h2>

		<div class="form-group">
			<label for="title">スケジュールタイトル</label>
			<input
				id="title"
				type="text"
				bind:value={scheduleTitle}
				placeholder="例: チーム飲み会"
			/>
		</div>

		<div class="form-group">
			<label for="organizer">主催者名</label>
			<input
				id="organizer"
				type="text"
				bind:value={organizerName}
				placeholder="あなたの名前"
			/>
		</div>

		<div class="form-group">
			<label>候補日</label>
			<MultiDatePicker bind:selectedDates={proposedDates} />
		</div>

		<button class="btn-create" on:click={createSchedule}>スケジュールを作成</button>
	</div>

	<div class="schedules-section">
		<h2>作成済みスケジュール</h2>
		{#if savedSchedules.length === 0}
			<p class="empty-message">まだスケジュールがありません</p>
		{:else}
			<div class="schedules-list">
				{#each savedSchedules as schedule}
					<div class="schedule-card">
						<div class="schedule-header" on:click={() => openResponseForm(schedule)}>
							<h3>{schedule.title}</h3>
							<p class="organizer">主催者: {schedule.organizer.name}</p>
							<div class="dates">
								<strong>候補日:</strong>
								<ul>
									{#each schedule.proposedDates as date}
										<li>{date.toStringWithDay()}</li>
									{/each}
								</ul>
							</div>
							<div class="members">
								<strong>回答者数:</strong> {schedule.attendanceTable.members.length}名
							</div>
						</div>

						{#if schedule.attendanceTable.members.length > 0}
							{@const result = decisionService.decide(schedule.attendanceTable)}
							<div class="aggregation-result">
								<h4>集計結果</h4>

								<div class="decision-status">
									{#if result.status === 'decided'}
										<div class="status-decided">
											✓ 日程確定: <strong>{result.mostSuitableDate.toStringWithDay()}</strong>
										</div>
									{:else if result.status === 'rescheduleRequired'}
										<div class="status-reschedule">
											× 再調整が必要: {result.reason}
										</div>
									{:else}
										<div class="status-pending">
											⏳ 回答待ち: {result.reason}
										</div>
									{/if}
								</div>

								<div class="table-container">
									<table class="attendance-table">
										<thead>
											<tr>
												<th>参加者</th>
												{#each schedule.proposedDates as date, i}
													{@const agg = getDateAggregation(schedule, i)}
													<th class:decided-date={result.status === 'decided' && result.mostSuitableDate.equals(date)}>
														{date.toStringWithDay()}
														<div class="date-summary">
															{#if agg.allAvailable}
																◎
															{:else if agg.allUnavailable}
																×
															{:else}
																△
															{/if}
														</div>
													</th>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#each schedule.attendanceTable.members as member}
												<tr>
													<td class="member-name">{member.name}</td>
													{#each schedule.proposedDates as date, i}
														{@const attendance = schedule.attendanceTable.getAttendance(member.name, i)}
														<td class="attendance-cell" class:available={attendance === 'available'} class:unavailable={attendance === 'unavailable'}>
															{#if attendance === 'available'}
																○
															{:else if attendance === 'unavailable'}
																×
															{:else}
																-
															{/if}
														</td>
													{/each}
												</tr>
											{/each}
											<tr class="summary-row">
												<td>出席可能</td>
												{#each schedule.proposedDates as date, i}
													{@const agg = getDateAggregation(schedule, i)}
													<td class:decided-date={result.status === 'decided' && result.mostSuitableDate.equals(date)}>
														{agg.available}名
													</td>
												{/each}
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						{/if}

						<button class="btn-delete" on:click|stopPropagation={() => deleteSchedule(schedule.id)}>削除</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if selectedSchedule}
	<div class="modal-overlay" on:click={closeResponseForm}>
		<div class="modal-content" on:click|stopPropagation>
			<h2>出欠回答</h2>
			<h3>{selectedSchedule.title}</h3>
			<p class="modal-organizer">主催者: {selectedSchedule.organizer.name}</p>

			<div class="response-form">
				<div class="form-group">
					<label for="member-name">あなたの氏名</label>
					<input
						id="member-name"
						type="text"
						bind:value={memberName}
						placeholder="山田太郎"
					/>
				</div>

				<div class="attendance-section">
					<label>候補日への出欠</label>
					{#each selectedSchedule.proposedDates as date, i}
						<div class="attendance-item">
							<span class="date-label">{date.toStringWithDay()}</span>
							<div class="radio-group">
								<label>
									<input
										type="radio"
										bind:group={attendanceResponses[i]}
										value="available"
									/>
									出席可能 ○
								</label>
								<label>
									<input
										type="radio"
										bind:group={attendanceResponses[i]}
										value="unavailable"
									/>
									出席不可 ×
								</label>
							</div>
						</div>
					{/each}
				</div>

				<div class="modal-buttons">
					<button class="btn-submit" on:click={submitResponse}>回答を送信</button>
					<button class="btn-cancel" on:click={closeResponseForm}>キャンセル</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		color: #ff3e00;
		text-align: center;
		margin-bottom: 2rem;
	}

	h2 {
		color: #333;
		margin-bottom: 1rem;
		border-bottom: 2px solid #ff3e00;
		padding-bottom: 0.5rem;
	}

	.create-section {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group input[type='text'] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.date-input-group {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.date-input-group input[type='date'] {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.btn-add {
		background: #4caf50;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.btn-add:hover {
		background: #45a049;
	}

	.btn-remove {
		background: #f44336;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.btn-remove:hover {
		background: #da190b;
	}

	.btn-create {
		background: #ff3e00;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		width: 100%;
	}

	.btn-create:hover {
		background: #e63900;
	}

	.schedules-section {
		margin-top: 2rem;
	}

	.empty-message {
		text-align: center;
		color: #999;
		padding: 2rem;
	}

	.schedules-list {
		display: grid;
		gap: 1rem;
	}

	.schedule-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.schedule-header {
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.schedule-header:hover {
		opacity: 0.8;
	}

	.schedule-card h3 {
		margin-top: 0;
		color: #333;
	}

	.organizer {
		color: #666;
		margin: 0.5rem 0;
	}

	.dates ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.members {
		margin-top: 1rem;
		color: #666;
	}

	.btn-delete {
		background: #f44336;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		margin-top: 1rem;
	}

	.btn-delete:hover {
		background: #da190b;
	}

	/* モーダルスタイル */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-content h2 {
		margin-top: 0;
		color: #ff3e00;
	}

	.modal-content h3 {
		margin: 0.5rem 0;
		color: #333;
	}

	.modal-organizer {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.response-form {
		margin-top: 1rem;
	}

	.attendance-section {
		margin: 1.5rem 0;
	}

	.attendance-section > label {
		display: block;
		margin-bottom: 1rem;
		font-weight: 600;
		color: #333;
	}

	.attendance-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.date-label {
		font-weight: 500;
		color: #333;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
	}

	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
	}

	.radio-group input[type='radio'] {
		cursor: pointer;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.btn-submit {
		flex: 1;
		background: #ff3e00;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-submit:hover {
		background: #e63900;
	}

	.btn-cancel {
		flex: 1;
		background: #666;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-cancel:hover {
		background: #555;
	}

	/* 集計ボタン */
	.btn-aggregate {
		background: #2196f3;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		margin-top: 1rem;
		width: 100%;
	}

	.btn-aggregate:hover {
		background: #1976d2;
	}

	/* 集計結果 */
	.aggregation-result {
		margin-top: 1rem;
		padding: 1rem;
		background: #f0f8ff;
		border-radius: 4px;
		border: 1px solid #2196f3;
	}

	.aggregation-result h4 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #2196f3;
	}

	.decision-status {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.status-decided {
		background: #e8f5e9;
		color: #2e7d32;
		border: 1px solid #4caf50;
	}

	.status-reschedule {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #f44336;
	}

	.status-pending {
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ff9800;
	}

	/* テーブル表示 */
	.table-container {
		overflow-x: auto;
		margin-top: 1rem;
	}

	.attendance-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
	}

	.attendance-table th,
	.attendance-table td {
		padding: 0.75rem;
		text-align: center;
		border: 1px solid #ddd;
	}

	.attendance-table th {
		background: #f5f5f5;
		font-weight: 600;
		color: #333;
	}

	.attendance-table th.decided-date {
		background: #c8e6c9;
		color: #2e7d32;
	}

	.attendance-table .member-name {
		text-align: left;
		font-weight: 500;
	}

	.attendance-table .attendance-cell {
		font-size: 1.2rem;
	}

	.attendance-table .attendance-cell.available {
		color: #4caf50;
		font-weight: 600;
	}

	.attendance-table .attendance-cell.unavailable {
		color: #f44336;
		font-weight: 600;
	}

	.attendance-table .summary-row {
		background: #f9f9f9;
		font-weight: 600;
	}

	.attendance-table .summary-row td {
		background: #f5f5f5;
	}

	.attendance-table .summary-row td.decided-date {
		background: #c8e6c9;
		color: #2e7d32;
	}

	.attendance-table .date-summary {
		font-size: 1.2rem;
		margin-top: 0.25rem;
		color: #666;
	}
</style>