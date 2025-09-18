import React, { useState, useRef } from "react";
import { Play, Upload } from "lucide-react";
import { aiInteractionService } from "../../services/api";
import PatientSelector from "../PatientSelectior";

const AISpeech = () => {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  const handlePatientSelect = (patientId) => {
    setSelectedPatient(patientId);
  };

  const handleTextToSpeech = async () => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiInteractionService.textToSpeech(text, language);
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid response structure from server');
      }

      if (!response.data.audioUrl) {
        throw new Error('No audio URL received from text-to-speech service');
      }

      setAudioUrl(response.data.audioUrl);

      if (audioRef.current) {
        audioRef.current.src = response.data.audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error converting text to speech:", error);
      alert(`Failed to convert text to speech: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPatient = async () => {
    if (!selectedPatient) {
      alert("Please select a patient before saving.");
      return;
    }

    if (!text.trim() || !audioUrl) {
      alert("Please enter some text and convert it to speech first.");
      return;
    }

    setIsSaving(true);
    try {
      await aiInteractionService.createAIInteraction({
        userId: selectedPatient,
        interactionType: "speechConversion",
        content: text,
        audioUrl: audioUrl,
      });

      alert("Speech conversion saved successfully to patient record!");
    } catch (error) {
      console.error("Error saving speech conversion:", error);
      alert("Failed to save to patient record. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">AI Speech Converter</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <PatientSelector onSelectPatient={handlePatientSelect} />

        <div className="mb-4 mt-4">
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Language
          </label>
          <select
            id="language-select"
            className="border rounded p-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English (US)</option>
            <option value="es">Spanish</option>
            <option value="pt-BR">Portuguese (Brazilian)</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="text-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Text to Convert
          </label>
          <textarea
            id="text-input"
            className="w-full p-2 border rounded"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter medical information or instructions here..."
          />
        </div>

        {audioUrl && (
          <div className="mb-4">
            <audio ref={audioRef} controls src={audioUrl} />
          </div>
        )}

        <div className="flex justify-between">
          <button
            className={`${
              isLoading ? "bg-gray-500" : "bg-blue-500"
            } text-white px-4 py-2 rounded flex items-center`}
            onClick={handleTextToSpeech}
            disabled={isLoading || !text.trim()}
          >
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? "Converting..." : "Convert to Speech"}
          </button>

          {audioUrl && (
            <button
              className={`${
                isSaving || !selectedPatient ? "bg-gray-500" : "bg-green-500"
              } text-white px-4 py-2 rounded`}
              onClick={handleSaveToPatient}
              disabled={isSaving || !selectedPatient}
            >
              {isSaving ? "Saving..." : "Save to Patient Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISpeech;
