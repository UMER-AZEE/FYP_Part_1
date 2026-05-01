import ActivityLogCard from '../components/ActivityLogCard'

export default function SettingsPage({ data }) {
  return (
    <>
      <div className="grid row-2">
        {data.settingsSections.map((section) => (
          <div className="card" key={section.name}>
            <div className="card-head">
              <h3>{section.name}</h3>
              <span className="hint">{section.detail}</span>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between rounded-[8px] bg-[var(--panel-2)] p-4">
                <div className="text-[11.5px] text-[var(--ink-3)]">Current state</div>
                <span className="pill green">{section.state}</span>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn">Configure</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ActivityLogCard rows={data.activityRows} />
    </>
  )
}
