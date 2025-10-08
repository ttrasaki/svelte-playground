<script lang="ts">
	export let selectedDates: string[] = [];

	let currentYear = new Date().getFullYear();
	let currentMonth = new Date().getMonth();

	const DAYS = ['日', '月', '火', '水', '木', '金', '土'];
	const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(year: number, month: number): number {
		return new Date(year, month, 1).getDay();
	}

	function getCalendarDays(): (number | null)[] {
		const daysInMonth = getDaysInMonth(currentYear, currentMonth);
		const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
		const days: (number | null)[] = [];

		// 前月の空白
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// 当月の日付
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(i);
		}

		return days;
	}

	function formatDate(year: number, month: number, day: number): string {
		const m = String(month + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${year}-${m}-${d}`;
	}

	function isSelected(day: number | null): boolean {
		if (day === null) return false;
		const dateStr = formatDate(currentYear, currentMonth, day);
		return selectedDates.includes(dateStr);
	}

	function toggleDate(day: number | null) {
		if (day === null) return;
		const dateStr = formatDate(currentYear, currentMonth, day);

		if (selectedDates.includes(dateStr)) {
			selectedDates = selectedDates.filter(d => d !== dateStr);
		} else {
			selectedDates = [...selectedDates, dateStr].sort();
		}
	}

	function previousMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}

	function goToToday() {
		currentYear = new Date().getFullYear();
		currentMonth = new Date().getMonth();
	}

	$: calendarDays = getCalendarDays();
</script>

<div class="calendar-container">
	<div class="calendar-header">
		<button type="button" class="nav-btn" on:click={previousMonth}>◀</button>
		<div class="month-year">
			{currentYear}年 {MONTHS[currentMonth]}
		</div>
		<button type="button" class="nav-btn" on:click={nextMonth}>▶</button>
	</div>

	<button type="button" class="today-btn" on:click={goToToday}>今月に戻る</button>

	<div class="calendar-grid">
		{#each DAYS as day}
			<div class="day-header">{day}</div>
		{/each}
		{#each calendarDays as day}
			{#if day === null}
				<div class="day-cell empty"></div>
			{:else}
				<button
					type="button"
					class="day-cell"
					class:selected={isSelected(day)}
					class:today={currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth() && day === new Date().getDate()}
					on:click={() => toggleDate(day)}
				>
					{day}
				</button>
			{/if}
		{/each}
	</div>

	{#if selectedDates.length > 0}
		<div class="selected-dates">
			<strong>選択中の日付:</strong>
			<div class="date-chips">
				{#each selectedDates as date}
					<span class="date-chip">
						{date}
						<button type="button" class="remove-chip" on:click={() => toggleDate(parseInt(date.split('-')[2]))}>×</button>
					</span>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.calendar-container {
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.75rem;
		max-width: 400px;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.month-year {
		font-weight: 600;
		font-size: 0.95rem;
		color: #333;
	}

	.nav-btn {
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 3px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.nav-btn:hover {
		background: #e0e0e0;
	}

	.today-btn {
		width: 100%;
		background: #2196f3;
		color: white;
		border: none;
		border-radius: 3px;
		padding: 0.35rem;
		cursor: pointer;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.today-btn:hover {
		background: #1976d2;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.day-header {
		text-align: center;
		font-weight: 600;
		padding: 0.25rem 0;
		color: #666;
		font-size: 0.75rem;
	}

	.day-cell {
		aspect-ratio: 1;
		border: 1px solid #ddd;
		background: white;
		border-radius: 3px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		font-size: 0.8rem;
		min-height: 28px;
	}

	.day-cell:hover:not(.empty) {
		background: #f0f0f0;
	}

	.day-cell.empty {
		border: none;
		cursor: default;
	}

	.day-cell.selected {
		background: #ff3e00;
		color: white;
		font-weight: 600;
	}

	.day-cell.today {
		border: 2px solid #2196f3;
		font-weight: 600;
	}

	.selected-dates {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #ddd;
	}

	.selected-dates strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #333;
		font-size: 0.85rem;
	}

	.date-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.date-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: #e3f2fd;
		color: #1976d2;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.8rem;
	}

	.remove-chip {
		background: none;
		border: none;
		color: #1976d2;
		cursor: pointer;
		font-size: 1rem;
		padding: 0;
		line-height: 1;
	}

	.remove-chip:hover {
		color: #0d47a1;
	}
</style>
