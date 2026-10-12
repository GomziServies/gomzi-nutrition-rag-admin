import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetExam } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ExamAllocate: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [examData, setExamData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [sort, setSort] = useState('createdAt')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [selectedSubject, setSelectedSubject] = useState('')

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetExam({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: selectedSubject || searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setExamData(response.data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedSubject])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredExamData = examData.filter(
		(exam: any) => exam.title && exam.title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}
	const sortableFields = [
		{ title: 'Exam Name', field: 'title' },
		{ title: 'Course', field: 'course_name' },
		{ title: 'Updated At', field: 'updatedAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exam Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 d-flex'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={examData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar d-flex justify-content-end'>
						<SelectField
							className='fv-row mb-7 mt-6'
							label='Subject'
							showLabel={false}
							name='Filter Subject'
							value={selectedSubject}
							onChange={(e) => setSelectedSubject(e.target.value)}
							htmlFor='Filter Subject'
							options={[
								'Anabolic Androgenic Steroids',
								'Diploma In Nutrition Course',
								'Nutri Trainer',
								'Injury Rehabilitation Masterclass',
								'Group Instructor Masterclass',
								'Diploma In Nutrition',
								'Advance Clinical Nutrition',
								'Mix Martial Arts Workshop',
								'Anabolic Androgenic Steroids Masterclass',
								'Functional Training Workshop',
								'Diploma In Personal Training',
								'Powerlifting Coach Workshop',
								'Diploma In Business Management',
								'Tabata Workshop',
								'Certified Nutrition Course',
								'TRX band workshop',
								'Python Programming',
								'Injury Rehabilitation Workshop',
								'Injury Rehab Course',
								'Certified Personal Trainer',
								'Flexible Learning',
								'Certified Wellness Consultant',
								'Gym Management Course',
								'Digital Marketing',
								'Tabata & Functional Trainer',
								'Tabata & Functional Workshop',
								'Group Instructor Workshop',
							]}
						/>
						<TableButton
							action='add'
							to='/fgiit/exam-view'
							text='Add'
						/>
					</div>
				</div>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={examData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(exam: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={exam._id}>
									<tr
										onClick={() => handleRowClick(exam._id)}
										className='data-row'>
										<td className='text-center'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{exam.title}
											</span>
										</td>
										<td>
											<ul>
												{exam.courses &&
													exam.courses.length > 0 &&
													exam.courses.map((course: any, itemIndex: number) => {
														return (
															<li
																key={itemIndex}
																className='text-dark fw-bold  mb-1 fs-6'>
																{course.course_name}
															</li>
														)
													})}
											</ul>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(exam.updatedAt).format('DD-MM-YYYY h:mm:ss A')}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='view'
													to={`/fgiit/exam-question?exam_id=${exam._id}`}
													backgroundDark={true}
													className='d-flex align-items-center'
												/>
												<TableButton
													action='assign'
													to={`/fgiit/allocate-exam?allocate_id=${exam._id}&exam_title=${exam.title}`}
													text='Allocate Exam'
													showIcon={false}
													backgroundDark={true}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {exam.title}
													<br />
													<strong>{sortableFields[1].title}: </strong>{' '}
													<ul>
														{exam.courses &&
															exam.courses.length > 0 &&
															exam.courses.map((course: any, itemIndex: number) => {
																return (
																	<li
																		key={itemIndex}
																		className='text-dark fw-bold  mb-1 fs-6'>
																		{course.course_name}
																	</li>
																)
															})}
													</ul>
													<br />
													<strong>{sortableFields[2].title}: </strong>{' '}
													{DayJS(exam.updatedAt).format('DD-MM-YYYY')}
													<br />
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
					{examData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					<UsersListPagination
						totalPages={metaData?.totalPages}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
					/>
				</div>
			</KTCard>
		</>
	)
}

export default ExamAllocate
