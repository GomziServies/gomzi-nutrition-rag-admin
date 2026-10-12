import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import Table from '../../../components/Table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const HREmployeeMemo = () => {
	const intl = useIntl()
	const [loading, setLoading] = useState(false);
	const [sort, setSort] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc');
	const [metaData, setMetaData] = useState<any>();
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [memberData, setMemberData] = useState<any>([
		{ name: 'Demo', createdAt: '12-10-12' },
		{ name: 'Demo1', createdAt: '10-12-22 1:00 pm' },
		{ name: 'Demo2', createdAt: '3-5-23 8:38' },
	])
	const [employeeMemoData, setEmployeeMemoData] = useState({
		upload_photo: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		setEmployeeMemoData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const sortableFields = [
		{ title: 'Name', field: 'name' },
		{ title: 'Create Date', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Detail</PageTitle>
			<>

				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<h1 className='fw-bold text-dark fs-1 m-6 mt-0 '>Employee Memo</h1>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-12'>
										<div className='row'>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Upload Memo'
													type='file'
													className='col-12 fv-row mb-7'
													name='upload_photo'
													label='Upload Memo'
													htmlFor='upload_photo'
													value={employeeMemoData.upload_photo}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>

											<div className='col-md-4 fv-row mb-7 d-flex align-items-center justify-content-center'>
												<button
													type='button'
													className='btn btn-success mx-2 mt-7 my-4'
													data-bs-toggle='modal'
													data-bs-target='#kt_modal_exercise'>
													Upload Document
												</button>
											</div>
										</div>
									</div>
								</div>

								<div className='py-4 card-body'>
									<div className='table-responsive'>
										<Table
											data={memberData}
											columns={sortableFields}
											sort={sort}
											sortOrder={sortOrder}
											onSortChange={handleSortChange}
											renderRow={(member: any, index: number, actualIndex: number, isVisible: boolean) => (
												<React.Fragment key={member._id}>
													<tr
														onClick={() => handleRowClick(member._id)}
														className='data-row'>
														<td className='text-center'>
															<div className='d-flex'>
																<FontAwesomeIcon
																	icon={faPlusCircle}
																	className='mx-2 ms-5 mb-1 plus-icon'
																	style={{ color: '#607D8B', fontSize: '18px' }}
																/>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{actualIndex}
																</span>
															</div>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{member.name}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{DayJS(member.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
															</span>
														</td>
														<td>
															<TableButton
																action="edit"
															// onClick={() => handleEditClick(member)}
															/>

															<TableButton
																action="remove"
															// onClick={() => deleteFood(member._id)}
															/>
														</td>
													</tr>
													{isVisible && (
														<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
															<td colSpan={12}>
																<div>
																	<strong>{sortableFields[0].title}:</strong> {member.document_type}
																</div>
															</td>
														</tr>
													)}
												</React.Fragment>
											)}
											visibleDetails={visibleDetails}
											pagination={pagination}
											setPagination={setPagination}
											loading={loading}
										/>
									</div>
								</div>

							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}

export { HREmployeeMemo }
