import React, { useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import { Link } from 'react-router-dom'

const ACCOUNT_ID = '474498156857637'

const FollowUpReportDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [ads, setAds] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isSavingLeads, setIsSavingLeads] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))

  const getField = (fieldData: any[], name: string): string | null => {
    if (!Array.isArray(fieldData)) return null
    const search = name.toLowerCase().trim()
    const f = fieldData.find((d: any) => d.name?.toLowerCase().trim() === search)
    const val = f?.values?.[0]
    return val && val !== '' ? val : null
  }

  const getFullName = (fieldData: any[]): string | null => {
    if (!Array.isArray(fieldData)) return null;
    
    // 1. Check common fields exactly (case-insensitive)
    const commonNames = ['full_name', 'full name', 'fullname', 'first_name', 'last_name', 'name', 'your_name', 'customer_name']
    for (const name of commonNames) {
      const val = getField(fieldData, name)
      if (val && val !== '-' && val !== '') return val
    }
    
    // 2. Combine first and last if found separately
    const first = getField(fieldData, 'first_name') || getField(fieldData, 'first name')
    const last = getField(fieldData, 'last_name') || getField(fieldData, 'last name')
    if (first && last) return `${first} ${last}`
    
    // 3. Last resort: any field containing "name" but not "ad" or "campaign" or "form"
    const fuzzyName = fieldData.find(f => {
      const n = f.name?.toLowerCase() || ''
      return n.includes('name') && !n.includes('ad') && !n.includes('campaign') && !n.includes('form') && !n.includes('business')
    })
    if (fuzzyName?.values?.[0]) return fuzzyName.values[0]

    return null
  }

  const handleSaveLeads = async (dateStr: string) => {
    setIsSavingLeads(true)
    let totalSaved = 0

    try {
      for (const ad of ads) {
        if (ad.status !== 'ACTIVE') continue;

        try {
          const res: any = await FGGroupAPIs.GetAdLeads(ad.id, { limit: '100', fields: 'id,created_time,field_data,platform' })
          const rawLeads: any[] = res.data || []
          
          const filteredLeads = rawLeads.filter((lead: any) => {
            if (!lead.created_time) return false;
            return new Date(lead.created_time).toLocaleDateString('en-CA') === dateStr
          })

          for (const lead of filteredLeads) {
            const title = getFullName(lead.field_data) || '-'
            const email = getField(lead.field_data, 'email') || '-'
            const mobile = getField(lead.field_data, 'phone_number') || getField(lead.field_data, 'phone') || getField(lead.field_data, 'mobile_number') || getField(lead.field_data, 'mobile') || '-'
            const city = getField(lead.field_data, 'city') || '-'

            const excludeFields = ['email', 'phone_number', 'phone', 'mobile_number', 'mobile', 'full_name', 'first_name', 'last_name', 'name', 'city', 'street_address']
            
            const additional_note_parts = lead.field_data
              ?.filter((f: any) => !excludeFields.includes(f.name?.toLowerCase().trim()))
              .map((f: any) => {
                const q = f.name?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase())
                const a = Array.isArray(f.values) ? f.values.join(', ') : (f.values || '-')
                return `${q}: ${a}`
              }) || []

            const additional_note = additional_note_parts.length > 0 ? additional_note_parts.join(' | ') : '-'

            await FGGroupAPIs.CreateFacebookLead({
              ad_id: ad.id,
              ad_name: ad.name,
              adName: ad.name, // Send both formats
              lead_id: lead.id,
              full_name: title,
              fullName: title, // Send both formats
              phone_number: mobile,
              phone: mobile,
              email: email,
              city: city,
              tag: 'fgiit',
              platform: lead.platform || 'fb',
              additional_note: additional_note,
              created_time: lead.created_time,
              createdTime: lead.created_time // Send both formats
            })
            totalSaved++;
          }
        } catch (err) {
          console.error(`Failed to fetch/save leads for ad ${ad.id}:`, err)
        }
      }
      toast.success(`Successfully saved ${totalSaved} new leads for ${dateStr}!`)
      setShowDateModal(false)
    } catch (err) {
      console.error('Error during bulk save:', err)
      toast.error('An error occurred while saving leads.')
    }
    setIsSavingLeads(false)
  }

  const handleSaveTodaysLeads = () => {
    const todayStr = new Date().toLocaleDateString('en-CA')
    handleSaveLeads(todayStr)
  }

  useEffect(() => {
    fetchAllAds()
  }, [])

  const fetchAllAds = async () => {
    setIsLoading(true)
    try {
      const campRes: any = await FGGroupAPIs.GetAdCampaign(`act_${ACCOUNT_ID}`, {
        fields: 'id,account_id,name,configured_status,bid_strategy,objective',
      })
      const campaignList = campRes.data || []
      setCampaigns(campaignList)

      const adSetResults = await Promise.all(
        campaignList.map((camp: any) =>
          FGGroupAPIs.GetAdSet(camp.id, { fields: 'id,name,configured_status' })
            .then((res: any) =>
              (res.data || []).map((adSet: any) => ({
                ...adSet,
                campaignName: camp.name,
                campaignId: camp.id,
              }))
            )
            .catch(() => [])
        )
      )
      const allAdSets: any[] = adSetResults.flat()

      const adResults = await Promise.all(
        allAdSets.map((adSet: any) =>
          FGGroupAPIs.GetAds(adSet.id, { fields: 'id,name,status' })
            .then((res: any) =>
              (res.data || []).map((ad: any) => ({
                ...ad,
                adSetName: adSet.name,
                campaignName: adSet.campaignName,
                campaignId: adSet.campaignId,
              }))
            )
            .catch(() => [])
        )
      )
      setAds(adResults.flat())
    } catch (err) {
      console.error('Error fetching ads:', err)
    }
    setIsLoading(false)
  }

  const totalActiveAds = ads.length
  const totalCampaigns = campaigns.length

  return (
    <>
      <PageTitle breadcrumbs={[]}>Follow Up Report Dashboard</PageTitle>

      {/* Stats Cards Row */}
      <div className='row g-5 mb-5'>
        <div className='col-xl-4'>
          <div className='stats-card-new border-primary-left'>
            <div className='stats-card-body-new'>
              <div className='stats-icon-new bg-light-primary'>
                <i className='bi bi-megaphone-fill text-primary'></i>
              </div>
              <div className='stats-content-new'>
                <div className='stats-title-new'>Active Ads</div>
                <div className='stats-subtitle-new'>{totalActiveAds} Ads</div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-4'>
          <div className='stats-card-new border-success-left'>
            <div className='stats-card-body-new'>
              <div className='stats-icon-new bg-light-success'>
                <i className='bi bi-diagram-3-fill text-success'></i>
              </div>
              <div className='stats-content-new'>
                <div className='stats-title-new'>Campaigns</div>
                <div className='stats-subtitle-new'>{totalCampaigns} Campaigns</div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-4'>
          <div className='stats-card-new border-warning-left'>
            <div className='stats-card-body-new'>
              <div className='stats-icon-new bg-light-warning'>
                <i className='bi bi-building text-warning'></i>
              </div>
              <div className='stats-content-new'>
                <div className='stats-title-new'>Account</div>
                <div className='stats-subtitle-new'>FGIIT</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <KTCard className='tele-report-card'>
        {/* Filter Bar */}
        <div className='filter-bar'>
          <div className='filter-group'>
            <div className='filter-left'>
              <h5 className='mb-0' style={{ color: '#181c32', fontWeight: 600 }}>Active Ads List</h5>
            </div>

            <div className='filter-right'>
              <Link to='/fgiit/follow-up-report-list' className='btn-add-lead me-2'>
                <i className='bi bi-list-ul text-white'></i>
                View All Saved Leads
              </Link>
              {isLoading && (
                <div className='spinner-border spinner-border-sm text-primary me-3' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
              )}
               <button 
                className='btn-sync me-2'
                onClick={() => setShowDateModal(true)}
                disabled={isSavingLeads || ads.length === 0}
                style={{ background: '#7239ea' }}
              >
                <i className='bi bi-calendar-check-fill text-white'></i>
                <span className='text-white'>Save by Date</span>
              </button>
              <button 
                className='btn-sync'
                onClick={handleSaveTodaysLeads}
                disabled={isSavingLeads || ads.length === 0}
              >
                {isSavingLeads ? (
                  <>
                    <span className='spinner'></span>
                    <span className='text-white'>Saving Leads...</span>
                  </>
                ) : (
                  <>
                    <i className='bi bi-cloud-arrow-down-fill text-white'></i>
                    <span className='text-white'>Save Today's Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='card-body '>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
              <thead>
                <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0 bg-light'>
                  <th className='ps-4 rounded-start' style={{ width: '60px' }}>No.</th>
                  <th className='min-w-150px'>Campaign</th>
                  <th className='min-w-150px'>Ad Set</th>
                  <th className='min-w-150px'>Ad Name</th>
                  <th className='min-w-80px'>Status</th>
                  <th className='min-w-100px text-center rounded-end'>Action</th>
                </tr>
              </thead>
              <tbody className='text-gray-600 fw-bold'>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className='d-flex justify-content-center align-items-center py-10'>
                        <div className='spinner-border text-primary' role='status'>
                          <span className='visually-hidden'>Loading...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : ads.length > 0 ? (
                  ads.map((ad, index) => (
                    <tr key={ad.id} className='data-row'>
                      <td className='ps-4'>
                        <span className='table-common-text'>{index + 1}</span>
                      </td>
                      <td>
                        <div className='table-common-text'>{ad.campaignName || '-'}</div>
                      </td>
                      <td>
                        <div className='table-common-text'>{ad.adSetName || '-'}</div>
                      </td>
                      <td>
                        <div className='table-common-text'>{ad.name || '-'}</div>
                      </td>
                      <td>
                        <span
                          className={`badge badge-light-${
                            ad.status === 'ACTIVE' ? 'success' : ad.status === 'PAUSED' ? 'warning' : 'secondary'
                          }`}>
                          {ad.status || '-'}
                        </span>
                      </td>
                      <td className='text-center'>
                        <TableButton
                          action='view'
                          to={`/fgiit/follow-up-report-list?ad=${ad.id}&name=${encodeURIComponent(ad.name || '')}`}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className='empty-state'>
                        <div className='empty-icon'>
                          <i className='bi bi-inbox'></i>
                        </div>
                        <div className='empty-title'>No Ads Found</div>
                        <div className='empty-subtitle'>
                          No active ads available
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </KTCard>

      <Modal show={showDateModal} onHide={() => !isSavingLeads && setShowDateModal(false)} centered>
        <Modal.Header closeButton={!isSavingLeads}>
          <Modal.Title>Select Date to Save Leads</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='mb-3'>
            <label className='form-label fw-bold'>Date</label>
            <input
              type='date'
              className='form-control'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isSavingLeads}
            />
          </div>
          <p className='text-muted small'>
            This will fetch and save leads created on the selected date for all active ads.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowDateModal(false)} disabled={isSavingLeads}>
            Cancel
          </Button>
          <Button 
            variant='primary' 
            onClick={() => handleSaveLeads(selectedDate)} 
            disabled={isSavingLeads || !selectedDate}
            style={{ background: '#7239ea', border: 'none' }}
          >
            {isSavingLeads ? (
              <>
                <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                Saving...
              </>
            ) : (
              'Save Leads'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        /* New Stats Cards UI */
        .stats-card-new {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          height: 100%;
          border: 1px solid #f1f3f9;
          position: relative;
          overflow: hidden;
        }

        .stats-card-new:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }

        .stats-card-body-new {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .border-primary-left { border-left: 5px solid #667eea; }
        .border-success-left { border-left: 5px solid #50cd89; }
        .border-warning-left { border-left: 5px solid #ffc700; }

        .stats-icon-new {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-light-primary { background-color: #f1f4ff; }
        .bg-light-success { background-color: #e8fff3; }
        .bg-light-warning { background-color: #fff8dd; }

        .stats-icon-new i {
          font-size: 22px;
        }

        .stats-content-new {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stats-title-new {
          font-size: 16px;
          font-weight: 700;
          color: #181c32;
        }

        .stats-subtitle-new {
          font-size: 13px;
          color: #7e8299;
          font-weight: 500;
        }

        /* Card Table Styles */
        .card-table-container {
          margin-top: 16px;
          max-height: 200px;
          overflow-y: auto;
        }

        .card-table-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .card-table-item:hover {
          background: #eef0f8;
        }

        .card-table-item:last-child {
          margin-bottom: 0;
        }

        .card-table-name {
          font-size: 13px;
          font-weight: 600;
          color: #181c32;
        }

        .card-table-platform {
          font-size: 11px;
          color: #a1a5b7;
          margin-top: 2px;
        }

        .card-table-count {
          font-size: 16px;
          font-weight: 800;
          color: #3699ff;
        }

        .city-card-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .city-card-item:last-child {
          margin-bottom: 0;
        }

        .city-card-name {
          font-size: 13px;
          font-weight: 600;
          color: #181c32;
        }

        .city-card-stats {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .city-card-count {
          font-size: 16px;
          font-weight: 800;
          color: #3699ff;
        }

        .city-card-percentage {
          font-size: 11px;
          font-weight: 600;
          color: #a1a5b7;
        }

        .tele-report-card {
          border: none;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .filter-bar {
          background: linear-gradient(135deg, #f8f9fd 0%, #ffffff 100%);
          border-bottom: 1px solid #eef0f8;
          padding: 20px 24px;
        }

        .filter-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          width: 100%;
          justify-content: space-between;
        }

        .filter-left,
        .filter-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .custom-select {
          border: 1px solid #e4e6ef;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #3f4254;
          background-color: #fff;
          min-width: 180px;
          height: 40px;
          transition: all 0.2s ease;
          outline: none;
          cursor: pointer;
        }

        .custom-select:focus {
          border-color: #3699ff;
          box-shadow: 0 0 0 3px rgba(54, 153, 255, 0.12);
        }

        .custom-select:hover {
          border-color: #b5b5c3;
        }

        .search-input-wrapper {
          position: relative;
          min-width: 250px;
        }

        .search-input {
          border: 1px solid #e4e6ef;
          border-radius: 8px;
          padding: 8px 14px 8px 38px;
          font-size: 13px;
          font-weight: 500;
          color: #3f4254;
          background-color: #fff;
          width: 100%;
          height: 40px;
          transition: all 0.2s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: #3699ff;
          box-shadow: 0 0 0 3px rgba(54, 153, 255, 0.12);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #a1a5b7;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-sync {
          background: #3699ff;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          height: 40px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-sync:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(54, 153, 255, 0.4);
        }

        .btn-sync:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-add-lead {
          background: #50cd89;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          height: 40px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-add-lead:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(80, 205, 137, 0.4);
        }

        .data-row {
          transition: all 0.15s ease;
          border-bottom: 1px solid #f4f4f8;
        }

        .data-row:hover {
          background-color: transparent !important;
          cursor: default !important;
        }

        .data-row td {
          padding: 12px 10px;
          vertical-align: middle;
        }

        .table thead th {
          padding: 12px 10px !important;
          font-size: 13px !important;
        }

        .table-common-text {
          color: #3f4254;
          font-weight: 500;
          font-size: 13px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f1f3f9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .empty-icon i {
          font-size: 32px;
          color: #b5b5c3;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #5e6278;
          margin-bottom: 4px;
        }

        .empty-subtitle {
          font-size: 13px;
          color: #a1a5b7;
        }

        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid #fff;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default FollowUpReportDashboard