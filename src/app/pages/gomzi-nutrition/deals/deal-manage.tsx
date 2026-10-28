import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import { DealItem, GetDealsAdmin, CreateDealAdmin, UpdateDealAdmin, DeleteDealAdmin, ReorderDealsAdmin } from '../../../Functions/FGGroup/Deal'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

const newDeal = (): DealItem => ({ title: '', subtitle: '', tag: '', originalPrice: 0, dealPrice: 0, code: '', image: '', bgGradient: 'linear-gradient(180deg, #fff2dc 0%, #f8d396 100%)', url: '/gomzi-supplement', status: true })
const idOf = (deal: DealItem) => deal._id || deal.id || ''
const imageUrl = (value: string) => /^(https?:\/\/|\/)/i.test(value) ? value : `${FG_GROUP_FILE_BASE_URL}/${value}`
const validUrl = (value: string) => ((value.startsWith('/') && !value.startsWith('//')) || /^https?:\/\//i.test(value)) && !value.includes('\\')
const requireSuccess = (response: any) => {
  if (!response || Number(response.status) >= 400) throw new Error(response?.message || 'The request failed. Please try again.')
  return response
}

export default function DealManage() {
  const [deals, setDeals] = useState<DealItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DealItem>(newDeal)
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response: any = requireSuccess(await GetDealsAdmin())
      setDeals(Array.isArray(response.data?.deals) ? response.data.deals : [])
    } catch (failure: any) { setError(failure.message || 'Could not load deals.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const startEdit = (deal?: DealItem) => {
    setEditing(deal ? idOf(deal) : null)
    setForm(deal ? { ...newDeal(), ...deal } : newDeal())
    setOpen(true)
  }
  const upload = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Choose a JPG, PNG or WebP image.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Choose an image smaller than 10 MB.'); return }
    setUploading(true)
    try {
      const response: any = requireSuccess(await FileUploadToFGGroup([file], { directory: 'deals' }))
      const key = response.data?.fileURLs?.[0] || response.fileURLs?.[0]
      if (!key) throw new Error('The upload did not return an image path.')
      setForm(previous => ({ ...previous, image: key }))
      toast.success('Image uploaded')
    } catch (failure: any) { toast.error(failure.message || 'Image upload failed.') }
    finally { setUploading(false) }
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (uploading || busy) return
    if (!form.title.trim() || !form.image.trim()) { toast.error('A title and product image are required.'); return }
    if (!Number.isFinite(form.dealPrice) || form.dealPrice < 0 || Number(form.originalPrice || 0) < 0) { toast.error('Prices must be zero or greater.'); return }
    if (Number(form.originalPrice) > 0 && Number(form.originalPrice) < form.dealPrice) { toast.error('Original price must be at least the deal price.'); return }
    if (!validUrl(form.url || '')) { toast.error('Use a website path or an http/https destination URL.'); return }
    if (/url\s*\(/i.test(form.bgGradient || '')) { toast.error('Use a colour or CSS gradient for the background.'); return }
    setBusy(true)
    try {
      const { _id, id, createdAt, updatedAt, ...fields } = form
      const payload = { ...fields, title: form.title.trim(), code: form.code?.trim().toUpperCase(), image: form.image.trim() }
      requireSuccess(editing ? await UpdateDealAdmin({ ...payload, id: editing }) : await CreateDealAdmin(payload))
      toast.success(editing ? 'Deal updated' : 'Deal created')
      setOpen(false)
      await load()
    } catch (failure: any) { toast.error(failure.message || 'Could not save this deal.') }
    finally { setBusy(false) }
  }
  const toggle = async (deal: DealItem) => {
    setBusy(true)
    try { requireSuccess(await UpdateDealAdmin({ id: idOf(deal), status: !deal.status })); await load() }
    catch (failure: any) { toast.error(failure.message || 'Could not change visibility.') }
    finally { setBusy(false) }
  }
  const remove = async (deal: DealItem) => {
    if (!window.confirm(`Permanently delete "${deal.title}"? This cannot be undone. You can hide it instead.`)) return
    setBusy(true)
    try { requireSuccess(await DeleteDealAdmin(idOf(deal))); toast.success('Deal deleted'); await load() }
    catch (failure: any) { toast.error(failure.message || 'Could not delete this deal.') }
    finally { setBusy(false) }
  }
  const move = async (index: number, delta: number) => {
    const next = index + delta
    if (next < 0 || next >= deals.length) return
    const reordered = [...deals]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
    setBusy(true)
    try { requireSuccess(await ReorderDealsAdmin(reordered)); await load() }
    catch (failure: any) { toast.error(failure.message || 'Could not reorder deals.') }
    finally { setBusy(false) }
  }

  return <>
    <PageTitle>Deals You Cannot Miss</PageTitle>
    <div className='card'>
      <div className='card-header align-items-center py-5 gap-3'>
        <div><h2 className='mb-2'>Homepage deals</h2><p className='text-muted mb-0'>Manage images, prices, coupons, links and display order. The homepage shows the first four active deals.</p></div>
        <button className='btn btn-primary' disabled={busy || uploading} onClick={() => startEdit()}>Add deal</button>
      </div>
      <div className='card-body'>
        {loading ? <p role='status'>Loading deals…</p> : error ? <div role='alert' className='alert alert-danger'>{error}<button className='btn btn-sm btn-light ms-3' onClick={load}>Try again</button></div> : !deals.length ? <p className='text-muted'>No deals yet. Add your first deal to display it on the website.</p> : <div className='row g-5'>
          {deals.map((deal, index) => <div key={idOf(deal)} className='col-12 col-md-6 col-xl-3'>
            <div className='border rounded-3 h-100 overflow-hidden'>
              <div className='text-center p-5' style={{ background: /url\s*\(/i.test(deal.bgGradient || '') ? '#fff2dc' : deal.bgGradient || '#fff2dc' }}>
                <h3 className='fs-5 mb-2'>{deal.title}</h3><p className='small mb-2'>{deal.subtitle}</p><p className='fw-bold text-danger mb-2'>{deal.tag}</p>
                <div className='bg-white rounded p-2 d-inline-block'><del className='small text-muted me-2'>{Number(deal.originalPrice) > deal.dealPrice ? `₹${deal.originalPrice}` : ''}</del><strong>₹{deal.dealPrice.toLocaleString('en-IN')}</strong></div>
                <img src={imageUrl(deal.image)} alt={deal.title} className='d-block w-100 my-4' style={{ height: 160, objectFit: 'contain' }} onError={event => { event.currentTarget.style.visibility = 'hidden' }} />
                {deal.code && <span className='badge badge-light text-dark'>Code: {deal.code}</span>}
              </div>
              <div className='p-4'>
                <div className='d-flex align-items-center justify-content-between mb-3'><span className={`badge ${deal.status ? 'badge-light-success' : 'badge-light-secondary'}`}>{deal.status ? 'Active' : 'Hidden'}</span><span className='text-muted small'>Position {index + 1}</span></div>
                <div className='d-flex flex-wrap gap-2 mb-2'><button className='btn btn-sm btn-light-primary' disabled={busy} onClick={() => startEdit(deal)}>Edit</button><button className='btn btn-sm btn-light' disabled={busy} onClick={() => toggle(deal)}>{deal.status ? 'Hide' : 'Show'}</button><button className='btn btn-sm btn-light-danger' disabled={busy} onClick={() => remove(deal)}>Delete</button></div>
                <div className='d-flex gap-2'><button className='btn btn-sm btn-light' disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${deal.title} up`}>↑ Move up</button><button className='btn btn-sm btn-light' disabled={busy || index === deals.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${deal.title} down`}>↓ Move down</button></div>
              </div>
            </div>
          </div>)}
        </div>}
      </div>
    </div>
    {open && <div className='modal d-block' role='dialog' aria-modal='true' aria-labelledby='deal-editor-heading' style={{ background: 'rgba(0,0,0,.5)' }} onKeyDown={event => { if (event.key === 'Escape' && !busy && !uploading) setOpen(false) }}>
      <div className='modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'><form className='modal-content' onSubmit={save}>
        <div className='modal-header'><h2 className='modal-title fs-4' id='deal-editor-heading'>{editing ? 'Edit deal' : 'Add deal'}</h2><button type='button' className='btn-close' aria-label='Close deal editor' disabled={busy || uploading} onClick={() => setOpen(false)} /></div>
        <div className='modal-body'><div className='row g-4'>
          <div className='col-12'><label htmlFor='deal-title' className='form-label'>Title</label><input id='deal-title' autoFocus required maxLength={160} className='form-control' value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></div>
          <div className='col-12'><label htmlFor='deal-subtitle' className='form-label'>Subtitle</label><input id='deal-subtitle' className='form-control' value={form.subtitle} onChange={event => setForm({ ...form, subtitle: event.target.value })} /></div>
          <div className='col-md-6'><label htmlFor='deal-tag' className='form-label'>Offer label</label><input id='deal-tag' className='form-control' placeholder='EXTRA 15% OFF' value={form.tag} onChange={event => setForm({ ...form, tag: event.target.value })} /></div>
          <div className='col-md-6'><label htmlFor='deal-code' className='form-label'>Coupon code</label><input id='deal-code' className='form-control' value={form.code} onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} /></div>
          <div className='col-md-6'><label htmlFor='deal-original-price' className='form-label'>Original price (₹)</label><input id='deal-original-price' type='number' min='0' step='0.01' className='form-control' value={form.originalPrice} onChange={event => setForm({ ...form, originalPrice: Number(event.target.value) })} /></div>
          <div className='col-md-6'><label htmlFor='deal-price' className='form-label'>Deal price (₹)</label><input id='deal-price' required type='number' min='0' step='0.01' className='form-control' value={form.dealPrice} onChange={event => setForm({ ...form, dealPrice: Number(event.target.value) })} /></div>
          <div className='col-12'><label htmlFor='deal-upload' className='form-label'>Product image (JPG, PNG, WebP; up to 10 MB)</label><input id='deal-upload' type='file' accept='image/jpeg,image/png,image/webp' className='form-control' disabled={uploading || busy} onChange={event => { upload(event.target.files?.[0]); event.target.value = '' }} />{uploading && <p className='mt-2 text-muted' role='status'>Uploading image…</p>}</div>
          <div className='col-12'><label htmlFor='deal-image' className='form-label'>Image URL or uploaded file key</label><input id='deal-image' required className='form-control' value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} /></div>
          <div className='col-12'><label htmlFor='deal-url' className='form-label'>Destination link</label><input id='deal-url' required className='form-control' placeholder='/gomzi-supplement/creatine' value={form.url} onChange={event => setForm({ ...form, url: event.target.value })} /></div>
          <div className='col-12'><label htmlFor='deal-background' className='form-label'>Background colour or CSS gradient</label><input id='deal-background' className='form-control' value={form.bgGradient} onChange={event => setForm({ ...form, bgGradient: event.target.value })} /></div>
          <div className='col-12'><label className='form-check form-switch'><input type='checkbox' className='form-check-input' checked={Boolean(form.status)} onChange={event => setForm({ ...form, status: event.target.checked })} /><span className='form-check-label'>Show this deal on the website</span></label></div>
        </div></div>
        <div className='modal-footer'><button type='button' className='btn btn-light' disabled={busy || uploading} onClick={() => setOpen(false)}>Cancel</button><button type='submit' className='btn btn-primary' disabled={busy || uploading}>{busy ? 'Saving…' : 'Save deal'}</button></div>
      </form></div>
    </div>}
  </>
}
