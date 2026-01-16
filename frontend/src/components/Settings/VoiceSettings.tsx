import { useTTS } from "../../hooks/useTTS";
import { Volume2, VolumeX } from "lucide-react";

export default function VoiceSettings() {
  const { settings, updateSettings, availableVoices, isSupported, speak } =
    useTTS();

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ Text-to-speech is not supported in your browser. Please use a
          modern browser like Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  const testVoice = () => {
    speak("Hello! This is a test of the selected voice.");
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Voice Settings</h3>
        <button
          onClick={() => updateSettings({ enabled: !settings.enabled })}
          className={`p-2 rounded-lg transition-colors ${
            settings.enabled
              ? "bg-[var(--accent)] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          title={settings.enabled ? "Disable voice" : "Enable voice"}
        >
          {settings.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Auto-play toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-play
              </label>
              <p className="text-xs text-gray-500">
                Automatically read assistant messages
              </p>
            </div>
            <button
              onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoPlay ? "bg-[var(--accent)]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoPlay ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Voice selection */}
          <div>
            <label
              htmlFor="voice-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Voice
            </label>
            <select
              id="voice-select"
              value={settings.voice || ""}
              onChange={(e) => updateSettings({ voice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="speed-slider"
                className="text-sm font-medium text-gray-700"
              >
                Speed
              </label>
              <span className="text-sm text-gray-600">
                {settings.rate.toFixed(1)}x
              </span>
            </div>
            <input
              id="speed-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={(e) =>
                updateSettings({ rate: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Pitch control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="pitch-slider"
                className="text-sm font-medium text-gray-700"
              >
                Pitch
              </label>
              <span className="text-sm text-gray-600">
                {settings.pitch.toFixed(1)}
              </span>
            </div>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={(e) =>
                updateSettings({ pitch: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          {/* Volume control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="volume-slider"
                className="text-sm font-medium text-gray-700"
              >
                Volume
              </label>
              <span className="text-sm text-gray-600">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) =>
                updateSettings({ volume: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Test button */}
          <button
            onClick={testVoice}
            className="w-full px-4 py-2 bg-[var(--accent)] hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 size={18} />
            Test Voice
          </button>
        </>
      )}
    </div>
  );
}
