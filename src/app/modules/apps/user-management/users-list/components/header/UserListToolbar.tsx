import { KTIcon } from '../../../../../../../_metronic/helpers'
import { UsersListFilter } from './UsersListFilter'

const UsersListToolbar = () => {

	return (
		<div
			className='d-flex justify-content-end'
			data-kt-user-table-toolbar='base'>
			<UsersListFilter />

			{/* begin::Add user */}
			<button
				className='btn btn-primary'>
				<KTIcon
					iconName='plus'
					className='fs-2'
				/>
				Create Invoice
			</button>
			{/* end::Add user */}
		</div>
	)
}

export { UsersListToolbar }
