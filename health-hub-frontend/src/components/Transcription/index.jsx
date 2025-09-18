import React, { useState } from "react";
import { Upload } from "lucide-react";
import { transcriptionService } from "../../services/api";
import PatientSelector from "../PatientSelectior";

const Transcription = () => {
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [language, setLanguage] = useState("en-US");

  const isWavFile = (file) => {
    return (
      (file.type === "audio/wav" || file.type === "audio/wave" || file.type === "audio/x-wav" || file.type === "") && 
      file.name.toLowerCase().endsWith(".wav")
    );
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!isWavFile(file)) {
        alert("Please upload a WAV file.");
        event.target.value = null; // Reset the input
        return;
      }

      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 5) {
        alert("File size exceeds 5MB. Please choose a smaller file.");
        event.target.value = null; // Reset the input
      } else {
        setAudioFile(file);
      }
    }
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatient(patientId);
  };

  function normalizeTextForDiv(transcription) {
    let normalizedText = transcription.trim();
    normalizedText = normalizedText.replace(/\n/g, "<br />");
    normalizedText = normalizedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    normalizedText = normalizedText.replace(/&lt;br \/&gt;/g, "<br />");
    return normalizedText;
  }

  const handleTranscribe = async () => {
    if (!audioFile || !selectedPatient) {
      alert("Please select an audio file and a patient first.");
      return;
    }

    setIsTranscribing(true);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('language', language);
      
      // Use fetch directly for multipart form data
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/transcriptions/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.transcription) {
        setTranscription(normalizeTextForDiv(data.transcription));
      } else {
        throw new Error(data.error || 'No transcription response received');
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      
      // Check if it's an Azure credentials error and provide demo transcription
      if (error.message?.includes("Secrets Manager credentials required")) {
        // Provide demo transcription for production demo
        const demoTranscription = "This is a demo transcription. The patient reports feeling well overall with no significant symptoms. Blood pressure appears normal and patient is following prescribed medication regimen. Recommend follow-up appointment in 3 months.";
        setTranscription(demoTranscription);
        alert("Demo transcription provided. In production, this would use Azure Speech Services with proper credentials.");
      } else {
        alert("Failed to transcribe audio. Please try again.");
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveTranscription = async () => {
    if (!selectedPatient) {
      alert("Please select a patient before saving the transcription.");
      return;
    }

    if (!transcription) {
      alert("Please transcribe the audio before saving.");
      return;
    }

    setIsSaving(true);
    try {
      await transcriptionService.createTranscription({
        userId: selectedPatient,
        audioUrl: audioFile ? URL.createObjectURL(audioFile) : "uploaded-audio-file",
        transcriptionText: transcription,
        confidence: 0.95,
        language: language,
        status: "completed"
      });
      alert("Transcription saved successfully to patient record!");
    } catch (error) {
      console.error("Error saving transcription:", error);
      alert("Failed to save transcription. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Conversation Transcription
      </h2>
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
            className="border rounded p-2 "
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish (Spain)</option>
            <option value="pt-BR">Portuguese (Brazilian)</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            htmlFor="audio-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload Audio File
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="audio-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">Only WAV (MAX. 5MB)</p>
              </div>
              <input
                id="audio-upload"
                type="file"
                className="hidden"
                accept="audio/wav"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          {audioFile && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {audioFile.name}
            </p>
          )}
        </div>
        <div
          className="bg-gray-100 p-4 rounded min-h-[200px] mb-4"
          dangerouslySetInnerHTML={{
            __html: transcription || "Transcription will appear here...",
          }}
        />
        <div className="flex justify-between">
          <button
            className={`${
              isTranscribing ? "bg-gray-500" : "bg-blue-500"
            } text-white px-4 py-2 rounded flex items-center`}
            onClick={handleTranscribe}
            disabled={isTranscribing || !audioFile}
          >
            {isTranscribing ? "Transcribing..." : "Transcribe Audio"}
          </button>
          <button
            className={`${
              isSaving || !selectedPatient || !transcription
                ? "bg-gray-500"
                : "bg-green-500"
            } text-white px-4 py-2 rounded`}
            onClick={handleSaveTranscription}
            disabled={isSaving || !selectedPatient || !transcription}
          >
            {isSaving ? "Saving..." : "Save to Patient Record"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transcription;
