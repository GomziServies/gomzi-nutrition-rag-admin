export type ResolvedPaginationMeta = {
	totalPages: number
	totalRecords: number
}

const PAGE_KEYS = [
	'totalPages',
	'total_pages',
	'totalPage',
	'pageCount',
	'totalPageCount',
	'pages',
	'pageCounts',
]

const RECORD_KEYS = [
	'totalRecords',
	'total_records',
	'totalItems',
	'total_items',
	'totalDocs',
	'totalDocuments',
	'totalEmployees',
	'totalTasks',
	'totalReports',
	'totalCount',
	'totalEntries',
	'total',
	'count',
]

const toPositiveInt = (value: any): number => {
	const parsed = Number(value)
	if (!isFinite(parsed)) return 0
	return Math.max(0, Math.floor(parsed))
}

const pickNumeric = (source: Record<string, any>, keys: string[]): number => {
	for (const key of keys) {
		const value = toPositiveInt(source?.[key])
		if (value > 0) return value
	}
	return 0
}

const collectMeta = (metaData: any): Record<string, any>[] => {
	const sources: Record<string, any>[] = []

	if (metaData && typeof metaData === 'object') {
		sources.push(metaData)

		const nested = (metaData as any).pagination || (metaData as any).meta
		if (nested && typeof nested === 'object') {
			sources.push(nested)

			const deepPages = (nested as any).pages || (nested as any).page
			if (deepPages && typeof deepPages === 'object') {
				sources.push(deepPages)
			}
		}
	}

	return sources
}

/**
 * Normalises the many metadata shapes returned by the FGGroup APIs
 * (`metadata`, `metadata.pagination`, `totalPages`, `totalDocs`, ...) into a
 * single `{ totalPages, totalRecords }` pair so list pages always render a
 * correct pagination bar instead of falling back to the current page slice.
 */
export function resolvePaginationMeta(
	metaData: any,
	fallbackRecords = 0,
	itemsPerPage = 10
): ResolvedPaginationMeta {
	const safePerPage = Math.max(1, toPositiveInt(itemsPerPage) || 10)
	const sources = collectMeta(metaData)

	let totalPages = 0
	let totalRecords = 0

	for (const source of sources) {
		if (!totalPages) totalPages = pickNumeric(source, PAGE_KEYS)
		if (!totalRecords) totalRecords = pickNumeric(source, RECORD_KEYS)
		if (totalPages && totalRecords) break
	}

	if (!totalRecords) {
		totalRecords = Math.max(0, toPositiveInt(fallbackRecords))
	}

	if (!totalPages && totalRecords) {
		totalPages = Math.ceil(totalRecords / safePerPage)
	}

	if (!totalPages && !totalRecords) {
		return { totalPages: 0, totalRecords: 0 }
	}

	totalPages = Math.max(1, totalPages)

	if (totalPages === 1 && totalRecords && totalRecords < safePerPage) {
		totalPages = 1
	}

	return { totalPages, totalRecords }
}

/** Keeps a page number inside the 1..totalPages range. */
export function clampPage(page: number, totalPages: number): number {
	const safePage = Math.max(1, toPositiveInt(page) || 1)
	if (totalPages <= 0) return safePage
	return Math.min(safePage, totalPages)
}

/** Reads a persisted pagination object and guarantees sane values. */
export function sanitizePaginationState(
	saved: any,
	fallback: { page: number; itemsPerPage: number } = { page: 1, itemsPerPage: 10 }
): { page: number; itemsPerPage: number } {
	const source = saved && typeof saved === 'object' ? saved : {}

	const page = Math.max(1, toPositiveInt(source.page) || fallback.page || 1)
	const itemsPerPage = Math.max(1, toPositiveInt(source.itemsPerPage) || fallback.itemsPerPage || 10)

	return { page, itemsPerPage }
}