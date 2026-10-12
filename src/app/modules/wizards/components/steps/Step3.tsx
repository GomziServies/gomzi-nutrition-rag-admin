import { FC, useEffect, useState } from 'react'
import { AsyncPaginate } from 'react-select-async-paginate'
import { loadUserOptionsFGIIT } from '../../../../components/loadUserOptionsFGIIT'

interface Step3Props {
	setFormData: (data: any) => void
}

const Step3: FC<Step3Props> = ({ setFormData }) => {
	const [manualExpiryDate, setManualExpiryDate] = useState('')
	const [value, setValue] = useState<any>(null)
	const [sendWithRazorpay, setSendWithRazorpay] = useState(false)
	const [sendWithEmail, setSendWithEmail] = useState(false)
	const [sendWithWhatsApp, setSendWithWhatsApp] = useState(false)
	const [noExpiry, setNoExpiry] = useState(false)

	const handleManualExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setManualExpiryDate(e.target.value)
	}

	const handleUserSelectChange = (selectedOption: any) => {
		setValue(selectedOption)
	}

	const updateFormData = () => {
		setFormData((prev: any) => ({
			...prev,
			userDetails: {
				user_id: value ? value.value : null,
				manualExpiryDate: noExpiry ? null : manualExpiryDate,
				notifications: {
					whatsapp: sendWithWhatsApp,
					email: sendWithEmail,
					razorpay: sendWithRazorpay,
				},
			},
		}))
	}

	useEffect(() => {
		updateFormData()
	}, [value, manualExpiryDate, sendWithRazorpay, sendWithEmail, sendWithWhatsApp, noExpiry])

	return (
		<div className='w-100'>
			<div className='pb-5'>
				<h2 className='fw-bolder text-dark'>User Details</h2>
				<div className='text-gray-400 fw-bold fs-6'>
					Add user details to send notification to user.
				</div>
			</div>

			<div className='d-flex flex-column mb-7 fv-row'>
				<label
					htmlFor='userSelect'
					className='d-flex align-items-center fs-6 fw-bold form-label mb-2'>
					<span className='required'>Select User</span>
				</label>
				<AsyncPaginate
					debounceTimeout={1000}
					value={value}
					loadOptions={loadUserOptionsFGIIT}
					closeMenuOnSelect={false}
					onChange={handleUserSelectChange}
				/>
			</div>

			<div className='fv-row mb-7'>
				<label className='form-label fw-bold text-dark fs-6'>Link Expiry</label>

				<div className='form-check form-check-inline mb-3 mx-3'>
					<input
						type='checkbox'
						name='noExpiry'
						id='noExpiryCheckbox'
						className='form-check-input'
						checked={noExpiry}
						onChange={() => setNoExpiry(!noExpiry)}
					/>
					<label
						htmlFor='noExpiryCheckbox'
						className='form-check-label text-gray-600'>
						No Expiry
					</label>
				</div>

				<div className='input-group'>
					<input
						type='date'
						name='manualExpiryDate'
						className='form-control'
						value={manualExpiryDate}
						onChange={handleManualExpiryDateChange}
						disabled={noExpiry}
					/>
				</div>

				<div className='text-danger mt-2'>
					{!manualExpiryDate && !noExpiry && 'Please select an expiry date'}
				</div>
			</div>

			{/* Send Notification options */}
			<div className='mb-7'>
				<label className='fs-6 fw-bold form-label'>Send Notification:</label>
				<div className='form-check mb-4'>
					<input
						type='checkbox'
						className='form-check-input'
						checked={sendWithRazorpay}
						onChange={() => setSendWithRazorpay(!sendWithRazorpay)}
					/>
					<label className='form-check-label'>Send with Razorpay</label>
				</div>
				<div className='form-check mb-4'>
					<input
						type='checkbox'
						className='form-check-input'
						checked={sendWithEmail}
						onChange={() => setSendWithEmail(!sendWithEmail)}
					/>
					<label className='form-check-label'>Send with Email</label>
				</div>
				<div className='form-check mb-4'>
					<input
						type='checkbox'
						className='form-check-input'
						checked={sendWithWhatsApp}
						onChange={() => setSendWithWhatsApp(!sendWithWhatsApp)}
					/>
					<label className='form-check-label'>Send with WhatsApp</label>
				</div>
			</div>
		</div>
	)
}

export { Step3 }
