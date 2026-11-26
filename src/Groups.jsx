
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Groups.css'

function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGroups() {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Please log in to view your groups.')
        setLoading(false)
        return
      }

      const { data, error: groupsError } = await supabase
        .from('shared_groups')
        .select('id, name, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (groupsError) {
        setError(groupsError.message)
      } else {
        setGroups(data || [])
      }

      setLoading(false)
    }

    loadGroups()
  }, [])

  return (
    <div className="groups-page">
      <header className="groups-header">
        <div>
          <p className="groups-eyebrow">
            BACHATBUDDY · SHARED
          </p>

          <h1>Groups</h1>

          <p className="groups-subtitle">
            Share expenses, split bills, and stay
            clear about who owes whom.
          </p>
        </div>

        <Link
          to="/groups/create"
          className="create-group-btn"
        >
          <span>＋</span> Create a Group
        </Link>
      </header>

      {loading ? (
        <section className="groups-empty-state">
          <div className="groups-empty-icon">✦</div>
          <h2>Loading your groups...</h2>
          <p>Your shared space is getting ready.</p>
        </section>
      ) : error ? (
        <section className="groups-empty-state">
          <div className="groups-empty-icon">!</div>
          <h2>Couldn't load groups</h2>
          <p>{error}</p>
        </section>
      ) : groups.length === 0 ? (
        <section className="groups-empty-state">
          <div className="groups-empty-icon">✦</div>

          <h2>Your shared journey starts here</h2>

          <p>
            Create a group for your roommates, friends,
            or a trip. Add shared expenses and split
            them fairly.
          </p>

          <Link
            to="/groups/create"
            className="empty-create-btn"
          >
            Create your first group
          </Link>
        </section>
      ) : (
        <section className="groups-list">
          <div className="groups-list-heading">
            <h2>Your groups</h2>
            <span>{groups.length} created</span>
          </div>

          <div className="groups-grid">
            {groups.map((group) => (
             <Link
  to={`/groups/${group.id}`}
  className="group-card"
  key={group.id}
>
                <div className="group-card-top">
                  <div className="group-card-icon">✦</div>
                  <span className="group-owner-label">
                    ADMIN
                  </span>
                </div>

                <h3>{group.name}</h3>

                <p>
                  Created{' '}
                  {new Date(group.created_at).toLocaleDateString()}
                </p>

                <div className="group-card-footer">
                  <span>Shared expenses</span>
                  <span className="group-card-arrow">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Groups
