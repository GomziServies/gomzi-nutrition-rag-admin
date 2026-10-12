import React, { useEffect, useState } from 'react'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import { useLocation, useNavigate } from 'react-router-dom'
import {
	GetGnFollowUpReport,
	UpdatePitchReport,
} from '../../../../Functions/FGGroup/GnFollowUpReport'
import toast from 'react-hot-toast'

interface PitchReport {
	telecaller_name: string
	interest_level: string
	follow_up_date: string
	objections: string
}

const AutomationUpdateFollowUpReportGn: React.FC = () => {
	const [pitchReport, setPitchReport] = useState<PitchReport>({
		telecaller_name: '',
		interest_level: 'LOW',
		follow_up_date: '',
		objections: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [recordId, setRecordId] = useState<string | null>(null)
	const [mobile, setMobile] = useState<string>('')
	const [clientName, setClientName] = useState<string>('')

	const location = useLocation()
	const navigate = useNavigate()

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		const id = queryParams.get('id')
		if (id) {
			setRecordId(id)
			fetchReportData(id)
		}
	}, [location])

	const fetchReportData = async (id: string) => {
		try {
			const response = await GetGnFollowUpReport({ id })
			if (response.status === 200 && response.data && response.data.length > 0) {
				const data = response.data[0]
				setMobile(data.personalDetails?.mobile || '')
				setClientName(data.personalDetails?.client_name || '')
				const latestCall = data.callHistory?.[data.callHistory.length - 1]
				if (latestCall?.pitchReport) {
					setPitchReport({
						telecaller_name: latestCall.pitchReport.telecaller_name || '',
						interest_level: latestCall.pitchReport.interest_level || 'LOW',
						follow_up_date: latestCall.pitchReport.pitch_follow_up_date
							? new Date(latestCall.pitchReport.pitch_follow_up_date)
									.toISOString()
									.split('T')[0]
							: '',
						objections: latestCall.pitchReport.objections || '',
					})
				}
			}
		} catch (error) {
			toast.error('Failed to fetch report data')
		}
	}

	const handlePitchReportChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setPitchReport((prev) => ({ ...prev, [name]: value }))
	}

	const handleSavePitchReport = async () => {
		if (!recordId) {
			toast.error('No record ID found')
			return
		}
		try {
			setIsSubmitting(true)
			const response = await UpdatePitchReport(
				{ id: recordId },
				{
					pitchReport: {
						telecaller_name: pitchReport.telecaller_name,
						interest_level: pitchReport.interest_level,
						pitch_follow_up_date: pitchReport.follow_up_date
							? new Date(pitchReport.follow_up_date)
							: null,
						objections: pitchReport.objections,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Pitch report updated successfully!')
				navigate(
					`/automation/follow-up-report-inner-list/gn?mobile=${encodeURIComponent(
						mobile
					)}&name=${encodeURIComponent(clientName)}`
				)
			} else {
				toast.error(response.message || 'Failed to update pitch report')
			}
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Follow Up Report</PageTitle>
			<div className='card'>
				<div className='card-body'>
					<div className='row'>
						<SelectField
							className='col-md-4 fv-row mb-7'
							label='Telecaller Name'
							name='telecaller_name'
							value={pitchReport.telecaller_name}
							onChange={handlePitchReportChange}
							htmlFor='telecaller_name'
							options={['Chirag Pandey', 'Ravi Patel', 'Asalam Khan', 'Suman Gupta']}
						/>
						<SelectField
							className='col-md-4 fv-row mb-7'
							label='Interest Level'
							name='interest_level'
							value={pitchReport.interest_level}
							onChange={handlePitchReportChange}
							htmlFor='interest_level'
							options={['LOW', 'MEDIUM', 'HIGH']}
						/>
						<InputField
							placeholder='Select Follow Up Date'
							type='date'
							className='col-md-4 fv-row'
							label='Follow Up Date'
							name='follow_up_date'
							htmlFor='follow_up_date'
							value={pitchReport.follow_up_date}
							onChange={handlePitchReportChange}
						/>
					</div>

					<div className='col-md-12 fv-row mb-7'>
						<label className='form-label fw-bolder text-dark fs-6 mb-3'>
							Objections
						</label>
						<textarea
							className='form-control form-control-lg form-control-solid'
							rows={3}
							placeholder='Enter objections or client concerns...'
							name='objections'
							value={pitchReport.objections}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setPitchReport((prev) => ({
									...prev,
									objections: e.target.value,
								}))
							}
						/>
					</div>

					<div className='d-flex justify-content-end'>
						<TableButton
							action='add'
							text={isSubmitting ? 'Saving...' : 'Update Report'}
							showIcon={false}
							backgroundDark={true}
							onClick={handleSavePitchReport}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</div>
		</>
	)
}

export default AutomationUpdateFollowUpReportGn
