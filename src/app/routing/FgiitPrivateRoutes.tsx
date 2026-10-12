import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import FgiitAbandonedList from '../pages/fgiit/abandoned-list/abandoned-list'
import FgiitAddToCart from '../pages/fgiit/add-to-cart/add-to-cart'
import { AddAdminUser } from '../pages/fgiit/admin-user/add-admin-user'
import { AdminProfileView } from '../pages/fgiit/admin-user/admin-profile-view'
import AdminUserList from '../pages/fgiit/admin-user/admin-user-list'
import { EditAdminUser } from '../pages/fgiit/admin-user/edit-admin-user'
import BookDemoSession from '../pages/fgiit/book-demo-session/book-demo-session'
import { BookAdd } from '../pages/fgiit/books/book-add'
import { BookView } from '../pages/fgiit/books/book-view'
import Books from '../pages/fgiit/books/books'
import BusinessList from '../pages/fgiit/business-list/business'
import { BusinessEdit } from '../pages/fgiit/business-list/business-edit'
import BusinessView from '../pages/fgiit/business-list/business-view'
import CreateCertificate from '../pages/fgiit/certificate/create-certificate'
import ComplaintAssistant from '../pages/fgiit/complaint-assistant/complaint-assistant'
import ComplaintAssistantView from '../pages/fgiit/complaint-assistant/complaint-assistant-view'
import ContactInquiry from '../pages/fgiit/contact-inquiry/contact'
import ExampleComponent from '../pages/fgiit/contact-inquiry/contact-inquiry-view'
import RTPConsultancy from '../pages/fgiit/contact-inquiry/rtp-consultancy'
import RTPConsultancyView from '../pages/fgiit/contact-inquiry/rtp-consultancy-view'
import SeminarRegistration from '../pages/fgiit/contact-inquiry/seminar'
import { DashboardWrapper } from '../pages/fgiit/dashboard/DashboardWrapper'
import { E_BookAdd } from '../pages/fgiit/e-books/e-book-add'
import { E_BookView } from '../pages/fgiit/e-books/e-book-view'
import E_Books from '../pages/fgiit/e-books/e-books'
import AddAllocation from '../pages/fgiit/exam/add-allocation'
import AllocateExam from '../pages/fgiit/exam/allocate-exam'
import ExamAllocate from '../pages/fgiit/exam/exam'
import { Exam } from '../pages/fgiit/exam/exam-question'
import StudentResults from '../pages/fgiit/exam/exam-result'
import ExamView from '../pages/fgiit/exam/exam-view'
import { AddExpenseFgiit } from '../pages/fgiit/expense/create-expense'
import ExpenseListDetailsFgiit from '../pages/fgiit/expense/expense-details'
import BookFeedback from '../pages/fgiit/feedback/book-feedback'
import CourseFeedback from '../pages/fgiit/feedback/course-feedback'
import ProductFeedback from '../pages/fgiit/feedback/product-feedback'
import FitnessCourses from '../pages/fgiit/fitness-course/fitness'
import FitnessPlan from '../pages/fgiit/fitness-plan/fitness-plan'
import FranchiseList from '../pages/fgiit/franchise/franchise-list'
import FreeSession from '../pages/fgiit/free-session/free-session'
import InvestmentContactInquiry from '../pages/fgiit/investment-contact-inquiry/investment-contact-inquiry'
import CreateInvoiceFGIIT from '../pages/fgiit/invoice/create-invoice'
import TotalSalesListFgiit from '../pages/fgiit/invoice/total-sales'
import UpdateInvoiceFGIIT from '../pages/fgiit/invoice/update-invoice'
import FWGUpdateInvoicePage from '../pages/fgiit/invoice/update-invoice-fwg'
import JobPlacement from '../pages/fgiit/job-placement/JobPlacement'
import { JobPlacementAdd } from '../pages/fgiit/job-placement/JobPlacementAdd'
import { JobPlacementView } from '../pages/fgiit/job-placement/JobPlacementView'
import LectureComment from '../pages/fgiit/lectures-comments/lectute-comment'
import LectureCommentView from '../pages/fgiit/lectures-comments/lectute-comment-view'
import { LectureView } from '../pages/fgiit/lectures/lecture-view'
import { LecturesAdd } from '../pages/fgiit/lectures/lectures-add'
import Lecture from '../pages/fgiit/lectures/list-lecture'
import AllOrder from '../pages/fgiit/orders/all-order/all-order'
import { OrderView } from '../pages/fgiit/orders/all-order/order-view'
import BookOrder from '../pages/fgiit/orders/book/book-order'
import { BookOrderView } from '../pages/fgiit/orders/book/book-order-view'
import { BookUserOrderView } from '../pages/fgiit/orders/book/book-user-order-view'
import DigitalPlanOrder from '../pages/fgiit/orders/digital-plan/digital-plan-order'
import EBookOrder from '../pages/fgiit/orders/e-book/e-book-order'
import FitnessOrder from '../pages/fgiit/orders/fitness-course/fitness'
import FitnessPlanOrder from '../pages/fgiit/orders/fitness-plan/fitness-plan'
import CreatePersonalInvoice from '../pages/fgiit/personal-invoice/create-personal-invoice'
import TotalSalesListPersonal from '../pages/fgiit/personal-invoice/personal-total-sales'
import UpdateInvoicePersonal from '../pages/fgiit/personal-invoice/update-invoice'
import ProjectDetails from '../pages/fgiit/project-submission/project-details'
import ProjectSubmission from '../pages/fgiit/project-submission/project-submission'
import RTPSession from '../pages/fgiit/rtp-session/rtp-session'
import { ScholarOrderView } from '../pages/fgiit/scholarship-result/scholar-order-view'
import ScholarshipResult from '../pages/fgiit/scholarship-result/ScholarshipResult'
import SubmissionResult from '../pages/fgiit/scholarship-result/SubmissionResult'
import BatchView from '../pages/fgiit/student-batch/add-batch'
import StudentBatch from '../pages/fgiit/student-batch/student-batch'
import StudentsDashboard from '../pages/fgiit/student-dashboard/student-dashboard'
import StudentsUser from '../pages/fgiit/student-dashboard/student-user'
import SubscriptionPlanList from '../pages/fgiit/subscription-plan/subscription-plan'
import SubscriptionPlanAdd from '../pages/fgiit/subscription-plan/subscription-plan-add'
import SubscriptionPlanView from '../pages/fgiit/subscription-plan/subscription-plan-view'
import SubscriptionList from '../pages/fgiit/subscription/subscription'
import SubscriptionAdd from '../pages/fgiit/subscription/subscription-add'
import SubscriptionInvoice from '../pages/fgiit/subscription/subscription-invoice'
import SubscriptionView from '../pages/fgiit/subscription/subscription-view'
import EmployeeInquiry from '../pages/fgiit/training-placement/employee'
import { EmployeeView } from '../pages/fgiit/training-placement/employee-view'
import EmployerInquiry from '../pages/fgiit/training-placement/employer'
import { EmployerView } from '../pages/fgiit/training-placement/employer-view'
import UserFitnessCourses from '../pages/fgiit/users/fitness-course/fitness'
import { FitnessView } from '../pages/fgiit/users/fitness-course/fitness-view'
import AddUserForm from '../pages/fgiit/users/users/add-user'
import Users from '../pages/fgiit/users/users/users'
import { UserView } from '../pages/fgiit/users/users/view-user'
import AppFeedback from '../pages/fgiit/app-feedback/app-feedback'
import { InptaTPEdit } from '../pages/fgiit/inpta-tp-list/inpta-tp-edit'
import InptaTPListing from '../pages/fgiit/inpta-tp-list/inpta-tp'
import InptaTPView from '../pages/fgiit/inpta-tp-list/inpta-tp-view'
import InptaTCView from '../pages/fgiit/inpta-tc-list/inpta-tc-view'
import InptaTCListing from '../pages/fgiit/inpta-tc-list/inpta-tc'
import { InptaTCEdit } from '../pages/fgiit/inpta-tc-list/inpta-tc-edit'
import StudentPlacement from '../pages/fgiit/student-placement/student-placement'
import UserLocationList from '../pages/fgiit/user-location/user-location-list'
import IptnaInquiryList from '../pages/fgiit/iptna/iptna-inquiry-list'
import FitnessCoursesView from '../pages/fgiit/fitness-course/fitness-courses-view'
import BroadcastList from '../pages/fgiit/broadcast/broadcast-list'
import CreateBroadcastTemplate from '../pages/fgiit/broadcast/create-broadcast'
import ContactList from '../pages/fgiit/broadcast-contact/contact-list'
import SendBroadcastTemplate from '../pages/fgiit/broadcast/send-broadcast'
import ViewTeleReport from '../pages/fgiit/tele-report/view-tele-report'
import ViewTeleReportList from '../pages/fgiit/tele-report/tele-report-list'
import BrandAndGroupManagement from '../pages/fgiit/broadcast-contact/brand-and-group-management'
import ViewTeleReportInnerList from '../pages/fgiit/tele-report/tele-report-inner-list'
import BroadcastActiveChats from '../pages/fgiit/broadcast-active-chats/broadcast-active-chats'
import LecturesEdit from '../pages/fgiit/lecture-management/lectures-edit'
import LecturesList from '../pages/fgiit/lecture-management/lectures-list'
import LecturesCreate from '../pages/fgiit/lecture-management/lectures-create'
import MentorList from '../pages/fgiit/lecture-management/mentor-list'
import LectureOverview from '../pages/fgiit/lecture-management/lectures-overview'
import LecturesSyllabusList from '../pages/fgiit/lecture-management/lectures-syllabus-list'
import ChapterDetail from '../pages/fgiit/lecture-management/chapter-detail'
import CourseSyllabus from '../pages/fgiit/lecture-management/course-syllabus'
import LectureBatchDetail from '../pages/fgiit/lecture-management/lecture-batch-detail'
import CoursesList from '../pages/fgiit/lecture-management/courses-list'
import UpdateFollowUpReport from '../pages/fgiit/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/fgiit/follow-up-report/view-follow-up-report'
import AddFollowUpReport from '../pages/fgiit/follow-up-report/add-follow-up-report'
import FollowUpReportList from '../pages/fgiit/follow-up-report/follow-up-report-list'
import FollowUpReportInnerList from '../pages/fgiit/follow-up-report/follow-up-report-inner-list'
import FollowUpReportDashboard from '../pages/fgiit/follow-up-report/follow-up-report-dashboard'
const FgiitPrivateRoutes = () => {
	const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

	return (
		<Routes>
			<Route element={<MasterLayout />}>
				{/* <Route path='dashboard' element={<DashboardWrapper />} /> */}
				<Route
					path='franchise/franchise-list'
					element={<FranchiseList />}
				/>
				<Route
					path='contact-inquiry/contact'
					element={<ContactInquiry />}
				/>
				<Route
					path='contact-inquiry/contact-inquiry-view'
					element={<ExampleComponent />}
				/>
				<Route
					path='complaint-assistant'
					element={<ComplaintAssistant />}
				/>
				<Route
					path='complaint-assistant-view'
					element={<ComplaintAssistantView />}
				/>
				<Route
					path='business-list/business'
					element={<BusinessList />}
				/>
				<Route
					path='business-list/edit-list'
					element={<BusinessEdit />}
				/>
				<Route
					path='business-list/business-view'
					element={<BusinessView />}
				/>
				<Route
					path='inpta/tp-listing'
					element={<InptaTPListing />}
				/>
				<Route
					path='inpta/tp-edit-listing'
					element={<InptaTPEdit />}
				/>
				<Route
					path='inpta/tp-view-listing'
					element={<InptaTPView />}
				/>
				<Route
					path='inpta/tc-listing'
					element={<InptaTCListing />}
				/>
				<Route
					path='inpta/tc-edit-listing'
					element={<InptaTCEdit />}
				/>
				<Route
					path='inpta/tc-view-listing'
					element={<InptaTCView />}
				/>
				<Route
					path='iptna/inquiry-list'
					element={<IptnaInquiryList />}
				/>
				<Route
					path='student-dashboard'
					element={<StudentsDashboard />}
				/>
				<Route
					path='student-user'
					element={<StudentsUser />}
				/>
				<Route
					path='users/view-user'
					element={<UserView />}
				/>
				<Route
					path='users/add-user'
					element={<AddUserForm />}
				/>
				<Route
					path='/exam'
					element={<ExamAllocate />}
				/>
				<Route
					path='/exam-view'
					element={<ExamView />}
				/>
				<Route
					path='/exam-question'
					element={<Exam />}
				/>
				<Route
					path='allocate-exam'
					element={<AllocateExam />}
				/>
				<Route
					path='allocate-exam-add'
					element={<AddAllocation />}
				/>
				<Route
					path='/student-batch'
					element={<StudentBatch />}
				/>
				<Route
					path='/student-batch-add'
					element={<BatchView />}
				/>
				<Route
					path='/project-submission'
					element={<ProjectSubmission />}
				/>
				<Route
					path='/project-submission-details'
					element={<ProjectDetails />}
				/>
				<Route
					path='fitness-plan'
					element={<FitnessPlan />}
				/>
				<Route
					path='free-session'
					element={<FreeSession />}
				/>
				<Route
					path='/automation/broadcast/list'
					element={<BroadcastList />}
				/>
				<Route
					path='/automation/broadcast/create-template'
					element={<CreateBroadcastTemplate />}
				/>
				<Route
					path='/automation/broadcast/send-template'
					element={<SendBroadcastTemplate />}
				/>
				<Route
					path='/automation/contact/list'
					element={<ContactList />}
				/>
				<Route
					path='/automation/brand-and-group-management'
					element={<BrandAndGroupManagement />}
				/>
				<Route
					path='/automation/broadcast/active-chats'
					element={<BroadcastActiveChats />}
				/>

				{/*  */}
				<Route
					path='/fitness-courses'
					element={<FitnessCourses />}
				/>
				<Route
					path='/fitness-courses-view'
					element={<FitnessCoursesView />}
				/>
				<Route
					path='/scholarship-result'
					element={<ScholarshipResult />}
				/>
				<Route
					path='/scholarship-result/submissionResult'
					element={<SubmissionResult />}
				/>
				<Route
					path='/scholarship-result/UserDetails'
					element={<UserView />}
				/>
				<Route
					path='/books'
					element={<Books />}
				/>
				<Route
					path='/books/book-view'
					element={<BookView />}
				/>
				<Route
					path='/books/book-add'
					element={<BookAdd />}
				/>
				<Route
					path='/e-book'
					element={<E_Books />}
				/>
				<Route
					path='/e-book-view'
					element={<E_BookView />}
				/>
				<Route
					path='/e-book-add'
					element={<E_BookAdd />}
				/>
				<Route
					path='/lectures'
					element={<Lecture />}
				/>
				<Route
					path='/lectures-add'
					element={<LecturesAdd />}
				/>
				<Route
					path='/lectures-view'
					element={<LectureView />}
				/>
				<Route
					path='/lecture-comment'
					element={<LectureComment />}
				/>
				<Route
					path='/lecture-comment-view'
					element={<LectureCommentView />}
				/>
				<Route
					path='/job-placement'
					element={<JobPlacement />}
				/>
				<Route
					path='/job-placement-add'
					element={<JobPlacementAdd />}
				/>
				<Route
					path='/job-placement-view'
					element={<JobPlacementView />}
				/>
				<Route
					path='/users'
					element={<Users />}
				/>
				<Route
					path='/diet-prefrence'
					element={<UserFitnessCourses />}
				/>
				<Route
					path='/fitness-view'
					element={<FitnessView />}
				/>
				<Route
					path='/all-order'
					element={<AllOrder />}
				/>
				<Route
					path='/all-order/view-order'
					element={<OrderView />}
				/>
				<Route
					path='/fitness-course-order'
					element={<FitnessOrder />}
				/>
				<Route
					path='/user/user-fitness-course-view'
					element={<ScholarOrderView />}
				/>
				<Route
					path='/book-order'
					element={<BookOrder />}
				/>
				<Route
					path='/book-order-view'
					element={<BookOrderView />}
				/>
				<Route
					path='/book-user-order-view'
					element={<BookUserOrderView />}
				/>
				<Route
					path='/digital-plan-order'
					element={<DigitalPlanOrder />}
				/>
				<Route
					path='/fitness-plan-order'
					element={<FitnessPlanOrder />}
				/>
				<Route
					path='/employee-inquiry'
					element={<EmployeeInquiry />}
				/>
				<Route
					path='/employee-inquiry-view'
					element={<EmployeeView />}
				/>
				<Route
					path='/employer-inquiry'
					element={<EmployerInquiry />}
				/>
				<Route
					path='/employer-inquiry-view'
					element={<EmployerView />}
				/>
				<Route
					path='/e-book-order'
					element={<EBookOrder />}
				/>
				<Route
					path='admin-user'
					element={<AdminUserList />}
				/>
				<Route
					path='admin-user-edit'
					element={<EditAdminUser />}
				/>
				<Route
					path='admin-user-add'
					element={<AddAdminUser />}
				/>
				<Route
					path='admin-user/admin-profile'
					element={<AdminProfileView />}
				/>

				{/* Inquiry  */}
				<Route
					path='rtp-consultancy'
					element={<RTPConsultancy />}
				/>
				<Route
					path='rtp-consultancy/view'
					element={<RTPConsultancyView />}
				/>
				<Route
					path='seminar-registration'
					element={<SeminarRegistration />}
				/>

				{/* Feedback  */}
				<Route
					path='course-feedback'
					element={<CourseFeedback />}
				/>
				<Route
					path='product-feedback'
					element={<ProductFeedback />}
				/>
				<Route
					path='book-feedback'
					element={<BookFeedback />}
				/>

				{/* Invoice  */}
				<Route
					path='/invoice/create'
					element={<CreateInvoiceFGIIT />}
				/>
				<Route
					path='invoice/update'
					element={<UpdateInvoiceFGIIT />}
				/>
				<Route
					path='invoice/fwg-update'
					element={<FWGUpdateInvoicePage />}
				/>
				<Route
					path='/invoice/list'
					element={<TotalSalesListFgiit />}
				/>

				{/* Personal Invoice  */}
				<Route
					path='/personal-invoice/create'
					element={<CreatePersonalInvoice />}
				/>
				<Route
					path='/personal-invoice/update'
					element={<UpdateInvoicePersonal />}
				/>
				<Route
					path='/personal-invoice/list'
					element={<TotalSalesListPersonal />}
				/>

				<Route
					path='/investment-contact-inquiry'
					element={<InvestmentContactInquiry />}
				/>
				<Route
					path='/rtp-session'
					element={<RTPSession />}
				/>
				<Route
					path='/book-bemo-session'
					element={<BookDemoSession />}
				/>

				<Route
					path='create-expense'
					element={<AddExpenseFgiit />}
				/>
				<Route
					path='expense-details'
					element={<ExpenseListDetailsFgiit />}
				/>
				<Route
					path='expense-update'
					element={<AddExpenseFgiit />}
				/>

				<Route
					path='exam-result'
					element={<StudentResults />}
				/>

				<Route
					path='create-certificate'
					element={<CreateCertificate />}
				/>

				<Route
					path='/cart/add-to-cart'
					element={<FgiitAddToCart />}
				/>
				<Route
					path='/cart/abandoned-list'
					element={<FgiitAbandonedList />}
				/>

				{/* Subscription  */}
				<Route
					path='/plan/'
					element={<SubscriptionPlanList />}
				/>
				<Route
					path='/plan/create'
					element={<SubscriptionPlanAdd />}
				/>
				<Route
					path='/plan/view'
					element={<SubscriptionPlanView />}
				/>
				<Route
					path='/subscription/'
					element={<SubscriptionList />}
				/>
				<Route
					path='/subscription/create'
					element={<SubscriptionAdd />}
				/>
				<Route
					path='/subscription/view'
					element={<SubscriptionView />}
				/>
				<Route
					path='/subscription/invoice/view'
					element={<SubscriptionInvoice />}
				/>

				<Route
					path='app-feedback'
					element={<AppFeedback />}
				/>

				<Route
					path='mentors'
					element={<MentorList />}
				/>

				<Route
					path='lecture-edit'
					element={<LecturesEdit />}
				/>
				<Route
					path='lectures-create'
					element={<LecturesCreate />}
				/>
				<Route
					path='lectures-list'
					element={<LecturesList />}
				/>

				{/* Student Placement */}
				<Route
					path='/student-placement'
					element={<StudentPlacement />}
				/>

				<Route
					path='user-location'
					element={<UserLocationList />}
				/>

				<Route
					path='/tele-report-list'
					element={<ViewTeleReportList />}
				/>
				<Route
					path='/tele-report-inner-list'
					element={<ViewTeleReportInnerList />}
				/>
				<Route
					path='/view-tele-report'
					element={<ViewTeleReport />}
				/>

				<Route
					path='lecture-edit'
					element={<LecturesEdit />}
				/>
				<Route
					path='lectures-create'
					element={<LecturesCreate />}
				/>
				<Route
					path='lectures-list'
					element={<LecturesList />}
				/>

				<Route
					path='mentors'
					element={<MentorList />}
				/>
				<Route
					path='lecture-overview'
					element={<LectureOverview />}
				/>
				<Route
					path='lectures-syllabus-list'
					element={<LecturesSyllabusList />}
				/>

				<Route
					path='chapter-detail'
					element={<ChapterDetail />}
				/>
				<Route
					path='coursesyllabus'
					element={<CourseSyllabus />}
				/>
				<Route
					path='lecture-batch-detail'
					element={<LectureBatchDetail />}
				/>

				<Route
					path='courslist'
					element={<CoursesList />}
				/>
				{/* Lazy Modules */}
				<Route
					path='admin-user'
					element={
						<SuspensedView>
							<UsersPage />
						</SuspensedView>
					}
				/>

				{/* fgiit route */}
				<Route
					path='dashboard'
					element={<DashboardWrapper />}
				/>
				{/* Page Not Found */}
				<Route
					path='*'
					element={<Navigate to='/error/404' />}
				/>
				{/* Follow Up Report */}
				<Route
					path='/follow-up-report-dashboard'
					element={<FollowUpReportDashboard />}
				/>
				<Route
					path='/follow-up-report-inner-list'
					element={<FollowUpReportInnerList />}
				/>
				<Route
					path='/follow-up-report-list'
					element={<FollowUpReportList />}
				/>
				<Route
					path='/add-follow-up-report'
					element={<AddFollowUpReport />}
				/>
				<Route
					path='/view-follow-up-report'
					element={<ViewFollowUpReport />}
				/>
				<Route
					path='/update-follow-up-report'
					element={<UpdateFollowUpReport />}
				/> 
			</Route>
		</Routes>
	)
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
	const baseColor = getCSSVariableValue('--bs-primary')
	TopBarProgress.config({
		barColors: {
			'0': baseColor,
		},
		barThickness: 1,
		shadowBlur: 5,
	})
	return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { FgiitPrivateRoutes }
