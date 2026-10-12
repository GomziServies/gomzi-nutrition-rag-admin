import { FWG_BASE_URL } from './base_URL'

// 🌟----------------- FWG -----------------🌟
export const FWGBasedURL = FWG_BASE_URL
const AdminV1Route = FWGBasedURL + '/admin/v1'

// Account
export const CreateAdminAccount = `${AdminV1Route}/create-admin-user`
export const GetProfile = `${AdminV1Route}/get-profile`
export const UpdateProfile = `${AdminV1Route}/update-profile`
export const ChangePassword = `${AdminV1Route}/change-password`
export const FileUpload = `${AdminV1Route}/file-upload`

// Chat
const ChatRoute = `${AdminV1Route}/chat`

export const GetChatHistory = `${ChatRoute}`
export const GetChatUsers = `${ChatRoute}/user-list`

// Dashboard
const DashboardRoute = `${AdminV1Route}/dashboard`

export const GetDashboardStats = `${DashboardRoute}/stats`

// Diet Plan
const DietPlanRoute = `${AdminV1Route}/diet`

export const CreateDietPlan = `${DietPlanRoute}/create`
export const UpdateDietPlan = `${DietPlanRoute}/update`
export const GetDietPlan = `${DietPlanRoute}/get`
export const RemoveDietPlan = `${DietPlanRoute}/remove`
export const AddDietPlanItem = `${DietPlanRoute}/add-item`
export const UpdateDietPlanItem = `${DietPlanRoute}/update-item`
export const RemoveDietPlanItem = `${DietPlanRoute}/remove-item`
export const AssignDietPlan = `${DietPlanRoute}/assign`
export const WithdrawDietPlan = `${DietPlanRoute}/withdraw`
export const UpdateAssignedDietPlan = `${DietPlanRoute}/update-assigned-diet`
export const UpdateDietPlanSortIndex = `${DietPlanRoute}/sort-index`

// E-Books
const EBookRoute = `${AdminV1Route}/ebook`

export const AddEBook = `${EBookRoute}/add`
export const UpdateEBook = `${EBookRoute}/update`
export const GetEBook = `${EBookRoute}/get`
export const RemoveEBook = `${EBookRoute}/remove`

//Expense
export const ExpenseGet = `${AdminV1Route}/expense/get`
export const ExpenseCreate = `${AdminV1Route}/expense/create`
export const ExpenseUpdate = `${AdminV1Route}/expense/update`
export const ExpenseStats = `${AdminV1Route}/expense/stats`
export const NextExpenseNumber = `${AdminV1Route}/expense/get-next-expense`

// Exercise
const ExerciseRoute = `${AdminV1Route}/exercise`

export const AddExercise = `${ExerciseRoute}/add`
export const UpdateExercise = `${ExerciseRoute}/update`
export const GetExercise = `${ExerciseRoute}/get`
export const RemoveExercise = `${ExerciseRoute}/remove`

// Exercise Plan
const ExercisePlanRoute = `${AdminV1Route}/exercise-plan`

export const CreateExercisePlan = `${ExercisePlanRoute}/create-plan`
export const UpdateExercisePlan = `${ExercisePlanRoute}/update-plan`
export const GetExercisePlan = `${ExercisePlanRoute}/get-plan`
export const RemoveExercisePlan = `${ExercisePlanRoute}/remove-plan`
export const AddExerciseBundle = `${ExercisePlanRoute}/add-plan-bundle`
export const RemoveExercisePlanBundle = `${ExercisePlanRoute}/remove-plan-bundle`
export const AssignExercisePlan = `${ExercisePlanRoute}/assign`
export const UpdateAssignedExercisePlan = `${ExercisePlanRoute}/update-assigned-plan`
export const WithdrawExercisePlan = `${ExercisePlanRoute}/revoke`

// Exercise Bundle
const ExerciseBundleRoute = `${AdminV1Route}/exercise-bundle`

export const CreateExerciseBundle = `${ExerciseBundleRoute}/create`
export const UpdateExerciseBundle = `${ExerciseBundleRoute}/update`
export const GetExerciseBundle = `${ExerciseBundleRoute}/get`
export const RemoveExerciseBundle = `${ExerciseBundleRoute}/remove`
export const AddExerciseBundleItem = `${ExerciseBundleRoute}/add-item`
export const RemoveExerciseBundleItem = `${ExerciseBundleRoute}/remove-item`
export const UpdateExerciseBundleItem = `${ExerciseBundleRoute}/update-item`

// Franchise User
const FranchiseUserRoute = `${AdminV1Route}/franchise`

export const CreateFranchiseUser = `${FranchiseUserRoute}/create-user`
export const ChangeFranchiseUserPassword = `${FranchiseUserRoute}/change-password`
export const GetFranchiseUser = `${FranchiseUserRoute}/get-users`
export const SetFranchiseUserAccess = `${FranchiseUserRoute}/access`
export const DeleteFranchiseUser = `${FranchiseUserRoute}/delete-user`
export const UpdateFranchiseUserProfile = `${FranchiseUserRoute}/update-profile`

// Feedback
const FeedbackRoute = `${AdminV1Route}/feedback`

export const AddFeedback = `${FeedbackRoute}/add`

// Feature
const FeatureRoute = `${AdminV1Route}/feature`

export const AddFeature = `${FeatureRoute}/add`
export const UpdateFeature = `${FeatureRoute}/update`
export const GetFeature = `${FeatureRoute}/get`
export const RemoveFeature = `${FeatureRoute}/remove`

// Food
const FoodRoute = `${AdminV1Route}/food`

export const AddFood = `${FoodRoute}/add`
export const UpdateFood = `${FoodRoute}/update`
export const GetFood = `${FoodRoute}/get`
export const RemoveFood = `${FoodRoute}/remove`

// Food Bundle
const FoodBundleRoute = `${AdminV1Route}/food-bundle`

export const AddFoodBundle = `${FoodBundleRoute}/add`
export const UpdateFoodBundle = `${FoodBundleRoute}/update`
export const GetFoodBundle = `${FoodBundleRoute}/get`
export const RemoveFoodBundle = `${FoodBundleRoute}/remove`

// Food Bundle Item
const FoodBundleItemRoute = `${AdminV1Route}/food-bundle-item`
export const AddFoodBundleItem = `${FoodBundleItemRoute}/add`
export const RemoveFoodBundleItem = `${FoodBundleItemRoute}/remove`
export const UpdateFoodBundleItem = `${FoodBundleItemRoute}/update`

// Food Time
const FoodTimeRoute = `${AdminV1Route}/food-time`

export const AddFoodTime = `${FoodTimeRoute}/add`
export const UpdateFoodTime = `${FoodTimeRoute}/update`
export const GetFoodTime = `${FoodTimeRoute}/get`
export const RemoveFoodTime = `${FoodTimeRoute}/remove`

// Food Category
const FoodCategoryRoute = `${AdminV1Route}/food-category`

export const AddFoodCategory = `${FoodCategoryRoute}/add`
export const UpdateFoodCategory = `${FoodCategoryRoute}/update`
export const GetFoodCategory = `${FoodCategoryRoute}/get`
export const RemoveFoodCategory = `${FoodCategoryRoute}/remove`

// Invoice
export const InvoiceGet = `${AdminV1Route}/invoice/get`
export const InvoiceCreate = `${AdminV1Route}/invoice/create`
export const InvoiceUpdate = `${AdminV1Route}/invoice/update`
export const InvoiceStats = `${AdminV1Route}/invoice/stats`
export const NextInvoiceNumber = `${AdminV1Route}/invoice/get-next-invoice`

// Motivation Song

// Membership  Plan
const MembershipPlanRoute = `${AdminV1Route}/membership`

export const CreateMembershipPlan = `${MembershipPlanRoute}/create-plan`
export const UpdateMembershipPlan = `${MembershipPlanRoute}/update-plan`
export const AssignMembershipPlan = `${MembershipPlanRoute}/assign-plan`
export const GetMembershipPlan = `${MembershipPlanRoute}/get-plan`
export const RemoveMembershipPlan = `${MembershipPlanRoute}/delete-plan`
export const WithdrawMembershipPlan = `${MembershipPlanRoute}/withdraw-plan`
export const GetAssignedMembershipPlan = `${MembershipPlanRoute}/get-assign-plan`

// Plan Bundle
const PlanBundleRoute = `${AdminV1Route}/plan-bundle`

export const CreatePlanBundle = `${PlanBundleRoute}/create`
export const UpdatePlanBundle = `${PlanBundleRoute}/update`
export const GetPlanBundle = `${PlanBundleRoute}/get`
export const RemovePlanBundle = `${PlanBundleRoute}/remove`
export const AddPlanBundleItem = `${PlanBundleRoute}/add-item`
export const RemovePlanBundleItem = `${PlanBundleRoute}/remove-item`

// Sub Admin
export const CreateAdminUser = `${AdminV1Route}/create-admin-user`
export const ChangeAdminUserPassword = `${AdminV1Route}/admin-change-password`
export const GetAdminUser = `${AdminV1Route}/get-admins`
export const SetAdminUserPermission = `${AdminV1Route}/set-admin-permission`
export const AssignUser = `${AdminV1Route}/assign-users`

// User
const AdminUserRoute = `${AdminV1Route}/user`

export const CreateUser = `${AdminUserRoute}/create`
export const RemoveUser = `${AdminUserRoute}/remove`
export const DeactivateUser = `${AdminUserRoute}/deactivate`
export const ActivateUser = `${AdminUserRoute}/activate`
export const UpdateUser = `${AdminUserRoute}/update`
export const GetUser = `${AdminUserRoute}/get`
export const ChangeUserPassword = `${AdminUserRoute}/change-password`
export const UnlockUser = `${AdminUserRoute}/unlock`

// User Water Count
export const GetUserWaterCount = `${AdminUserRoute}/get-water`

// User Diet Feedback
export const GetUserDietFeedback = `${AdminV1Route}/user-diet-feedback/get`
export const GetUserDietFeedbackStats = `${AdminV1Route}/user-diet-feedback-stats/get`

// User Assign Feature
const AdminFeatureRoute = `${AdminV1Route}/user-feature`

export const AddUserAssignFeature = `${AdminFeatureRoute}/assign-feature`
export const UpdateUserAssignFeature = `${AdminFeatureRoute}/update-feature`
export const GetUserAssignFeature = `${AdminFeatureRoute}/assign-feature`

// User Assign Franchise
const AdminFranchiseRoute = `${AdminV1Route}/user-franchise`

export const AssignFranchise = `${AdminFranchiseRoute}/assign`
export const WithdrawFranchise = `${AdminFranchiseRoute}/withdraw`
export const GetAssignFranchise = `${AdminFranchiseRoute}/assign`

// User Exercise Feedback
const AdminExerciseFeedbackRoute = `${AdminV1Route}/user-exercise-feedback`

export const GetUserExerciseFeedback = `${AdminExerciseFeedbackRoute}/get`
export const GetUserExerciseFeedbackStats = `${AdminExerciseFeedbackRoute}/get-stats`
export const GetUserExerciseFeedbackStatsState = `${AdminExerciseFeedbackRoute}/get-user-stats`

// User Assign Plan
export const AssignUserPlan = `${AdminFeatureRoute}/assign-plan`
export const GetAssignUserPlan = `${AdminFeatureRoute}/get-plan-stats`
export const RemoveUserAssignPlan = `${AdminFeatureRoute}/remove-plan`

// User Selected Food
export const GetUserSelectedFood = `${AdminUserRoute}/user-selected-food`
export const AddUserSelectedFood = `${AdminUserRoute}/user-selected-food`

// User Weight
export const UserGetWeight = `${AdminUserRoute}/get-weight`
export const UserUpdateWeight = `${AdminUserRoute}/update-weight`
export const UserRemoveWeight = `${AdminUserRoute}/remove-weight`

// User Height
export const UserGetHeight = `${AdminUserRoute}/get-height`
export const UserUpdateHeight = `${AdminUserRoute}/update-height`
export const UserRemoveHeight = `${AdminUserRoute}/remove-height`

// VodCast
// Youtube Video
const YoutubeVideoRoute = `${AdminV1Route}/youtube-video`

export const AddYoutubeVideo = `${YoutubeVideoRoute}/add`
export const UpdateYoutubeVideo = `${YoutubeVideoRoute}/update`
export const GetYoutubeVideo = `${YoutubeVideoRoute}/get`
export const RemoveYoutubeVideo = `${YoutubeVideoRoute}/remove`

// User Body Analysis
const BodyAnalysisRoute = `${AdminV1Route}/user/body-analysis`

export const BodyAnalysis = BodyAnalysisRoute

// Complaint Chatbot
const ComplaintRoute = `${AdminV1Route}/complaint-chatbot`

export const CreateComplaint = `${ComplaintRoute}/create`
export const UpdateComplaint = `${ComplaintRoute}/update`
export const RemoveComplaint = `${ComplaintRoute}/remove`
export const GetComplaint = `${ComplaintRoute}/get`

// Motivation Song
const MotivationSongRoute = `${AdminV1Route}/motivation-song`

export const CreateMotivationSong = `${MotivationSongRoute}/add-song`
export const UpdateMotivationSong = `${MotivationSongRoute}/update-song`
export const RemoveMotivationSong = `${MotivationSongRoute}/remove-song`
export const GetMotivationSong = `${MotivationSongRoute}/get-song`

// orders
const OrdersRoute = `${AdminV1Route}/orders`

export const GetOrders = `${OrdersRoute}/get`

// User Location Logs
const UserLocationRoute = `${AdminV1Route}/user-location-logs`

export const GetUserLocation = `${UserLocationRoute}/get`

// Matrix
const MatrixRoute = `${AdminV1Route}/matrix`

export const GetMatrixData = `${MatrixRoute}/data`

// FWG Follow Up Report
const FwgFollowUpRoute = `${AdminV1Route}/fwg-follow-up`

export const CreateFwgFollowUpReport = `${FwgFollowUpRoute}/create`
export const AddFwgCallEntry = `${FwgFollowUpRoute}/add-call`
export const UpdateFwgCallEntry = `${FwgFollowUpRoute}/update-call`
export const GetFwgFollowUpReport = `${FwgFollowUpRoute}/get`