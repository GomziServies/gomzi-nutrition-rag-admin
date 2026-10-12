import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetIptnaInquiry } from '../../../Functions/FGGroup/IptnaInquiry'

const IptnaInquiryList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [metaData, setMetaData] = useState<any>(null)
    const [businessData, setBusinessData] = useState([])
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchData = async (page?: number) => {
        setLoading(true)
        try {
            const response: any = await GetIptnaInquiry({
                page: page || pagination.page,
                limit: pagination.itemsPerPage,
                search: searchTerm,
                sort,
                sortOrder,
            })

            if (response?.metadata?.pagination) {
                setMetaData(response.metadata.pagination)
            } else {
                setMetaData(null)
            }

            setBusinessData(response?.data || [])

        } catch (error: any) {
            console.error('Fetch error:', error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

    const isFirstRender = useRef(true)

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

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
        setSort(newSort)
        setSortOrder(newSortOrder)
    }

    const sortableFields = [
        { title: 'Full Name', field: 'full_name' },
        { title: 'Email', field: 'email' },
        { title: 'Phone', field: 'phone' },
        { title: 'Institute', field: 'institute_name' },
        { title: 'Country', field: 'country' },
    ]

    const handleRowClick = (id: string) => {
        if (window.innerWidth <= 1024) {
            setVisibleDetails(visibleDetails === id ? null : id)
        }
    }

    return (
			<>
				<PageTitle breadcrumbs={[]}>IPTNA Inquiry List</PageTitle>
				<KTCard>
					<div className='card-header border-0 pt-6'>
						<div className='card-branch_code'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
					<div className='py-4 card-body'>
						<div className='table-responsive'>
							<Table
								data={businessData}
								columns={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
								renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
									<React.Fragment key={item._id}>
										<tr
											onClick={() => handleRowClick(item._id)}
											className='data-row'>
											<td
												className='text-center'
												role='button'>
												<span className='text-dark ms-6 d-flex fw-bold d-block mb-1 fs-6'>
													<FontAwesomeIcon
														icon={faPlusCircle}
														className='me-2 plus-icon'
														style={{ color: '#607D8B', fontSize: '18px' }}
													/>
													{actualIndex + 1}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{item.full_name}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.email}</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{item.country_code + item.phone}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{item.institute_name}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.country}</span>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>Full Name:</strong> {item.full_name}
														<br />
														<strong>Email:</strong> {item.email}
														<br />
														<strong>Phone:</strong> {item.phone}
														<br />
														<strong>Institute:</strong> {item.institute_name}
														<br />
														<strong>Country:</strong> {item.country}
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

						{businessData.length === 0 && !loading && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}

						{businessData.length > 0 && metaData?.totalPages > 1 && (
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</KTCard>
			</>
		)
}

export default IptnaInquiryList
