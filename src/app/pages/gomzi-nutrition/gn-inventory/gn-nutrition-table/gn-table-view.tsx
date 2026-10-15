import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import toast from 'react-hot-toast'
import { GetGnFormulation } from '../../../../Functions/FGGroup/GnFormulation'

//  PDF Packages
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/*  Nutrition Types */
interface NutritionItem {
  itemName: string
  weightPerScoop: string
  weightPer100g: string
  rda: string
}

/* Amino Profile Types  */
interface AminoItem {
  id: string
  title: string
  weight: string
  unit: string
}

interface AminoCategory {
  id: string
  heading: string
  weight?: string
  unit?: string
  items: AminoItem[]
}

interface ViewData {
  _id: string
  client_name: string
  product_name: string
  scoop_size: string
  nutrition_items: NutritionItem[]
  createdAt: string

  // ✅ Add Amino Profile (optional)
  amino_profile?: AminoCategory[]
}

interface LocationState {
  viewData?: ViewData
}

const GnTablePriceView: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedItem, setSelectedItem] = useState<ViewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ✅ Get formulation_id from URL query parameter
  const searchParams = new URLSearchParams(location.search)
  const formulation_id = searchParams.get('formulation_id')

  // ✅ Fetch formulation data when component mounts
  useEffect(() => {
    const fetchFormulationData = async () => {
      // Check if data is passed via location.state first
      const state = location.state as LocationState
      if (state?.viewData) {
        setSelectedItem(state.viewData)
        return
      }

      // If no formulation_id in URL, do not fetch
      if (!formulation_id) {
        return
      }

      setIsLoading(true)
      try {
        // Call your API to get formulation by ID
        const response: FGGroupAPIResponse = await GetGnFormulation({ id: formulation_id })
        
        if (response?.data) {
          const formulation = Array.isArray(response.data) ? response.data[0] : response.data
          
          // Map the API response to ViewData format
          const mappedData: ViewData = {
            _id: formulation._id,
            client_name: formulation.clientName || 'N/A',
            product_name: formulation.productName,
            scoop_size: formulation.scoopSize?.toString() || '35',
            nutrition_items: (formulation.nutritionItems || []).map((item: any) => ({
              itemName: item.itemName,
              weightPerScoop: item.weight35gm?.toString() || '-',
              weightPer100g: item.weight100gm?.toString() || '-',
              rda: item.rda?.toString() || '-',
            })),
            createdAt: formulation.createdAt || new Date().toISOString(),
            // Map amino acid profile
            amino_profile: (formulation.aminoAcidProfile || []).map((cat: any) => ({
              id: cat._id,
              heading: cat.title,
              weight: cat.value?.toString() || '',
              unit: cat.unit || '',
              items: (cat.items || []).map((item: any) => ({
                id: item._id,
                title: item.name,
                weight: item.value?.toString() || '',
                unit: item.unit || '',
              })),
            })),
          }
          
          setSelectedItem(mappedData)
        } else {
          toast.error('Formulation not found')
          navigate(-1)
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to fetch formulation data')
        navigate(-1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormulationData()
  }, [formulation_id, location.state])

  const formatRDA = (value: string) => {
    const v = (value || '').trim()
    if (!v) return '-'
    return v.includes('%') ? v : `${v}%`
  }

  const printTimeText = useMemo(() => {
    return new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // ✅ Check Amino has data or not
  const hasAminoData = useMemo(() => {
    const amino = selectedItem?.amino_profile || []
    if (!amino || amino.length === 0) return false

    return amino.some((c) => {
      const hasHeading = (c.heading || '').trim() !== ''
      const hasWeight = (c.weight || '').toString().trim() !== ''
      const hasItems = c.items && c.items.length > 0
      return hasHeading || hasWeight || hasItems
    })
  }, [selectedItem])

  /** =======================
   * ✅ Generate PDF (Same as Create)
   * ======================= */
  const generatePDF = async () => {
    if (!selectedItem) return

    const amino = selectedItem?.amino_profile || []

    const aminoSectionHTML = hasAminoData
      ? `
        <div class="sectionTitle">Amino Acid Profile</div>
        <table>
          <tbody>
            ${amino
        .map((cat) => {
          const categoryRow = `
                  <tr class="categoryRow">
                    <td colspan="2">
                      <div class="catRowFlex">
                        <div class="catName">${cat.heading || '-----'}</div>
                        ${cat.items.length === 0
              ? `<div class="catValue">${cat.weight || '-'} ${cat.unit ? cat.unit : ''}</div>`
              : ``
            }
                      </div>
                    </td>
                  </tr>
                `

          const itemRows =
            cat.items.length > 0
              ? cat.items
                .map(
                  (it) => `
                      <tr>
                        <td>${it.title || '-'}</td>
                        <td style="font-weight:700; text-align:right;">
                          ${it.weight || '-'} ${it.unit ? it.unit : ''}
                        </td>
                      </tr>
                    `
                )
                .join('')
              : ''

          return categoryRow + itemRows
        })
        .join('')}
          </tbody>
        </table>
      `
      : ``

    // ✅ Nutrition table HTML
    const htmlContent = `
      <div id="pdf-root">
        <div class="topHeader">
          <h1>${selectedItem.product_name || 'Nutrition Report'}</h1>
        </div>

        <div class="sectionTitle">Formulation Table</div>
        <table>
          <thead>
            <tr>
              <th style="width:40%;">Nutrients</th>
              <th style="width:20%;">Per ${selectedItem.scoop_size || '__'}g</th>
              <th style="width:20%;">Per 100g</th>
              <th style="width:20%;">%RDA</th>
            </tr>
          </thead>
          <tbody>
            ${(selectedItem.nutrition_items || [])
        .map(
          (item) => `
              <tr>
                <td style="font-weight:700;">${item.itemName || '-'}</td>
                <td>${item.weightPerScoop || '-'}</td>
                <td>${item.weightPer100g || '-'}</td>
                <td>${formatRDA(item.rda)}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>

        ${aminoSectionHTML}
      </div>
    `

    // ✅ Temp wrapper for html2canvas
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-9999px'
    wrapper.style.top = '0'
    wrapper.style.width = '794px' // A4 width approx
    wrapper.style.background = '#fff'
    wrapper.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        #pdf-root {         
          padding: 18px;
          background: #fff;
          color: #111827;
        }

        .topHeader {
          text-align: center;
          margin-bottom: 14px;
          border-bottom: 1px solid #111827;
          padding-bottom: 10px;
        }

        .topHeader h1 {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          margin-bottom: 4px;
        }

        .smallTime{
          font-size: 10px;
          font-weight: 600;
          color: #374151;
        }

        .sectionTitle {
          font-size: 14px;
          font-weight: 900;
          color: #000;
          margin-top: 14px;
          margin-bottom: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          margin-bottom: 14px;
        }

        th {
          background: #e1e3ea;
          color: #000000;
          padding: 10px 12px;
          font-size: 11px;
          text-align: left;
          border: 1px solid #d1d5db;
          font-weight: 700;
        }

        td {
          padding: 10px 12px;
          font-size: 11px;
          border: 1px solid #d1d5db;
          color: #111827;
        }

        .categoryRow td {
          font-weight: 800;
          border: 1px solid #d1d5db;
          background: #e1e3ea;
          color: #000000;
        }

        .catRowFlex{
          display:flex;
          justify-content: space-between;
          align-items:center;
        }

        .catName{
          font-weight: 800;
        }

        .catValue{
          font-weight: 800;
        }
      </style>

      ${htmlContent}
    `

    document.body.appendChild(wrapper)

    try {
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/JPEG', 1.0)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${selectedItem.product_name || 'Nutrition_Report'}.pdf`)
    } catch (error) {
      alert('PDF Generate failed ❌')
    } finally {
      document.body.removeChild(wrapper)
    }
  }

  // ✅ Loading State
  if (isLoading) {
    return (
      <>
        <PageTitle breadcrumbs={[]}>Formulation Table View</PageTitle>
        <KTCard>
          <div className="card-body">
            <div className="d-flex flex-column text-center w-100 align-content-center justify-content-center mt-5 py-10">
              <div className='spinner-border text-primary mx-auto mb-4' role='status' style={{ width: '3rem', height: '3rem' }}>
                <span className='visually-hidden'>Loading...</span>
              </div>
              <p className="text-gray-600 fs-5 fw-semibold">Loading formulation data...</p>
            </div>
          </div>
        </KTCard>
      </>
    )
  }

  // ✅ No Data State
  if (!selectedItem) {
    return (
      <>
        <PageTitle breadcrumbs={[]}>Formulation Table View</PageTitle>
        <KTCard>
          <div className="card-body">
            <div className="d-flex flex-column text-center w-100 align-content-center justify-content-center mt-5 py-10">
              <i className="bi bi-inbox fs-4x text-gray-400 mb-4"></i>
              <b className="text-gray-800 fs-3">No data available</b>
              <p className="text-gray-600 fs-6 mt-2">Please select a client process from the Inventory Dashboard to view its Production Formula</p>
              <button
                onClick={() => navigate('/rag/inventory')}
                className='btn btn-primary mt-4'
                style={{ maxWidth: '240px', margin: '0 auto' }}
              >
                Go to Inventory Dashboard
              </button>
            </div>
          </div>
        </KTCard>
      </>
    )
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Formulation Table View</PageTitle>

      <KTCard>
        <div className="card-header" style={{ background: '#f8f9fa', padding: '20px' }}>
          <div>
            <h3 className="card-title fw-bold fs-2 mb-1">Formulation Table</h3>
            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
              {selectedItem.product_name} - {selectedItem.client_name}
            </p>
          </div>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          {/* ✅ Preview - Formulation Table (Same as Create preview style) */}
          <div
            style={{
              background: 'white',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>
              Preview - Formulation Table
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e1e3ea', color: '#000000' }}>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>Nutrients</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
                      Per {selectedItem.scoop_size || '__'}g
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>Per 100g</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>%RDA</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedItem.nutrition_items || []).map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 600 }}>{item.itemName || '-'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.weightPerScoop || '-'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.weightPer100g || '-'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{formatRDA(item.rda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ Preview - Amino Acid Profile (If exists) */}
          {hasAminoData && (
            <div
              style={{
                background: 'white',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '24px',
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
                Preview - Amino Acid Profile
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                  <tbody>
                    {(selectedItem.amino_profile || []).map((cat) => (
                      <React.Fragment key={cat.id}>
                        <tr style={{ background: '#e1e3ea' }}>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px' }} colSpan={2}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 800 }}>{cat.heading || '-'}</span>

                              {cat.items.length === 0 && (
                                <span style={{ fontWeight: 800 }}>
                                  {cat.weight || '-'} {cat.unit || ''}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {cat.items.length > 0 &&
                          cat.items.map((it) => (
                            <tr key={it.id}>
                              <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{it.title || '-'}</td>
                              <td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 700, textAlign: 'right' }}>
                                {it.weight || '-'} {it.unit || ''}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              className='btn btn-light'
            >
              <i className="bi bi-arrow-left text-dark" style={{ marginRight: '8px' }}></i>
              Back
            </button>
            <button
              onClick={generatePDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: '#009ef7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-download" style={{ fontSize: '16px', color: "white" }}></i>
              Download PDF
            </button>
          </div>
        </div>
      </KTCard>
    </>
  )
}

export default GnTablePriceView
