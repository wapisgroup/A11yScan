"use client";

type BrandingTabProps = {
  customLogo: string;
  setCustomLogo: (logo: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
};

export function BrandingTab({
  customLogo,
  setCustomLogo,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  saving,
  onSave,
}: BrandingTabProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Branding Settings
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Customize the logo, color scheme, and default form settings for PDF reports.
          </p>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Custom Logo
          </h3>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Enter logo URL (e.g., https://example.com/logo.png)"
            value={customLogo}
            onChange={(e) => setCustomLogo(e.target.value)}
          />
          {customLogo && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
              <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                <img src={customLogo} alt="Custom logo" className="max-h-16" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-base font-medium text-gray-900 mb-6">
            Custom Colors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div
                className="mt-3 h-12 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
              <div
                className="mt-3 h-12 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Branding Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
