import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { formatDateTime, formatRelativeDate } from '../../utils/dateUtils'
import { maskEmail } from '../../utils/privacy'
import { DateTimePicker } from '../ui/date-picker'

const PERMISSION_LABELS = {
  view: 'View only',
  edit: 'Editor',
  admin: 'Admin',
}

const toIsoString = (value) => {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return parsed.toISOString()
}

const statusBadgeClass = (status) => {
  switch (status) {
    case 'accepted':
      return 'bg-success/15 text-success'
    case 'declined':
      return 'bg-destructive/15 text-destructive'
    default:
      return 'bg-warning/15 text-warning'
  }
}

const buildShareLinkUrl = (token) => {
  if (!token) return ''
  const basePath = `/shared/${token}`
  if (typeof window === 'undefined' || !window.location?.origin) {
    return basePath
  }
  const origin = window.location.origin.replace(/\/$/, '')
  return `${origin}${basePath}`
}

export const CollaboratorsPanel = ({
  tripId,
  collaborators,
  collaboratorsMeta,
  shareLinks,
  shareLinksMeta,
  permission,
  collaboratorsLoading,
  shareLinksLoading,
  onInvite,
  onResend,
  onRemove,
  onUpdatePermission,
  onCreateShareLink,
  onRevokeShareLink,
  onFetchCollaborators,
  onFetchShareLinks,
}) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState('edit')
  const [shareLabel, setShareLabel] = useState('')
  const [shareAccessLevel, setShareAccessLevel] = useState('view')
  const [shareExpiresAt, setShareExpiresAt] = useState('')
  const [shareMaxUsages, setShareMaxUsages] = useState('')
  const [shareLinkTokens, setShareLinkTokens] = useState({})
  const [latestShareLink, setLatestShareLink] = useState(null)
  const [collaboratorFilter, setCollaboratorFilter] = useState('')
  const [shareLinkFilter, setShareLinkFilter] = useState('')

  const canManageCollaborators = permission?.level === 'admin'
  const canEditTrip = permission?.level === 'admin' || permission?.level === 'edit'

  const filteredCollaborators = useMemo(() => {
    if (!Array.isArray(collaborators) || !collaborators.length) {
      return collaborators || []
    }
    const term = collaboratorFilter.trim().toLowerCase()
    if (!term) return collaborators
    return collaborators.filter((collaborator) => {
      const values = [
        collaborator.email,
        collaborator.user?.firstName,
        collaborator.user?.lastName,
        collaborator.status,
        PERMISSION_LABELS[collaborator.permissionLevel],
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase())
      return values.some((value) => value.includes(term))
    })
  }, [collaborators, collaboratorFilter])

  const filteredShareLinks = useMemo(() => {
    if (!Array.isArray(shareLinks) || !shareLinks.length) {
      return shareLinks || []
    }
    const term = shareLinkFilter.trim().toLowerCase()
    if (!term) return shareLinks
    return shareLinks.filter((link) => {
      const values = [
        link.label,
        link.accessLevel,
        link.token,
        link.createdBy?.email,
        link.createdBy?.firstName,
        link.createdBy?.lastName,
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase())
      return values.some((value) => value.includes(term))
    })
  }, [shareLinks, shareLinkFilter])

  const collaboratorMeta = collaboratorsMeta || {}
  const collaboratorPage = collaboratorMeta.page || 1
  const collaboratorLimit = collaboratorMeta.limit || 10
  const collaboratorTotal = collaboratorMeta.total ?? collaborators?.length ?? 0
  const collaboratorStart = collaboratorTotal === 0 ? 0 : (collaboratorPage - 1) * collaboratorLimit + 1
  const collaboratorPageCount = filteredCollaborators.length || 0
  const collaboratorEnd = collaboratorPageCount > 0 ? collaboratorStart + collaboratorPageCount - 1 : collaboratorStart
  const collaboratorTotalPages = collaboratorMeta.totalPages || Math.max(Math.ceil(collaboratorTotal / collaboratorLimit), 1)
  const collaboratorPrevDisabled = collaboratorsLoading || collaboratorPage <= 1 || !onFetchCollaborators
  const collaboratorNextDisabled =
    collaboratorsLoading || collaboratorPage >= collaboratorTotalPages || !onFetchCollaborators

  const shareLinkMeta = shareLinksMeta || {}
  const shareLinkPage = shareLinkMeta.page || 1
  const shareLinkLimit = shareLinkMeta.limit || 10
  const shareLinkTotal = shareLinkMeta.total ?? shareLinks?.length ?? 0
  const shareLinkStart = shareLinkTotal === 0 ? 0 : (shareLinkPage - 1) * shareLinkLimit + 1
  const shareLinkPageCount = filteredShareLinks.length || 0
  const shareLinkEnd = shareLinkPageCount > 0 ? shareLinkStart + shareLinkPageCount - 1 : shareLinkStart
  const shareLinkTotalPages = shareLinkMeta.totalPages || Math.max(Math.ceil(shareLinkTotal / shareLinkLimit), 1)
  const shareLinkPrevDisabled = shareLinksLoading || shareLinkPage <= 1 || !onFetchShareLinks
  const shareLinkNextDisabled =
    shareLinksLoading || shareLinkPage >= shareLinkTotalPages || !onFetchShareLinks

  const changeCollaboratorPage = async (newPage) => {
    if (!onFetchCollaborators) return
    if (newPage < 1 || newPage > collaboratorTotalPages) return

    try {
      await onFetchCollaborators(tripId, { page: newPage, limit: collaboratorLimit })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to load collaborators right now.'
      toast.error(message)
    }
  }

  const changeShareLinkPage = async (newPage) => {
    if (!onFetchShareLinks) return
    if (newPage < 1 || newPage > shareLinkTotalPages) return

    try {
      await onFetchShareLinks(tripId, { page: newPage, limit: shareLinkLimit })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to load share links right now.'
      toast.error(message)
    }
  }

  const handleInvite = async (event) => {
    event.preventDefault()
    if (!inviteEmail) {
      toast.error('Enter an email to send an invitation.')
      return
    }

    try {
      const result = await onInvite(tripId, {
        email: inviteEmail,
        permissionLevel: invitePermission,
      })
      if (result?.inviteToken) {
        toast.success('Invitation sent')
        toast.custom(
          () => (
            <div className="rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-md">
              <p className="font-medium">Invitation token generated</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{result.inviteToken}</p>
            </div>
          ),
          { duration: 6000 }
        )
      }
      setInviteEmail('')
      setInvitePermission('edit')

      if (onFetchCollaborators) {
        await onFetchCollaborators(tripId, { page: 1, limit: collaboratorLimit }).catch(() => {
          toast.error('Unable to refresh collaborators list.')
        })
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to send invitation.'
      toast.error(message)
    }
  }

  const handleResend = async (collaborator) => {
    try {
      const result = await onResend(tripId, collaborator.id)
      if (result?.inviteToken) {
        toast.success(`Invitation re-sent to ${maskEmail(collaborator.email)}`)
        toast.custom(
          () => (
            <div className="rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-md">
              <p className="font-medium">New invitation token</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{result.inviteToken}</p>
            </div>
          ),
          { duration: 6000 }
        )
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to resend invitation.'
      toast.error(message)
    }
  }

  const handlePermissionChange = async (collaborator, level) => {
    try {
      await onUpdatePermission(tripId, collaborator.id, { permissionLevel: level })
      toast.success('Permissions updated')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to update permission.'
      toast.error(message)
    }
  }

  const handleRemove = async (collaborator) => {
    const confirmed = window.confirm(`Remove ${maskEmail(collaborator.email)} from this trip?`)
    if (!confirmed) return

    try {
      await onRemove(tripId, collaborator.id)
      toast.success('Collaborator removed')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to remove collaborator.'
      toast.error(message)
    }
  }

  const handleCreateShareLink = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        label: shareLabel || undefined,
        accessLevel: shareAccessLevel,
        expiresAt: toIsoString(shareExpiresAt),
        maxUsages: shareMaxUsages ? Number(shareMaxUsages) : undefined,
      }
      const result = await onCreateShareLink(tripId, payload)
      if (result?.token && result?.shareLink) {
        const { shareLink: createdLink, token } = result
        const shareUrl = buildShareLinkUrl(token)
        toast.success('Share link created')
        setShareLinkTokens((prev) => ({
          ...prev,
          [createdLink.id]: token,
        }))
        setLatestShareLink({
          id: createdLink.id,
          url: shareUrl,
          token,
          label: createdLink.label || 'Untitled link',
        })
        setShareLabel('')
        setShareAccessLevel('view')
        setShareExpiresAt('')
        setShareMaxUsages('')
      }
      setShareLabel('')
      setShareAccessLevel('view')
      setShareExpiresAt('')
      setShareMaxUsages('')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to create share link.'
      toast.error(message)
    }
  }

  const handleRevokeShareLink = async (link) => {
    const confirmed = window.confirm(`Revoke the share link "${link.label || 'Unnamed'}"?`)
    if (!confirmed) return

    try {
      await onRevokeShareLink(tripId, link.id)
      toast.success('Share link revoked')
      setShareLinkTokens((prev) => {
        if (!prev[link.id]) return prev
        const updated = { ...prev }
        delete updated[link.id]
        return updated
      })
      setLatestShareLink((current) => (current?.id === link.id ? null : current))
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to revoke share link.'
      toast.error(message)
    }
  }

  const copyToClipboard = async (value) => {
    if (!value) {
      toast.error('Nothing to copy yet. Create a link first.')
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else if (typeof document !== 'undefined') {
        const tempInput = document.createElement('textarea')
        tempInput.value = value
        tempInput.setAttribute('readonly', '')
        tempInput.style.position = 'absolute'
        tempInput.style.left = '-9999px'
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      toast.success('Link copied to clipboard')
    } catch (error) {
      console.error('copy-to-clipboard failed', error)
      toast.error('Unable to copy automatically. Copy the link manually instead.')
    }
  }

  const handleCopyShareLink = async (tokenOrUrl) => {
    const isUrl = typeof tokenOrUrl === 'string' && /^https?:\/\//i.test(tokenOrUrl)
    const target = isUrl ? tokenOrUrl : buildShareLinkUrl(tokenOrUrl)
    await copyToClipboard(target)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Collaborators</CardTitle>
            <CardDescription>Manage who can view or edit this trip.</CardDescription>
          </div>
          {canManageCollaborators && (
            <form className="flex flex-col gap-2 md:flex-row md:items-center" onSubmit={handleInvite}>
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="collaborator-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Invite by email
                </Label>
                <Input
                  id="collaborator-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1 md:w-48">
                <Label htmlFor="collaborator-permission" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Permission
                </Label>
                <Select
                  id="collaborator-permission"
                  value={invitePermission}
                  onChange={(event) => setInvitePermission(event.target.value)}
                >
                  <option value="view">View only</option>
                  <option value="edit">Editor</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <Button type="submit" className="md:self-end">
                Send invite
              </Button>
            </form>
          )}
        </CardHeader>
        <CardContent>
          {collaboratorsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : collaborators?.length ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  placeholder="Filter collaborators"
                  value={collaboratorFilter}
                  onChange={(event) => setCollaboratorFilter(event.target.value)}
                  className="sm:max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Showing {filteredCollaborators.length} of {collaborators.length} collaborator
                  {collaborators.length === 1 ? '' : 's'}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    {canManageCollaborators && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollaborators.map((collaborator) => (
                    <TableRow key={collaborator.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{maskEmail(collaborator.email)}</span>
                          {collaborator.user?.firstName && (
                            <span className="text-xs text-muted-foreground">
                              {collaborator.user.firstName} {collaborator.user.lastName || ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{PERMISSION_LABELS[collaborator.permissionLevel]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(collaborator.status)}>{collaborator.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">
                          {formatRelativeDate(collaborator.invitedAt) || 'Pending'}
                        </p>
                        {collaborator.respondedAt && (
                          <p className="text-xs text-muted-foreground">
                            Responded {formatRelativeDate(collaborator.respondedAt)}
                          </p>
                        )}
                      </TableCell>
                      {canManageCollaborators && (
                        <TableCell className="text-right">
                          {collaborator.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResend(collaborator)}
                              >
                                Resend
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(collaborator)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Select
                                value={collaborator.permissionLevel}
                                onChange={(event) => handlePermissionChange(collaborator, event.target.value)}
                                className="h-9 w-32 text-xs"
                              >
                                <option value="view">View only</option>
                                <option value="edit">Editor</option>
                                <option value="admin">Admin</option>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(collaborator)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {!filteredCollaborators.length && (
                    <TableRow>
                      <TableCell
                        colSpan={canManageCollaborators ? 5 : 4}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No collaborators match your filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {collaboratorStart === 0 ? 0 : collaboratorStart}-{collaboratorEnd} of {collaboratorTotal}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={collaboratorPrevDisabled}
                    onClick={() => changeCollaboratorPage(collaboratorPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={collaboratorNextDisabled}
                    onClick={() => changeCollaboratorPage(collaboratorPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No collaborators yet. Invite teammates to start collaborating.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Share Links</CardTitle>
          <CardDescription>Create view-only links for guests or external partners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestShareLink && (
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Link ready to share</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{latestShareLink.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleCopyShareLink(latestShareLink.url)}
                  >
                    <Copy className="h-4 w-4" />
                    Copy link
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Save this URL securely. For security reasons the full token is only shown immediately after creation.
              </p>
            </div>
          )}

          {canEditTrip && (
            <form className="grid gap-3 md:grid-cols-5" onSubmit={handleCreateShareLink}>
              <div className="md:col-span-2">
                <Label htmlFor="share-label" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Label (optional)
                </Label>
                <Input
                  id="share-label"
                  placeholder="Family itinerary"
                  value={shareLabel}
                  onChange={(event) => setShareLabel(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="share-access" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Access level
                </Label>
                <Select
                  id="share-access"
                  value={shareAccessLevel}
                  onChange={(event) => setShareAccessLevel(event.target.value)}
                >
                  <option value="view">View</option>
                  <option value="contribute">Contribute</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="share-expires" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Expires (optional)
                </Label>
                <DateTimePicker
                  id="share-expires"
                  value={shareExpiresAt}
                  onChange={setShareExpiresAt}
                  placeholder="Select expiration"
                />
              </div>
              <div>
                <Label htmlFor="share-uses" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Max uses
                </Label>
                <Input
                  id="share-uses"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={shareMaxUsages}
                  onChange={(event) => setShareMaxUsages(event.target.value)}
                />
              </div>
              <div className="md:col-span-5 flex justify-end">
                <Button type="submit">Create link</Button>
              </div>
            </form>
          )}

          {shareLinksLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : shareLinks?.length ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  placeholder="Filter share links"
                  value={shareLinkFilter}
                  onChange={(event) => setShareLinkFilter(event.target.value)}
                  className="sm:max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Showing {filteredShareLinks.length} of {shareLinks.length} link{shareLinks.length === 1 ? '' : 's'}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    {canEditTrip && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShareLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{link.label || 'Untitled link'}</span>
                          <span className="text-xs text-muted-foreground">Created {formatRelativeDate(link.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{link.accessLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">
                          {link.usageCount}{' '}
                          {link.maxUsages ? `of ${link.maxUsages}` : 'uses'}
                        </p>
                        {link.revokedAt && (
                          <p className="text-xs text-destructive/80">Revoked {formatRelativeDate(link.revokedAt)}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {link.expiresAt ? (
                          <p className="text-sm text-foreground">{formatDateTime(link.expiresAt)}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No expiry</p>
                        )}
                      </TableCell>
                      {canEditTrip && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {shareLinkTokens[link.id] && !link.revokedAt && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-muted-foreground hover:bg-muted"
                                onClick={() => handleCopyShareLink(shareLinkTokens[link.id])}
                              >
                                <Copy className="h-4 w-4" />
                                Copy
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRevokeShareLink(link)}
                              disabled={Boolean(link.revokedAt)}
                            >
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {!filteredShareLinks.length && (
                    <TableRow>
                      <TableCell colSpan={canEditTrip ? 5 : 4} className="py-6 text-center text-sm text-muted-foreground">
                        No share links match your filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {shareLinkStart}-{shareLinkEnd} of {shareLinkTotal} share links
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shareLinkPrevDisabled}
                    onClick={() => changeShareLinkPage(shareLinkPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shareLinkNextDisabled}
                    onClick={() => changeShareLinkPage(shareLinkPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No share links created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
