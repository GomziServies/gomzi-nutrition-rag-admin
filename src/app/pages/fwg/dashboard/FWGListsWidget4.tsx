/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCircleDollarToSlot, faDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { GetInvoice } from '../../../Functions/FWG'

type Props = {
	className?: string
	chartColor: string
	chartHeight: string
}

const FWGListsWidget4: React.FC<Props> = ({ className, chartColor, chartHeight }) => {
	const [totalInvoicesFGIIT, setTotalInvoicesFGIIT] = useState<number>(0)
	const [totalInvoicesFWG, setTotalInvoicesFWG] = useState<number>(0)

	const fetchData = async () => {
		try {
			const response: any = await GetInvoice()
			const invoicesFGIIT = response.data.filter(
				(invoice: any) => invoice.selectedCompany === 'FGIIT'
			)
			const invoicesFWG = response.data.filter((invoice: any) => invoice.selectedCompany === 'FWG')
			setTotalInvoicesFGIIT(invoicesFGIIT.length)
			setTotalInvoicesFWG(invoicesFWG.length)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	return (
		<div className='card mb-xl-8'>
			<div>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Invoice Data</span>
					</h3>
				</div>

				<div className='card-body pt-5'>
					<div className='d-flex align-items-sm-center mb-7'>
						<div className='symbol symbol-50px me-5'>
							<span className='symbol-label'>
								<FontAwesomeIcon
									icon={faCircleDollarToSlot}
									className='text-primary fs-3'
								/>
							</span>
						</div>
						<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
							<div className='flex-grow-1 me-2'>
								<div className='text-gray-800  fs-6 fw-bold'>
									Total FGIIT Invoice
								</div>
							</div>
							<div className='badge badge-primary fw-semibold py-4 px-3'>{totalInvoicesFGIIT}</div>
						</div>
					</div>

					<div className='d-flex align-items-sm-center mb-7'>
						<div className='symbol symbol-50px me-5'>
							<span className='symbol-label'>
								<FontAwesomeIcon
									icon={faCircleDollarToSlot}
									className='text-info fs-3'
								/>
							</span>
						</div>
						<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
							<div className='flex-grow-1 me-2'>
								<div className='text-gray-800  fs-6 fw-bold'>
									Total FWG Invoice
								</div>
							</div>
							<div className='badge badge-info fw-semibold py-4 px-3'>{totalInvoicesFWG}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { FWGListsWidget4 }
