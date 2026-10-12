import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { GetGnProduction } from '../../../../Functions/FGGroup/GnProduction'
import toast from 'react-hot-toast'

interface SupplementData {
    item_id?: string
    item_name?: string
    item_weight?: number
    item_weight_type?: string
}

const GNInventoryProductionDetailsView: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const productionId = queryParams.get('id')

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<any>(null)
    const [supplements, setSupplements] = useState<SupplementData[]>([])

    const fetchProductionDetails = async () => {
        if (!productionId) return
        setLoading(true)
        try {
            const response = await GetGnProduction({ id: productionId })
            if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
                const data = response.data[0]
                setFormData(data)
                setSupplements(data.productionRawItems || [])
            } else {
                toast.error('Production details not found')
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to fetch production details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProductionDetails()
    }, [productionId])

    return (
        <>
            <PageTitle breadcrumbs={[]}>GN Production Details - View</PageTitle>

            <div className='row'>
                <div className='col-md-12 mt-3'>
                    <div className='card shadow-sm'>
                        <div className='card-body'>
                            {/* Production Information Section */}
                            <div className='mb-8'>
                                <h3 className='mb-5 fw-bolder text-dark'>Production Information</h3>
                                <div className='row g-5'>
                                    {/* Production Name */}
                                    <div className='col-md-4'>
                                        <label className='form-label fw-bold text-muted mb-2'>
                                            Production Name
                                        </label>
                                        <div className='fs-5 fw-semibold text-gray-800'>
                                            {formData?.production_itemId?.item_name || formData?.production_name || '-'}
                                        </div>
                                    </div>

                                    {/* Batch No */}
                                    <div className='col-md-4'>
                                        <label className='form-label fw-bold text-muted mb-2'>
                                            Batch No
                                        </label>
                                        <div className='fs-5 fw-semibold text-gray-800'>
                                            {formData?.batch_no}
                                        </div>
                                    </div>

                                    {/* Total Product Weight */}
                                    <div className='col-md-4'>
                                        <label className='form-label fw-bold text-muted mb-2'>
                                            Total Product Weight
                                        </label>
                                        <div className='fs-5 fw-semibold text-gray-800'>
                                            {formData?.total_product_weight}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='separator separator-dashed my-6'></div>

                            {/* Supplements Section */}
                            <div className='mb-8'>
                                <h3 className='mb-5 fw-bolder text-dark'>Supplements Details</h3>
                                <div className='table-responsive'>
                                    <table className='table table-row-bordered table-row-gray-300 align-middle gs-0 gy-4'>
                                        <thead>
                                            <tr className='fw-bold text-muted bg-light'>
                                                <th className='min-w-50px ps-4 rounded-start'>Sr. No.</th>

                                                <th className='min-w-150px'>Product Raw Type</th>
                                                <th className='min-w-100px rounded-end'>Weight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supplements.map((supplement, index) => (
                                                <tr key={index}>
                                                    <td className='ps-4'>
                                                        <span className='text-dark fw-semibold d-block fs-6'>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className='text-dark fw-semibold d-block fs-6'>
                                                            {supplement.item_name}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className='text-dark fw-semibold fs-7 fw-bold'>
                                                            {supplement.item_weight_type?.toLowerCase() === 'kg' || supplement.item_weight_type?.toLowerCase() === 'ltr' 
                                                                ? (Number(supplement.item_weight || 0) / 1000) 
                                                                : supplement.item_weight} {supplement.item_weight_type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className='separator separator-dashed my-6'></div>

                            {/* Total Raw Weight */}
                            <div className='mb-8'>
                                <div className='row  bg-light-dark rounded p-2'>
                                    <div className='col-md-6'>
                                        <div className='d-flex align-items-center'>
                                            <div className='flex-grow-1'>
                                                <label className='form-label fw-bolder text-dark mb-2 fs-4'>
                                                    Total Raw Weight
                                                </label>
                                                <div className='fs-4 fw-bold text-gray-500'>
                                                    {Number(formData?.total_raw_weight || 0) / 1000} kg
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <div className='d-flex align-items-center'>
                                            <div className='flex-grow-1'>
                                                <label className='form-label fw-bolder text-dark mb-2 fs-4'>
                                                    Total Raw Volume
                                                </label>
                                                <div className='fs-4 fw-bold text-gray-500'>
                                                    {Number(formData?.total_raw_volume || 0) / 1000} Ltr
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className='d-flex justify-content-end gap-3 mt-8'>
                                <button
                                    type='button'
                                    className='btn btn-light'
                                    onClick={() => navigate(-1)}>
                                    <i className='bi bi-arrow-left me-2'></i>
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default GNInventoryProductionDetailsView