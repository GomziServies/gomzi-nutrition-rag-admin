export const feedbackStatus = {
	pending: 'PENDING',
	approved: 'APPROVED',
	rejected: 'REJECTED',
}

export const orderStatus = {
	success: 'SUCCESS', // After Successful Payment
	pending: 'PENDING', // Before Successful Payment
	failed: 'FAILED', // Failed due to not paid for long time
	cancelled: 'CANCELLED', // Cancelled by user
	refunded: 'REFUNDED', // Refunded by admin
}

export const itemType = {
	meals: 'FG_MEAL_PRODUCT', // Ref.: FG Meals Product
	pt_plan: 'PT_PLAN', // Ref.: FWG > PT Plan
	fitness_course: 'FITNESS_COURSE', // Ref.: FG IIT > Fitness Course,
	digital_plan: 'DIGITAL_PLAN', // Ref.: FG Digital > Digital Plan
	books: 'BOOKS', // Ref.: Books [FGIIT]
	ebooks: 'EBOOKS', // Ref.: E-Books [FGIIT]
}

export const shipmentStatus = {
	placed: 'PLACED',
	dispatched: 'DISPATCHED',
	delivered: 'DELIVERED',
	cancelled: 'CANCELLED',
	returned: 'RETURN',
}

export const projectSubmissionStatus = {
	submitted: 'Submitted',
	reassigned: 'Reassigned',
	rejected: 'Rejected',
	approved: 'Approved',
}

export type StudentBatchTimeTableType = [
	{
		id?: string
		date: string // YYYY/MM/DD
		end_date?: string // YYYY/MM/DD
		frequency_interval?: FrequencyInterval
		note?: string
		time?: {
			start_time?: string // HH:MM
			end_time?: string // HH:MM
		}
		meeting_link?: {
			link?: string
			platform?: string
			join_password?: string
		}
	}
]

export const timeUnit = {
	day: 'DAY',
	week: 'WEEK',
	month: 'MONTH',
	year: 'YEAR',
}
export type TimeUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

export type FrequencyInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export const certificateCourses = {
	CertifiedPersonalTrainer: 'Certified Personal Trainer',
	CertifiedDietitianCourse: 'Certified Dietitian Course',
	AnabolicAndrogenicSteroids: 'Anabolic Androgenic Steroids',
	TabataWorkshop: 'Tabata Workshop',
	InjuryRehabCourse: 'Injury Rehab Course',
	CertifiedWellnessConsultant: 'Certified Wellness Consultant',
	DiplomaGymManagement: 'Diploma in Gym Management',
	PythonProgramming: 'Python Programming',
	GroupInstructorMasterclass: 'Group Instructor Masterclass',
}

export type TypeAvailableCertificates =
	| 'Certified Personal Trainer'
	| 'Certified Dietitian Course'
	| 'Anabolic Androgenic Steroids'
	| 'Tabata Workshop'
	| 'Injury Rehab Course'
	| 'Certified Wellness Consultant'
	| 'Diploma in Gym Management'
	| 'Python Programming'
	| 'Group Instructor Masterclass'
