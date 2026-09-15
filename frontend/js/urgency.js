/**
 * Smart Urgency Recommendation Engine
 * Analyzes deadlines and due dates to suggest LOW, MEDIUM, or HIGH urgency
 */

export function calculateUrgencySuggestion(dueDateStr) {
  if (!dueDateStr) {
    return {
      urgency: 'LOW',
      daysLeft: null,
      reason: 'No upcoming deadline set — classified as routine backlog.'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: 'HIGH',
      daysLeft: diffDays,
      reason: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}! Needs immediate attention.`
    };
  } else if (diffDays <= 1) {
    return {
      urgency: 'HIGH',
      daysLeft: diffDays,
      reason: diffDays === 0 ? 'Due today! High urgency recommended.' : 'Due tomorrow! High urgency recommended.'
    };
  } else if (diffDays <= 4) {
    return {
      urgency: 'MEDIUM',
      daysLeft: diffDays,
      reason: `Due in ${diffDays} days — optimal for Medium urgency focus.`
    };
  } else {
    return {
      urgency: 'LOW',
      daysLeft: diffDays,
      reason: `Due in ${diffDays} days — ample time, Low urgency recommended.`
    };
  }
}

/**
 * Format days countdown string (e.g., "In 2 days", "Today", "Tomorrow", "Overdue by 1d")
 */
export function formatCountdown(dateStr) {
  if (!dateStr) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue (${Math.abs(diffDays)}d)`, isUrgent: true, diffDays };
  } else if (diffDays === 0) {
    return { text: 'Due today!', isUrgent: true, diffDays };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', isUrgent: true, diffDays };
  } else if (diffDays <= 4) {
    return { text: `In ${diffDays} days`, isUrgent: false, diffDays };
  } else {
    return { text: `In ${diffDays} days`, isUrgent: false, diffDays };
  }
}
