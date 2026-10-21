export default function Loading() {
  return (
    <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header - static */}
      <div className="mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Settings
        </h1>
        <p className="text-ink-2 text-[14px] sm:text-[16px] mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile section - static heading */}
      <div className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h2 className="text-[16px] font-bold mb-4">Profile</h2>
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 bg-rule/40 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-10 w-full bg-rule/40 rounded-lg animate-pulse mb-3" />
            <div className="h-10 w-full bg-rule/40 rounded-lg animate-pulse mb-3" />
            <div className="h-20 w-full bg-rule/40 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Account section - static heading */}
      <div className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h2 className="text-[16px] font-bold mb-4">Account</h2>
        <div className="h-10 w-full bg-rule/40 rounded-lg animate-pulse mb-3" />
        <div className="h-10 w-full bg-rule/40 rounded-lg animate-pulse" />
      </div>

      {/* Notifications section - static heading */}
      <div className="bg-page border border-rule rounded-xl p-6">
        <h2 className="text-[16px] font-bold mb-4">Notifications</h2>
        <div className="space-y-4">
          {['Email digests', 'New followers', 'Comments'].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[14px] text-ink-2">{label}</span>
              <div className="h-6 w-12 bg-rule/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
