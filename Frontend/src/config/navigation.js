export const pageGroups = [
  {
    title: 'Observability',
    items: [
      { key: 'insights', label: 'Insights' },
      { key: 'policies', label: 'Policies', count: 24 },
      { key: 'violations', label: 'Violations', count: 17, danger: true },
      { key: 'activity-log', label: 'Activity Log' },
    ],
  },
  {
    title: 'Users',
    items: [
      { key: 'inventory', label: 'Inventory' },
      { key: 'users', label: 'Insight' },
    ],
  },
  {
    title: 'Integration',
    items: [{ key: 'integrations', label: 'LLM Providers' }],
  },
  {
    title: 'Models',
    items: [
      { key: 'catalog', label: 'Catalog', count: 12 },
      { key: 'latency', label: 'Latency' },
      { key: 'spend', label: 'Spend' },
    ],
  },
  {
    title: 'Admin',
    items: [{ key: 'settings', label: 'Settings' }],
  },
]

export const pageMeta = {
  insights: {
    section: 'Observability',
    title: 'Insights',
    subtitle: 'Overview of LLM usage, violations and cost across all integrated providers.',
    search: 'Search prompts, users, models…',
  },
  integrations: {
    section: 'Integration',
    title: 'LLM Integrations',
    subtitle: 'Connect organization-owned provider accounts, API keys, and model access.',
    search: 'Search providers, accounts, and models…',
  },
  inventory: {
    section: 'Observability',
    title: 'Inventory',
    subtitle: 'Manage group definitions, attached DLP policies, and guardrails bundles.',
    search: 'Search groups and policy bundles…',
  },
  policies: {
    section: 'Observability',
    title: 'Policies',
    subtitle: 'Guardrails, enforcement status, owners, and rollout readiness.',
    search: 'Search policies and scopes…',
  },
  violations: {
    section: 'Observability',
    title: 'Violations',
    subtitle: 'Flagged prompts, blocked outputs, and incident escalation trends.',
    search: 'Search incidents and categories…',
  },
  users: {
    section: 'Insight',
    title: 'Users',
    subtitle: 'Invite employees, manage roles, and maintain the live company directory.',
    search: 'Search employees and departments…',
  },
  'activity-log': {
    section: 'Observability',
    title: 'Activity Log',
    subtitle: 'Raw request history, policy decisions, and review events.',
    search: 'Search requests and prompts…',
  },
  catalog: {
    section: 'Models',
    title: 'Catalog',
    subtitle: 'Provider mix, model health, and deployment availability.',
    search: 'Search models and providers…',
  },
  latency: {
    section: 'Models',
    title: 'Latency',
    subtitle: 'Latency breakdowns by provider, region, and workload.',
    search: 'Search latency and routes…',
  },
  spend: {
    section: 'Models',
    title: 'Spend',
    subtitle: 'Budget pacing, provider cost mix, and efficiency signals.',
    search: 'Search spend and budgets…',
  },
  settings: {
    section: 'Admin',
    title: 'Settings',
    subtitle: 'Workspace defaults, alerts, review workflows, and access controls.',
    search: 'Search settings…',
  },
}

export function isValidPage(page) {
  return Boolean(pageMeta[page])
}

export function getInitialPage() {
  const hash = window.location.hash.replace('#', '').split('?')[0]
  return isValidPage(hash) ? hash : 'insights'
}
