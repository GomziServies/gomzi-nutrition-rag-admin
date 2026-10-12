import {
	faDollarSign,
	faHandHoldingUsd,
	faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	StatisticsWidget2,
} from '../../../../_metronic/partials/widgets'
import {
	GetDashboardStats,
	GetExercisePlan,
	GetExpenseStats,
	GetInvoice,
} from '../../../Functions/FWG'
import { ListsWidgetGCS } from './list-widget'
import { ListsWidgetGCSUser } from './list-widget2'

type DashboardStats = {
	total_users: number
	user_assigned_plan: number
}

type Invoice = {
	date: string
	totalPayment: number
	paidPayment: number
}
const GcsDashboard = () => {
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
	const fetchData = async () => {
		try {
			const response: any = await GetDashboardStats()
			setDashboardStats(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}
	const [invoiceData, setInvoiceData] = useState<any>([])

	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetInvoice()
			setInvoiceData(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}
	const [expenseData, setExpenseData] = useState<any>([])

	const fetchExpenseData = async () => {
		try {
			const response: any = await GetExpenseStats()
			setExpenseData(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const [exercisePlan, setExercisePlan] = useState<number>(0)
	const fetchExercisePlan = async () => {
		try {
			const response: any = await GetExercisePlan()
			setExercisePlan(response.data.length)
		} catch (error: any) {
			console.error(error)
		}
	}
	const totalPaidAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.paidPayment),
		0
	)
	const totalAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.totalPayment),
		0
	)
	const totalExpenseAmount = expenseData.reduce(
		(sum: number, invoice: any) => sum + parseFloat(invoice.expenseAmount),
		0
	)
	const totalDueAmount = totalAmount - totalPaidAmount
	const formattedTotalAmount = totalAmount.toLocaleString()
	const formattedTotalDueAmount = totalDueAmount.toLocaleString()
	const formattedTotalExpenseAmount = totalExpenseAmount.toLocaleString()

	useEffect(() => {
		fetchData()
		fetchInvoiceData()
		fetchExpenseData()
		fetchExercisePlan()
	}, [])

	if (!dashboardStats) {
		return null
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>DASHBOARD</PageTitle>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>Gomzi Consultancy Service</h1>
			<div className='row g-5 g-xl-5'>
            <div className='col-lg-4'>
					<StatisticsWidget2
						className='card'
						Icon={faDollarSign}
						color='warning'
						title={formattedTotalAmount}
						description='Total Income'
					/>
			</div>
			<div className='col-lg-4'>
					<StatisticsWidget2
						className='card'
						Icon={faHandHoldingUsd}
						color='danger'
						title={formattedTotalExpenseAmount}
						description='Total Cost'
					/>
				</div>
                <div className='col-lg-4'>
					<StatisticsWidget2
						className='card'
						Icon={faWallet}
						color='info'
						title={formattedTotalDueAmount}
						description='Due Amount'
					/>
				</div>
				<div className='col-md-12'>
					<h2 className='fw-bold text-dark fs-1 '>Charts</h2>
				</div>
				 <div className='col-xl-4'>
            <ListsWidgetGCSUser className='card-xl-stretch mb-xl-8' />
          </div>
				
                <div className='col-xl-4'>
            <ListsWidgetGCS className='card-xl-stretch mb-xl-8' />
          </div>
			</div>
		</>
	)
}

export { GcsDashboard }
