import { FC, useEffect, useState } from 'react'

const Step2: FC<{ setFormData: (data: any) => void; formData: any }> = ({ setFormData }) => {
	const [showForm, setShowForm] = useState(false)
	const [addOns, setAddOns] = useState({
		name: '',
		amount: '',
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setAddOns((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setShowForm(e.target.checked)
	}

	useEffect(() => {
		setFormData((prev: any) => ({
			...prev,
			addOns: showForm ? addOns : {},
		}))
	}, [addOns, showForm, setFormData])

	return (
		<div className='w-100'>
			<div className='pb-5'>
				<h2 className='fw-bolder text-dark'>Add Ons</h2>
				<div className='text-gray-400 fw-bold fs-6'>
					If you want to receive a token amount for starting the subscription.
				</div>
			</div>

			<div className='fv-row mb-10'>
				<label className='form-check form-check-sm form-check-custom form-check-solid'>
					<input
						type='checkbox'
						name='showForm'
						className='form-check-input'
						checked={showForm}
						onChange={handleCheckboxChange}
					/>
					<span className='form-check-label'>I want to add an upfront amount</span>
				</label>
			</div>

			{showForm && (
				<div className='fv-row mb-7'>
					{/* Item Name Input */}
					<div className='mt-4'>
						<label
							htmlFor='name'
							className='form-label required'>
							Item Name
						</label>
						<input
							placeholder='Item name'
							type='text'
							required={true}
							className='form-control'
							name='name'
							id='name'
							value={addOns.name}
							onChange={handleInputChange}
						/>
					</div>

					{/* Amount Input */}
					<div className='mt-4'>
						<label
							htmlFor='amount'
							className='form-label required'>
							Amount
						</label>
						<input
							placeholder='Item Amount'
							type='number'
							required={true}
							className='form-control'
							name='amount'
							id='amount'
							value={addOns.amount}
							onChange={handleInputChange}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

export { Step2 }
