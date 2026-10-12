import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

export function GetExpenses(
	query?: {
		id?: string | null
		from_date?: Date
		to_date?: Date
	} & GCSSearchOptions &
		GCSPaginationOptions &
		GCSSortOptions
): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.ExpenseGet, getAPIHeaders('gcs'), query)
}

export function CreateExpense(body: {
	expense_number: string
	date: string
	expenseName: string
	expensePaymentMethod: string
	expenseItemName: string
	expenseAmount: string
	expenseNotes: string
}): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.ExpenseCreate, getAPIHeaders('gcs'), undefined, body)
}

export function UpdateExpense(body: {
	id: string
	expenseName?: string
	expensePaymentMethod?: string
	expenseItemName?: string
	expenseAmount?: string
	expenseNotes?: string
}) {
	return APIPost(GCSEndpoints.ExpenseUpdate, getAPIHeaders('gcs'), undefined, body)
}

export function GetExpenseStats(): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.ExpenseStats, getAPIHeaders('gcs'))
}

export function GetExpenseInsight(query?: {
	from_date?: Date
	to_date?: Date
}): Promise<FWG_APIResponse> {
	return APIGet(GCSEndpoints.ExpenseInsight, getAPIHeaders('gcs'), query)
}
