import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import '../styles/pages.css';

function VolunteerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [activeView, setActiveView] = useState('available');
  const [updatingId, setUpdatingId] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [availableResponse, assignedResponse] = await Promise.all([
        api.get('/api/volunteers/tasks'),
        api.get('/api/volunteers/tasks/assigned'),
      ]);
      setAvailableTasks(availableResponse.data.tasks || []);
      setAssignedTasks(assignedResponse.data.tasks || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load pickup assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const activeTasks = useMemo(
    () =>
      assignedTasks.filter((task) =>
        ['ASSIGNED', 'ACCEPTED', 'COLLECTED', 'IN_TRANSIT'].includes(
          String(task.status).toUpperCase(),
        ),
      ),
    [assignedTasks],
  );
  const completedTasks = useMemo(
    () =>
      assignedTasks.filter(
        (task) => String(task.status).toUpperCase() === 'COMPLETED'
          || String(task.status).toUpperCase() === 'DELIVERED',
      ),
    [assignedTasks],
  );

  async function acceptAssignment(task) {
    setUpdatingId(task.id);
    setError('');
    try {
      const response = await api.patch(`/api/volunteers/tasks/${task.id}/accept`);
      const acceptedTask = response.data.task;
      setAvailableTasks((current) => current.filter((item) => item.id !== task.id));
      setAssignedTasks((current) => [acceptedTask, ...current]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not accept the assignment.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function declineAssignment(task) {
    setUpdatingId(task.id);
    setError('');
    try {
      await api.patch(`/api/volunteers/tasks/${task.id}/decline`);
      setAssignedTasks((current) => current.filter((item) => item.id !== task.id));
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not decline the assignment.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateTaskStatus(task, status) {
    setUpdatingId(task.id);
    setError('');
    try {
      const response = await api.patch(`/api/volunteers/tasks/${task.id}/status`, { status });
      const updatedTask = response.data.task;
      setAssignedTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, ...updatedTask } : item)),
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the pickup status.');
    } finally {
      setUpdatingId(null);
    }
  }

  function nextStatus(task) {
    switch (String(task.status).toUpperCase()) {
      case 'ASSIGNED':
        return { label: 'Accept task', status: 'ACCEPTED' };
      case 'ACCEPTED':
        return { label: 'Mark collected', status: 'COLLECTED' };
      case 'COLLECTED':
        return { label: 'Mark delivered', status: 'DELIVERED' };
      default:
        return null;
    }
  }

  if (loading) return <LoadingSpinner message="Loading your deliveries..." />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Volunteer Dashboard</h1>
          <p className="dashboard-page__welcome">
            Welcome, {user?.name}! Manage your delivery assignments.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadTasks} />}

      <div className="dashboard-page__cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Available Assignments</h3>
          <p className="dashboard-card__value">{availableTasks.length}</p>
          <p className="dashboard-card__description">Approved pickups waiting for a volunteer.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Active Deliveries</h3>
          <p className="dashboard-card__value">{activeTasks.length}</p>
          <p className="dashboard-card__description">Pickups currently assigned to you.</p>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">Completed</h3>
          <p className="dashboard-card__value">{completedTasks.length}</p>
          <p className="dashboard-card__description">Deliveries you have finished.</p>
        </div>
      </div>

      <div className="ngo-dashboard__tabs" role="tablist" aria-label="Volunteer dashboard views">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'available'}
          className={activeView === 'available' ? 'is-active' : ''}
          onClick={() => setActiveView('available')}
        >
          Available assignments
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'assigned'}
          className={activeView === 'assigned' ? 'is-active' : ''}
          onClick={() => setActiveView('assigned')}
        >
          My assignments
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'completed'}
          className={activeView === 'completed' ? 'is-active' : ''}
          onClick={() => setActiveView('completed')}
        >
          Completed
        </button>
      </div>

      {activeView === 'available' && (
        <section className="dashboard-section">
          <h2>Available pickup assignments</h2>
          {availableTasks.length ? (
            <div className="pickup-request-list">
              {availableTasks.map((task) => (
                <article className="pickup-request-card" key={task.id}>
                  <div className="pickup-request-card__header">
                    <div>
                      <h3>Donation #{task.donation_id}</h3>
                      {task.notes && <p className="pickup-request-card__notes">{task.notes}</p>}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  <p><strong>Donor ID:</strong> {task.donor_id ?? 'Not provided'}</p>
                  <p><strong>NGO/recipient ID:</strong> {task.ngo_id ?? 'Not provided'}</p>
                  <div className="pickup-request-card__actions">
                    <Button
                      type="button"
                      size="small"
                      loading={updatingId === task.id}
                      onClick={() => acceptAssignment(task)}
                    >
                      Accept assignment
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="donation-list__empty"><p>No available pickup assignments.</p></div>
          )}
        </section>
      )}

      {activeView !== 'available' && (
        <section className="dashboard-section">
          <h2>{activeView === 'completed' ? 'Completed assignments' : 'My assignments'}</h2>
          {(activeView === 'completed' ? completedTasks : activeTasks).length ? (
            <div className="pickup-request-list">
              {(activeView === 'completed' ? completedTasks : activeTasks).map((task) => {
                const next = nextStatus(task);
                return (
                  <article className="pickup-request-card" key={task.id}>
                    <div className="pickup-request-card__header">
                      <div>
                        <h3>Donation #{task.donation_id}</h3>
                        {task.notes && <p className="pickup-request-card__notes">{task.notes}</p>}
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    <p><strong>Donor ID:</strong> {task.donor_id ?? 'Not provided'}</p>
                    <p><strong>NGO/recipient ID:</strong> {task.ngo_id ?? 'Not provided'}</p>
                    {next && activeView !== 'completed' && (
                      <div className="pickup-request-card__actions">
                        <Button
                          type="button"
                          size="small"
                          loading={updatingId === task.id}
                          onClick={() => updateTaskStatus(task, next.status)}
                        >
                          {next.label}
                        </Button>
                        {String(task.status).toUpperCase() === 'ASSIGNED' && (
                          <Button
                            type="button"
                            size="small"
                            variant="danger"
                            loading={updatingId === task.id}
                            onClick={() => declineAssignment(task)}
                          >
                            Decline assignment
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="donation-list__empty">
              <p>{activeView === 'completed' ? 'No completed assignments.' : 'No active assignments.'}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default VolunteerDashboard;
