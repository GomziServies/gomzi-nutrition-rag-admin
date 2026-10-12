import React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'

const CopyableTag: React.FC<{
	value: string
}> = ({ value }) => {
	const handleCopy = () => {
		toast.success('Text copied to clipboard!')
	}

	return (
		<div className='input-group'>
			<CopyToClipboard
				text={value}
				onCopy={handleCopy}>
				<p>{value}</p>
			</CopyToClipboard>
		</div>
	)
}

export default CopyableTag
