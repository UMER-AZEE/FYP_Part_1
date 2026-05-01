import ActivityLogCard from '../components/ActivityLogCard'

export default function ActivityLogPage({ data }) {
  return <ActivityLogCard rows={data.activityRows} />
}
