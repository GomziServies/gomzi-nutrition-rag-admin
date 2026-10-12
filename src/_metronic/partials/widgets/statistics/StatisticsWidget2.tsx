/* eslint-disable jsx-a11y/anchor-is-valid */
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import CurrencyFormatter from '../../../../app/components/CurrencyFormatter'

type Props = {
	className: string
	title: any | number
	description: string
	Icon: IconDefinition
	color: string
}

const StatisticsWidget2: FC<Props> = ({ className, title, description, Icon, color }) => {
	return (
		<div className={`card ${className}`}>
			{/* begin::Body */}
			<div className='card-body d-flex align-items-center pt-3 pb-0'>
				<div
					className='d-flex flex-column flex-grow-1 py-2 py-lg-2 me-2'
					style={{ zIndex: '1' }}>
					<a
						href='#'
						className='fw-bold text-dark fs-2 mb-1 text-hover-primary'>
						<CurrencyFormatter amount={parseInt(title)} />
					</a>
					<span
						className='fw-semibold text-muted fs-6'
						dangerouslySetInnerHTML={{ __html: description }}></span>
				</div>
			</div>
			{/* end::Body */}
			<FontAwesomeIcon
				icon={Icon}
				className={`fs-3x align-self-end text-${color}`}
				style={{
					position: 'absolute',
					bottom: '26px',
					right: '20px',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			/>
		</div>
	)
}

export { StatisticsWidget2 }
