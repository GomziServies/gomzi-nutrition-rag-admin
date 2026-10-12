import clsx from 'clsx'
import { useFormik } from 'formik'
import { FC, useState } from 'react'
import * as Yup from 'yup'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { UsersListLoading } from '../components/loading/UsersListLoading'
import { useListView } from '../core/ListViewProvider'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { initialUser, User } from '../core/_models'
import { createUser, updateUser } from '../core/_requests'

type Props = {
	isUserLoading: boolean
	user: User
}

const editUserSchema = Yup.object().shape({
	email: Yup.string()
		.email('Wrong email format')
		.min(3, 'Minimum 3 symbols')
		.max(50, 'Maximum 50 symbols')
		.required('Email is required'),
	name: Yup.string()
		.min(3, 'Minimum 3 symbols')
		.max(50, 'Maximum 50 symbols')
		.required('Name is required'),
})

const UserEditModalForm: FC<Props> = ({ user, isUserLoading }) => {
	const { setItemIdForUpdate } = useListView()
	const { refetch } = useQueryResponse()

	const [userForEdit] = useState<User>({
		...user,
		avatar: user.avatar || initialUser.avatar,
		role: user.role || initialUser.role,
		position: user.position || initialUser.position,
		name: user.name || initialUser.name,
		email: user.email || initialUser.email,
	})

	const cancel = (withRefresh?: boolean) => {
		if (withRefresh) {
			refetch()
		}
		setItemIdForUpdate(undefined)
	}

	const formik = useFormik({
		initialValues: userForEdit,
		validationSchema: editUserSchema,
		onSubmit: async (values, { setSubmitting }) => {
			setSubmitting(true)
			try {
				if (isNotEmpty(values.id)) {
					await updateUser(values)
				} else {
					await createUser(values)
				}
			} catch (ex) {
				console.error(ex)
			} finally {
				setSubmitting(true)
				cancel(true)
			}
		},
	})

	return (
		<>
			<form
				id='kt_modal_add_user_form'
				className='form'
				onSubmit={formik.handleSubmit}
				noValidate>
				{/* begin::Scroll */}
				<div
					className='d-flex flex-column scroll-y me-n7 pe-7'
					id='kt_modal_add_user_scroll'
					data-kt-scroll='true'
					data-kt-scroll-activate='{default: false, lg: true}'
					data-kt-scroll-max-height='auto'
					data-kt-scroll-dependencies='#kt_modal_add_user_header'
					data-kt-scroll-wrappers='#kt_modal_add_user_scroll'
					data-kt-scroll-offset='300px'>
					{/* begin::Input group */}
					<div className='fv-row mb-7'>
						{/* begin::Label */}
						<label
							htmlFor='dfsf'
							className='required fw-bold fs-6 mb-2'>
							Full Name
						</label>
						{/* end::Label */}

						{/* begin::Input */}
						<input
							placeholder='Full name'
							{...formik.getFieldProps('name')}
							type='text'
							name='name'
							className={clsx(
								'form-control form-control-solid mb-3 mb-lg-0',
								{ 'is-invalid': formik.touched.name && formik.errors.name },
								{
									'is-valid': formik.touched.name && !formik.errors.name,
								}
							)}
							autoComplete='off'
							disabled={formik.isSubmitting || isUserLoading}
						/>
						{formik.touched.name && formik.errors.name && (
							<div className='fv-plugins-message-container'>
								<div className='fv-help-block'>
									<span role='alert'>{formik.errors.name}</span>
								</div>
							</div>
						)}
						{/* end::Input */}
					</div>
					{/* end::Input group */}

					{/* begin::Input group */}
					<div className='fv-row mb-7'>
						{/* begin::Label */}
						<label
							htmlFor='dfsf'
							className='required fw-bold fs-6 mb-2'>
							Type
						</label>
						{/* end::Label */}

						{/* begin::Input */}
						<select className='form-control form-select form-control-solid mb-3 mb-lg-0'>
							<option>Admin</option>
							<option>Franchise</option>
						</select>
						{/* end::Input */}
					</div>
					{/* end::Input group */}

					{/* begin::Input group */}
					<div className='fv-row mb-7'>
						{/* begin::Label */}
						<label
							htmlFor='dfsf'
							className='required fw-bold fs-6 mb-2'>
							Number
						</label>
						{/* end::Label */}

						{/* begin::Input */}
						<input
							placeholder='Number'
							type='Number'
							name='name'
							className='form-control form-control-solid mb-3 mb-lg-0'
							autoComplete='off'
						/>
						{/* end::Input */}
					</div>
					{/* end::Input group */}

					{/* begin::Input group */}
					<div className='fv-row mb-7'>
						{/* begin::Label */}
						<label
							htmlFor='dfsf'
							className='required fw-bold fs-6 mb-2'>
							Email
						</label>
						{/* end::Label */}

						{/* begin::Input */}
						<input
							placeholder='Email'
							{...formik.getFieldProps('email')}
							className={clsx(
								'form-control form-control-solid mb-3 mb-lg-0',
								{ 'is-invalid': formik.touched.email && formik.errors.email },
								{
									'is-valid': formik.touched.email && !formik.errors.email,
								}
							)}
							type='email'
							name='email'
							autoComplete='off'
							disabled={formik.isSubmitting || isUserLoading}
						/>
						{/* end::Input */}
						{formik.touched.email && formik.errors.email && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.email}</span>
							</div>
						)}
					</div>
					{/* end::Input group */}

					{/* begin::Input group */}
					<div className='fv-row mb-7'>
						{/* begin::Label */}
						<label
							htmlFor='dfsf'
							className='required fw-bold fs-6 mb-2'>
							Password
						</label>
						{/* end::Label */}

						{/* begin::Input */}
						<input
							placeholder='Password'
							type='text'
							name='password'
							className='form-control form-control-solid mb-3 mb-lg-0'
							autoComplete='off'
						/>
						{/* end::Input */}
					</div>
					{/* end::Input group */}
				</div>
				{/* end::Scroll */}

				{/* begin::Actions */}
				<div className='text-center pt-15'>
					<button
						type='reset'
						onClick={() => cancel()}
						className='btn btn-light me-3'
						data-kt-users-modal-action='cancel'
						disabled={formik.isSubmitting || isUserLoading}>
						Discard
					</button>

					<button
						type='submit'
						className='btn btn-primary'
						data-kt-users-modal-action='submit'
						disabled={isUserLoading || formik.isSubmitting || !formik.isValid || !formik.touched}>
						<span className='indicator-label'>Submit</span>
						{(formik.isSubmitting || isUserLoading) && (
							<span className='indicator-progress'>
								Please wait...{' '}
								<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
							</span>
						)}
					</button>
				</div>
				{/* end::Actions */}
			</form>
			{(formik.isSubmitting || isUserLoading) && <UsersListLoading />}
		</>
	)
}

export { UserEditModalForm }
