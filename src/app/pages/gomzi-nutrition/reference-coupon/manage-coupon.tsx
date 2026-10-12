import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Modal, OverlayTrigger } from 'react-bootstrap'
import CopyToClipboard from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	CreateReferralCoupon,
	GetReferralCoupon,
	GetTrainers,
	UpdateReferralCoupon,
} from '../../../Functions/FGGroup'

const ManageCoupon: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [copied, setCopied] = useState(false)
	const [trainerData, setTrainerData] = useState([])
	const [subject, setSubject] = useState<any>({
		name: '',
		trainer_id: '',
	})
	const [updateData, setUpdateData] = useState({
		_id: '',
		title: '',
		coupon_code: '',
		max_usage_count: '',
		discount_type: '',
		discount: '',
		expired_at: '',
	})
	const [couponAdd, setCouponAdd] = useState({
		title: '',
		coupon_code: '',
		max_usage_count: '',
		discount_type: 'percent',
		discount: '',
		expired_at: '',
	})
	const [generateData, setGenerateData] = useState({
		ID: '',
		CouponCode: '',
		PasteURL: '',
		GenerateLink: '',
	})
	const [showReferenceModal, setShowReferenceModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [showGenerateModal, setShowGenerateModal] = useState(false)
	const [referenceData, setReferenceData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setCouponAdd({ ...couponAdd, [name]: value })
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleGenerateInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setGenerateData({ ...generateData, [name]: value })
	}

	const fetchCouponData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetReferralCoupon()
			const filteredData = response.data

			const sortedData = [...filteredData].sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setReferenceData(sortedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchTrainerData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetTrainers()
			const filteredData = response.data
			setTrainerData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchCouponData()
		fetchTrainerData()
	}, [])

	const handleUpdateModal = (data: any) => {
		setShowUpdateModal(true)
		setUpdateData(data)
	}

	const handleGenerateModal = (data: any) => {
		setShowGenerateModal(true)
		const setData: any = {
			ID: data._id,
			CouponCode: data.coupon_code,
		}
		setGenerateData(setData)
	}

	const handleAddUpdateCoupon = async (coupon_id?: string) => {
		try {
			if (coupon_id) {
				const data: any = {
					title: updateData.title,
					coupon_code: updateData.coupon_code,
					max_usage_count: parseInt(updateData.max_usage_count),
					discount_type: updateData.discount_type,
					discount: parseInt(updateData.discount),
					expired_at: DayJS(updateData.expired_at).format('YYYY/MM/DD'),
					assign_trainer: {
						name: subject.name,
						trainer_id: subject.trainer_id,
					},
				}

				data.coupon_id = coupon_id
				await UpdateReferralCoupon(data)
				setShowUpdateModal(false)
				fetchCouponData()
				setUpdateData({
					_id: '',
					title: '',
					coupon_code: '',
					max_usage_count: '',
					discount_type: '',
					discount: '',
					expired_at: '',
				})
				toast.success('Coupon Updated Successfully')
			} else {
				const data: any = {
					title: couponAdd.title,
					coupon_code: couponAdd.coupon_code,
					max_usage_count: parseInt(couponAdd.max_usage_count),
					discount_type: couponAdd.discount_type,
					discount: parseInt(couponAdd.discount),
					expired_at: DayJS(couponAdd.expired_at).format('YYYY/MM/DD'),
					assign_trainer: {
						name: subject.name,
						trainer_id: subject.trainer_id,
					},
				}

				await CreateReferralCoupon(data)

				setShowReferenceModal(false)
				fetchCouponData()

				setCouponAdd({
					title: '',
					coupon_code: '',
					max_usage_count: '',
					discount_type: '',
					discount: '',
					expired_at: '',
				})
				toast.success('Coupon Added Successfully')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFoodTimeData = referenceData.filter((data: any) =>
		data.title.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedCouponData = filteredFoodTimeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const generateUrl = () => {
		generateData.PasteURL

		if (!generateData.ID || !generateData.PasteURL)
			return toast.error('Coupon ID and PasteURL is required')

		let newURL: any = generateData.PasteURL

		try {
			newURL = new URL(newURL)
		} catch (error) {
			return toast.error('Invalid URL')
		}

		const FGGroupRegex = new RegExp(/.*\.fggroup\.in\/.*|localhost/)

		if (!FGGroupRegex.test(newURL.hostname)) {
			console.warn('Unsupported link provided.')
		}

		try {
			const params = new URLSearchParams(newURL.search)

			params.set('coupon_id', generateData.ID)

			newURL.search = params.toString()

			setTimeout(() => {
				setGenerateData((prevData) => ({ ...prevData, GenerateLink: newURL.toString() }))

				return toast.success('URL generated successfully')
			}, 200)
		} catch (error) {
			return toast.error('Invalid URL')
		}
	}

	const handleCopyUrl = (couponUrl: any) => {
		navigator.clipboard
			.writeText(couponUrl)
			.then(() => {
				toast.success('Coupon link copied to clipboard!')
			})
			.catch((err) => {
				toast.error('Failed to copy Coupon link!')
			})
	}

	const handleSelectChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const trainerId = event.target.value
		const selectedTrainer: any = trainerData.find(
			(trainer: any) => trainer.trainer_id === trainerId
		)
		if (selectedTrainer) {
			setSubject({ name: selectedTrainer.full_name, trainer_id: selectedTrainer.trainer_id })
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Manage Coupon</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-between mt-5 px-8'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div>
								<TableButton
									action='add'
									onClick={() => setShowReferenceModal(true)}
									text='Add Coupon'
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Title</th>
									<th>Coupon Code</th>
									<th>Assigned Trainer</th>
									{/* <th>Last updated</th> */}
									<th>Coupon Count</th>
									<th>Discount</th>
									<th>Discount Type</th>
									<th>Expired At</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedCouponData.map((data: any, index: any) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{data.title}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.coupon_code}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data?.assign_trainer?.name || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.max_usage_count ? data.max_usage_count : '0'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.discount
															? data.discount + (data?.discount_type !== 'rupees' && '%')
															: '0'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.discount_type ? data.discount_type : '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.expired_at
															? DayJS(data.expired_at).format('DD/MM/YYYY hh:mm:ss A')
															: '-'}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														{/* <div>
															<button
																className='btn gap-2 d-block mt-2 mb-2 btn-light-primary mx-2 btn-sm me-1'
																onClick={() =>
																	handleCopyUrl(`https://fggroup.in?coupon_id=${data._id}`)
																}>
																<FontAwesomeIcon
																	icon={faCopy}
																	className='fs-3 me-2'
																/>
																Coupon Link
															</button>
														</div> */}
														<div>
															<TableButton
																action='edit'
																onClick={() => handleUpdateModal(data)}
																className='my-2'
															/>
														</div>
														{/* <div>
															<button
																onClick={() => handleGenerateModal(data)}
																className='btn gap-2 d-block mt-2 mb-2 btn-light-warning mx-2 btn-sm me-1'>
																<FontAwesomeIcon
																	icon={faShare}
																	className='fs-3'
																/>
															</button>
														</div> */}
														<div>
															<TableButton
																action='view'
																to={
																	'/rag/manage-coupon/reference?id=' +
																	data._id +
																	'&' +
																	'coupon_discount=' +
																	data.discount
																}
																className='my-2'
															/>
														</div>
													</div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{referenceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{referenceData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(referenceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				centered
				show={showReferenceModal}
				onHide={() => setShowReferenceModal(false)}
				id='edit'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Reference Coupon</h2>
						<button
							onClick={() => setShowReferenceModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Enter Title'
								type='text'
								className='col-12 fv-row mb-7'
								name='title'
								label='Title'
								htmlFor='title'
								value={couponAdd.title}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Enter Coupon Code'
								type='text'
								className='col-12 fv-row mb-7'
								name='coupon_code'
								label='Coupon Code'
								htmlFor='coupon_code'
								value={couponAdd.coupon_code}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Enter max Usage Count'
								type='number'
								className='col-12 fv-row mb-7'
								name='max_usage_count'
								label='max Usage Count'
								htmlFor='max_usage_count'
								value={couponAdd.max_usage_count}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='col-12 fv-row mb-7'
								label='Discount Type'
								name='discount_type'
								value={couponAdd.discount_type}
								onChange={handleInputChange}
								htmlFor='discount_type'
								marginRemove={true}
								options={[
									{
										value: 'percent',
										name: 'Percent',
									},
									{
										value: 'rupees',
										name: 'Rupees',
									},
								]}
							/>
							<InputField
								placeholder='Enter Discount'
								type='number'
								className='col-12 fv-row mb-7'
								name='discount'
								label='Discount'
								htmlFor='discount'
								value={couponAdd.discount}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Enter Expired At'
								type='date'
								className='col-12 fv-row mb-7'
								name='expired_at'
								label='Expired At'
								htmlFor='expired_at'
								value={DayJS(couponAdd.expired_at).format('YYYY-MM-DD')}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='col-12 fv-row'
								label='Assign Trainer'
								name='account_id'
								value={subject.trainer_id}
								onChange={handleSelectChange}
								htmlFor='account_id'
								marginRemove={true}
								options={trainerData.map((data: any) => ({
									value: data.trainer_id,
									name: data.full_name,
								}))}
							/>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={() => handleAddUpdateCoupon()}
							text='Add Coupon'
						/>
					</div>
				</div>
			</Modal>

			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				id='edit'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Reference Coupon</h2>
						<button
							onClick={() => setShowUpdateModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Enter Title'
								type='text'
								className='col-12 fv-row mb-7'
								name='title'
								label='Title'
								htmlFor='title'
								value={updateData.title}
								onChange={handleInputUpdateChange}
							/>
							<InputField
								placeholder='Enter Coupon Code'
								type='text'
								className='col-12 fv-row mb-7'
								name='coupon_code'
								label='Coupon Code'
								htmlFor='coupon_code'
								value={updateData.coupon_code}
								onChange={handleInputUpdateChange}
							/>
							<InputField
								placeholder='Enter max Usage Count'
								type='number'
								className='col-12 fv-row mb-7'
								name='max_usage_count'
								label='max Usage Count'
								htmlFor='max_usage_count'
								value={updateData.max_usage_count}
								onChange={handleInputUpdateChange}
							/>
							<SelectFieldManual
								className='col-12 fv-row mb-7'
								label='Discount Type'
								name='discount_type'
								value={updateData.discount_type}
								onChange={handleInputUpdateChange}
								htmlFor='discount_type'
								marginRemove={true}
								options={[
									{
										value: 'percent',
										name: 'Percent',
									},
									{
										value: 'rupees',
										name: 'Rupees',
									},
								]}
							/>
							<InputField
								placeholder='Enter Discount'
								type='number'
								className='col-12 fv-row mb-7'
								name='discount'
								label='Discount'
								htmlFor='discount'
								value={updateData.discount}
								onChange={handleInputUpdateChange}
							/>
							<InputField
								placeholder='Enter Expired At'
								type='date'
								className='col-12 fv-row mb-7'
								name='expired_at'
								label='Expired At'
								htmlFor='expired_at'
								value={DayJS(updateData.expired_at).format('YYYY-MM-DD')}
								onChange={handleInputUpdateChange}
							/>
							<SelectFieldManual
								className='col-12 fv-row'
								label='Assign Trainer'
								name='trainer_id'
								value={subject.trainer_id}
								onChange={handleSelectChange}
								htmlFor='trainer_id'
								marginRemove={true}
								options={trainerData.map((data: any) => ({
									value: data.trainer_id,
									name: data.full_name,
								}))}
							/>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={() => handleAddUpdateCoupon(updateData._id)}
							text='Save Changes'
							backgroundDark={true}
						/>
					</div>
				</div>
			</Modal>

			<Modal
				centered
				show={showGenerateModal}
				onHide={() => setShowGenerateModal(false)}
				className='modal fade'
				id='generate_link'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Generate Link for Page</h2>
						<button
							onClick={() => setShowGenerateModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='ID'
								type='text'
								className='col-12 fv-row mb-7'
								name='ID'
								label='ID'
								htmlFor='ID'
								value={generateData.ID}
								onChange={handleGenerateInputChange}
								readOnly
							/>
							<InputField
								readOnly
								placeholder='Coupon Code'
								type='text'
								className='col-12 fv-row mb-7'
								name='CouponCode'
								label='Coupon Code'
								htmlFor='CouponCode'
								value={generateData.CouponCode}
								onChange={handleGenerateInputChange}
							/>
							<InputField
								placeholder='Paste Valid Link from FGGROUP'
								type='text'
								className='col-12 fv-row mb-7'
								name='PasteURL'
								label='Paste URL'
								htmlFor='PasteURL'
								value={generateData.PasteURL}
								onChange={handleGenerateInputChange}
							/>
							<div>
								<button
									onClick={() => generateUrl()}
									className='btn gap-2 my-1 btn-bg-primary btn-active-color-success m-2 btn-sm me-1 mb-5 text-white'>
									<span>Generate</span>
								</button>
							</div>
							<InputField
								placeholder='Paste Valid Link from FGGROUP'
								type='text'
								className='col-12 fv-row mb-7'
								name='GenerateLink'
								label='Paste URL'
								htmlFor='GenerateLink'
								value={generateData.GenerateLink}
								readOnly
							/>
							<OverlayTrigger
								key='copy-to-clipboard'
								placement='top'
								overlay={<p id='tooltip-copy-to-clipboard'>Copy Code</p>}>
								<CopyToClipboard
									text={generateData.GenerateLink}
									onCopy={() => {
										setCopied(true)
										toast.success('URL copied to clipboard')
									}}>
									<button className='highlight-copy btn'>{copied ? 'Copied' : 'Copy'}</button>
								</CopyToClipboard>
							</OverlayTrigger>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}
export default ManageCoupon
