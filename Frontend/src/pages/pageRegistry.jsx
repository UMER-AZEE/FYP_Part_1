import ActivityLogPage from './ActivityLogPage'
import CatalogPage from './CatalogPage'
import InsightsPage from './InsightsPage'
import LatencyPage from './LatencyPage'
import PoliciesPage from './PoliciesPage'
import SettingsPage from './SettingsPage'
import SpendPage from './SpendPage'
import UsersPage from './UsersPage'
import ViolationsPage from './ViolationsPage'

export const pageRegistry = {
  insights: InsightsPage,
  policies: PoliciesPage,
  violations: ViolationsPage,
  users: UsersPage,
  'activity-log': ActivityLogPage,
  catalog: CatalogPage,
  latency: LatencyPage,
  spend: SpendPage,
  settings: SettingsPage,
}
