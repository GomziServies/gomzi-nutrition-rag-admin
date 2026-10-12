/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'
import { GetProduct } from '../../../Functions/FGGroup'

type Props = {
	className: string
	color: string
	dashboardData: any
	Amount: any
}

const NutritionTotalProductOrder: React.FC<Props> = ({
	className,
	color,
	dashboardData,
	Amount,
}) => {
	const [productData, setProductData] = useState()

	const fetchProductData = async () => {
		try {
			const response = await GetProduct()
			setProductData(response?.data?.length)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchProductData()
	}, [])

	return (
		<div className={`card ${className} p-0`}>
			<div
				style={{ padding: '0!important' }}
				className='p-0'>
				<div className={`px-9 pt-7 card-rounded h-200px w-100 bg-${color}`}>
					{/* <div className='d-flex flex-stack'>
						<h3 className='m-0 text-white fw-bold fs-3'>Nutrition Product</h3>
						<div className='ms-1'>
							<Link
								to={'/rag/product-order'}
								className={`btn btn-sm btn-icon btn-color-white btn-active-white border-0 me-n3`}>
								<KTIcon
									iconName='category'
									className='fs-2'
								/>
							</Link>
						</div>
					</div> */}
					<div className='d-flex text-center flex-column text-white pt-8'>
						<span className='fw-semibold fs-3'>Nutrition Product</span>
					</div>
					{/* <div className='d-flex text-center flex-column text-white pt-8'>
						<span className='fw-semibold fs-7'>Order Amount</span>
						<span className='fw-bold fs-2x pt-1'>
							<CurrencyFormatter amount={parseInt(Amount)} />
						</span>
					</div> */}
				</div>
				<div
					className='shadow-xs card-rounded mx-9 mb-9 px-6 py-8 position-relative z-index-1 bg-body'
					style={{ marginTop: '-100px' }}>
					<div className='d-flex align-items-center mb-6'>
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='dollar'
									className='fs-1'
								/>
							</span>
						</div>
						<div className='d-flex align-items-center flex-wrap w-100'>
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/rag/product-order'}
									className='fs-5 text-gray-800  fw-bold'>
									Product Order
								</Link>
							</div>
							{/* <div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>{dashboardData || 0}</div>
							</div> */}
						</div>
					</div>
					<div className='d-flex align-items-center mb-6'>
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='category'
									className='fs-1'
								/>
							</span>
						</div>
						<div className='d-flex align-items-center flex-wrap w-100'>
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/rag/product-list'}
									className='fs-5 text-gray-800  fw-bold'>
									Products
								</Link>
							</div>
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>{productData}</div>
							</div>
						</div>
					</div>
					<div className='d-flex align-items-center mb-0'>
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='messages'
									className='fs-1'
								/>
							</span>
						</div>
						<div className='d-flex align-items-center flex-wrap w-100'>
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/rag/nutrition-product-feedback'}
									className='fs-5 text-gray-800  fw-bold'>
									Product Feedbacks
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { NutritionTotalProductOrder }
