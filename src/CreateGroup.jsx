
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase.js'
import './CreateGroup.css'

function CreateGroup() {
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  async function handleCreateGroup(e) {
    e.preventDefault()

    const name = groupName.trim()

    if (!name) {
      setError('Please enter a group name.')
      return
    }

    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Please log in again.')
      setLoading(false)
      return
    }

    const { data: group, error: groupError } = await supabase
      .from('shared_groups')
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single()

    if (groupError) {
      setError(groupError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('shared_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    navigate('/groups')
  }

  return (
    <div className="create-group-page">
      <Link to="/groups" className="create-group-back">
        ← Back to Groups
      </Link>

      <div className="create-group-card">
        <div className="create-group-symbol">✦</div>

        <p className="create-group-eyebrow">
          BACHATBUDDY · SHARED
        </p>

        <h1>Create a Group</h1>

        <p className="create-group-description">
          Start sharing expenses with your roommates,
          friends, or travel buddies.
        </p>

        <form onSubmit={handleCreateGroup}>
          <label htmlFor="groupName">
            Group name
          </label>

          <input
            id="groupName"
            type="text"
            placeholder="e.g. Roommates, Goa Trip"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={60}
            required
          />

          <p className="group-name-hint">
            Choose a name everyone will recognize.
          </p>

          {error && (
            <p className="create-group-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating group...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateGroup
