import {
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import { GetGnStock } from '../../../../Functions/FGGroup'
import Table from '../../../../components/Table'
import UsersListPagination from '../../../../components/TablePagination'

const GNInventoryStockList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  })

  const [stockData, setStockData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const fetchStock = async () => {
    setLoading(true)
    try {
      const response: any = await GetGnStock({
        page: pagination.page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        sort: 'name',
        sortOrder: 'asc',
      })
      if (response.status === 200) {
        setStockData(response.data)
        setTotalCount(response.metadata.pagination.totalDocs)
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [pagination.page, pagination.itemsPerPage, searchTerm])

  // const handleDateRangeChange = (range: [Date, Date] | null) => {
  //   setSelectedDateRange(range)
  //   setPagination((prev) => ({ ...prev, page: 1 }))
  // }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value })
  }

  const handleRowClick = (id: string) => {
    if (window.innerWidth <= 1024) {
      setVisibleDetails(visibleDetails === id ? null : id)
    }
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (searchTerm.trim() || searchTerm === '') {
      setPagination((prev) => ({ ...prev, page: 1 }))
    }
  }, [searchTerm])

  const sortableFields = [
    { title: 'Item Name', field: 'item_name', className: 'text-nowrap' },
    { title: 'Stock', field: 'stock', className: 'text-nowrap' },
  ]

  return (
    <>
      <PageTitle breadcrumbs={[]}>GN Inventory Stock</PageTitle>
      <KTCard>
        <div className='card-header border-0 pt-6'>
          <div className='row w-100 align-items-center g-2 g-lg-3'>
            <div className='col-12'>
              <div className='row g-2 g-lg-3 align-items-center'>
                <div className='col-12 col-sm-6 col-md-4 col-lg-4'>
                  <SearchFilter
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                  />
                </div>

                <div className='col-auto d-none d-lg-block'>
                  <LengthMenu
                    expenseData={stockData}
                    handleItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>

                {/* <div className='col-12 col-sm-6 col-md-4 col-lg-4'>
                  <DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
                </div> */}

                <div className='col-auto d-lg-none mt-2'>
                  <LengthMenu
                    expenseData={stockData}
                    handleItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='card-body py-4'>
          <div className='table-responsive'>
            <Table
              data={stockData}
              columns={sortableFields}
              sort={''}
              sortOrder={'asc'}
              onSortChange={() => { }}
              renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
                <React.Fragment key={item._id}>
                  <tr
                    className='data-row'
                    onClick={() => handleRowClick(item._id)}>
                    <td className='text-center align-middle' style={{ minWidth: '80px' }}>
                      <div className='d-flex align-items-center justify-content-center' role='button'>
                        <FontAwesomeIcon
                          icon={faPlusCircle}
                          className='me-2 plus-icon'
                          style={{ color: '#607D8B', fontSize: '18px' }}
                        />
                        <span className='text-dark fw-bold fs-6'>{actualIndex}</span>
                      </div>
                    </td>
                    <td className='align-middle' style={{ minWidth: '200px' }}>
                      <span className='text-dark fw-bold text-nowrap d-block fs-6'>
                        {item.item_name || '-'}
                      </span>
                    </td>
                    <td className='align-middle text-start' style={{ minWidth: '150px' }}>
                      <span className='text-dark fw-bold text-nowrap d-block fs-6'>
                        {item.stock} {item.unit || ''}
                      </span>
                    </td>
                  </tr>
                  {isVisible && (
                    <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                      <td colSpan={3}>
                        <div className='p-3'>
                          <div className='row g-2'>
                            <div className='col-12'>
                              <strong>Item Name:</strong> {item.item_name || '-'}
                            </div>
                            <div className='col-12'>
                              <strong>Stock:</strong> {item.stock} {item.unit || ''}
                            </div>
                          </div>
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
              removeAction={true}
            />
          </div>
          {stockData.length === 0 && !loading && (
            <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
              <b>No records found</b>
            </div>
          )}
          {stockData.length > 0 && (
            <div className='mt-3'>
              <UsersListPagination
                totalPages={Math.ceil(totalCount / pagination.itemsPerPage)}
                currentPage={pagination.page}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </KTCard>
    </>
  )
}

export default GNInventoryStockList