type FeedbackStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED'
type OrderStatusValue = 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
type OrderItemTypeValue =
	| 'FG_MEAL_PRODUCT'
	| 'PT_PLAN'
	| 'FITNESS_COURSE'
	| 'DIGITAL_PLAN'
	| 'BOOKS'
	| 'EBOOKS'
	| 'PURE_GO_MEAL_PRODUCT'
	| 'GYM_MEMBERSHIP'
type ShipmentStatusValue = 'PLACED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURN'
type ProjectSubmissionStatusValue = 'Reassigned' | 'Rejected' | 'Approved'

// API Response
type FGGroupAPIResponse = {
	status: number
	response: string
	message?: string
	data?: object | object[] | any
	error?: string
	customCode?: string
	metadata?: object
	_developer?: string | object | object[]
}

type FitnessCourseType = 'Online Course' | 'Offline Course' | 'Flexible Learning'

type FitnessCourseCertificateOptions = {
	user_fitness_course_id: string
	generate_type: 'AUTO' | 'MANUAL'
	certificate_data?: generate_type extends 'AUTO'
		? {
				name: string
				passing_date: string
				instructor: string
				certificate:
					| 'Certified Personal Trainer'
					| 'Certified Dietitian Course'
					| 'Anabolic Androgenic Steroids'
					| 'Tabata Workshop'
					| 'Injury Rehab Course'
					| 'Certified Wellness Consultant'
					| 'Diploma in Gym Management'
					| 'Python Programming'
					| 'Group Instructor Masterclass'
		  }
		: undefined
}

type FGGroupSearchOptions = {
	search?: string
	status?: string
}

type InventorySearchOption = {
	search?: string
	product_id?: string
	variant_id?: string
	source?: string
	transaction_type?: string
}

type FGGroupPaginationOptions = {
	page?: number
	limit?: number
	skip?: number
}

type FGGroupSortOptions = {
	sort?: string
	sortOrder?: QuerySortOptions
}

type PaymentGateway =
	| 'RAZORPAY'
	| 'RAZORPAY_FGIIT'
	| 'RAZORPAY_FGMEALS'
	| 'RAZORPAY GOMZI CONSULTING'
