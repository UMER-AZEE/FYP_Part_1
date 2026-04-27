export const pageGroups = [
  {
    title: 'Observability',
    items: [
      { key: 'insights', label: 'Insights' },
      { key: 'policies', label: 'Policies', count: 24 },
      { key: 'violations', label: 'Violations', count: 17, danger: true },
      { key: 'users', label: 'Users' },
      { key: 'activity-log', label: 'Activity Log' },
    ],
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
    section: 'Observability',
    title: 'Users',
    subtitle: 'Risk posture, usage density, and behavior patterns across teams.',
    search: 'Search users and teams…',
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
  const hash = window.location.hash.replace('#', '')
  return isValidPage(hash) ? hash : 'insights'
}
