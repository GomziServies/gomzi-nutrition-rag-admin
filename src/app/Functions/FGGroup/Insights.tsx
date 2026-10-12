import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type FacebookGraphAPIInsightsQueryParams = {
	fields?: string
	breakdowns?: string
	action_attribution_windows?: string
	action_breakdowns?: string
	action_report_time?: string
	date_preset?: string
	default_summary?: string
	export_columns?: string
	filtering?: string
	level?: string
	time_range?: string
	product_id_limit?: string
	sort?: string
	summary?: string
	summary_action_breakdowns?: string
	time_increment?: string
	use_account_attribution_setting?: string
	use_unified_attribution_setting?: string
	limit?: string
	after?: string
}

// Insights > Facebook
export function getFacebookOAuthURL(query: { redirect_uri: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.FacebookAuth, getAPIHeaders('fg_group'), query)
}

export function FacebookOAuthCallback(body: {
	code: string
	state: string
	redirect_uri: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.FacebookAuthCallback, getAPIHeaders('fg_group'), undefined, body)
}

// Insights > Facebook > Facebook Page
export function getFacebookPageList(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFacebookPages, getAPIHeaders('fg_group'))
}

/**
 * @see https://developers.facebook.com/docs/graph-api/reference/insights for metric options
 */
export function getFacebookPageInsights(
	page_id: string | number,
	query: {
		metric: string
		period?: string
		since?: string // Date format: YYYY-MM-DD or Unix timestamp (in seconds)
		until?: string // Date format: YYYY-MM-DD or Unix timestamp (in seconds)
		breakdown?: string
		date_preset?: string
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFacebookPageInsights.replace(':page_id', page_id.toString())
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

// Insights > Facebook > Instagram
export function getInstagramAccounts(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetInstagramAccounts, getAPIHeaders('fg_group'))
}

/**
 * @see https://developers.facebook.com/docs/instagram-api/reference/ig-user/insights for metric options
 */
export function getInstagramInsights(
	account_id: string | number,
	query: {
		metric: string
		period: string
		since?: string // Date format: YYYY-MM-DD or Unix timestamp (in seconds)
		until?: string // Date format: YYYY-MM-DD or Unix timestamp (in seconds)
		metric_type?: string
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetInstagramAccountInsights.replace(
		':account_id',
		account_id.toString()
	)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

/**
 * @see https://developers.facebook.com/docs/instagram-api/reference/ig-media#fields for fields options
 */
export function getInstagramMedia(
	account_id: string | number,
	query: {
		fields: string
		limit?: number
		after?: string // Pagination cursor, returned in the metadata.cursor field of the response
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetIGMedia.replace(':account_id', account_id.toString())
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

/**
 * @see https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights#metrics for metric options
 */
export function getInstagramMediaInsights(
	media_id: string | number,
	query: {
		metric: string
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetIGMediaInsights.replace(':media_id', media_id.toString())
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetUserOwnedAdAccounts(query?: { fields?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFBUserAdAccounts, getAPIHeaders('fg_group'), query)
}

export function GetFBBusiness(query: { fields?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFBBusinesses, getAPIHeaders('fg_group'), query)
}

export function GetBusinessOwnAdAccounts(
	query: { fields?: string },
	business_id: string | number
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBBusinessOwnedAdAccounts.replace(
		':business_id',
		business_id.toString()
	)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetBusinessAdAccountInsights(
	account_id: string | number,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBBusinessAdAccountInsights.replace(
		':account_id',
		account_id.toString()
	)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdCampaign(
	account_id: string,
	query?: {
		fields?: string
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdCampaigns.replace(':account_id', account_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdCampaignInsights(
	campaign_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdCampaignsInsights.replace(':campaign_id', campaign_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdSet(
	campaign_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdCampaignAdSets.replace(':campaign_id', campaign_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdSetInsights(
	ad_set_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdSetInsights.replace(':ad_set_id', ad_set_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAds(
	ad_set_id: string,
	query?: {
		fields?: string
	}
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdSetAds.replace(':ad_set_id', ad_set_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdInsights(
	ad_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetFBAdInsights.replace(':ad_id', ad_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetAdLeads(
	ad_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetAdLeads.replace(':ad_id', ad_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

export function GetLeadGenForms(
	lead_id: string,
	query?: FacebookGraphAPIInsightsQueryParams
): Promise<FGGroupAPIResponse> {
	const endpoint = FGGroupEndpoints.GetLeadInfo.replace(':lead_id', lead_id)
	return APIGet(endpoint, getAPIHeaders('fg_group'), query)
}

/**
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport?request-body
 * @param {object} body
 * @returns {Promise<FGGroupAPIResponse>}
 */
export function GoogleAnalyticsRunReport(body: object): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GARunReport, getAPIHeaders('fg_group'), undefined, body)
}

// --- FG Group ---
export function GetOrdersInsights(query?: {
	item_type?: string | string[]
	currency: string | string[]
	purchase_mode?: string | string[]
	gateway?: string | string[]
	from_date?: Date
	to_date?: Date
	order_status?: string | string[]
	receipt_id?: string | string[]
	user_id?: string | string[]
	order_id?: string | string[]
	key?: string | string[] // format: item_type#order_status#currency#purchase_mode#(gateway) Check API response for detailed information
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetOrdersInsights, getAPIHeaders('fg_group'), query)
}

export function GetInvoiceInsights(query?: {
	from_date?: Date
	to_date?: Date
	createdAt_from?: Date
	createdAt_to?: Date
	email?: string | string[]
	mobile?: string | string[]
	state?: string | string[]
	city?: string | string[]
	pin_code?: string | string[]
	item_name?: string | string[]
	bank_account_type?: string | string[]
	bank_branch_code?: string | string[]
	payment_method?: string | string[]
	invoice_category?: string | string[]
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetInvoiceInsights, getAPIHeaders('fg_group'), query)
}

export function GetExpenseInsights(query?: {
	from_date?: Date
	to_date?: Date
	createdAt_from?: Date
	createdAt_to?: Date
	item_name?: string | string[]
	payment_method?: string | string[]
	expense_category?: string | string[]
	expense_company?: string | string[]
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetExpenseStats, getAPIHeaders('fg_group'), query)
}

export function GetUserStats(query?: { reset_cache?: boolean }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUsersStats, getAPIHeaders('fg_group'), query)
}

export function GetStudentsStats(query?: { reset_cache?: boolean }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetStudentsStats, getAPIHeaders('fg_group'), query)
}

export function GetGoogleSearchConsoleSites(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GSCSitesList, getAPIHeaders('fg_group'))
}

/**
 * @see https://developers.google.com/webmaster-tools/v1/searchanalytics/query for request body options
 */
export function RunGoogleSearchConsoleQuery(body: {
	siteUrl: string
	requestBody: object
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GSCRunAnalytics, getAPIHeaders('fg_group'), undefined, body)
}

export function GSCInspectURL(body: {
	siteUrl: string
	inspectionUrl: string
	languageCode?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GSCInspectURL, getAPIHeaders('fg_group'), undefined, body)
}

export function GSCGetSitemapList(body?: {
	siteUrl: string
	sitemapIndex?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GSCGetSitemapList, getAPIHeaders('fg_group'), undefined, body)
}

export function GSCGetSitemapDetails(body: {
	siteUrl: string
	feedpath: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GSCGetSitemap, getAPIHeaders('fg_group'), undefined, body)
}
