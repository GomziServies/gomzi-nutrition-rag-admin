import { faCheckCircle, faClock, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import SelectFieldManual from '../../../components/SelectFieldManual'
import {
	GetProduct,
	GetReferralCoupon,
	GetReferralCouponUsage,
	GetTrainers,
} from '../../../Functions/FGGroup'

type InvoiceCategory = 'Private' | 'FG Group' | 'Gomzi Nutrition'

const TrainerDashboard = () => {
	const [trainerData, setTrainerData] = useState<any>()
	const [couponData, setCouponData] = useState<any[]>([])
	const [singleCouponData, setSingleCouponData] = useState<any>()
	const [totalDiscountAmount, setTotalDiscountAmount] = useState<number>(0)
	const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
	const [loading, setLoading] = useState(false)
	const fgGroupInfo: any = localStorage.getItem('fg_group_info')
	const data = JSON.parse(fgGroupInfo)

	const fetchData = async () => {
		try {
			const response: any = await GetTrainers({ id: data._id })
			setTrainerData(response.data[0])
			setCouponData(response.data[0].trainer.coupon_assign)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const getCouponData = async (coupon_code: string) => {
		try {
			const response: any = await GetReferralCoupon({ coupon_code })
			setSingleCouponData(response.data[0])
			return response.data[0]
		} catch (error: any) {
			console.error(error)
			return null
		}
	}

	const fetchProductAmount = async (id: string): Promise<number> => {
		try {
			const response: any = await GetProduct({ id })
			return response.data[0]?.price || 0
		} catch (error: any) {
			console.error(error)
			return 0
		}
	}

	const fetchCouponUsage = async (couponId: string, couponData: any) => {
		setLoading(true)
		try {
			const response: any = await GetReferralCouponUsage({ coupon_id: couponId })
			const data = response.data[0]
			if (!data.orders || !Array.isArray(data.orders)) {
				console.error('Orders data is not available or not an array')
				return
			}

			const discount = couponData?.discount || 0

			const discountAmounts = await Promise.all(
				data.orders.map(async (order: any) => {
					const price = order.amount
					const discountAmount = (price * discount) / 100
					return discountAmount
				})
			)

			const totalDiscount = discountAmounts.reduce((acc: number, curr: number) => acc + curr, 0)
			setTotalDiscountAmount(totalDiscount)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const couponOption = couponData?.map((data: any) => ({
		name: data.title,
		value: data.coupon_id,
	}))

	const handleCouponSelect = async (
		event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
	) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedId = event.target.value

			if (selectedId === 'Select Coupon') {
				setSelectedCoupon(null)
			} else {
				const selectedCouponObj = couponData.find((el: any) => el.coupon_id === selectedId)
				if (selectedCouponObj) {
					setSelectedCoupon(selectedCouponObj)
					const couponDetails = await getCouponData(selectedCouponObj.coupon_code)
					if (couponDetails) {
						await fetchCouponUsage(selectedCouponObj.coupon_id, couponDetails)
					}
				}
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<>
				<div className='row mb-5 nutri-trainer'>
					<div className='col-md-12'>
						<div className='card'>
							<div
								className='card-header'
								style={{ backgroundColor: 'white', border: 'none' }}>
								<h5
									className='card-title'
									style={{ fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
									Gomzi Nutrition Details
								</h5>
								<SelectFieldManual
									className='col-md-4 fv-row'
									label='Coupon'
									showLabel={false}
									name='coupon_id'
									value={selectedCoupon?.coupon_id}
									onChange={handleCouponSelect}
									htmlFor='Coupon'
									options={couponOption}
								/>
							</div>
							<div className='my-1 card-body'>
								<div className='row text-center'>
									<div className='col-md-4'>
										<div className='p-3 rounded shadow-sm'>
											<FontAwesomeIcon
												icon={faClock}
												className='text-warning fs-3 mb-2'
											/>
											<h2 className='card-title mb-1 text-warning'>
												{singleCouponData?.usage_count || 0}
											</h2>
											<p
												className='text-warning mb-0'
												style={{ fontSize: '16px' }}>
												Total Usages
											</p>
										</div>
									</div>
									<div className='col-md-4'>
										<div className='p-3 rounded shadow-sm'>
											<FontAwesomeIcon
												icon={faCheckCircle}
												className='text-primary fs-3 mb-2'
											/>
											<h2 className='card-title mb-1 text-primary'>
												{singleCouponData?.max_usage_count || 0}
											</h2>
											<p
												className='text-primary mb-0'
												style={{ fontSize: '16px' }}>
												Max Usage Count
											</p>
										</div>
									</div>
									<div className='col-md-4'>
										<div className='p-3 rounded shadow-sm'>
											<FontAwesomeIcon
												icon={faTimesCircle}
												className='text-success fs-3 mb-2'
											/>
											<h2 className='card-title mb-1 text-success'>
												₹ {totalDiscountAmount.toFixed(2) || 0}/-
											</h2>
											<p
												className='text-success mb-0'
												style={{ fontSize: '16px' }}>
												Approved
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='row nutri-trainer'>
					<div className='col-md-12'>
						<div className='card'>
							<div
								className='card-header'
								style={{ backgroundColor: 'white', border: 'none' }}>
								<h5
									className='card-title'
									style={{ fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
									Affiliate Coupon
								</h5>
							</div>
							<div className='card-body'>
								<div className='input-group mb-3'>
									<CopyableInput
										placeholder='Coupon'
										type='text'
										className='col-md-12 fv-row'
										name='coupon_code'
										label='Coupon'
										htmlFor='coupon_code'
										value={singleCouponData?.coupon_code || 'N/A'}
										disabled
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}

export { TrainerDashboard }
