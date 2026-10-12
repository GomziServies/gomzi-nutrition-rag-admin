/* eslint-disable jsx-a11y/anchor-is-valid */
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import CopyableInput from '../../../../app/components/CopyableInput'
import InputField from '../../../../app/components/InputField'
import SelectFieldManual from '../../../../app/components/SelectFieldManual'
import UsersListPagination from '../../../../app/components/TablePagination'
import * as FGGroupAPIs from '../../../../app/Functions/FGGroup'
import { KTIcon } from '../../../helpers'

type Props = {
	className: string
}

const extractValue = (fieldData: any, fieldName: any) => {
	if (!Array.isArray(fieldData)) return ''
	const field = fieldData.find((data) => data.name === fieldName)
	return field ? field.values[0] : ''
}

const LeadTable: React.FC<Props> = ({ className }) => {
	const [facebookAccountData, setFacebookAccountData] = useState([{}])
	const [selectedFacebookAccountData, setSelectedFacebookAccountData] = useState<any>({})
	const [campaignData, setCampaignData] = useState<any[]>([{}])
	const [subject, setSubject] = useState('')
	const [campaign_id, setCampaignId] = useState('')
	const [leadData, setLeadData] = useState<any[]>([])
	const [purchaseData, setPurchaseData] = useState<any[]>([])
	const [showLeadSection, setShowLeadSection] = useState<boolean>(false)
	const [showPurchaseSection, setPurchaseSection] = useState<boolean>(false)
	const [adsData, setAdsData] = useState<any[]>([{}])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [showModal, setShowModal] = useState(false)
	const [selectedLeadData, setSelectedLeadData] = useState<any>({})

	const [businessData, setBusinessData] = useState<any>([])
	const [adAccountsId, setAdAccountsId] = useState<any>([])
	const [businessAdAccountData, setBusinessAdAccountData] = useState<any>([])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchUserOwnedACData = async () => {
		try {
			const response: any = await FGGroupAPIs.GetUserOwnedAdAccounts({
				fields: 'account_status,amount_spent,balance,min_daily_budget,account_id,name',
			})
			const fetchedData = response.data
			setFacebookAccountData(fetchedData)

			// const initialSelectedData = fetchedData.find((data: any) => data.id === 'act_784701510451784')

			// if (initialSelectedData) {
			// 	setSelectedFacebookAccountData(initialSelectedData)
			// 	setSubject(initialSelectedData.account_id)
			// 	fetchAdCampaignAccounts('act_784701510451784')
			// }
		} catch (error) {
			console.error(error)
		}
	}
	const fetchFBBusiness = async () => {
		try {
			const response: any = await FGGroupAPIs.GetFBBusiness({
				fields: 'id,name,link,profile_picture_uri',
			})
			const fetchedData = response.data

			setBusinessData(fetchedData)
		} catch (error) {
			console.error(error)
		}
	}
	const fetchBusinessAdAccounts = async (AdAccountId: any) => {
		try {
			const response: any = await FGGroupAPIs.GetBusinessOwnAdAccounts(
				{ fields: 'name,account_id' },
				AdAccountId
			)
			const fetchedData = response.data
			setBusinessAdAccountData(fetchedData)
		} catch (error) {
			console.error(error)
		}
	}

	const handleBusinessSelectChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const accountId = event.target.value
		setAdAccountsId(accountId)
		fetchBusinessAdAccounts(accountId)
	}

	const handleAdAccountSelectChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const accountId = event.target.value
		// setSubject(accountId)
		fetchBusinessAdAccounts(accountId)
	}

	const adsAccountOption = [
		{
			name: 'FitnessWithGomzi',
			id: 'act_844345232591443',
		},
		{
			name: 'Adajan Ads Account',
			id: 'act_784701510451784',
		},
		{
			name: 'FGIIT 2 Account',
			id: 'act_474498156857637',
		},
		{
			name: 'FGIIT Course Account',
			id: 'act_1227447128664390',
		},
		{
			name: 'Gomzi Nutrition Account',
			id: 'act_2776739622489798',
		},
	]

	const fetchAdCampaignAccounts = async (subject: string) => {
		try {
			const response: any = await FGGroupAPIs.GetAdCampaign(subject, {
				fields:
					'objective,account_id,bid_amount,bid_info,bid_strategy,campaign,configured_status,name',
			})
			const filteredData = response.data.filter((data: any) => data.configured_status === 'ACTIVE')
			setCampaignData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	const adsPurchaseData = async (id: string) => {
		try {
			const response: any = await FGGroupAPIs.GetAdInsights(id, {
				fields:
					'actions,ad_click_actions,action_values,website_purchase_roas,clicks,campaign_name,website_ctr',
			})
			setPurchaseData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchAds = async (id: string) => {
		try {
			const findAdsType = campaignData.find((data: any) => data.id === id)

			if (findAdsType) {
				const response: any = await FGGroupAPIs.GetAds(id, {
					fields:
						'objective,account_id,name,insights,adset_id,ad_active_time,ad_schedule_end_time,adset,status,tracking_specs,campaign_name',
				})
				setAdsData(response.data)

				if (findAdsType.objective === 'OUTCOME_SALES') {
					setPurchaseSection(true)
					adsPurchaseData(response.data[0]?.id)
					setShowLeadSection(false)
				} else if (findAdsType.objective === 'OUTCOME_LEADS') {
					setShowLeadSection(true)
					fetchAdsLeads(response.data[0].id)
					setPurchaseSection(false)
				} else {
					console.log('Unknown objective type')
				}
			} else {
				console.log('Ad campaign not found')
			}
		} catch (error) {
			console.error(error)
		}
	}

	const fetchAdsLeads = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await FGGroupAPIs.GetAdLeads(id)
			setLeadData(response.data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchUserOwnedACData()
		fetchFBBusiness()
	}, [])

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const accountId = event.target.value
		setSubject(accountId)
		fetchAdCampaignAccounts(accountId)

		const selectedAccount = facebookAccountData.find((account: any) => account.id === accountId)
		setSelectedFacebookAccountData(selectedAccount || {})
	}

	const handleSelectCampaignChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const campaignID = event.target.value
		setCampaignId(campaignID)
		fetchAds(campaignID)
	}

	const uniqueFields = useMemo<string[]>(() => {
		const fields = new Set<string>()
		leadData.forEach((row) => {
			if (Array.isArray(row.field_data)) {
				row.field_data.forEach((field: any) => fields.add(field.name))
			}
		})
		return Array.from(fields)
	}, [leadData])

	const paginatedLeadData = leadData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleViewLead = (rowData: any) => {
		setSelectedLeadData(rowData)
		setShowModal(true)
	}

	const downloadExcel = () => {
		const worksheetData = leadData.map((lead: any) => {
			const rowData: any = {}

			lead.field_data.forEach((field: any) => {
				const fieldName = field.name
				const value = field.values?.length > 0 ? field.values[0] : 'N/A'
				rowData[fieldName] = value
			})

			rowData['Lead ID'] = lead.id
			rowData['Created Time'] = new Date(lead.created_time).toLocaleString()

			return rowData
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

		XLSX.writeFile(workbook, 'LeadData.xlsx')
	}

	return (
		<>
			<div className={`card ${className}`}>
				<div className='px-7 pt-7'>
					<div className='col-12 mb-5'>
						<span className='fw-bold fs-3 mb-3'>ADS Account Details</span>
						{/* <button
							className='col-md-2 btn btn-primary mx-3 mt-3'
							onClick={downloadExcel}
							disabled={loading}>
							<FontAwesomeIcon
								icon={faDownload}
								className='fs-3'
								style={{ marginRight: '5px' }}
							/>
							Excel
						</button> */}
					</div>
					<div className='d-flex'>
						{/* <SelectFieldManual
							className='col-md-4 fv-row'
							label='Business'
							name='business_id'
							value={adAccountsId}
							onChange={handleBusinessSelectChange}
							htmlFor='business_id'
							marginRemove={true}
							options={businessData.map((data: any) => ({
								value: data.id,
								name: data.name,
							}))}
						/>
						<SelectFieldManual
							className='col-md-4 fv-row'
							label='Business Ad Account'
							name='ad_account_id'
							value={subject}
							onChange={handleSelectChange}
							htmlFor='ad_account_id'
							marginRemove={true}
							options={businessAdAccountData?.map((data: any) => ({
								value: data.id,
								name: data.name,
							}))}
							disabled={businessAdAccountData?.length === 0}
						/> */}
						<SelectFieldManual
							className='col-md-5 fv-row'
							label='Account'
							showLabel={false}
							name='account_id'
							value={subject}
							onChange={handleSelectChange}
							htmlFor='account_id'
							marginRemove={true}
							options={adsAccountOption.map((data: any) => ({
								value: data.id,
								name: data.name,
							}))}
						/>
						<SelectFieldManual
							className='col-md-5 fv-row'
							label='Ads Campaign'
							showLabel={false}
							name='campaign_id'
							value={campaign_id}
							onChange={handleSelectCampaignChange}
							htmlFor='campaign_id'
							marginRemove={true}
							options={campaignData.map((data: any) => ({
								value: data.id,
								name: data.name + ' - ' + data.configured_status,
							}))}
						/>
						<button
							className='btn btn-primary mx-3'
							onClick={downloadExcel}
							disabled={loading}>
							<FontAwesomeIcon
								icon={faDownload}
								className='fs-3'
								style={{ marginRight: '5px' }}
							/>
							Excel
						</button>
					</div>
					<div className='mt-6 row'>
						<CopyableInput
							className='col-md-6 fv-row'
							label='Facebook ID'
							placeholder='Facebook ID'
							type='text'
							name='facebook_id'
							htmlFor='facebook'
							value={selectedFacebookAccountData.account_id || ''}
							disabled
						/>
						<InputField
							className='col-md-6 fv-row'
							label='Facebook Page'
							placeholder='Facebook Name'
							type='text'
							name='name'
							htmlFor='name'
							value={selectedFacebookAccountData.name || ''}
							disabled
						/>
						<InputField
							className='col-md-4 fv-row'
							label='Amount Spend'
							placeholder='Amount Spend'
							type='text'
							name='amount_spend'
							htmlFor='name'
							value={selectedFacebookAccountData.amount_spent || ''}
							disabled
						/>
						<InputField
							className='col-md-4 fv-row'
							label='Balance'
							placeholder='Balance'
							type='text'
							name='balance'
							htmlFor='balance'
							value={selectedFacebookAccountData.balance || ''}
							disabled
						/>
						<InputField
							className='col-md-4 fv-row'
							label='Min Daily Budget'
							placeholder='Budget'
							type='text'
							name='min_budget'
							htmlFor='min_budget'
							value={selectedFacebookAccountData.min_daily_budget || ''}
							disabled
						/>
					</div>
				</div>

				{showPurchaseSection && (
					<>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 mb-1'>Order Details</span>
								<span className='text-muted mt-1 fw-semibold fs-7'></span>
							</h3>
						</div>
						<div className='px-7'>
							<div className='row'>
								<InputField
									className='col-md-6 fv-row'
									label='Campaign Name'
									placeholder='Facebook ID'
									type='text'
									name='campaign_name'
									htmlFor='campaign_name'
									value={purchaseData[0]?.campaign_name || ''}
									disabled
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Purchase Click'
									placeholder='Click'
									type='text'
									name='name'
									htmlFor='name'
									value={purchaseData[0]?.clicks || ''}
									disabled
								/>
								<InputField
									className='col-md-4 fv-row'
									label='Total Order'
									placeholder='Total Order'
									type='text'
									name='amount_spend'
									htmlFor='name'
									value={purchaseData[0]?.actions[0]?.value || ''}
									disabled
								/>
							</div>
						</div>
					</>
				)}
				{showLeadSection && (
					<>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 mb-1'>Lead Details</span>
								<span className='text-muted mt-1 fw-semibold fs-7'></span>
							</h3>
							{/* <div className='col-md-6'>
						<div className='d-flex'>
							
							<div className='col-md-3'>
								<button
									className='btn btn-primary mx-3'
									onClick={downloadExcel}
									disabled={loading}>
									<FontAwesomeIcon
										icon={faDownload}
										className='fs-3'
										style={{ marginRight: '5px' }}
									/>
									Excel
								</button>
							</div>
						</div>
					</div> */}
						</div>
						<div className='card-body py-3'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th className='min-w-50px'>No.</th>
											{uniqueFields.map((field) => (
												<th
													key={field}
													className='min-w-150px'>
													{field.replace(/_/g, ' ').toUpperCase()}
												</th>
											))}
											<th className='min-w-150px'>CREATED TIME</th>
											<th className='min-w-100px text-end'>ACTIONS</th>
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
											paginatedLeadData.map((rowData, index) => {
												const actualIndex =
													(pagination.page - 1) * pagination.itemsPerPage + index + 1
												return (
													<tr key={rowData.id}>
														<td>{actualIndex}</td>
														{uniqueFields.map((field) => (
															<td key={field}>
																<a
																	href='#'
																	className='text-dark fw-bold text-hover-primary d-block fs-6'>
																	{extractValue(rowData.field_data, field)}
																</a>
															</td>
														))}
														<td className='text-dark fw-bold text-hover-primary d-block fs-6'>
															{rowData.created_time
																? new Date(rowData.created_time).toLocaleString()
																: ''}
														</td>
														<td align='right'>
															<button
																className='btn btn-icon btn-bg-light btn-sm me-1'
																onClick={() => handleViewLead(rowData)}>
																<KTIcon
																	iconName='eye'
																	className='fs-1 text-primary'
																/>
															</button>
														</td>
													</tr>
												)
											})
										)}
									</tbody>
								</table>
								{campaign_id == '' && (
									<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
										<b>Select Campaign</b>
									</div>
								)}
								{leadData.length === 0 && !loading && campaign_id != '' && (
									<div className='d-flex text-center w-100 align-content-center justify-content-center mt-7 mb-2'>
										<b>No records found</b>
									</div>
								)}
								{leadData.length > 0 && (
									<UsersListPagination
										totalPages={Math.ceil(leadData.length / pagination.itemsPerPage)}
										currentPage={pagination.page}
										onPageChange={handlePageChange}
									/>
								)}
							</div>
						</div>
					</>
				)}
			</div>

			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Lead Details</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{uniqueFields.map((field) => (
						<div
							key={field}
							className='mb-3'>
							<label className='form-label'>{field.replace(/_/g, ' ').toUpperCase()}</label>
							{field === 'phone_number' ? (
								<CopyableInput
									className='col-md-12 fv-row'
									label='Mobile'
									placeholder='Mobile'
									type='text'
									showLabel={false}
									name='facebook_id'
									htmlFor='facebook'
									value={extractValue(selectedLeadData.field_data, field)}
									disabled
								/>
							) : (
								<input
									type='text'
									className='form-control'
									value={extractValue(selectedLeadData.field_data, field)}
									readOnly
								/>
							)}
						</div>
					))}
					<div className='mb-3'>
						<label className='form-label'>Created Time</label>
						<input
							type='text'
							className='form-control'
							value={new Date(selectedLeadData.created_time).toLocaleString()}
							readOnly
						/>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button
						className='btn btn-primary'
						onClick={() => setShowModal(false)}>
						Close
					</button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export { LeadTable }
