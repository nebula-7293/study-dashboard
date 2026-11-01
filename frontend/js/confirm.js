/**
 * StudyPulse Reusable Confirmation Modal
 * Replaces native browser confirm(...) dialogs with a styled Bento modal.
 */

let confirmResolver = null;

/**
 * Show confirmation modal
 * @param {Object} options
 * @param {string} [options.title='Delete Confirmation']
 * @param {string} [options.message='Are you sure you want to delete it?']
 * @param {string} [options.confirmText='Delete']
 * @param {string} [options.cancelText='Cancel']
 * @param {boolean} [options.danger=true]
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled/dismissed
 */
export function showConfirmModal({
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete it?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true
} = {}) {
  const modal = document.getElementById('confirm-modal');
  if (!modal) {
    // Fallback if modal DOM element is not found
    return Promise.resolve(window.confirm(message));
  }

  // Cancel any pending unresolved confirm modal
  if (confirmResolver) {
    confirmResolver(false);
    confirmResolver = null;
  }

  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const confirmBtn = document.getElementById('btn-action-confirm');
  const cancelBtn = document.getElementById('btn-cancel-confirm');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (confirmBtn) {
    confirmBtn.textContent = confirmText;
    confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
  }
  if (cancelBtn) cancelBtn.textContent = cancelText;

  modal.classList.add('open');

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

/**
 * Close confirmation modal and resolve promise
 * @param {boolean} result
 */
export function closeConfirmModal(result = false) {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('open');
  if (confirmResolver) {
    confirmResolver(result);
    confirmResolver = null;
  }
}

/**
 * Initialize event listeners for the confirmation modal
 */
export function initConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;

  const confirmBtn = document.getElementById('btn-action-confirm');
  const cancelBtn = document.getElementById('btn-cancel-confirm');
  const closeBtn = document.getElementById('btn-close-confirm-modal');

  confirmBtn?.addEventListener('click', () => {
    closeConfirmModal(true);
  });

  cancelBtn?.addEventListener('click', () => {
    closeConfirmModal(false);
  });

  closeBtn?.addEventListener('click', () => {
    closeConfirmModal(false);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeConfirmModal(false);
    }
  });
}
