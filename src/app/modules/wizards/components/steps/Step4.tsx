import React, { FC } from 'react'
import { Link } from 'react-router-dom'

interface LinkDetails {
	label: string
	url: string
}

interface Step4Props {
	plan?: any
	links?: LinkDetails[]
	setFormData: (data: any) => void
}

const Step4: FC<Step4Props> = ({ plan, links, setFormData }) => {
	const handleFinish = () => {
		setFormData({
			step: 4,
			plan,
		})
	}

	return (
		<div className='w-100'>
			<div className='pb-5'>
				<h2 className='fw-bolder text-dark'>You're Done!</h2>
				<div className='text-gray-400 fw-bold fs-6'>
					Thank you for completing the process. Here are your details:
				</div>
			</div>

			{/* Plan Details Section */}
			{plan && (
				<div className='fs-6 text-gray-600 mb-5'>
					<h4 className='text-gray-800 fw-bolder'>Plan</h4>
					<div className='text-gray-800 fw-bold'>{'userName'}</div>{' '}
					{/* Assuming userName is available from props or state */}
					<div className='mt-3'>
						<p>
							<strong>Every Month the customer will be charged:</strong>
							<span className='text-danger'> ₹ {plan?.price?.toFixed(2)}</span>
						</p>
						<p>
							<strong>Currency:</strong> ₹ - Indian Rupee (INR)
						</p>
					</div>
					{/* Payment Details */}
					<h4 className='text-gray-800 fw-bolder mt-4'>First Payment</h4>
					<p>
						<strong>Authorization Payment:</strong>
						<span className='text-danger'> ₹ {plan?.price?.toFixed(2)}</span>
					</p>
					<p>Currency: ₹ - Indian Rupee (INR)</p>
					{/* Subscription Amount */}
					<h4 className='text-gray-800 fw-bolder mt-4'>Subscription Amount</h4>
					<p>
						<strong>Subscription Amount:</strong>
						<span className='text-danger'> ₹ {plan?.price?.toFixed(2)}</span>
					</p>
					<p>Currency: ₹ - Indian Rupee (INR)</p>
					<p>
						<strong>Quantity:</strong> x 1
					</p>
					<p>
						<strong>Every Month after the first payment:</strong>
						<span className='text-danger'> ₹ {plan?.price?.toFixed(2)}</span>
					</p>
					<p>Currency: ₹ - Indian Rupee (INR)</p>
					{/* Recurring Payments */}
					<h4 className='text-gray-800 fw-bolder mt-4'>Recurring Payments</h4>
					<p>
						<strong>Recurring Payments:</strong>
						<span className='text-danger'> ₹ {plan?.price?.toFixed(2)}</span>
					</p>
					<p>Currency: ₹ - Indian Rupee (INR)</p>
					<p>
						<strong>No. of cycles:</strong> 6
					</p>
					<p>
						<strong>End Date:</strong> 19 Apr 2025
					</p>
				</div>
			)}

			{/* Link Details */}
			{links && links.length > 0 && (
				<div className='fs-6 text-gray-600 mb-5'>
					<h4 className='text-gray-800 fw-bolder'>Useful Links:</h4>
					<ul>
						{links?.map((link, index) => (
							<li key={index}>
								<Link
									to={link.url}
									className='link-primary fw-bolder'>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

export { Step4 }
