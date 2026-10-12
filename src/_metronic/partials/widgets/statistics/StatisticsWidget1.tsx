/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { toAbsoluteUrl } from '../../../helpers'

type Props = {
	link: string
	className: string
	image: string
	title: string
	description: string
}

const StatisticsWidget1: React.FC<Props> = ({ className, image, title, description, link }) => {
	return (
		<a href={link}>
			<div
				className={`card bgi-no-repeat ${className}`}
				style={{
					backgroundPosition: 'right top',
					backgroundSize: '30% auto',
					backgroundImage: `url(${toAbsoluteUrl('/media/svg/shapes/' + image)})`,
				}}>
				{/* begin::Body */}
				<div className='card-body'>
					<h2 className='card-title fw-bold text-muted text-hover-primary fs-1 mb-5'>{title}</h2>

					{/* <div className='fw-bold text-primary my-6'>{time}</div> */}

					<p
						className='text-dark-75 fw-semibold fs-2 m-0'
						dangerouslySetInnerHTML={{ __html: description }}></p>
				</div>
				{/* end::Body */}
			</div>
		</a>
	)
}

export { StatisticsWidget1 }
