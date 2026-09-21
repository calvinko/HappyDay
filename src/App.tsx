import HappyDayApp, { type Group } from './components/HappyDayApp'

// Groups a reader can sign in under. Edit this list as congregations change.
const GROUPS: Group[] = [
  { id: 'sj_senior', label: 'SJ 長者' },
  { id: 'sf_senior', label: 'SF 長者' },
  { id: 'bra_senior', label: '巴西長者' },
]

function App() {
  // homeLayout: 'poster' | 'cards'  ·  navModel: 'tabs' | 'top'
  return <HappyDayApp homeLayout="poster" navModel="tabs" groups={GROUPS} />
}

export default App
