"use client";
import React from "react";
import dynamic from "next/dynamic";
import RestoreProgressModal from "./RestoreProgressModal";

// Lazy-load heavier modals for fast initial page load and smaller JS bundle
const AddPlayerModal = dynamic(() => import("./AddPlayerModal"), { ssr: false });
const BranchManager = dynamic(() => import("./BranchManager"), { ssr: false });
const Profile = dynamic(() => import("./Profile"), { ssr: false });
const AddEventModal = dynamic(() => import("./AddEventModal"), { ssr: false });
const AddParticipantsModal = dynamic(() => import("./AddParticipantsModal"), { ssr: false });
const EventPaymentModal = dynamic(() => import("./EventPaymentModal"), { ssr: false });
const EmailBackupModal = dynamic(() => import("./EmailBackupModal"), { ssr: false });
const RestoreModal = dynamic(() => import("./RestoreModal"), { ssr: false });
const WelcomeCardModal = dynamic(() => import("./WelcomeCardModal"), { ssr: false });
const BranchAttendanceModal = dynamic(() => import("./BranchAttendanceModal"), { ssr: false });
const AccountSettingsModal = dynamic(() => import("./AccountSettingsModal"), { ssr: false });
const SystemFeaturesModal = dynamic(() => import("./SystemFeaturesModal"), { ssr: false });
const ExportExcelModal = dynamic(() => import("./ExportExcelModal"), { ssr: false });

export default function DashboardModals({
  // Add player
  showForm = false,
  setShowForm,
  branches = [],
  branch = "كل الصالات",
  onAddPlayer,
  onOpenManageBranches,

  // Branch manager
  showBranches = false,
  setShowBranches,
  players = [],
  onAddBranch,
  onRenameBranch,
  onUpdateBranch,
  onDeleteBranch,
  onDeleteBlockedBranch,
  toastMessage = "",

  // Profile
  selected = null,
  setSelected,
  onUpdatePlayer,
  onDeletePlayer,
  paymentMonth,
  events = [],

  // Events
  showAddEventModal = false,
  setShowAddEventModal,
  editingEvent = null,
  setEditingEvent,
  onSaveEvent,
  eventActionBusy = false,
  addParticipantsEvent = null,
  setAddParticipantsEvent,
  onAddParticipants,
  paymentParticipantData = null,
  setPaymentParticipantData,
  onSaveParticipantPayment,

  // Backups
  showEmailBackupModal = false,
  setShowEmailBackupModal,
  userEmail,
  showRestoreModal = false,
  setShowRestoreModal,
  onReloadAllData,
  restoreProgressModal = null,

  // Welcome & Reports
  welcomePlayer = null,
  setWelcomePlayer,
  branchAttendanceReport = null,
  setBranchAttendanceReport,
  sessionDate,
  captainName = "كابتن",
  academyName = "CoachMaster",

  // Account & Features
  showAccountSettings = false,
  setShowAccountSettings,
  onUserUpdated,
  showFeaturesModal = false,
  setShowFeaturesModal,

  // Excel
  showExportExcelModal = false,
  setShowExportExcelModal,
  exportInitialTab = "players",
  exportInitialEventId = null,

  // Utilities
  showToast,
}) {
  return (
    <>
      {showForm && (
        <AddPlayerModal
          branches={branches}
          initialBranch={branch === "كل الصالات" ? "" : branch}
          onClose={() => setShowForm(false)}
          onAdd={onAddPlayer}
          onManageBranches={() => {
            setShowForm(false);
            if (onOpenManageBranches) onOpenManageBranches();
          }}
        />
      )}

      {showBranches && (
        <BranchManager
          branches={branches}
          players={players}
          onAdd={onAddBranch}
          onRename={onRenameBranch}
          onUpdateBranch={onUpdateBranch}
          onDelete={onDeleteBranch}
          onDeleteBlocked={onDeleteBlockedBranch}
          notice={toastMessage || ""}
          onClose={() => setShowBranches(false)}
        />
      )}

      {selected && (
        <Profile
          player={selected}
          branches={branches}
          onClose={() => setSelected(null)}
          onUpdate={onUpdatePlayer}
          onDelete={onDeletePlayer}
          paymentMonth={paymentMonth}
          events={events}
        />
      )}

      {showAddEventModal && (
        <AddEventModal
          isOpen={showAddEventModal}
          initialEvent={editingEvent}
          onClose={() => {
            setShowAddEventModal(false);
            if (setEditingEvent) setEditingEvent(null);
          }}
          onSave={onSaveEvent}
          isSubmitting={eventActionBusy}
        />
      )}

      {addParticipantsEvent && (
        <AddParticipantsModal
          isOpen={Boolean(addParticipantsEvent)}
          event={addParticipantsEvent}
          players={players}
          branches={branches}
          onClose={() => setAddParticipantsEvent(null)}
          onAddParticipants={onAddParticipants}
          isSubmitting={eventActionBusy}
        />
      )}

      {paymentParticipantData && (
        <EventPaymentModal
          isOpen={Boolean(paymentParticipantData)}
          participant={paymentParticipantData.participant}
          eventTitle={paymentParticipantData.event?.title}
          onClose={() => setPaymentParticipantData(null)}
          onSavePayment={onSaveParticipantPayment}
          isSubmitting={eventActionBusy}
        />
      )}

      {showEmailBackupModal && (
        <EmailBackupModal
          isOpen={showEmailBackupModal}
          onClose={() => setShowEmailBackupModal(false)}
          showToast={showToast}
          userEmail={userEmail}
        />
      )}

      {showRestoreModal && (
        <RestoreModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          showToast={showToast}
          onRestoreSuccess={onReloadAllData}
        />
      )}

      {restoreProgressModal && (
        <RestoreProgressModal restoreProgressModal={restoreProgressModal} />
      )}

      {welcomePlayer && (
        <WelcomeCardModal
          player={welcomePlayer}
          captainName={captainName}
          academyName={academyName}
          isOpen={Boolean(welcomePlayer)}
          onClose={() => setWelcomePlayer(null)}
        />
      )}

      {branchAttendanceReport && (
        <BranchAttendanceModal
          branchName={branchAttendanceReport.branchName || branchAttendanceReport}
          sessionDate={branchAttendanceReport.date || sessionDate}
          players={players}
          captainName={captainName}
          academyName={academyName}
          isOpen={Boolean(branchAttendanceReport)}
          onClose={() => setBranchAttendanceReport(null)}
        />
      )}

      {showAccountSettings && (
        <AccountSettingsModal
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
          showToast={showToast}
          onUserUpdated={onUserUpdated}
        />
      )}

      {showFeaturesModal && (
        <SystemFeaturesModal
          isOpen={showFeaturesModal}
          onClose={() => setShowFeaturesModal(false)}
        />
      )}

      {showExportExcelModal && (
        <ExportExcelModal
          isOpen={showExportExcelModal}
          onClose={() => setShowExportExcelModal(false)}
          players={players}
          events={events}
          branches={branches}
          paymentMonth={paymentMonth}
          academyName={academyName}
          captainName={captainName}
          initialTab={exportInitialTab}
          initialEventId={exportInitialEventId}
          showToast={showToast}
        />
      )}
    </>
  );
}
