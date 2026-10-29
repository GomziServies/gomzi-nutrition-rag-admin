import { FG_GROUP_BASE_URL } from './base_URL'

// 🌟----------------- FG Group -----------------🌟
export const BASE_URL = FG_GROUP_BASE_URL
const AdminV1Route = `${BASE_URL}/admin/v1`
const PublicV1Route = `${BASE_URL}/public/v1`

// Account
export const Login = `${AdminV1Route}/login`
export const LoginWithEmailOTP = `${AdminV1Route}/login-with-otp`
export const VerifyEmailOTP = `${AdminV1Route}/login-with-otp/verify`
export const CreateAdminAccount = `${AdminV1Route}/create-admin`
export const GetProfile = `${AdminV1Route}/get-profile`
export const UpdateProfile = `${AdminV1Route}/update-profile`
export const ChangePassword = `${AdminV1Route}/change-password`
export const GetUniversalAccessToken = `${AdminV1Route}/get-universal-token`
export const FileUpload = `${AdminV1Route}/file-upload`

// Product Categories
export const GetCategories = `${AdminV1Route}/categories`
export const ManageCategory = `${AdminV1Route}/categories`
export const GetCompanies = `${AdminV1Route}/companies`
export const ManageCompany = `${AdminV1Route}/companies`
export const GetCompanyAds = `${AdminV1Route}/company-ads`
export const ManageCompanyAd = `${AdminV1Route}/company-ads`

// Science Journal / Blogs
export const GetBlogs = `${AdminV1Route}/blogs`
export const ManageBlog = `${AdminV1Route}/blogs`

// Promotional Deals
export const GetDeals = `${AdminV1Route}/deals`
export const ManageDeal = `${AdminV1Route}/deals`

// Dynamic Combo Stacks
export const GetComboStacks = `${AdminV1Route}/combo-stacks`
export const ManageComboStack = `${AdminV1Route}/combo-stacks`

// Middle Promo Banners
export const GetPromoBanners = `${AdminV1Route}/promo-banners`
export const ManagePromoBanner = `${AdminV1Route}/promo-banners`

// Nutrition Promo Banners
export const GetNutritionPromoBanners = `${AdminV1Route}/nutrition-promo-banners`
export const ManageNutritionPromoBanner = `${AdminV1Route}/nutrition-promo-banners`

// Bank Offers Banner Slider (Purple Festive)
export const GetBankOffers = `${AdminV1Route}/bank-offers`
export const ManageBankOffer = `${AdminV1Route}/bank-offers`

// Ad Banners & Static Banner (Pure Strength, Zero Compromise single banner)
export const GetAdBanners = `${AdminV1Route}/ads-banner`
export const ManageAdBanner = `${AdminV1Route}/ads-banner`
export const GetStaticBanner = `${AdminV1Route}/static-banner`
export const ManageStaticBanner = `${AdminV1Route}/static-banner`

export const GetHeroBanner = `${AdminV1Route}/hero-banner`
export const UpdateHeroBanner = `${AdminV1Route}/hero-banner`
export const TeleLogin = `${BASE_URL}/tele/v1/login`

// Account/Authenticator [MFA]
const AccountAuthenticatorRoute = `${AdminV1Route}/mfa`

export const AddAuthenticatorSecret = `${AccountAuthenticatorRoute}/authenticator/add-secret`
export const RemoveAuthenticatorSecret = `${AccountAuthenticatorRoute}/authenticator/remove-secret`

// Admin User
const AdminUserRoute = `${AdminV1Route}/admin-user`

export const GetAdminUsers = `${AdminUserRoute}/get-admin`
export const UpdateAdminUsers = `${AdminUserRoute}/update-profile`
export const ResetAdminUserPassword = `${AdminUserRoute}/reset-password`
export const RemoveAdminUser = `${AdminUserRoute}/remove-admin`

// Books
const BookRoute = `${AdminV1Route}/book`

export const CreateBook = `${BookRoute}/create`
export const UpdateBook = `${BookRoute}/update`
export const RemoveBook = `${BookRoute}/remove`
export const GetBooks = `${BookRoute}/get`

// Books Feedback
export const GetBooksFeedback = `${AdminV1Route}/feedback/books` // GET
export const updateBooksFeedback = `${AdminV1Route}/feedback/book` // POST

// Business Listing
const BusinessListingRoute = `${BASE_URL}/business-listing`

export const AddListing = `${BusinessListingRoute}/create-listing`
export const UpdateListing = `${BusinessListingRoute}/update-listing`
export const GetAdminBusinessListing = `${BusinessListingRoute}/get-listing-for-admin`
export const GetBusinessListing = `${BusinessListingRoute}/get-listing-admin`
export const RemoveListing = `${BusinessListingRoute}/delete-listing`
export const ListingAction = `${BusinessListingRoute}/listing-action`

// Contact Inquiry

const ContactInquiryRoute = AdminV1Route + '/contact-inquiry'

export const GetContactInquiry = `${ContactInquiryRoute}/get`
export const GetRTPConsultancyInquiry = `${ContactInquiryRoute}/get-rtp-consultancy`
export const UpdateInquiryReadReceipt = `${ContactInquiryRoute}/read-receipt`

// Dashboard
const DashboardRoute = `${AdminV1Route}/dashboard`

export const GeneralDashboardStats = `${DashboardRoute}/get-dashboard`
export const StudentDashboardStats = `${DashboardRoute}/get-student-stats`

// Digital Plan
const DigitalPlanRoute = `${AdminV1Route}/digital-plan`

export const GetDigitalPlans = `${DigitalPlanRoute}/get`
export const UpdateDigitalPlan = `${DigitalPlanRoute}/update`
export const RemoveDigitalPlan = `${DigitalPlanRoute}/remove`

// E-Books
const EBooksRoute = `${AdminV1Route}/ebook`

export const CreateEBook = `${EBooksRoute}/create-ebook`
export const UpdateEBook = `${EBooksRoute}/update-ebook`
export const RemoveEBook = `${EBooksRoute}/remove-ebook`
export const GetEBooks = `${EBooksRoute}/get-ebook`

// Employee Application
const EmployeeApplicationRoute = `${AdminV1Route}/employee-application`

export const GetEmployeeApplications = `${EmployeeApplicationRoute}/get-application`

// Employer Application
const EmployerApplicationRoute = `${AdminV1Route}/employer-application`

export const GetEmployerApplications = `${EmployerApplicationRoute}/get-application`

// Fitness Plan
const FitnessPlanRoute = `${AdminV1Route}/fitness-plan`

export const CreateFitnessPlan = `${FitnessPlanRoute}/create`
export const UpdateFitnessPlan = `${FitnessPlanRoute}/update`
export const RemoveFitnessPlan = `${FitnessPlanRoute}/remove`
export const GetFitnessPlans = `${FitnessPlanRoute}/get`

// Fitness Course
const FitnessCourseRoute = `${AdminV1Route}/fitness-course`

export const CreateFitnessCourse = `${FitnessCourseRoute}/create`
export const UpdateFitnessCourse = `${FitnessCourseRoute}/update`
export const RemoveFitnessCourse = `${FitnessCourseRoute}/remove`
export const GetFitnessCourse = `${FitnessCourseRoute}/get`
export const CreateMaterialOfFitnessCourse = `${FitnessCourseRoute}/add-material`
export const UpdateMaterialOfFitnessCourse = `${FitnessCourseRoute}/update-material`
export const DeleteMaterialOfFitnessCourse = `${FitnessCourseRoute}/remove-material`

// Fitness Course Lectures
const CourseLectureRoute = `${AdminV1Route}/fitness-course-lecture`

export const AddFitnessCourseLecture = `${CourseLectureRoute}/create`
export const UpdateFitnessCourseLecture = `${CourseLectureRoute}/update`
export const RemoveFitnessCourseLecture = `${CourseLectureRoute}/delete`
export const GetFitnessCourseLectures = `${CourseLectureRoute}/get`

// Fitness Course Exam [FCE]
const FitnessCourseExamRoute = `${AdminV1Route}/fitness-course-exam`

export const CreateFitnessCourseExam = `${FitnessCourseExamRoute}/create`
export const UpdateFitnessCourseExam = `${FitnessCourseExamRoute}/update`
export const RemoveFitnessCourseExam = `${FitnessCourseExamRoute}/remove`
export const GetFitnessCourseExam = `${FitnessCourseExamRoute}/get`
export const GetFitnessCourseResultExam = `${FitnessCourseExamRoute}/result/get`
export const UpdateFCEQuestion = `${FitnessCourseExamRoute}/question/update`
export const DeleteFCEQuestion = `${FitnessCourseExamRoute}/question/delete`

// Fitness Course Exam/Allocate
const FCEAllocationRoute = `${FitnessCourseExamRoute}/allocate`

export const FCEAllocate = `${FCEAllocationRoute}/assign`
export const UpdateFCEAllocation = `${FCEAllocationRoute}/update`
export const GetFCEAllocations = `${FCEAllocationRoute}/get`
export const RemoveFCEAllocation = `${FCEAllocationRoute}/remove`

// Fitness Course Exam/Result
const FCEResultRoute = `${FitnessCourseExamRoute}/result`

export const GetFCEResults = `${FCEResultRoute}/get`

// Fitness Course Feedback
export const GetFitnessCourseFeedback = `${AdminV1Route}/feedback/course` // GET
export const UpdateFitnessCourseFeedback = `${AdminV1Route}/feedback/course` // POST

// Free Session

export const GetFreeSessionRegistrations = `${AdminV1Route}/free-session/get-registration`

// Franchise
const FranchiseRoute = `${AdminV1Route}/franchise`

export const GetFranchise = `${FranchiseRoute}/get`
export const CreateFranchise = `${FranchiseRoute}/create`
export const UpdateFranchise = `${FranchiseRoute}/update`
export const RemoveFranchise = `${FranchiseRoute}/delete`

// Job Placement
const JobPlacementRoute = `${AdminV1Route}/job-placement`

export const GetJobPlacement = `${JobPlacementRoute}/get`
export const CreateJobPlacement = `${JobPlacementRoute}/create`
export const UpdateJobPlacement = `${JobPlacementRoute}/update`
export const RemoveJobPlacement = `${JobPlacementRoute}/remove`
export const RemoveJobPostClick = `${JobPlacementRoute}/remove-click`

// Order
const OrderRoute = `${AdminV1Route}/orders`

export const GetOrders = `${OrderRoute}/get`
export const FetchPaymentDetails = `${OrderRoute}/get-payment`
export const UpdateOrder = `${OrderRoute}/update-order`
export const SetBookTrackingStatus = `${BookRoute}/set-tracking-status`

// Project
const ProjectRoute = `${AdminV1Route}/projects`

export const CreateProject = `${ProjectRoute}/create`
export const UpdateProject = `${ProjectRoute}/update`
export const RemoveProject = `${ProjectRoute}/remove`
export const GetProjects = `${ProjectRoute}/get`
export const GetSubmission = `${ProjectRoute}/get-submission`
export const GetProjectSubmission = `${ProjectRoute}/get-projects-submissions`
export const UpdateProjectSubmission = `${ProjectRoute}/update-submission`

// Product
const ProductRoute = `${AdminV1Route}/product`

export const AddProduct = `${ProductRoute}/add`
export const UpdateProduct = `${ProductRoute}/update`
export const DeleteProduct = `${ProductRoute}/remove`
export const GetProduct = `${ProductRoute}/get`
export const SetProductTrackingStatus = `${ProductRoute}/set-tracking-status`
export const AddProductVariation = `${ProductRoute}/variation/add`
export const UpdateProductVariation = `${ProductRoute}/variation/update`
export const RemoveProductVariation = `${ProductRoute}/variation/remove`
export const GetProductStock = `${ProductRoute}/get-stocks`
export const UpdateProductStock = `${ProductRoute}/update-stock`

const InventoryRoute = `${AdminV1Route}/inventory`

export const GetInventoryHistory = `${InventoryRoute}/get`

// Product/Product Review
const ProductReviewRoute = `${ProductRoute}/product-review`

export const GetProductReviews = `${ProductReviewRoute}/get`
export const UpdateProductReview = `${ProductReviewRoute}/update`

// Product/Project Feedback
const ProductFeedbackRoute = `${ProductRoute}/feedback`

export const GetProductFeedback = `${AdminV1Route}/feedback/products`
export const UpdateProductFeedback = `${ProductFeedbackRoute}/update`

// Recipe
export const GetRecipes = `${AdminV1Route}/recipe/get`

// Referral Coupon
const ReferralCouponRoute = `${AdminV1Route}/referral-coupon`

export const CreateReferralCoupon = `${ReferralCouponRoute}/create`
export const UpdateReferralCoupon = `${ReferralCouponRoute}/update`
export const GetReferralCoupons = `${ReferralCouponRoute}/get`
export const GetCouponUsage = `${ReferralCouponRoute}/get-usage`

// ScholarShip
const ScholarShipRoute = `${AdminV1Route}/scholarship-user`

export const GetScholarshipResults = `${ScholarShipRoute}/get-results`
export const GetScholarshipResultByID = `${ScholarShipRoute}/get`
export const UpdateReadResultReceipt = `${ScholarShipRoute}/read-receipt`

// Seminar Registration
const SeminarRegistrationRoute = `${AdminV1Route}/seminar-registration`

export const GetSeminarRegistrations = `${SeminarRegistrationRoute}/get`

// Student Batch
const StudentBatchRoute = `${AdminV1Route}/student-batch`

export const CreateStudentBatch = `${StudentBatchRoute}/create`
export const UpdateStudentBatch = `${StudentBatchRoute}/update`
export const RemoveStudentBatch = `${StudentBatchRoute}/remove-batch`
export const GetStudentBatches = `${StudentBatchRoute}/get`
export const RemoveBatchTimetable = `${StudentBatchRoute}/remove-timetable`
export const RemoveBatchUser = `${StudentBatchRoute}/remove-user`

// Server Cache
const CacheManagerRoute = `${AdminV1Route}/cache-manager`

export const CleanGeneralCache = `${CacheManagerRoute}/general-cache`

// Users
const UserRoutes = `${AdminV1Route}/user`

export const GetUsers = `${UserRoutes}/get`
export const GetStudentUsers = `${UserRoutes}/get-student-user`
export const UpdateUser = `${UserRoutes}/update`
export const LockUnlockUser = `${UserRoutes}/lock`
export const RemoveUser = `${UserRoutes}/remove`
export const CreateUser = `${UserRoutes}/create`
export const SendFCMNotification = `${UserRoutes}/send-fcm-notification`
export const GetUserDietPreference = `${AdminV1Route}/diet-preference/get`

// Users > Fitness Plan
const UserFitnessPlanRoute = `${AdminV1Route}/user-fitness-plan`

export const GetUserFitnessPlan = `${UserFitnessPlanRoute}/get`

// Users > Fitness Course
const UserFitnessCourseRoute = `${AdminV1Route}/user-fitness-course`

export const GetUserFitnessCourse = `${UserFitnessCourseRoute}/get`
export const AssignFitnessCourseToUser = `${UserFitnessCourseRoute}/assign`
export const DeactivateFitnessCourse = `${UserFitnessCourseRoute}/deactivate`
export const ExtendFitnessCourseValidity = `${UserFitnessCourseRoute}/extend-validity`
export const GetFitnessCourseStudentReview = `${UserFitnessCourseRoute}/get-review`
export const FitnessCourseLectureComments = `${UserFitnessCourseRoute}/comment`
export const CreateFitnessCourseCertificate = `${UserFitnessCourseRoute}/create-certificate`
export const UpdateFitnessCourseCertificate = `${UserFitnessCourseRoute}/update-certificate`
export const GenerateFitnessCourseCertificate = `${UserFitnessCourseRoute}/generate-certificate`
export const GenerateFitnessCourseQRCertificate = `${UserFitnessCourseRoute}/generate-qr-certificate`
export const DeleteFitnessCourseCertificate = `${UserFitnessCourseRoute}/delete-certificate`
export const VerifyCertificate = `${PublicV1Route}/verify-certificate`

// Users > Fitness Course Exam
const UserDigitalPlanRoute = `${AdminV1Route}/user-digital-plan`

export const GetUserDigitalPlans = `${UserDigitalPlanRoute}/get`

//Product Cart
export const GetProductCart = `${AdminV1Route}/product-cart/get`

// Invoice
const InvoiceRoute = `${AdminV1Route}/invoice`

export const GetInvoices = `${InvoiceRoute}/get`
export const CreateInvoice = `${InvoiceRoute}/create`
export const UpdateInvoice = `${InvoiceRoute}/update`
export const DeleteInvoice = `${InvoiceRoute}/delete`
export const GetNextInvoiceSequence = `${InvoiceRoute}/get-next-invoice`
export const GetInvoiceStats = `${InvoiceRoute}/stats`
export const GetInvoiceBranches = `${InvoiceRoute}/branches`

// Employee
const EmployeeRoute = `${AdminV1Route}/employee`

export const GetEmployees = `${EmployeeRoute}/get`
export const GetNextEmployeeCode = `${EmployeeRoute}/get-next-employee_code`
export const CreateEmployee = `${EmployeeRoute}/create`
export const UpdateEmployee = `${EmployeeRoute}/update`
export const RemoveEmployee = `${EmployeeRoute}/remove`
export const AddEmployeeMemo = `${EmployeeRoute}/add-memo`
export const DeleteEmployeeMemo = `${EmployeeRoute}/delete-memo`

// Chat
const ChatRoute = `${AdminV1Route}/employee-chat`

export const GetEmployeeChatHistory = `${ChatRoute}`
export const GetChatEmployees = `${ChatRoute}/employee-list`

// Employee Leave Application
const EmployeeLeaveRoute = `${AdminV1Route}/leave-management`

export const CreateEmployeeLeave = `${EmployeeLeaveRoute}/create`
export const ActionEmployeeLeave = `${EmployeeLeaveRoute}/action`
export const RemoveEmployeeLeave = `${EmployeeLeaveRoute}/remove`
export const GetEmployeeLeaves = `${EmployeeLeaveRoute}/get`

// Task Management
const TaskManagementRoute = `${AdminV1Route}/task-management`

export const CreateTask = `${TaskManagementRoute}/create`
export const ActionTask = `${TaskManagementRoute}/action`
export const UpdateTask = `${TaskManagementRoute}/update`
export const RemoveTask = `${TaskManagementRoute}/remove`
export const GetTasks = `${TaskManagementRoute}/get`
export const RatingEmployee = `${TaskManagementRoute}/rating`

// Task Management
const DailyTaskReportingRoute = `${AdminV1Route}/task-daily-reporting`

export const CreateDailyReporting = `${DailyTaskReportingRoute}/create`
export const GetDailyReporting = `${DailyTaskReportingRoute}/get`
export const UpdateDailyReporting = `${DailyTaskReportingRoute}/update`

// Target Achievement
const TargetAchievementRoute = `${AdminV1Route}/target`

export const CreateTarget = `${TargetAchievementRoute}/create`
export const UpdateTarget = `${TargetAchievementRoute}/update`
export const RemoveTarget = `${TargetAchievementRoute}/remove`
export const GetTargets = `${TargetAchievementRoute}/get`

// SOP
const SOPRoute = `${AdminV1Route}/sop`

export const CreateSOP = `${SOPRoute}/create`
export const UpdateSOP = `${SOPRoute}/update`
export const RemoveSOP = `${SOPRoute}/remove`
export const GetSOPs = `${SOPRoute}/get`
export const CompleteSOPs = `${SOPRoute}/complete`

// Insights APIs (Individual modules, requires common admin access)
export const GetInsights = `${AdminV1Route}/insights`

// Insights APIs > Facebook
export const FacebookAuth = `${GetInsights}/facebook-oauth`
export const FacebookAuthCallback = `${GetInsights}/facebook-oauth/callback`

// Insights APIs > Facebook > Facebook Page
export const GetFacebookPages = `${GetInsights}/facebook-pages`
export const GetFacebookPageInsights = `${GetInsights}/facebook-pages/:page_id/insights`

// Insights APIs > Facebook > Instagram
export const GetInstagramAccounts = `${GetInsights}/instagram-accounts`
export const GetInstagramAccountInsights = `${GetInsights}/instagram-accounts/:account_id/insights`
export const GetIGMedia = `${GetInsights}/instagram-accounts/:account_id/media`
export const GetIGMediaInsights = `${GetInsights}/instagram-accounts/media/:media_id/insights`

// Insights APIs > Facebook > Facebook Ad / Marketing
const InsightFacebookBusinessRoute = `${GetInsights}/facebook-businesses`

export const GetFBUserAdAccounts = `${InsightFacebookBusinessRoute}/ad-accounts` // To get ad accounts of the user who has authenticated the app
export const GetFBBusinesses = `${InsightFacebookBusinessRoute}` // To get businesses owned by the user who has authenticated the app
export const GetFBBusinessOwnedAdAccounts = `${InsightFacebookBusinessRoute}/:business_id/ad-accounts` // To get ad accounts owned by a business, not the user
export const GetFBBusinessAdAccountInsights = `${InsightFacebookBusinessRoute}/:account_id/insights`
export const GetFBAdCampaigns = `${InsightFacebookBusinessRoute}/:account_id/campaigns`
export const GetFBAdCampaignsInsights = `${InsightFacebookBusinessRoute}/:campaign_id/insights`
export const GetFBAdCampaignAdSets = `${InsightFacebookBusinessRoute}/:campaign_id/ad-sets`
export const GetFBAdSetInsights = `${InsightFacebookBusinessRoute}/:ad_set_id/insights`
export const GetFBAdSetAds = `${InsightFacebookBusinessRoute}/:ad_set_id/ads`
export const GetFBAdInsights = `${InsightFacebookBusinessRoute}/:ad_id/insights`
export const GetAdLeads = `${InsightFacebookBusinessRoute}/:ad_id/leads`
export const GetLeadInfo = `${InsightFacebookBusinessRoute}/lead/:lead_id`

// Insights APIs > Google Analytics
const InsightGoogleAnalyticsRoute = `${GetInsights}/google-analytics`

export const GARunReport = `${InsightGoogleAnalyticsRoute}/run-report`

// Insights APIs > FG Group
const InsightFGGroupRoute = `${GetInsights}/fg-group`

export const GetOrdersInsights = `${InsightFGGroupRoute}/orders`
export const GetInvoiceInsights = `${InsightFGGroupRoute}/invoice`
export const GetUsersStats = `${InsightFGGroupRoute}/users`
export const GetStudentsStats = `${InsightFGGroupRoute}/students`
export const GetExpenseStats = `${InsightFGGroupRoute}/expense`

// Insights APIs > Google Search Console
const InsightGoogleSearchConsoleRoute = `${GetInsights}/google-search-console`

export const GSCRunAnalytics = `${InsightGoogleSearchConsoleRoute}/run-search-analytics-query`
export const GSCSitesList = `${InsightGoogleSearchConsoleRoute}/sites`
export const GSCInspectURL = `${InsightGoogleSearchConsoleRoute}/inspect-url`
export const GSCGetSitemapList = `${InsightGoogleSearchConsoleRoute}/get-sitemaps-list`
export const GSCGetSitemap = `${InsightGoogleSearchConsoleRoute}/get-sitemap`

// Expense
const ExpenseRoute = `${AdminV1Route}/expense`

export const GetExpense = `${ExpenseRoute}/get`
export const CreateExpense = `${ExpenseRoute}/create`
export const UpdateExpense = `${ExpenseRoute}/update`
export const DeleteExpense = `${ExpenseRoute}/delete`
export const GetNextExpenseSequence = `${ExpenseRoute}/get-next-expense`

// Expense Report
const ExpenseReportRoute = `${AdminV1Route}/expense-report`

export const CreateExpenseReport = `${ExpenseReportRoute}/create`
export const GetExpenseReports = `${ExpenseReportRoute}/get`
export const ActionExpenseReport = `${ExpenseReportRoute}/action`
export const UpdateExpenseReport = `${ExpenseReportRoute}/update`
export const DeleteExpenseReport = `${ExpenseReportRoute}/delete`

// Trainer
const TrainerRoute = `${AdminV1Route}/trainer`

export const GetTrainers = `${TrainerRoute}/get`
export const CreateTrainer = `${TrainerRoute}/create`
export const UpdateTrainer = `${TrainerRoute}/update`
export const RemoveTrainer = `${TrainerRoute}/remove`

// Attendance
const AttendanceRoute = `${AdminV1Route}/attendance`

export const GetAttendance = `${AttendanceRoute}/get-attendance`
export const GetSyncAttendance = `${AttendanceRoute}/get-machine-attendance`

// Salary
const SalaryRoute = `${AdminV1Route}/salary`

export const GetSalary = `${SalaryRoute}/get-salary`
export const GetSalaryData = `${SalaryRoute}/get-salary-data`
export const SyncSalaryData = `${SalaryRoute}/sync-salary`

// Manual Leave
const ManualLeaveRoute = `${AdminV1Route}/manual-leave`

export const CreateManualLeave = `${ManualLeaveRoute}/create`
export const ActionManualLeave = `${ManualLeaveRoute}/action`
export const RemoveManualLeave = `${ManualLeaveRoute}/remove`
export const GetManualLeaves = `${ManualLeaveRoute}/get`

// Order Cart
const OrderCartRoute = `${AdminV1Route}/order-cart`

export const GetOrderCart = `${OrderCartRoute}/get`

// Stock management
const StockManagementRoute = `${AdminV1Route}/stock-management`

export const CreateStockManagement = `${StockManagementRoute}/create`
export const RemoveStockManagement = `${StockManagementRoute}/remove`
export const GetStockManagement = `${StockManagementRoute}/get`
export const UpdateStockManagement = `${StockManagementRoute}/update`

// Subscriptions
const SubscriptionRoute = `${AdminV1Route}/subscription`

export const CreateSubscription = `${SubscriptionRoute}/create`
export const GetSubscription = `${SubscriptionRoute}/get`
export const GetSubscriptionById = `${SubscriptionRoute}/razorpay/get`
export const GetSubscriptionInvoice = `${SubscriptionRoute}/invoice-get`
export const CancelSubscription = `${SubscriptionRoute}/cancel`
export const PauseSubscription = `${SubscriptionRoute}/pause`
export const ResumeSubscription = `${SubscriptionRoute}/resume`
export const UpdateSubscription = `${SubscriptionRoute}/update`

// Subscriptions Plan
const SubscriptionPlanRoute = `${AdminV1Route}/subscription-plan`

export const CreateSubscriptionPlan = `${SubscriptionPlanRoute}/create`
export const GetSubscriptionPlan = `${SubscriptionPlanRoute}/get`

// Lead Automation
const LeadAutomationRoute = `${AdminV1Route}/lead-automation`

export const CreateLeadAutomation = `${LeadAutomationRoute}/create`
export const GetLeadAutomationRoute = `${LeadAutomationRoute}/get`
export const RemoveLeadAutomationRoute = `${LeadAutomationRoute}/remove`

// Sheets
const SheetsRoute = `${AdminV1Route}/sheets`

export const GetGoogleSheets = `${SheetsRoute}/list`
export const GetGoogleSubSheets = `${SheetsRoute}/get`
export const AppendGoogleSheets = `${SheetsRoute}/append`

// Complaint Chatbot
const ComplaintRoute = `${AdminV1Route}/complaint-chatbot`

export const CreateComplaint = `${ComplaintRoute}/create`
export const ActionComplaint = `${ComplaintRoute}/action`
export const UpdateComplaint = `${ComplaintRoute}/update`
export const RemoveComplaint = `${ComplaintRoute}/remove`
export const GetComplaint = `${ComplaintRoute}/get`

// Student Placement
const StudentPlacementRoute = `${AdminV1Route}/student-placement`

export const GetPlacementRequest = `${StudentPlacementRoute}/get-placement-requests`
export const SchedulePlacementInterview = `${StudentPlacementRoute}/schedule-interview`

// Iptna Inquiry
const IptnaInqiryRoute = `${BASE_URL}/iptna/v1`

// Iptna Partner
export const GetIptnaInquiry = `${IptnaInqiryRoute}/get-inquiry`

// Inpta Listing
const InptaListingRoute = `${BASE_URL}/inpta-listing`

// Training Partner
export const AddInptaTPListing = `${InptaListingRoute}/create-tp-listing`
export const UpdateInptaTPListing = `${InptaListingRoute}/update-tp-listing`
export const GetAdminInptaTPListing = `${InptaListingRoute}/get-tp-listing-for-admin`
export const RemoveInptaTPListing = `${InptaListingRoute}/delete-tp-listing`
export const ActionInptaTPListing = `${InptaListingRoute}/tp-listing-action`

// Training Center
export const AddInptaTCListing = `${InptaListingRoute}/create-tc-listing`
export const UpdateInptaTCListing = `${InptaListingRoute}/update-tc-listing`
export const GetAdminInptaTCListing = `${InptaListingRoute}/get-tc-listing-for-admin`
export const RemoveInptaTCListing = `${InptaListingRoute}/delete-tc-listing`
export const ActionInptaTCListing = `${InptaListingRoute}/tc-listing-action`

// Gomzi Medical Product
const MedicalProductRoute = `${AdminV1Route}/medical-product`

export const AddMedicalProduct = `${MedicalProductRoute}/add`
export const UpdateMedicalProduct = `${MedicalProductRoute}/update`
export const GetMedicalProduct = `${MedicalProductRoute}/get`

// Gomzi Medical Order

export const GetMedicalOrders = `${MedicalProductRoute}/get-order`
export const UpdateMedicalDoctorOrder = `${MedicalProductRoute}/update-doctor-order`
export const UpdateMedicalPharmacyOrder = `${MedicalProductRoute}/update-pharmacy-order`
export const GetMedicalProductRequirement = `${MedicalProductRoute}/get-requirement`

// User Location Logs
const UserLocationRoute = `${AdminV1Route}/user-location-logs`

export const GetUserLocation = `${UserLocationRoute}/get`

// Quotation
const QuotationRoute = `${AdminV1Route}/quotation`

export const GetQuotations = `${QuotationRoute}/get`
export const CreateQuotation = `${QuotationRoute}/create`
export const UpdateQuotation = `${QuotationRoute}/update`
export const DeleteQuotation = `${QuotationRoute}/delete`

// GN Target Matrix
const GnTargetMatrixRoute = `${AdminV1Route}/gn-target-matrix`

export const CreateGnTargetMatrix = `${GnTargetMatrixRoute}/create`
export const GetGnTargetMatrix = `${GnTargetMatrixRoute}/get`
export const UpdateGnTargetMatrix = `${GnTargetMatrixRoute}/update`
export const DeleteGnTargetMatrix = `${GnTargetMatrixRoute}/delete`
export const UpdateArchivedGnTargetMatrix = `${GnTargetMatrixRoute}/update-archived`

// GN Data
const GnDataRoute = `${AdminV1Route}/gn-data`
export const GetGnData = `${GnDataRoute}/get`

// FGIIT Matrix
const FGIITMatrixRoute = `${AdminV1Route}/fgiit-matrix`
export const GetFGIITMatrixData = `${FGIITMatrixRoute}/get-data`

// HR Matrix
const HRMatrixRoute = `${AdminV1Route}/hr-matrix`
export const GetHRMatrixData = `${HRMatrixRoute}/get-data`

// WhatsApp
const WhatsAppRoute = `${AdminV1Route}/whatsapp`
export const GetWhatsAppTemplates = `${WhatsAppRoute}/get-template-status`
export const DeleteWhatsAppTemplate = `${WhatsAppRoute}/delete-template`
export const CreateWhatsAppTemplate = `${WhatsAppRoute}/create-custom-template`
export const SendWhatsAppTemplateMessage = `${WhatsAppRoute}/send-template-message`
export const SendWhatsAppTemplateMessageMultiple = `${WhatsAppRoute}/send-message-multiple-users`
export const CreateScheduleMessage = `${WhatsAppRoute}/create-schedule-message`
export const GetWhatsAppChatHistory = `${WhatsAppRoute}/get-chat-history`
export const GetWhatsAppContactList = `${WhatsAppRoute}/get-contact-list`
export const SendWhatsAppTextMessage = `${WhatsAppRoute}/send-text-message`
export const MarkWhatsAppMessagesAsRead = `${WhatsAppRoute}/mark-as-read`

// Automation Contacts
const AutomationContactRoute = `${AdminV1Route}/automation-contact`

export const CreateAutomationContact = `${AutomationContactRoute}/create`
export const GetAutomationContact = `${AutomationContactRoute}/get`
export const BulkCreateAutomationContact = `${AutomationContactRoute}/bulk-create`
export const UpdateAutomationContact = `${AutomationContactRoute}/update`
export const RemoveAutomationContact = `${AutomationContactRoute}/remove`

// Automation Contacts Groups
const AutomationContactGroupRoute = `${AdminV1Route}/automation-contact-group`

export const CreateAutomationContactGroup = `${AutomationContactGroupRoute}/create`
export const GetAutomationContactGroup = `${AutomationContactGroupRoute}/get`
export const UpdateAutomationContactGroup = `${AutomationContactGroupRoute}/update`
export const RemoveAutomationContactGroup = `${AutomationContactGroupRoute}/remove`

// Automation Brands
const AutomationBrandRoute = `${AdminV1Route}/automation-brand`

export const CreateAutomationBrand = `${AutomationBrandRoute}/create`
export const GetAutomationBrand = `${AutomationBrandRoute}/get`
export const UpdateAutomationBrand = `${AutomationBrandRoute}/update`
export const RemoveAutomationBrand = `${AutomationBrandRoute}/remove`

// Mentor
const MentorRoute = `${AdminV1Route}/mentor`

export const AddMentor = `${MentorRoute}/create`
export const GetMentor = `${MentorRoute}/get`
export const UpdateMentor = `${MentorRoute}/update`
export const DeleteMentor = `${MentorRoute}/remove`

// Lecture Reminder
const LectureReminderRoute = `${AdminV1Route}/lecture-reminder`

export const AddLectureReminder = `${LectureReminderRoute}/create`
export const GetLectureReminder = `${LectureReminderRoute}/get`
export const UpdateLectureReminder = `${LectureReminderRoute}/update`
export const DeleteLectureReminder = `${LectureReminderRoute}/remove`

// Mentor
const MentorBaseRoute = `${AdminV1Route}/fgiit-lecture-management`

export const CreateFGIITMentor = `${MentorBaseRoute}/mentor-create`
export const GetFGIITMentors = `${MentorBaseRoute}/mentor-get`
export const UpdateFGIITMentor = `${MentorBaseRoute}/mentor-update`
export const RemoveFGIITMentor = `${MentorBaseRoute}/mentor-remove`

//Syllabus
const SyllabusBaseRoute = `${AdminV1Route}/fgiit-lecture-management`

export const createFGIITSyllabus = `${SyllabusBaseRoute}/syllabus-create`
export const getFGIITSyllabus = `${SyllabusBaseRoute}/syllabus-get`
export const updateFGIITSyllabus = `${SyllabusBaseRoute}/syllabus-update`
export const removeFGIITSyllabus = `${SyllabusBaseRoute}/syllabus-remove`

// FGIIT Lecture Schedule
const FGIITLectureScheduleRoute = `${AdminV1Route}/fgiit-lecture-management`

export const CreateFGIITLectureSchedule = `${FGIITLectureScheduleRoute}/lecture-schedule-create`
export const GetFGIITLectureSchedule = `${FGIITLectureScheduleRoute}/lecture-schedule-get`
export const UpdateFGIITLectureSchedule = `${FGIITLectureScheduleRoute}/lecture-schedule-update`
export const RemoveFGIITLectureSchedule = `${FGIITLectureScheduleRoute}/lecture-schedule-remove`
export const ToggleFGIITLectureReminder = `${FGIITLectureScheduleRoute}/lecture-reminder-toggle`

// FGIIT Syllabus Chapter
const FGIITChapterBaseRoute = `${AdminV1Route}/fgiit-lecture-management`

export const CreateFGIITSyllabusChapter = `${FGIITChapterBaseRoute}/chapter-create`
export const GetFGIITSyllabusChapter = `${FGIITChapterBaseRoute}/chapter-get`
export const GetFGIITSyllabusChapterById = `${FGIITChapterBaseRoute}/chapter-get-by-id`
export const UpdateFGIITSyllabusChapter = `${FGIITChapterBaseRoute}/chapter-update`
export const RemoveFGIITSyllabusChapter = `${FGIITChapterBaseRoute}/chapter-remove`

// FGIIT Batch
const FGIITBatchBaseRoute = `${AdminV1Route}/fgiit-lecture-management`
export const FGIITBatchRoute = `${FGIITBatchBaseRoute}`
export const CreateFGIITBatch = `${FGIITBatchBaseRoute}/batch-create`
export const GetFGIITBatch = `${FGIITBatchBaseRoute}/batch-get`
export const UpdateFGIITBatch = `${FGIITBatchBaseRoute}/batch-update`
export const RemoveFGIITBatch = `${FGIITBatchBaseRoute}/batch-remove`

// FGIIT Course Name
export const FGIITCourseNameRoute = `${FG_GROUP_BASE_URL}/admin/v1/fgiit-course-name`
export const CreateFGIITCourseName = `${FGIITCourseNameRoute}/create`
export const GetFGIITCourseNames = `${FGIITCourseNameRoute}/get`
export const UpdateFGIITCourseName = `${FGIITCourseNameRoute}/update`
export const RemoveFGIITCourseName = `${FGIITCourseNameRoute}/remove`

// FGIIT Course Syllabus
export const FGIITCourseSyllabusRoute = `${FG_GROUP_BASE_URL}/admin/v1/fgiit-course-syllabus`
export const CreateFGIITCourseSyllabus = `${FGIITCourseSyllabusRoute}/create`
export const GetFGIITCourseSyllabus = `${FGIITCourseSyllabusRoute}/get`
export const UpdateFGIITCourseSyllabus = `${FGIITCourseSyllabusRoute}/update`
export const RemoveFGIITCourseSyllabus = `${FGIITCourseSyllabusRoute}/remove`

// Adajan Branch Employee
const AdajanBranchEmployeeRoute = `${AdminV1Route}/adajan-branch/employee`

export const CreateAdajanBranchEmployee = `${AdajanBranchEmployeeRoute}/create`
export const GetAdajanBranchEmployees = `${AdajanBranchEmployeeRoute}/get`
export const UpdateAdajanBranchEmployee = `${AdajanBranchEmployeeRoute}/update`
export const DeleteAdajanBranchEmployee = `${AdajanBranchEmployeeRoute}/delete`

//Adajan Branch Client
const AdajanBranchClientRoute = `${AdminV1Route}/adajan-branch/client`

export const CreateAdajanBranchClient = `${AdajanBranchClientRoute}/create`
export const GetAdajanBranchClient = `${AdajanBranchClientRoute}/get`
export const UpdateAdajanBranchClient = `${AdajanBranchClientRoute}/update`
export const RemoveAdajanBranchClient = `${AdajanBranchClientRoute}/remove`
export const AssignAdajanBranchTrainer = `${AdajanBranchClientRoute}/assign-trainer`
export const RenewAdajanBranchClient = `${AdajanBranchClientRoute}/renew-plan`

// auto generate code (Client & Employee both)

const AdajanBranchNextCodeRoute = `${AdminV1Route}/adajan-branch`

export const GetNextCode = `${AdajanBranchNextCodeRoute}/next-code`

// Adajan Branch Attendance
const AdajanBranchAttendanceRoute = `${AdminV1Route}/adajan-branch/attendance`

export const GetAdajanBranchAttendance = `${AdajanBranchAttendanceRoute}/get`
export const GetAdajanBranchAttendanceSummary = `${AdajanBranchAttendanceRoute}/summary`
export const SyncAdajanBranchAttendance = `${AdajanBranchAttendanceRoute}/sync`

// Adajan Branch Salary
const AdajanBranchSalaryRoute = `${AdminV1Route}/adajan-branch/salary`

export const GetAdajanBranchSalary = `${AdajanBranchSalaryRoute}/get-salary`
export const GetAdajanBranchSalaryData = `${AdajanBranchSalaryRoute}/get-salary-data`

// FGIIT Syllabus
export const FGIITSyllabusRoute = `${FG_GROUP_BASE_URL}/admin/v1/fgiit-syllabus`
export const CreateFGIITSyllabus = `${FGIITSyllabusRoute}/create`
export const GetFGIITSyllabus = `${FGIITSyllabusRoute}/get`
export const UpdateFGIITSyllabus = `${FGIITSyllabusRoute}/update`
export const RemoveFGIITSyllabus = `${FGIITSyllabusRoute}/remove`

//Gn FollowUp Report
const GnFollowUpReportRoute = `${AdminV1Route}`
export const CreateGnFollowUpReport = `${GnFollowUpReportRoute}/gn-follow-up-report-create`
export const GetGnFollowUpReport = `${GnFollowUpReportRoute}/gn-follow-up-report-get`
export const UpdateProductDetails = `${GnFollowUpReportRoute}/gn-follow-up-report-product-details`
export const UpdateSampleSelection = `${GnFollowUpReportRoute}/gn-follow-up-report-sample-selection`
export const UpdateSampleUpdate = `${GnFollowUpReportRoute}/gn-follow-up-report-sample-update`
export const UpdatePitchReport = `${GnFollowUpReportRoute}/gn-follow-up-report-pitch-report`
export const UpdateGnPersonalDetails = `${GnFollowUpReportRoute}/gn-follow-up-report-personal-details`
export const GetGnSampleSelectedReports = `${GnFollowUpReportRoute}/gn-follow-up-report-sample-selected-get`

//Fgiit FollowUp Report
export const CreateFgiitFollowUpReport = `${AdminV1Route}/fgiit-follow-up-report-create`
export const GetFgiitFollowUpReport = `${AdminV1Route}/fgiit-follow-up-report-get`
export const UpdateFgiitPersonalDetails = `${AdminV1Route}/fgiit-follow-up-report-personal-details`
export const UpdateFgiitCourseDetails = `${AdminV1Route}/fgiit-follow-up-report-course-details`
export const UpdateFgiitAdmissionForm = `${AdminV1Route}/fgiit-follow-up-report-admission-form`
export const UpdateFgiitPitchReport = `${AdminV1Route}/fgiit-follow-up-report-pitch-report`
export const RemoveFgiitFollowUpReport = `${AdminV1Route}/fgiit-follow-up-report-remove`
export const GetFgiitAdmissionReport = `${AdminV1Route}/fgiit-admission-form-get`

// Facebook Lead Manage
const FacebookLeadRoute = `${AdminV1Route}/facebook-lead`
export const CreateFacebookLead = `${FacebookLeadRoute}/create`
export const GetFacebookLeads = `${FacebookLeadRoute}/get`
export const CreateManualFacebookLead = `${FacebookLeadRoute}/create-manual-lead`

//GN Inventory Stock
export const GetGnStock = `${AdminV1Route}/gn-stock/get`

// GN Raw Material Product
const GnRawMaterialProductRoute = `${AdminV1Route}/gn-raw-material-product`

export const CreateGnRawMaterialProduct = `${GnRawMaterialProductRoute}/add`
export const GetGnRawMaterialProduct = `${GnRawMaterialProductRoute}/get`
export const UpdateGnRawMaterialProduct = `${GnRawMaterialProductRoute}/update`
export const RemoveGnRawMaterialProduct = `${GnRawMaterialProductRoute}/remove`

// GN Raw Material Supplier
const GnRawMaterialSupplierRoute = `${AdminV1Route}/gn-raw-material-suppliers`

export const CreateGnRawMaterialSupplier = `${GnRawMaterialSupplierRoute}/add`
export const GetGnRawMaterialSupplier = `${GnRawMaterialSupplierRoute}/get`
export const UpdateGnRawMaterialSupplier = `${GnRawMaterialSupplierRoute}/update`
export const RemoveGnRawMaterialSupplier = `${GnRawMaterialSupplierRoute}/remove`

// GN Raw Material SupplierInvoice
const GnRawMaterialSupplierInvoiceRoute = `${AdminV1Route}/gn-raw-material-suppliers-invoice`

export const CreateGnRawMaterialSupplierInvoice = `${GnRawMaterialSupplierInvoiceRoute}/add`
export const GetGnRawMaterialSupplierInvoice = `${GnRawMaterialSupplierInvoiceRoute}/get`
export const UpdateGnRawMaterialSupplierInvoice = `${GnRawMaterialSupplierInvoiceRoute}/update`
export const RemoveGnRawMaterialSupplierInvoice = `${GnRawMaterialSupplierInvoiceRoute}/remove`

//Gn Clients

const GnClientsRoute = `${AdminV1Route}/gn-clients`

export const GetGnClient = `${GnClientsRoute}/get`
export const UpdateLabelStatus = `${GnClientsRoute}/update-label-status`
export const UpdateLabReportStatus = `${GnClientsRoute}/update-lab-report-status`

//Gn Formulation

const GnFormulationRoute = `${AdminV1Route}/gn-table-value`

export const GetGnFormulation = `${GnFormulationRoute}/get`
export const CreateGnFormulation = `${GnFormulationRoute}/create`
export const UpdateGnFormulation = `${GnFormulationRoute}/update`

//Gn Label Design Approve

const GnLabelDesignApproveRoute = `${AdminV1Route}/gn-label-design-approve`

export const GetGnLabelDesignApprove = `${GnLabelDesignApproveRoute}/get`
export const CreateGnLabelDesignApprove = `${GnLabelDesignApproveRoute}/add`
export const UpdateGnLabelDesignApprove = `${GnLabelDesignApproveRoute}/update`

//GN Procurement

const GnProcurementRoute = `${AdminV1Route}/gn-procurement`

export const GetGnProcurement = `${GnProcurementRoute}/get`
export const AddGnProcurement = `${GnProcurementRoute}/add`
export const UpdateGnProcurement = `${GnProcurementRoute}/update`

//GN Production

const GnProductionRoute = `${AdminV1Route}/gn-production`

export const GetGnProduction = `${GnProductionRoute}/get`
export const AddGnProduction = `${GnProductionRoute}/add`
export const UpdateGnProduction = `${GnProductionRoute}/update`

//GN Lab Report

const GnLabReportRoute = `${AdminV1Route}/gn-lab-report`

export const GetGnLabReport = `${GnLabReportRoute}/get`
export const AddGnLabReport = `${GnLabReportRoute}/add`
export const UpdateGnLabReport = `${GnLabReportRoute}/update`

// GN Dispatch Bill
const GnDispatchBillRoute = `${AdminV1Route}/gn-dispatch-bill`

export const GetGnDispatchBill = `${GnDispatchBillRoute}/get`
export const AddGnDispatchBill = `${GnDispatchBillRoute}/create`
export const UpdateGnDispatchBill = `${GnDispatchBillRoute}/update`

// GLS Employee
const GlsEmployeeRoute = `${AdminV1Route}/gls-employee`

export const GetGlsEmployees = `${GlsEmployeeRoute}/get`
export const CreateGlsEmployee = `${GlsEmployeeRoute}/add`
export const UpdateGlsEmployee = `${GlsEmployeeRoute}/update`
export const RemoveGlsEmployee = `${GlsEmployeeRoute}/remove`
export const GetNextGlsEmployeeCode = `${GlsEmployeeRoute}/get-next-employee_code`

// GLS Attendance
const GlsAttendanceRoute = `${AdminV1Route}/gls-attendance`

export const GetGlsAttendance = `${GlsAttendanceRoute}/get`
export const SyncGlsAttendance = `${GlsAttendanceRoute}/sync`

// GLS Branch - Salary
const GlsSalaryRoute = `${AdminV1Route}/gls-salary`
export const GetGlsSalary = `${GlsSalaryRoute}/get`
export const GetGlsSalaryData = `${GlsSalaryRoute}/get-data`

// GLS Reports
const GlsReportRoute = `${AdminV1Route}/gls-report`
export const GetGlsYearlyReport = `${GlsReportRoute}/yearly`
export const GetGlsProductWiseReport = `${GlsReportRoute}/product-wise`
export const GetGlsCityWiseReport = `${GlsReportRoute}/city-wise`
export const GetGlsBranchWiseReport = `${GlsReportRoute}/branch-wise`
export const GetGlsPartyWiseReport = `${GlsReportRoute}/party-wise`

// Salary Slip
const SalarySlipRoute = `${AdminV1Route}/salary-slip`

export const SalarySlipAdd = `${SalarySlipRoute}/add`
export const SalarySlipEdit = `${SalarySlipRoute}/edit`
export const SalarySlipGet = `${SalarySlipRoute}/get`
export const SalarySlipRemove = `${SalarySlipRoute}/remove`

// GN Sample Booking
const GnSampleBookingRoute = `${AdminV1Route}/gn-sample-booking`

export const GetGnSampleBooking = `${GnSampleBookingRoute}/get`
export const AddGnSampleBooking = `${GnSampleBookingRoute}/add`
export const UpdateGnSampleBooking = `${GnSampleBookingRoute}/update`
export const RemoveGnSampleBooking = `${GnSampleBookingRoute}/remove`

// IVR
const IVRRoute = `${AdminV1Route}/ivr`
export const InitiateCall = `${IVRRoute}/call/initiate`
export const GetIVRMembers = `${IVRRoute}/member/list`
export const GetIVRCallLogs = `${IVRRoute}/call/logs`

// 🌟 -------------- CallerDesk IVR System -------------- 🌟
// const IVRRoute = `${AdminV1Route}/ivr`

// Dashboard
export const IVRDashboardSummary = `${IVRRoute}/dashboard/summary`

// Call Logs
export const IVRGetCallLogs = `${IVRRoute}/call/logs`
export const IVRListReports = `${IVRRoute}/call/report-list`
export const IVRInitiateCall = `${IVRRoute}/call/initiate`
export const IVRSyncReports = `${IVRRoute}/call/sync`

// Member Management
export const IVRGetMemberList = `${IVRRoute}/member/list`
export const IVRAddMember = `${IVRRoute}/member/add`
export const IVRUpdateMember = `${IVRRoute}/member/update`
export const IVRDeleteMember = `${IVRRoute}/member/delete`

// IVR Numbers (Deskphones)
export const IVRGetNumbers = `${IVRRoute}/numbers/list`

// Member Analysis
export const IVRGetAnalysisReport = `${IVRRoute}/analysis/report`
export const IVRGetBreakStatus = `${IVRRoute}/analysis/break-status`
export const IVRUpdateWorkStatus = `${IVRRoute}/analysis/working-status`

// FWG Follow Up Report
const FwgFollowUpRoute = `${AdminV1Route}/fwg-follow-up`

export const CreateFwgFollowUpReport = `${FwgFollowUpRoute}/create`
export const AddFwgCallEntry = `${FwgFollowUpRoute}/add-call`
export const UpdateFwgCallEntry = `${FwgFollowUpRoute}/update-call`
export const GetFwgFollowUpReport = `${FwgFollowUpRoute}/get`

// Team Management
const TeamRoute = `${AdminV1Route}/team`

export const CreateTeam = `${TeamRoute}/create`
export const GetTeams = `${TeamRoute}/get`
export const RemoveTeam = `${TeamRoute}/remove`

// Manager Rating
const ManagerRatingRoute = `${AdminV1Route}/manager-rating`
export const AddManagerRating = `${ManagerRatingRoute}/add`
export const UpdateManagerRating = `${ManagerRatingRoute}/update`
export const GetManagerRatings = `${ManagerRatingRoute}/get`

// Wallet
export const GetWalletInvoices = `${AdminV1Route}/wallet/employee-invoices`
export const GetAllTransactionsEndpoint = `${AdminV1Route}/wallet/all-transactions`
export const GetDashboardStatsEndpoint = `${AdminV1Route}/wallet/dashboard-stats`
export const GetAllSalesBalanceEndpoint = `${AdminV1Route}/wallet/all-sales-balance`

// Withdrawal Requests
const WithdrawalRequestRoute = `${AdminV1Route}/withdrawal-request`
export const CreateWithdrawalRequest = `${WithdrawalRequestRoute}/create`
export const GetWithdrawalRequests = `${WithdrawalRequestRoute}/get`
export const UpdateWithdrawalRequest = `${WithdrawalRequestRoute}/update`

// Commission
const CommissionRoute = `${AdminV1Route}/commission`
export const CreateCommissionEndpoint = `${CommissionRoute}/add`
export const GetCommissionsEndpoint = `${CommissionRoute}/get`
export const UpdateCommissionEndpoint = `${CommissionRoute}/update`

// Hiring Request
const HiringRequestRoute = `${AdminV1Route}/hiring-request`

export const CreateHiringRequest = `${HiringRequestRoute}/create`
export const ActionHiringRequest = `${HiringRequestRoute}/action`
export const UpdateHiringRequest = `${HiringRequestRoute}/update`
export const RemoveHiringRequest = `${HiringRequestRoute}/remove`
export const GetHiringRequests = `${HiringRequestRoute}/get`

// Auto Commission Requests
const AutoCommissionRoute = `${AdminV1Route}/auto-commission`
export const GetAutoCommissionRequests = `${AutoCommissionRoute}/get`
export const UpdateAutoCommissionRequest = `${AutoCommissionRoute}/update`

// RBAC
const RBACRoute = `${AdminV1Route}`
export const CreatePanel = `${RBACRoute}/panel/create`
export const GetPanels = `${RBACRoute}/panel/get`
export const UpdatePanel = `${RBACRoute}/panel/update`
export const RemovePanel = `${RBACRoute}/panel/remove`

export const CreateMenu = `${RBACRoute}/menu/create`
export const GetMenus = `${RBACRoute}/menu/get`
export const RemoveMenu = `${RBACRoute}/menu/remove`
export const CreateSubMenu = `${RBACRoute}/menu/sub-menu/create`
export const RemoveSubMenu = `${RBACRoute}/menu/sub-menu/remove`

export const AssignAuthority = `${RBACRoute}/authority/assign`
export const GetAuthority = `${RBACRoute}/authority/get`
export const GetMyAuthority = `${RBACRoute}/authority/get-my-authority`
export const RemoveAuthority = `${RBACRoute}/authority/remove`
