type QuantityUnitValue =
	| 'GRAM'
	| 'KILOGRAM'
	| 'NOS'
	| 'MILLIGRAM'
	| 'LITRE'
	| 'MILLILITER'
	| 'TABLESPOONS'
	| 'BOWL'

type FoodTypeValue = 'VEGETARIAN' | 'NON-VEGETARIAN' | 'VEGAN'

type WeekdaysValue =
	| 'MONDAY'
	| 'TUESDAY'
	| 'WEDNESDAY'
	| 'THURSDAY'
	| 'FRIDAY'
	| 'SATURDAY'
	| 'SUNDAY'

type GoalTypeValue = 'FAT LOSS' | 'MUSCLE GAIN'

// Promise Return for API
type FWG_APIResponse = {
	status: number
	response: string
	message?: string
	data?: object | object[] | any
	error?: string
	custom_code?: string
	metadata?: object
}

type FWGUserStatus = 'ACTIVE' | 'DELETED' | 'DEACTIVATED'

type FWGSearchOptions = {
	search?: string
}

type FWGPaginationOptions = {
	page?: number
	limit?: number
	skip?: number
}

type FWGSortOptions = {
	sort?: string
	sortOrder?: QuerySortOptions
}
