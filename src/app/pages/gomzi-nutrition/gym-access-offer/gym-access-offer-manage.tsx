import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
  GetGymAccessOffer,
  SaveGymAccessOffer,
  GymOfferSettings,
  GymOfferPack,
  GymCouponSystem,
} from '../../../Functions/FGGroup/GymAccessOffer'
import '../products-theme.css'

const DEFAULT_COUPON_SYSTEM: GymCouponSystem = {
  enabled: true,
  price: 300,
  title: 'Coupon System',
  subtitle: 'Pre + Post Workout (One Time)',
  reward_count: 90,
  reward_text: 'Get 1 kg Protein (Free)',
  supplement_policy: 'Take any 1 supplement from our packs and also get gym membership for 1 month.',
  share_prompt: 'Share this with your contacts.',
}

export default function GymAccessOfferManage() {
  const [settings, setSettings] = useState<GymOfferSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'packs' | 'coupons' | 'tiers' | 'terms'>('packs')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result: any = await GetGymAccessOffer()
      const data: GymOfferSettings = result?.data || result
      setSettings({
        ...data,
        coupon_system: data.coupon_system || { ...DEFAULT_COUPON_SYSTEM },
        packs: data.packs && data.packs.length > 0 ? data.packs : [],
      })
    } catch (err: any) {
      setError(err.message || 'Unable to load the gym access offer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (event?: React.FormEvent) => {
    if (event) event.preventDefault()
    if (!settings) return
    setSaving(true)
    setError('')
    try {
      const payload: GymOfferSettings = {
        ...settings,
        gym_name: settings.gym_name.trim(),
        terms: settings.terms.trim(),
        coupon_system: settings.coupon_system || DEFAULT_COUPON_SYSTEM,
        packs: (settings.packs || []).map((pack, idx) => ({
          ...pack,
          id: pack.id || `pack_${Date.now()}_${idx}`,
          name: pack.name.trim(),
          price: Number(pack.price) || 0,
          rtp: (pack.rtp || '').trim(),
          supplements: (pack.supplements || '').trim(),
          free_gift: (pack.free_gift || '').trim(),
          perks: (pack.perks || []).map((p) => p.trim()).filter(Boolean),
          status: pack.status !== false,
        })),
      }
      const result: any = await SaveGymAccessOffer(payload)
      const data: GymOfferSettings = result?.data || result
      setSettings(data)
      toast.success('Gym access offers and packs saved successfully!')
    } catch (err: any) {
      setError(err.message || 'Unable to save the gym access offer.')
    } finally {
      setSaving(false)
    }
  }

  // --- Tier Helpers ---
  const updateTier = (index: number, field: 'minimum_amount' | 'months', value: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      tiers: settings.tiers.map((tier, position) =>
        position === index ? { ...tier, [field]: Number(value) } : tier
      ),
    })
  }

  // --- Coupon System Helpers ---
  const updateCoupon = <K extends keyof GymCouponSystem>(field: K, value: GymCouponSystem[K]) => {
    if (!settings) return
    setSettings({
      ...settings,
      coupon_system: {
        ...(settings.coupon_system || DEFAULT_COUPON_SYSTEM),
        [field]: value,
      },
    })
  }

  // --- Pack Helpers ---
  const addPack = () => {
    if (!settings) return
    const newPack: GymOfferPack = {
      id: `pack_${Date.now()}`,
      name: 'New Transformation Pack',
      price: 5000,
      rtp: 'RTP: 1',
      supplements: 'Whey Protein + Multivitamin',
      perks: ['Unlimited Gym Access for 1 Month', 'Certified Trainer & Dietitian Guidance'],
      free_gift: 'Weight Scale Machine',
      status: true,
    }
    setSettings({
      ...settings,
      packs: [...(settings.packs || []), newPack],
    })
  }

  const removePack = (index: number) => {
    if (!settings || !settings.packs) return
    setSettings({
      ...settings,
      packs: settings.packs.filter((_, idx) => idx !== index),
    })
  }

  const updatePack = <K extends keyof GymOfferPack>(index: number, field: K, value: GymOfferPack[K]) => {
    if (!settings || !settings.packs) return
    setSettings({
      ...settings,
      packs: settings.packs.map((p, idx) => (idx === index ? { ...p, [field]: value } : p)),
    })
  }

  const addPackPerk = (packIndex: number) => {
    if (!settings || !settings.packs) return
    const target = settings.packs[packIndex]
    const perks = [...(target.perks || []), '']
    updatePack(packIndex, 'perks', perks)
  }

  const updatePackPerk = (packIndex: number, perkIndex: number, val: string) => {
    if (!settings || !settings.packs) return
    const target = settings.packs[packIndex]
    const perks = target.perks.map((p, idx) => (idx === perkIndex ? val : p))
    updatePack(packIndex, 'perks', perks)
  }

  const removePackPerk = (packIndex: number, perkIndex: number) => {
    if (!settings || !settings.packs) return
    const target = settings.packs[packIndex]
    const perks = target.perks.filter((_, idx) => idx !== perkIndex)
    updatePack(packIndex, 'perks', perks)
  }

  return (
    <div className='gz-prod-container'>
      <PageTitle breadcrumbs={[]}>Gomzi Gym Access &amp; Transformation Offers</PageTitle>

      <div className='gz-prod-header d-flex flex-wrap align-items-center justify-content-between gap-4 mb-6'>
        <div>
          <h1 className='gz-prod-title fs-2 fw-bolder mb-1'>Gomzi Gym Offers &amp; Packs</h1>
          <p className='gz-prod-subtitle text-muted mb-0'>
            Configure Transformation Packs (Rapid Weight Loss, Insane Performance), ₹300 Coupon System, and Cart Gym Access Tiers.
          </p>
        </div>
        <button
          className='btn btn-primary px-6'
          type='button'
          disabled={saving || loading || !settings}
          onClick={() => save()}
        >
          {saving ? 'Saving Changes…' : 'Save All Settings'}
        </button>
      </div>

      {error && (
        <div role='alert' className='alert alert-danger d-flex align-items-center justify-content-between mb-6'>
          <span>{error}</span>
          {!settings && (
            <button type='button' className='btn btn-sm btn-light' onClick={load}>
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div role='status' className='card p-8 text-center'>
          <span className='spinner-border text-primary align-middle me-2' />
          Loading offer settings…
        </div>
      ) : settings && (
        <form onSubmit={save}>
          <fieldset disabled={saving}>
            {/* Master Header Card */}
            <div className='card p-6 mb-6 shadow-xs border'>
              <div className='row g-4 align-items-center'>
                <div className='col-md-6'>
                  <label htmlFor='gym-offer-name' className='form-label fw-bold'>
                    Partner Gym Name
                  </label>
                  <input
                    id='gym-offer-name'
                    className='form-control form-control-solid'
                    value={settings.gym_name}
                    onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
                    maxLength={100}
                    placeholder='e.g. Gomzi Fitness Gym'
                    required
                  />
                  <div className='form-text'>Displayed to users in the cart, receipt, and gym offers portal.</div>
                </div>

                <div className='col-md-6 d-flex align-items-center justify-content-md-end'>
                  <div className='form-check form-switch form-check-custom form-check-solid'>
                    <input
                      type='checkbox'
                      id='master-gym-enabled'
                      className='form-check-input h-25px w-45px'
                      checked={settings.enabled}
                      onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    />
                    <label htmlFor='master-gym-enabled' className='form-check-label fw-bold ms-3'>
                      {settings.enabled ? (
                        <span className='badge badge-light-success fs-7'>Offer System Active</span>
                      ) : (
                        <span className='badge badge-light-danger fs-7'>Offer System Paused</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <ul className='nav nav-tabs nav-line-tabs mb-6 fs-6'>
              <li className='nav-item'>
                <button
                  type='button'
                  className={`nav-link text-active-primary fw-bold ${activeTab === 'packs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('packs')}
                >
                  Transformation Packs ({settings.packs?.length || 0})
                </button>
              </li>
              <li className='nav-item'>
                <button
                  type='button'
                  className={`nav-link text-active-primary fw-bold ${activeTab === 'coupons' ? 'active' : ''}`}
                  onClick={() => setActiveTab('coupons')}
                >
                  Coupon System (₹300 Pre/Post)
                </button>
              </li>
              <li className='nav-item'>
                <button
                  type='button'
                  className={`nav-link text-active-primary fw-bold ${activeTab === 'tiers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tiers')}
                >
                  Cart Spending Tiers ({settings.tiers.length})
                </button>
              </li>
              <li className='nav-item'>
                <button
                  type='button'
                  className={`nav-link text-active-primary fw-bold ${activeTab === 'terms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('terms')}
                >
                  Redemption &amp; Terms
                </button>
              </li>
            </ul>

            {/* TAB 1: TRANSFORMATION PACKS */}
            {activeTab === 'packs' && (
              <div className='card p-6 mb-6 shadow-xs border'>
                <div className='d-flex align-items-center justify-content-between gap-3 mb-6'>
                  <div>
                    <h2 className='fs-4 fw-bolder mb-1'>Gym Transformation Packs</h2>
                    <p className='text-muted fs-7 mb-0'>
                      Pack bundles that combine Gomzi supplements with gym hours, coaches, and free gifts.
                    </p>
                  </div>
                  <button type='button' className='btn btn-light-primary btn-sm' onClick={addPack}>
                    + Add New Pack
                  </button>
                </div>

                {(!settings.packs || settings.packs.length === 0) && (
                  <div className='alert alert-warning'>
                    No packs configured yet. Click <strong>+ Add New Pack</strong> above to create one.
                  </div>
                )}

                <div className='row g-6'>
                  {(settings.packs || []).map((pack, pIdx) => (
                    <div key={pack.id || pIdx} className='col-lg-6'>
                      <div className='border rounded-3 p-5 h-100 bg-light'>
                        <div className='d-flex align-items-center justify-content-between mb-4'>
                          <span className='badge badge-primary fs-7'>Pack #{pIdx + 1}</span>
                          <div className='d-flex align-items-center gap-3'>
                            <div className='form-check form-switch'>
                              <input
                                type='checkbox'
                                className='form-check-input'
                                checked={pack.status !== false}
                                onChange={(e) => updatePack(pIdx, 'status', e.target.checked)}
                              />
                              <label className='form-check-label fs-8'>Active</label>
                            </div>
                            <button
                              type='button'
                              className='btn btn-icon btn-sm btn-light-danger'
                              onClick={() => removePack(pIdx)}
                              title='Remove Pack'
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className='row g-3 mb-3'>
                          <div className='col-sm-8'>
                            <label className='form-label fs-7 fw-bold'>Pack Title</label>
                            <input
                              className='form-control form-control-sm form-control-solid'
                              value={pack.name}
                              onChange={(e) => updatePack(pIdx, 'name', e.target.value)}
                              placeholder='e.g. Rapid Weight Loss Pack'
                              required
                            />
                          </div>
                          <div className='col-sm-4'>
                            <label className='form-label fs-7 fw-bold'>Price (₹)</label>
                            <input
                              type='number'
                              min={0}
                              className='form-control form-control-sm form-control-solid'
                              value={pack.price}
                              onChange={(e) => updatePack(pIdx, 'price', Number(e.target.value))}
                              required
                            />
                          </div>
                        </div>

                        <div className='row g-3 mb-3'>
                          <div className='col-sm-4'>
                            <label className='form-label fs-7 fw-bold'>RTP Badge</label>
                            <input
                              className='form-control form-control-sm form-control-solid'
                              value={pack.rtp || ''}
                              onChange={(e) => updatePack(pIdx, 'rtp', e.target.value)}
                              placeholder='e.g. RTP: 1'
                            />
                          </div>
                          <div className='col-sm-8'>
                            <label className='form-label fs-7 fw-bold'>Supplements Included</label>
                            <input
                              className='form-control form-control-sm form-control-solid'
                              value={pack.supplements || ''}
                              onChange={(e) => updatePack(pIdx, 'supplements', e.target.value)}
                              placeholder='e.g. 2 kg Whey Protein + Fat Burner'
                            />
                          </div>
                        </div>

                        <div className='mb-3'>
                          <label className='form-label fs-7 fw-bold text-success'>
                            🎁 Free Gift Item (Included Free)
                          </label>
                          <input
                            className='form-control form-control-sm form-control-solid border-success'
                            value={pack.free_gift || ''}
                            onChange={(e) => updatePack(pIdx, 'free_gift', e.target.value)}
                            placeholder='e.g. Weight Scale Machine'
                          />
                        </div>

                        <div className='mb-2'>
                          <div className='d-flex align-items-center justify-content-between mb-2'>
                            <label className='form-label fs-7 fw-bold mb-0'>Perks &amp; Benefits</label>
                            <button
                              type='button'
                              className='btn btn-link btn-color-primary p-0 fs-8'
                              onClick={() => addPackPerk(pIdx)}
                            >
                              + Add Bullet
                            </button>
                          </div>
                          {(pack.perks || []).map((perk, perkIdx) => (
                            <div key={perkIdx} className='input-group input-group-sm mb-2'>
                              <span className='input-group-text bg-white'>➔</span>
                              <input
                                className='form-control form-control-solid'
                                value={perk}
                                onChange={(e) => updatePackPerk(pIdx, perkIdx, e.target.value)}
                                placeholder='e.g. Unlimited Number of Gym Hours Access / Month'
                              />
                              <button
                                type='button'
                                className='btn btn-light-danger'
                                onClick={() => removePackPerk(pIdx, perkIdx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: COUPON SYSTEM */}
            {activeTab === 'coupons' && (
              <div className='card p-6 mb-6 shadow-xs border'>
                <div className='d-flex align-items-center justify-content-between mb-6'>
                  <div>
                    <h2 className='fs-4 fw-bolder mb-1'>Coupon &amp; Reward System</h2>
                    <p className='text-muted fs-7 mb-0'>
                      Pre/Post workout session coupons, milestone protein reward, and supplement-gym link.
                    </p>
                  </div>
                  <div className='form-check form-switch'>
                    <input
                      type='checkbox'
                      id='coupon-enabled'
                      className='form-check-input'
                      checked={settings.coupon_system?.enabled !== false}
                      onChange={(e) => updateCoupon('enabled', e.target.checked)}
                    />
                    <label htmlFor='coupon-enabled' className='form-check-label fw-bold ms-2'>
                      Coupon System Active
                    </label>
                  </div>
                </div>

                <div className='row g-4'>
                  <div className='col-md-4'>
                    <label className='form-label fw-bold'>Coupon System Title</label>
                    <input
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.title || 'Coupon System'}
                      onChange={(e) => updateCoupon('title', e.target.value)}
                    />
                  </div>

                  <div className='col-md-4'>
                    <label className='form-label fw-bold'>Price Per Coupon (₹)</label>
                    <input
                      type='number'
                      min={0}
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.price ?? 300}
                      onChange={(e) => updateCoupon('price', Number(e.target.value))}
                    />
                  </div>

                  <div className='col-md-4'>
                    <label className='form-label fw-bold'>Coupon Description / Subtitle</label>
                    <input
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.subtitle || ''}
                      onChange={(e) => updateCoupon('subtitle', e.target.value)}
                      placeholder='e.g. Pre + Post Workout (One Time)'
                    />
                  </div>

                  <div className='col-md-4'>
                    <label className='form-label fw-bold'>Coupons Needed for Free Reward</label>
                    <input
                      type='number'
                      min={1}
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.reward_count ?? 90}
                      onChange={(e) => updateCoupon('reward_count', Number(e.target.value))}
                    />
                  </div>

                  <div className='col-md-8'>
                    <label className='form-label fw-bold'>Free Reward Description</label>
                    <input
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.reward_text || ''}
                      onChange={(e) => updateCoupon('reward_text', e.target.value)}
                      placeholder='e.g. Get 1 kg Protein (Free)'
                    />
                  </div>

                  <div className='col-12'>
                    <label className='form-label fw-bold'>Universal Supplement Pack Policy</label>
                    <textarea
                      className='form-control form-control-solid'
                      rows={2}
                      value={settings.coupon_system?.supplement_policy || ''}
                      onChange={(e) => updateCoupon('supplement_policy', e.target.value)}
                      placeholder='e.g. Take any 1 supplement from our packs and also get gym membership for 1 month.'
                    />
                  </div>

                  <div className='col-12'>
                    <label className='form-label fw-bold'>Social Share Callout</label>
                    <input
                      className='form-control form-control-solid'
                      value={settings.coupon_system?.share_prompt || ''}
                      onChange={(e) => updateCoupon('share_prompt', e.target.value)}
                      placeholder='e.g. Share this with your contacts.'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CART SPENDING TIERS */}
            {activeTab === 'tiers' && (
              <div className='card p-6 mb-6 shadow-xs border'>
                <div className='d-flex align-items-center justify-content-between gap-3 mb-4'>
                  <div>
                    <h2 className='fs-4 fw-bolder mb-1'>Cart Spending Tiers</h2>
                    <p className='text-muted fs-7 mb-0'>
                      Automatic free gym access based on Gomzi supplement purchase totals in cart.
                    </p>
                  </div>
                  <button
                    type='button'
                    className='btn btn-light-primary btn-sm'
                    disabled={settings.tiers.length >= 20}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        tiers: [...settings.tiers, { minimum_amount: 0, months: 1 }],
                      })
                    }
                  >
                    + Add Tier
                  </button>
                </div>

                <div className='alert alert-primary mb-4'>
                  Only the combined selling price of Gomzi products counts toward these thresholds.
                  The highest eligible tier applies automatically during cart calculation.
                </div>

                <div className='table-responsive'>
                  <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                    <thead>
                      <tr className='fw-bolder text-muted'>
                        <th>Minimum Gomzi Subtotal (₹)</th>
                        <th>Free Gym Access (Months)</th>
                        <th className='text-end'>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.tiers.map((tier, index) => (
                        <tr key={index}>
                          <td style={{ maxWidth: '240px' }}>
                            <input
                              aria-label={`Minimum spend for tier ${index + 1}`}
                              type='number'
                              className='form-control form-control-solid form-control-sm'
                              min={0}
                              max={10000000}
                              step='0.01'
                              required
                              value={tier.minimum_amount}
                              onChange={(event) => updateTier(index, 'minimum_amount', event.target.value)}
                            />
                          </td>
                          <td style={{ maxWidth: '200px' }}>
                            <input
                              aria-label={`Months for tier ${index + 1}`}
                              type='number'
                              className='form-control form-control-solid form-control-sm'
                              min={1}
                              max={120}
                              step={1}
                              required
                              value={tier.months}
                              onChange={(event) => updateTier(index, 'months', event.target.value)}
                            />
                          </td>
                          <td className='text-end'>
                            <button
                              type='button'
                              className='btn btn-sm btn-light-danger'
                              disabled={settings.tiers.length === 1}
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  tiers: settings.tiers.filter((_, position) => position !== index),
                                })
                              }
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: REDEMPTION TERMS */}
            {activeTab === 'terms' && (
              <div className='card p-6 mb-6 shadow-xs border'>
                <h2 className='fs-4 fw-bolder mb-2'>Redemption Instructions &amp; Policy</h2>
                <p className='text-muted fs-7 mb-4'>
                  Instructions printed on order receipts and customer accounts detailing how to verify and activate gym access at partner branches.
                </p>
                <div className='mb-4'>
                  <textarea
                    id='gym-offer-terms'
                    className='form-control form-control-solid'
                    rows={4}
                    maxLength={2000}
                    value={settings.terms}
                    onChange={(event) => setSettings({ ...settings, terms: event.target.value })}
                  />
                  <div className='form-text'>Maximum 2,000 characters.</div>
                </div>
              </div>
            )}

            {/* Floating Save Footer */}
            <div className='d-flex align-items-center justify-content-between p-4 bg-white rounded border mt-4'>
              <span className='text-muted fs-7'>
                Changes saved here take effect immediately in the Cart and Gym Offers page.
              </span>
              <button className='btn btn-primary px-8' type='submit' disabled={saving}>
                {saving ? 'Saving…' : 'Save Offer Settings'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}
