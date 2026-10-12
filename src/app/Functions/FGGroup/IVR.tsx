import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as CDEndpoints from '../../constants/fg_group_endpoints'

const headers = () => getAPIHeaders('fg_group')

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardSummary = (params?: { start_date?: string; end_date?: string }) =>
	APIPost(CDEndpoints.IVRDashboardSummary, headers(), undefined, params || {})

// ─── Call Logs ────────────────────────────────────────────────────────────────
export const getCallLogs = (params?: {
	page?: number
	limit?: number
	status?: string
	search?: string
}) => APIGet(CDEndpoints.IVRGetCallLogs, headers(), params)

// Direct CallerDesk call_list_v2 — returns all live records with full field set
export const listCallReports = (data?: {
	current_page?: number
	per_page?: number
	start_date?: string
	end_date?: string
	deskphone?: string
	member_num?: string
	callresult?: string
	caller_num?: string
	callstatus?: string
	Flow_type?: string
}) => APIPost(CDEndpoints.IVRListReports, headers(), undefined, data || {})

export const initiateCall = (data: { party_a?: string; party_b: string; deskphone?: string }) =>
	APIPost(CDEndpoints.IVRInitiateCall, headers(), undefined, data)

export const syncReports = (data?: { start_date?: string; end_date?: string }) =>
	APIPost(CDEndpoints.IVRSyncReports, headers(), undefined, data || {})

// ─── IVR Numbers (Deskphones) ─────────────────────────────────────────────────
export const getIVRNumbers = () => APIGet(CDEndpoints.IVRGetNumbers, headers())

// ─── Member Management ────────────────────────────────────────────────────────
export const getMemberList = (page?: number, limit?: number) =>
	APIGet(CDEndpoints.IVRGetMemberList, headers(), { page, per_page: limit })

export const addMember = (data: object) =>
	APIPost(CDEndpoints.IVRAddMember, headers(), undefined, data)

export const updateMember = (data: object) =>
	APIPost(CDEndpoints.IVRUpdateMember, headers(), undefined, data)

export const deleteMember = (member_id: string) =>
	APIPost(CDEndpoints.IVRDeleteMember, headers(), undefined, { member_id })

// ─── Member Analysis ──────────────────────────────────────────────────────────
export const getMemberAnalysisReport = (data?: { date?: string }) =>
	APIPost(CDEndpoints.IVRGetAnalysisReport, headers(), undefined, data || {})

export const getMemberBreakStatus = () => APIGet(CDEndpoints.IVRGetBreakStatus, headers())

export const updateMemberWorkingStatus = (data: {
	member_name: string
	member_num: string
	working_status: string
}) => APIPost(CDEndpoints.IVRUpdateWorkStatus, headers(), undefined, data)
