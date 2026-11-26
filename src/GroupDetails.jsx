
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from './supabase.js'
import './GroupDetails.css'

function GroupDetails() {
  const { groupId } = useParams()

 const [group, setGroup] = useState(null)
const [members, setMembers] = useState([])
const [currentUserId, setCurrentUserId] = useState('')
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [inviteCode, setInviteCode] = useState('')
const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    async function loadGroup() {
      setLoading(true)
      setError('')

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  setError('Please log in to view this group.')
  setLoading(false)
  return
}

setCurrentUserId(user.id)

      const { data, error: groupError } = await supabase
        .from('shared_groups')
        .select('id, name, created_at')
        .eq('id', groupId)
        .single()

    if (groupError) {
  setError(groupError.message)
} else {
  setGroup(data)

  const { data: memberData, error: memberError } =
    await supabase
      .from('shared_group_members')
      .select('id, user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

  if (memberError) {
    setError(memberError.message)
  } else {
    setMembers(memberData || [])
  }
}

      setLoading(false)
    }

    loadGroup()
  }, [groupId])

  async function handleCreateInvite() {
  if (!group) return

  setInviteLoading(true)
  setInviteCode('')

  const { data, error } = await supabase.rpc(
    'create_shared_group_invite',
    {
      p_group_id: group.id,
    }
  )

  setInviteLoading(false)

  if (error) {
    alert(error.message)
    return
  }

  setInviteCode(data)
}

  return (
    <div className="group-details-page">
      <Link to="/groups" className="group-details-back">
        ← Back to Groups
      </Link>

      {loading ? (
        <div className="group-details-card">
          <h1>Loading group...</h1>
        </div>
      ) : error ? (
        <div className="group-details-card">
          <h1>Couldn't load group</h1>
          <p>{error}</p>
        </div>
      ) : group ? (
        <div className="group-details-card">
          <div className="group-details-icon">✦</div>

          <p className="groups-eyebrow">
            BACHATBUDDY · SHARED
          </p>

          <h1>{group.name}</h1>

          <button
  className="invite-button"
  onClick={handleCreateInvite}
  disabled={inviteLoading}
>
  {inviteLoading ? 'Generating...' : '+ Invite Members'}
</button>

{inviteCode && (
  <div>
    <p>Share this invitation code:</p>

    <strong>{inviteCode}</strong>

    <button
      onClick={() => {
        navigator.clipboard.writeText(inviteCode)
        alert('Invitation code copied!')
      }}
    >
      Copy Code
    </button>
  </div>
)}

          <p className="group-details-date">
            Created{' '}
            {new Date(group.created_at).toLocaleDateString()}
          </p>

          <div className="group-details-divider" />

          <h2>Shared expenses</h2>


<div className="group-members-section">
  <div className="group-members-heading">
    <h2>Members</h2>
    <span>{members.length} members</span>
  </div>

  <div className="group-members-list">
    {members.map((member) => (
      <div
        className="group-member-row"
        key={member.id}
      >
        <div className="group-member-avatar">
          {member.user_id === currentUserId
            ? 'Y'
            : 'M'}
        </div>

        <div className="group-member-info">
          <strong>
            {member.user_id === currentUserId
              ? 'You'
              : 'Group member'}
          </strong>

          <span>
            {member.role === 'owner'
              ? 'Group admin'
              : 'Member'}
          </span>
        </div>

        {member.role === 'owner' && (
          <span className="group-member-badge">
            ADMIN
          </span>
        )}
      </div>
    ))}
  </div>
</div>


          <p>
            Shared expenses and group members will be
            available here as we build the next features.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default GroupDetails
