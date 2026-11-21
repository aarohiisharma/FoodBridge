const AppError = require('../utils/AppError');
const volunteerService = require('../services/volunteerService');
const adminService = require('../services/adminService');
const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

const getVolunteerTasks = asyncHandler(async (request, response) => {
  const tasks = await volunteerService.getAvailableTasks();
  response.status(200).json({ success: true, tasks });
});

const getAssignedTasks = asyncHandler(async (request, response) => {
  const tasks = await volunteerService.getAssignedTasks(request.user.id);
  response.status(200).json({ success: true, tasks });
});

const acceptVolunteerTask = asyncHandler(async (request, response) => {
  const task = await volunteerService.acceptAssignment(request.params.id, request.user.id);
  response.status(200).json({ success: true, task });
});

const declineVolunteerTask = asyncHandler(async (request, response) => {
  const task = await volunteerService.declineAssignment(request.params.id, request.user.id);
  response.status(200).json({ success: true, task });
});

const updateVolunteerTask = asyncHandler(async (request, response) => {
  const task = await volunteerService.updateVolunteerTask(
    request.params.id,
    request.user.id,
    request.body.status,
  );
  response.status(200).json({ success: true, task });
});

const getAdminStats = asyncHandler(async (request, response) => {
  const stats = await adminService.getStats();
  response.status(200).json({ success: true, stats });
});

const getRegisteredUsers = asyncHandler(async (request, response) => {
  const users = await adminService.getRegisteredUsers();
  response.status(200).json({ success: true, users });
});

const getNgos = asyncHandler(async (request, response) => {
  const ngos = await adminService.getNgos();
  response.status(200).json({ success: true, ngos });
});

const getAdminDonations = asyncHandler(async (request, response) => {
  const donations = await adminService.getDonations();
  response.status(200).json({ success: true, donations });
});

const updateNgoVerification = asyncHandler(async (request, response) => {
  const ngo = await adminService.updateNgoVerification(request.params.id, request.body.status);
  response.status(200).json({ success: true, ngo });
});

const getNotifications = asyncHandler(async (request, response) => {
  const notifications = await notificationService.listNotifications(request.user.id);
  response.status(200).json({ success: true, notifications });
});

const markNotificationRead = asyncHandler(async (request, response) => {
  const notification = await notificationService.markNotificationRead(
    request.params.id,
    request.user.id,
  );
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  response.status(200).json({ success: true, notification });
});

module.exports = {
  getVolunteerTasks,
  getAssignedTasks,
  acceptVolunteerTask,
  declineVolunteerTask,
  updateVolunteerTask,
  getAdminStats,
  getRegisteredUsers,
  getNgos,
  getAdminDonations,
  updateNgoVerification,
  getNotifications,
  markNotificationRead,
};
