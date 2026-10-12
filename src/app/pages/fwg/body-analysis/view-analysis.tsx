import React, { useEffect, useState } from 'react';
import TableButton from '../../../components/TableButton';
import { PageTitle } from '../../../../_metronic/layout/core';
import UsersListPagination from '../../../components/TablePagination';
import { KTCard, KTIcon } from '../../../../_metronic/helpers';
import { DeleteBodyAnalysis, GetBodyAnalysis } from '../../../Functions/FWG';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';


const ViewAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [bodyAnalysisData, setBodyAnalysisData] = useState([])

  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  });


  const fetchData = async () => {
    setLoading(true)
    try {
      const featureResponse: any = await GetBodyAnalysis()
      setBodyAnalysisData(featureResponse.data)

    } catch (error: any) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])


  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleDeleteAnalysis = async (analysis_id: any) => {
    try {
      Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to Remove This Body Analysis.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
      }).then(async (result) => {
        if (result.isConfirmed) {
          await DeleteBodyAnalysis(analysis_id)
          toast.success('Body Analysis Remove successfully')
          fetchData()
        }
      })
    } catch (error: any) {
      console.error('Error Removing Admin:', error)
      toast.error(error.message)
    }
  }

  const filteredBodyAnalysisDataData = bodyAnalysisData.filter((admin: any) =>
    admin._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedBodyAnalysisDataData = filteredBodyAnalysisDataData.slice(
    (pagination.page - 1) * pagination.itemsPerPage,
    pagination.page * pagination.itemsPerPage
  );

  return (
    <>
      <PageTitle breadcrumbs={[]}>View Analysis</PageTitle>
      <KTCard>
        <div className='card-header border-0 pt-6'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <KTIcon
                iconName='magnifier'
                className='fs-1 position-absolute ms-6'
              />
              <input
                type='text'
                data-kt-user-table-filter='search'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Search user'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className='py-4 card-body'>
          <div className='table-responsive'>
            <table
              id='kt_table_users'
              className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
              <thead>
                <tr className='fw-bold text-muted bg-light border-bottom-0'>
                  <th className='ps-4 rounded-start'>No.</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className='text-gray-600 fw-bold'>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className='text-center'>
                      <div className='d-flex justify-content-center align-items-center mb-4 my-7'>
                        <div
                          className='spinner-border text-primary'
                          role='status'>
                          <span className='visually-hidden'>Loading...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBodyAnalysisDataData
                    .slice()
                    .reverse()
                    .map((body: any, index: number) => {
                      return (
                        <tr key={body.id}>
                          <td className='text-center'>
                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                              {index + 1}
                            </span>
                          </td>
                          <td>
                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                              {body.first_name}
                            </span>
                          </td>
                          <td>
                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                              {body.last_name}
                            </span>
                          </td>
                          <td>
                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                              {body.createdAt}
                            </span>
                          </td>
                          <td>
                            <TableButton
                              action="edit"
                              to={`/fwg/edit-analysis?analysis_id=${body._id}`}
                            />
                            <TableButton
                              action="remove"
                              onClick={() => handleDeleteAnalysis(body._id)}
                            />
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          {paginatedBodyAnalysisDataData.length === 0 && !loading && (
            <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
              <b>No records found</b>
            </div>
          )}
          {paginatedBodyAnalysisDataData.length > 0 && (
            <UsersListPagination
              totalPages={Math.ceil(bodyAnalysisData.length / pagination.itemsPerPage)}
              currentPage={pagination.page}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </KTCard>
    </>
  );
};

export default ViewAnalysis;
