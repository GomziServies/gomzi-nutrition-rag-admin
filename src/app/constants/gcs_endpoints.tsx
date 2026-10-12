import { GCS_BASE_URL } from './base_URL'

// 🌟----------------- GCS -----------------🌟
export const GCSBasedURL = GCS_BASE_URL
const AdminV1Route = GCSBasedURL + '/admin/v1'

// Account
export const CreateAdminAccount = `${AdminV1Route}/create`
export const GetProfile = `${AdminV1Route}/get-profile`
export const UpdateProfile = `${AdminV1Route}/update-profile`
export const ChangePassword = `${AdminV1Route}/change-password`

//Expense
export const ExpenseGet = `${AdminV1Route}/expense/get`
export const ExpenseCreate = `${AdminV1Route}/expense/create`
export const ExpenseUpdate = `${AdminV1Route}/expense/update`
export const ExpenseStats = `${AdminV1Route}/expense/stats`

// Invoice
export const InvoiceGet = `${AdminV1Route}/invoice/get`
export const InvoiceCreate = `${AdminV1Route}/invoice/create`
export const InvoiceUpdate = `${AdminV1Route}/invoice/update`
export const InvoiceStats = `${AdminV1Route}/invoice/stats`

//Insight
export const InsightsRoute = `${AdminV1Route}/insights/gcs`

export const InvocieInsight = `${InsightsRoute}/invoice`
export const ExpenseInsight = `${InsightsRoute}/expense`

// User
const AdminUserRoute = `${AdminV1Route}/user`

export const RemoveUser = `${AdminUserRoute}/remove`
export const GetUser = `${AdminUserRoute}/get`
export const ChangeUserPassword = `${AdminUserRoute}/change-password`

// Lead
export const LeadRoute = `${AdminV1Route}/lead`

export const AddLead = `${LeadRoute}/create`
export const UpdateLead = `${LeadRoute}/update`
export const RemoveLead = `${LeadRoute}/delete`
export const GetLead = `${LeadRoute}/get`

// Contact Inquiry
export const ContactRoute = `${AdminV1Route}/contact-inquiry`

export const GetContactInquiry = `${ContactRoute}/get`
export const UpdateInquiryReadReceipt = `${ContactRoute}/read-receipt`
