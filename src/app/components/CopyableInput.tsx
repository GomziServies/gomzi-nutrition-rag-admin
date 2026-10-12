import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import { KTIcon } from '../../_metronic/helpers'

type Props = {
	className?: string
	label: string
	placeholder?: string
	type: string
	name: string
	value?: string
	htmlFor: string
	onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
	readOnly?: boolean
	disabled?: boolean
	showLabel?: boolean
}

const CopyableInput: React.FC<Props> = ({
	className,
	label,
	placeholder,
	type,
	value,
	name,
	onChange,
	htmlFor,
	readOnly,
	disabled,
	showLabel = true,
}) => {
	const [copied, setCopied] = useState(false)

	const handleCopy = () => {
		setCopied(true)
		toast.success('Text copied to clipboard!')
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className={`fv-row mb-md-7 mb-3 ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className='fw-bold fs-6 mb-md-5 mb-2'>
					{label}
				</label>
			)}
			<div className='d-flex'>
				<input
					id={htmlFor}
					style={{ borderRadius: '5px 0px 0px 5px' }}
					placeholder={placeholder}
					type={type}
					name={name}
					value={value}
					onChange={onChange}
					readOnly={readOnly}
					className={`form-control mb-lg-0 ${disabled ? 'inputfield-bg1' : 'inputfield-bg'}`}
					autoComplete='off'
					disabled={disabled}
				/>
				<CopyToClipboard
					text={value || ''}
					onCopy={handleCopy}>
					<button
						className='btn btn-secondary'
						style={{ borderRadius: '0px 5px 5px 0px' }}
						type='button'
						disabled={!value}>
						<KTIcon
							className='fs-3 text-success'
							iconName={copied ? 'check' : 'copy'}
						/>
					</button>
				</CopyToClipboard>
			</div>
		</div>
	)
}

export default CopyableInput
