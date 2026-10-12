/**
 * Automation FWG Add Follow-Up Report
 * Re-exports admin component with automation-specific redirect path.
 * After save, this will navigate to /automation/fwg/follow-up-report-inner-list
 * The admin add-follow-up-report.tsx handles the navigation internally.
 * To keep this isolated from admin, we use the existing admin component
 * but the inner navigate will be overridden via URL context.
 */
export { default } from '../../../../fwg/follow-up-report/add-follow-up-report'
