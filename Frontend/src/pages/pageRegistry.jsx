import ActivityLogPage from './ActivityLogPage'
import CatalogPage from './CatalogPage'
import IntegrationsPage from './IntegrationsPage'
import InventoryPage from './InventoryPage'
import InsightsPage from './InsightsPage'
import LatencyPage from './LatencyPage'
import PoliciesPage from './PoliciesPage'
import PromptStudioPage from './PromptStudioPage'
import SettingsPage from './SettingsPage'
import SpendPage from './SpendPage'
import UsersPage from './UsersPage'
import ViolationsPage from './ViolationsPage'

export const pageRegistry = {
  insights: InsightsPage,
  integrations: IntegrationsPage,
  inventory: InventoryPage,
  policies: PoliciesPage,
  'prompt-studio': PromptStudioPage,
  violations: ViolationsPage,
  users: UsersPage,
  'activity-log': ActivityLogPage,
  catalog: CatalogPage,
  latency: LatencyPage,
  spend: SpendPage,
  settings: SettingsPage,
}
