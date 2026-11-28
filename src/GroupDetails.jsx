
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from './supabase.js'
import './GroupDetails.css'
import PageLoader from './PageLoader.jsx'

function getLocalDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function GroupDetails() {
  const { groupId } = useParams()

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Shared expenses
  const [sharedExpenses, setSharedExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)

  // Add expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [expenseDate, setExpenseDate] = useState(getLocalDate)
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [shareAmounts, setShareAmounts] = useState({})
  const [expenseSaving, setExpenseSaving] = useState(false)
  const [expenseMessage, setExpenseMessage] = useState('')

  async function loadSharedExpenses(groupId, groupMembers) {
    setExpensesLoading(true)

    const { data: expenseData, error: expenseError } =
      await supabase
        .from('shared_expenses')
        .select(
          'id, title, total_amount, paid_by, expense_date, created_at'
        )
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

    if (expenseError) {
      setError(expenseError.message)
      setExpensesLoading(false)
      return
    }

    if (!expenseData || expenseData.length === 0) {
      setSharedExpenses([])
      setExpensesLoading(false)
      return
    }

    const expenseIds = expenseData.map(
      (expense) => expense.id
    )

    const { data: shareData, error: shareError } =
      await supabase
        .from('shared_expense_shares')
        .select('expense_id, user_id, share_amount')
        .in('expense_id', expenseIds)

    if (shareError) {
      setError(shareError.message)
      setExpensesLoading(false)
      return
    }

    const membersById = Object.fromEntries(
      groupMembers.map((member) => [
        member.user_id,
        member.full_name,
      ])
    )

    const expensesWithShares = expenseData.map(
      (expense) => {
        const expenseShares = (shareData || [])
          .filter(
            (share) => share.expense_id === expense.id
          )
          .map((share) => ({
            ...share,
            full_name:
              membersById[share.user_id] || 'Group member',
          }))

        return {
          ...expense,
          payer_name:
            membersById[expense.paid_by] || 'Group member',
          shares: expenseShares,
        }
      }
    )

    setSharedExpenses(expensesWithShares)
    setExpensesLoading(false)
  }

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
      setPaidBy(user.id)
      setSelectedParticipants([user.id])

      const { data, error: groupError } = await supabase
        .from('shared_groups')
        .select('id, name, created_at')
        .eq('id', groupId)
        .single()

      if (groupError) {
        setError(groupError.message)
        setLoading(false)
        return
      }

      setGroup(data)

      const { data: memberData, error: memberError } =
        await supabase
          .from('shared_group_members')
          .select('id, user_id, role, joined_at')
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true })

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      const memberIds = (memberData || []).map(
        (member) => member.user_id
      )

      let profileData = []

      if (memberIds.length > 0) {
        const { data: profiles, error: profileError } =
          await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', memberIds)

        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }

        profileData = profiles || []
      }

      const profilesByUserId = Object.fromEntries(
        profileData.map((profile) => [
          profile.user_id,
          profile.full_name,
        ])
      )

      const membersWithNames = (memberData || []).map(
        (member) => ({
          ...member,
          full_name:
            profilesByUserId[member.user_id] || '',
        })
      )

      setMembers(membersWithNames)

      await loadSharedExpenses(
        groupId,
        membersWithNames
      )

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

  function handleParticipantChange(userId, checked) {
    setSelectedParticipants((previous) => {
      if (checked) {
        return [...previous, userId]
      }

      return previous.filter((id) => id !== userId)
    })

    if (!checked) {
      setShareAmounts((previous) => {
        const updated = { ...previous }
        delete updated[userId]
        return updated
      })
    }
  }

  function handleSplitEqually() {
    const amountInCents = Math.round(
      Number(totalAmount) * 100
    )

    if (
      !Number.isFinite(amountInCents) ||
      amountInCents <= 0
    ) {
      setExpenseMessage('Enter the total amount first.')
      return
    }

    if (selectedParticipants.length === 0) {
      setExpenseMessage('Select participants first.')
      return
    }

    const baseShare = Math.floor(
      amountInCents / selectedParticipants.length
    )

    const remainder =
      amountInCents % selectedParticipants.length

    const equalShares = {}

    selectedParticipants.forEach((userId, index) => {
      const cents =
        baseShare + (index < remainder ? 1 : 0)

      equalShares[userId] = (cents / 100).toFixed(2)
    })

    setShareAmounts(equalShares)
    setExpenseMessage('')
  }

  async function handleAddSharedExpense(event) {
    event.preventDefault()
    setExpenseMessage('')

    const amountInCents = Math.round(
      Number(totalAmount) * 100
    )

    if (
      !expenseTitle.trim() ||
      !Number.isFinite(amountInCents) ||
      amountInCents <= 0
    ) {
      setExpenseMessage(
        'Enter a title and a valid total amount.'
      )
      return
    }

    if (!expenseDate) {
      setExpenseMessage('Choose an expense date.')
      return
    }

    if (selectedParticipants.length === 0) {
      setExpenseMessage('Select at least one participant.')
      return
    }

    if (!selectedParticipants.includes(paidBy)) {
      setExpenseMessage(
        'The payer must be included in the participants.'
      )
      return
    }

    const shares = selectedParticipants.map(
      (userId) => ({
        user_id: userId,
        share_amount: Number(shareAmounts[userId]),
      })
    )

    const invalidShare = shares.some((share) => {
      const cents = share.share_amount * 100

      return (
        !Number.isFinite(share.share_amount) ||
        share.share_amount <= 0 ||
        !Number.isInteger(cents)
      )
    })

    if (invalidShare) {
      setExpenseMessage(
        'Enter a valid share for every participant.'
      )
      return
    }

    const sharesInCents = shares.reduce(
      (sum, share) =>
        sum + Math.round(share.share_amount * 100),
      0
    )

    if (sharesInCents !== amountInCents) {
      setExpenseMessage(
        'Participant shares must equal the total amount.'
      )
      return
    }

    setExpenseSaving(true)

    const { error: saveError } = await supabase.rpc(
      'add_shared_expense',
      {
        p_group_id: group.id,
        p_title: expenseTitle.trim(),
        p_total_amount: amountInCents / 100,
        p_paid_by: paidBy,
        p_expense_date: expenseDate,
        p_shares: shares,
      }
    )

    setExpenseSaving(false)

    if (saveError) {
      setExpenseMessage(saveError.message)
      return
    }

    setExpenseTitle('')
    setTotalAmount('')
    setExpenseDate(getLocalDate())
    setSelectedParticipants([currentUserId])
    setPaidBy(currentUserId)
    setShareAmounts({})
    setShowExpenseForm(false)
    setExpenseMessage('Shared expense added successfully!')

    await loadSharedExpenses(groupId, members)
  }


  const memberBalances = members.map((member) => {
    const totalPaid = sharedExpenses
      .filter((expense) => expense.paid_by === member.user_id)
      .reduce(
        (sum, expense) => sum + Number(expense.total_amount),
        0
      )

    const totalShare = sharedExpenses
      .flatMap((expense) => expense.shares)
      .filter((share) => share.user_id === member.user_id)
      .reduce(
        (sum, share) => sum + Number(share.share_amount),
        0
      )

    return {
      ...member,
      netBalance: totalPaid - totalShare,
    }
  })


  const settlementSuggestions = (() => {
    const creditors = memberBalances
      .map((member) => ({
        userId: member.user_id,
        name:
          member.user_id === currentUserId
            ? 'You'
            : member.full_name || 'Group member',
        cents: Math.round(member.netBalance * 100),
      }))
      .filter((member) => member.cents > 0)

    const debtors = memberBalances
      .map((member) => ({
        userId: member.user_id,
        name:
          member.user_id === currentUserId
            ? 'You'
            : member.full_name || 'Group member',
        cents: Math.round(member.netBalance * 100),
      }))
      .filter((member) => member.cents < 0)
      .map((member) => ({
        ...member,
        cents: Math.abs(member.cents),
      }))

    const suggestions = []
    let creditorIndex = 0
    let debtorIndex = 0

    while (
      creditorIndex < creditors.length &&
      debtorIndex < debtors.length
    ) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const paymentCents = Math.min(
        creditor.cents,
        debtor.cents
      )

      if (paymentCents > 0) {
        suggestions.push({
          from: debtor.name,
          to: creditor.name,
          amount: paymentCents / 100,
          fromId: debtor.userId,
          toId: creditor.userId,
        })
      }

      creditor.cents -= paymentCents
      debtor.cents -= paymentCents

      if (creditor.cents === 0) {
        creditorIndex += 1
      }

      if (debtor.cents === 0) {
        debtorIndex += 1
      }
    }

    return suggestions
  })()


  return (
    <div className="group-details-page">
      <Link to="/groups" className="group-details-back">
        ← Back to Groups
      </Link>

      {loading ? (
        <div className="group-details-card">
          <PageLoader message="Getting your group ready..." />
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
            {inviteLoading
              ? 'Generating...'
              : '+ Invite Members'}
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

          {/* Group balances */}
          <div className="group-balances-section">
            <p className="groups-eyebrow">
              THE MONEY PICTURE
            </p>

            <h2>Group balances</h2>

            <p className="group-balances-description">
              See how much each member has paid compared
              with their share of the expenses.
            </p>

            <div className="group-balances-list">
              {memberBalances.map((member) => {
                const balance = member.netBalance
                const isSettled = Math.abs(balance) < 0.005

                return (
                  <div
                    className="group-balance-card"
                    key={member.user_id}
                  >
                    <div className="group-balance-member">
                      <div className="group-member-avatar">
                        {member.user_id === currentUserId
                          ? 'Y'
                          : member.full_name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || 'M'}
                      </div>

                      <div>
                        <strong>
                          {member.user_id === currentUserId
                            ? 'You'
                            : member.full_name || 'Group member'}
                        </strong>

                        <p>
                          {isSettled
                            ? 'All settled'
                            : balance > 0
                              ? 'Is owed'
                              : 'Owes the group'}
                        </p>
                      </div>
                    </div>

                    <strong
                      className={
                        isSettled
                          ? 'group-balance-amount settled'
                          : balance > 0
                            ? 'group-balance-amount positive'
                            : 'group-balance-amount negative'
                      }
                    >
                      {isSettled
                        ? '₹0.00'
                        : `${balance > 0 ? '+' : '-'}₹${Math.abs(
                            balance
                          ).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </strong>
                  </div>
                )
              })}
           
            </div>
          </div>

          {/* Settlement suggestions */}
          <div className="settlements-section">
            <p className="groups-eyebrow">
              SETTLE UP
            </p>

            <h2>Suggested payments</h2>

            <p className="settlements-description">
              These payments would settle the current
              shared expense balances.
            </p>

            {settlementSuggestions.length === 0 ? (
              <div className="settlements-empty">
                <span>✓</span>
                <strong>Everyone is settled</strong>
                <p>No payments are needed right now.</p>
              </div>
            ) : (
              <div className="settlements-list">
                {settlementSuggestions.map(
                  (suggestion, index) => (
                    <div
                      className="settlement-card"
                      key={`${suggestion.fromId}-${suggestion.toId}-${index}`}
                    >
                      <div className="settlement-person">
                        <span className="settlement-person-label">
                          FROM
                        </span>
                        <strong>{suggestion.from}</strong>
                      </div>

                      <div className="settlement-arrow">
                        <span>→</span>
                      </div>

                      <div className="settlement-person">
                        <span className="settlement-person-label">
                          TO
                        </span>
                        <strong>{suggestion.to}</strong>
                      </div>

                      <strong className="settlement-amount">
                        ₹
                        {suggestion.amount.toLocaleString(
                          'en-IN',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="group-details-divider" />

          {/* Shared expenses */}


          <div className="shared-expenses-section">
            <div className="shared-expenses-heading">
              <div>
                <p className="groups-eyebrow">
                  MONEY TOGETHER
                </p>
                <h2>Shared expenses</h2>
              </div>

              <button
                className="shared-expense-add-button"
                onClick={() => {
                  setShowExpenseForm((previous) => !previous)
                  setExpenseMessage('')
                }}
              >
                {showExpenseForm
                  ? 'Cancel'
                  : '+ Add expense'}
              </button>
            </div>

            {expenseMessage && (
              <p className="shared-expense-message">
                {expenseMessage}
              </p>
            )}

            {showExpenseForm && (
              <form
                className="shared-expense-form"
                onSubmit={handleAddSharedExpense}
              >
                <label>
                  Expense title
                  <input
                    type="text"
                    value={expenseTitle}
                    onChange={(event) =>
                      setExpenseTitle(event.target.value)
                    }
                    placeholder="e.g. Groceries"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Total amount (₹)
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(event) =>
                      setTotalAmount(event.target.value)
                    }
                    placeholder="e.g. 1200"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Who paid?
                  <select
                    value={paidBy}
                    onChange={(event) => {
                      const userId = event.target.value
                      setPaidBy(userId)

                      setSelectedParticipants(
                        (previous) =>
                          previous.includes(userId)
                            ? previous
                            : [...previous, userId]
                      )
                    }}
                    required
                  >
                    {members.map((member) => (
                      <option
                        key={member.user_id}
                        value={member.user_id}
                      >
                        {member.user_id === currentUserId
                          ? 'You'
                          : member.full_name || 'Group member'}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Expense date
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(event) =>
                      setExpenseDate(event.target.value)
                    }
                    required
                  />
                </label>

                <div className="shared-expense-participants">
                  <h3>Who shared this expense?</h3>
                  <p>
                    Select only the people who should pay a
                    share of this bill.
                  </p>

                  {members.map((member) => (
                    <label
                      className="shared-expense-participant"
                      key={member.user_id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(
                          member.user_id
                        )}
                        onChange={(event) =>
                          handleParticipantChange(
                            member.user_id,
                            event.target.checked
                          )
                        }
                      />

                      <span>
                        {member.user_id === currentUserId
                          ? 'You'
                          : member.full_name || 'Group member'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="shared-expense-split-heading">
                  <h3>Split amount</h3>

                  <button
                    type="button"
                    onClick={handleSplitEqually}
                  >
                    Split equally
                  </button>
                </div>

                {selectedParticipants.map((userId) => {
                  const member = members.find(
                    (item) => item.user_id === userId
                  )

                  const name =
                    userId === currentUserId
                      ? 'You'
                      : member?.full_name || 'Group member'

                  return (
                    <label
                      className="shared-expense-share-row"
                      key={userId}
                    >
                      <span>{name}</span>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="₹ Share"
                        value={shareAmounts[userId] || ''}
                        onChange={(event) =>
                          setShareAmounts((previous) => ({
                            ...previous,
                            [userId]: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                  )
                })}

                <button
                  className="shared-expense-save-button"
                  type="submit"
                  disabled={expenseSaving}
                >
                  {expenseSaving
                    ? 'Saving expense...'
                    : 'Save shared expense'}
                </button>
              </form>
            )}

            {expensesLoading ? (
              <p>Loading shared expenses...</p>
            ) : sharedExpenses.length === 0 ? (
              <div className="shared-expenses-empty">
                <span>✦</span>
                <h3>No shared expenses yet</h3>
                <p>
                  Add your first group bill and start tracking
                  who paid and how much everyone shares.
                </p>
              </div>
            ) : (
              <div className="shared-expenses-list">
                {sharedExpenses.map((expense) => (
                  <div
                    className="shared-expense-card"
                    key={expense.id}
                  >
                    <div className="shared-expense-card-top">
                      <div>
                        <h3>{expense.title}</h3>
                        <p>
                          Paid by {expense.payer_name}
                        </p>
                      </div>

                      <strong>
                        ₹
                        {Number(
                          expense.total_amount
                        ).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </div>

                    <p className="shared-expense-date">
                      {new Date(
                        `${expense.expense_date}T00:00:00`
                      ).toLocaleDateString()}
                    </p>

                    <div className="shared-expense-shares">
                      {expense.shares.map((share) => (
                        <div
                          className="shared-expense-share-display"
                          key={share.user_id}
                        >
                          <span>{share.full_name}</span>
                          <strong>
                            ₹
                            {Number(
                              share.share_amount
                            ).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="group-details-divider" />

          {/* Group members */}
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
                    {member.full_name
                      ? member.full_name
                          .trim()
                          .charAt(0)
                          .toUpperCase()
                      : member.user_id === currentUserId
                        ? 'Y'
                        : 'M'}
                  </div>

                  <div className="group-member-info">
                    <strong>
                      {member.user_id === currentUserId
                        ? 'You'
                        : member.full_name || 'Group member'}
                    </strong>
                  </div>

                  <span className="group-member-badge">
                    {member.role === 'owner'
                      ? 'ADMIN'
                      : 'MEMBER'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default GroupDetails
