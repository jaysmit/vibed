'use client';

import { useState } from 'react';

export function NotificationSettings() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [founderNudges, setFounderNudges] = useState(true);

  // TODO: Save preferences to database
  const handleToggle = (setter: (v: boolean) => void, current: boolean) => {
    setter(!current);
    // Would call API here to persist
  };

  return (
    <div className="bg-page border border-rule rounded-xl p-6">
      <h3 className="text-[16px] font-bold mb-4">Notifications</h3>

      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-[14px] font-medium">Email updates</div>
            <div className="text-[13px] text-ink-3">Get notified about ventures you follow</div>
          </div>
          <button
            onClick={() => handleToggle(setEmailUpdates, emailUpdates)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              emailUpdates ? 'bg-go' : 'bg-rule'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                emailUpdates ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-[14px] font-medium">Weekly digest</div>
            <div className="text-[13px] text-ink-3">Summary of activity from ventures you follow</div>
          </div>
          <button
            onClick={() => handleToggle(setWeeklyDigest, weeklyDigest)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              weeklyDigest ? 'bg-go' : 'bg-rule'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                weeklyDigest ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-[14px] font-medium">Founder reminders</div>
            <div className="text-[13px] text-ink-3">Gentle nudges to update your ventures</div>
          </div>
          <button
            onClick={() => handleToggle(setFounderNudges, founderNudges)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              founderNudges ? 'bg-go' : 'bg-rule'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                founderNudges ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
