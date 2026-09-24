const activeStatuses = new Set(['PENDING', 'WAITING_FOR_CUSTOMER']);
const nonterminalStatuses = new Set(['PENDING', 'APPROVED', 'WAITING_FOR_CUSTOMER']);

export function canTransitionResetRequest(status, action) {
  if (action === 'complete') return status === 'APPROVED';
  if (action === 'approve' || action === 'reject') return activeStatuses.has(status);
  if (action === 'request_info') return nonterminalStatuses.has(status);
  return false;
}
