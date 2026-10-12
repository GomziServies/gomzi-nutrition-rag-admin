import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetExpenses(
	query?: {
		id?: string | null
		createdById?: string | null
		expense_company?: string
		from_date?: Date
		to_date?: Date
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.ExpenseGet, getAPIHeaders('fwg'), query)
}

export function CreateExpense(body: {
	expense_number: string
	date: string
	expenseName: string
	expensePaymentMethod: string
	expenseItemName: string
	expenseAmount: string
	expenseNotes: string
	expense_company?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ExpenseCreate, getAPIHeaders('fwg'), undefined, body)
}

export function UpdateExpense(
	query?: { id?: string | null },
	body?: {
		expenseName?: string
		expensePaymentMethod?: string
		expenseItemName?: string
		expenseAmount?: string
		expenseNotes?: string
	}
) {
	return APIPost(FWGEndpoints.ExpenseUpdate, getAPIHeaders('fwg'), query, body)
}

export function GetExpenseStats(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.ExpenseStats, getAPIHeaders('fwg'))
}

export function GetNextExpenseNumber(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.NextExpenseNumber, getAPIHeaders('fwg'))
}
