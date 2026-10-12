import { faBasketShopping } from '@fortawesome/free-solid-svg-icons'
import React, { FC } from 'react'
import {
	StatisticsWidget3,
	StatisticsWidget4,
	StatisticsWidget5,
	StatisticsWidget6,
} from '../../../../_metronic/partials/widgets'

const Statistics: FC = () => {
	return (
		<>
			{/* begin::Row */}
			<div className='row g-5 g-xl-8'>
				<div className='col-xl-4'>
					<StatisticsWidget3
						className='card-xl-stretch mb-xl-8'
						color='success'
						title='Weekly Sales'
						description='Your Weekly Sales Chart'
						change='+100'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget3
						className='card-xl-stretch mb-xl-8'
						color='danger'
						title='Authors Progress'
						description='Marketplace Authors Chart'
						change='-260'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget3
						className='card-xl-stretch mb-5 mb-xl-8'
						color='primary'
						title='Sales Progress'
						description='Marketplace Sales Chart'
						change='+180'
					/>
				</div>
			</div>
			{/* end::Row */}

			{/* begin::Row */}
			<div className='row g-5 g-xl-8'>
				<div className='col-xl-4'>
					<StatisticsWidget4
						className='card-xl-stretch mb-xl-8'
						Icon={faBasketShopping}
						color='info'
						title='Sales Change'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget4
						className='card-xl-stretch mb-xl-8'
						Icon={faBasketShopping}
						color='success'
						title='Weekly Income'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget4
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faBasketShopping}
						color='primary'
						title='New Users'
					/>
				</div>
			</div>
			{/* end::Row */}

			{/* begin::Row */}
			<div className='row g-5 g-xl-8'>
				<div className='col-xl-4'>
					<StatisticsWidget5
						className='card-xl-stretch mb-xl-8'
						svgIcon='basket'
						color='danger'
						iconColor='white'
						title='Shopping Cart'
						titleColor='white'
						description='Lands, Houses, Ranchos, Farms'
						descriptionColor='white'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget5
						className='card-xl-stretch mb-xl-8'
						svgIcon='cheque'
						color='primary'
						iconColor='white'
						title='Appartments'
						titleColor='white'
						description='Flats, Shared Rooms, Duplex'
						descriptionColor='white'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget5
						className='card-xl-stretch mb-5 mb-xl-8'
						svgIcon='chart-simple-3'
						color='success'
						iconColor='white'
						title='Sales Stats'
						titleColor='white'
						description='50% Increased for FY20'
						descriptionColor='white'
					/>
				</div>
			</div>
			{/* end::Row */}

			{/* begin::Row */}
			<div className='row g-5 g-xl-8'>
				<div className='col-xl-3'>
					<StatisticsWidget5
						className='card-xl-stretch mb-xl-8'
						svgIcon='chart-simple'
						color='white'
						iconColor='primary'
						title='500M$'
						description='SAP UI Progress'
					/>
				</div>

				<div className='col-xl-3'>
					<StatisticsWidget5
						className='card-xl-stretch mb-xl-8'
						svgIcon='cheque'
						color='dark'
						iconColor='white'
						title='+3000'
						titleColor='white'
						description='New Customers'
						descriptionColor='white'
					/>
				</div>

				<div className='col-xl-3'>
					<StatisticsWidget5
						className='card-xl-stretch mb-xl-8'
						svgIcon='briefcase'
						color='warning'
						iconColor='white'
						title='$50,000'
						titleColor='white'
						description='Milestone Reached'
						descriptionColor='white'
					/>
				</div>

				<div className='col-xl-3'>
					<StatisticsWidget5
						className='card-xl-stretch mb-5 mb-xl-8'
						svgIcon='chart-pie-simple'
						color='info'
						iconColor='white'
						title='$50,000'
						titleColor='white'
						description='Milestone Reached'
						descriptionColor='white'
					/>
				</div>
			</div>
			{/* end::Row */}

			{/* begin::Row */}
			<div className='row g-5 g-xl-8'>
				<div className='col-xl-4'>
					<StatisticsWidget6
						className='card-xl-stretch mb-xl-8'
						color='success'
						title='Avarage'
						description='Project Progress'
						progress='50%'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget6
						className='card-xl-stretch mb-xl-8'
						color='warning'
						title='48k Goal'
						description='Company Finance'
						progress='15%'
					/>
				</div>

				<div className='col-xl-4'>
					<StatisticsWidget6
						className='card-xl-stretch mb-xl-8'
						color='primary'
						title='400k Impressions'
						description='Marketing Analysis'
						progress='76%'
					/>
				</div>
			</div>
			{/* end::Row */}
		</>
	)
}

export { Statistics }
