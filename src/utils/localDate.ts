export function getLocalDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
	if (!match) return null;

	const date = new Date(
		Number(match[1]),
		Number(match[2]) - 1,
		Number(match[3]),
		12,
	);
	return getLocalDateKey(date) === dateKey ? date : null;
}

export function addLocalDays(date: Date, amount: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + amount);
	return result;
}

export function differenceInLocalDays(from: Date, to: Date): number {
	const fromUtc = Date.UTC(
		from.getFullYear(),
		from.getMonth(),
		from.getDate(),
	);
	const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
	return Math.round((toUtc - fromUtc) / 86_400_000);
}
