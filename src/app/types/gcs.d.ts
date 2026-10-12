type WeekdaysValue =
	| 'MONDAY'
	| 'TUESDAY'
	| 'WEDNESDAY'
	| 'THURSDAY'
	| 'FRIDAY'
	| 'SATURDAY'
	| 'SUNDAY'

// Promise Return for API
type GCS_APIResponse = {
	status: number
	response: string
	message?: string
	data?: object | object[]
	error?: string
	customCode?: string
	metadata?: object
}

type GCSUserStatus = 'ACTIVE' | 'DELETED' | 'DEACTIVATED'

type GCSSearchOptions = {
	search?: string
}

type GCSPaginationOptions = {
	page?: number
	limit?: number
	skip?: number
}

type GCSSortOptions = {
	sort?: string
	sortOrder?: QuerySortOptions
}
