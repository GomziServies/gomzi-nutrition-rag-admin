import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as FGGroupAPIs from '../../../../app/Functions/FGGroup'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import { GetGoogleSheets, GetGoogleSubSheets } from '../../../Functions/FGGroup/GoogleSheets'

const WhatsappAutomationView = () => {
	const [sheetLoading, setSheetLoading] = useState(false)
	const [subSheetLoading, setSubSheetLoading] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<any>({})
	const [campaignData, setCampaignData] = useState<any[]>([])
	const [googleSheetData, setGoogleSheetData] = useState<any[]>([])
	const [googleSubSheetData, setGoogleSubSheetData] = useState<any>([])
	const [selectedFacebookAccountData, setSelectedFacebookAccountData] = useState<any>('')
	const [subject, setSubject] = useState('')
	const [selectedSheets, setSelectedSheets] = useState('')
	const [selectedSubSheets, setSelectedSubSheets] = useState<any>()
	const [campaign_id, setCampaignId] = useState('')
	const [sheetsHeaders, setSheetsHeaders] = useState<any[]>([])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (selectedSubSheets?.headers?.includes(name)) {
			setSheetsHeaders((prevHeaders: any) => ({
				...prevHeaders,
				[name]: value,
			}))
		} else {
			setFormData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)

			const headersArray =
				selectedSubSheets?.headers.map((header: any) => sheetsHeaders[header]) || []

			const payload: any = {
				title: formData.title,
				ads_id: campaign_id,
				category: formData.category,
				fb_account_id: selectedFacebookAccountData,
				sheet_id: selectedSheets,
				sub_sheet_id: JSON.stringify(selectedSubSheets.sheetId),
				sheets_headers: selectedSubSheets?.headers,
				// sheets_headers: headersArray,
			}

			await FGGroupAPIs.CreateLeadAutomation(payload)

			toast.success('Product Add Successfully')

			setFormData({
				ads_id: '',
				title: '',
				category: '',
				fb_account_id: '',
				sheet_id: '',
				sub_sheet_id: '',
				sheets_headers: '',
			})
			setSheetsHeaders([])
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const fetchAdCampaignAccounts = async (subject: string) => {
		setSheetLoading(true)
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
		setSheetLoading(false)
	}

	const fetchSheets = async () => {
		try {
			const response: any = await GetGoogleSheets()
			setGoogleSheetData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchSubSheets = async (sheet_id: any) => {
		setSubSheetLoading(true)
		try {
			const response: any = await GetGoogleSubSheets({ sheet_id })
			let filterData = response.data.sheets
			setGoogleSubSheetData(filterData)
		} catch (error) {
			console.error(error)
		}
		setSubSheetLoading(false)
	}

	useEffect(() => {
		fetchSheets()
		sheetLoading == true && toast.success('Fetch Google Sheets, Wait...')
		subSheetLoading == true && toast.success('Fetch Sub Sheets, Wait...')
	}, [sheetLoading, subSheetLoading])

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const accountId = event.target.value
		setSubject(accountId)
		fetchAdCampaignAccounts(accountId)

		setSelectedFacebookAccountData(accountId || '')
	}

	const handleSelectSheetsChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const sheetId = event.target.value
		setSelectedSheets(sheetId)
		fetchSubSheets(sheetId)
	}

	const handleSelectSubSheetsChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const sheetId = event.target.value
		const filterSheetData = googleSubSheetData.find((sheet: any) => sheet.title == sheetId)
		setSelectedSubSheets(filterSheetData)
	}

	const handleSelectCampaignChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const campaignID = event.target.value
		setCampaignId(campaignID)
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
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Whatsapp Automation</PageTitle>

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Create Automation</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view'
					className='collapse show'>
					<div className='card-body border-top p-9'>
						<div className='row'>
							<div className='col-md-12'>
								<InputField
									placeholder='Title'
									type='text'
									className='mb-7 w-100 fv-row'
									name='title'
									label='Title'
									htmlFor='franchise_name'
									value={formData.title}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-12'>
								<SelectField
									className=''
									label='Catagories'
									name='category'
									value={formData.category}
									onChange={handleInputChange}
									htmlFor='Catagories'
									options={['Course', 'FWG']}
								/>
							</div>
							<div className='col-md-12 fv-row mb-7'>
								<div className='row'>
									<div className='col-12'>
										<SelectFieldManual
											className='fv-row'
											label='Facebook Account'
											name='account_id'
											value={subject}
											onChange={handleSelectChange}
											htmlFor='account_id'
											options={adsAccountOption?.map((data: any) => ({
												value: data.id,
												name: data.name,
											}))}
										/>
									</div>
									<div className='col-12 m-0'>
										<SelectFieldManual
											className={`fv-row`}
											label='Ads Campaign'
											name='campaign_id'
											value={campaign_id}
											marginRemove={true}
											onChange={handleSelectCampaignChange}
											htmlFor='campaign_id'
											options={campaignData?.map((data: any) => ({
												value: data.id,
												name: data.name + ' - ' + data.configured_status,
											}))}
											disabled={sheetLoading || campaignData.length === 0 ? true : false}
										/>
									</div>
								</div>
							</div>
							<div className='col-md-12 fv-row'>
								<div className='row'>
									<div className='col-md-12'>
										<SelectFieldManual
											className='fv-row'
											label='All Sheets'
											name='account_id'
											value={selectedSheets}
											onChange={handleSelectSheetsChange}
											htmlFor='account_id'
											options={googleSheetData?.map((data: any) => ({
												value: data.id,
												name: data.name,
											}))}
										/>
									</div>
									<div className='col-12 mb-3'>
										<SelectField
											className=''
											label='Select Sheet'
											name='type'
											value={selectedSubSheets}
											onChange={handleSelectSubSheetsChange}
											htmlFor='Select Sheet'
											options={googleSubSheetData?.map((data: any) => data.title)}
											disabled={subSheetLoading || googleSubSheetData.length === 0 ? true : false}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='card-body border-top p-9'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder mb-10'>Sheet Details</h3>
						</div>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='row'>
									{selectedSubSheets?.headers?.map((sheet: any, index: number) => (
										<div
											className='col-12 mb-3'
											key={index}>
											<InputField
												placeholder={'Enter ' + sheet}
												type='text'
												className=''
												name={sheet}
												label={sheet}
												htmlFor={sheet}
												value={sheetsHeaders[sheet] || ''}
												onChange={handleInputChange}
											/>
										</div>
									))}
								</div>
								<div className='modal-footer justify-content-start mt-3'>
									<TableButton
										action='edit'
										// onClick={handleAddButtonClick}
										// text={isSubmitting ? 'Please wait, Saving...' : 'Test Sheet'}
										text='Test Sheet'
										showIcon={false}
										// disabled={isSubmitting}
										backgroundDark={true}
										// className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
										className={`mb-4 btn-block`}
									/>
									<TableButton
										action='add'
										onClick={handleAddButtonClick}
										text={isSubmitting ? 'Please wait, Saving...' : 'Save'}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export { WhatsappAutomationView }
