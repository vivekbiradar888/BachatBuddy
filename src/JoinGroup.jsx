
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase.js'
import './JoinGroup.css'

function JoinGroup() {
  const navigate = useNavigate()

  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoinGroup(e) {
    e.preventDefault()

    if (!inviteCode.trim()) {
      alert('Please enter an invitation code')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.rpc(
      'join_shared_group_with_invite',
      {
        p_code: inviteCode.trim(),
      }
    )

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('You successfully joined the group!')
    navigate(`/groups/${data}`)
  }

  return (
    <div className="join-group-page">
      <h1>Join a Group</h1>

      <p>
        Enter the invitation code shared by your
        group admin.
      </p>

      <form onSubmit={handleJoinGroup}>
        <input
          type="text"
          placeholder="Enter invitation code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Joining...' : 'Join Group'}
        </button>
      </form>
    </div>
  )
}

export default JoinGroup
