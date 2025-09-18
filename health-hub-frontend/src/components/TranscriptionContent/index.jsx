import React, { useState } from "react";
import { Upload } from "lucide-react";
import { transcriptionService } from "../../services/api";

const TranscriptionContent = () => {
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      alert("Please upload an audio file first.");
      return;
    }

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await transcriptionService.transcribeAudio(formData);
      setTranscription(response.data.transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Conversation Transcription
      </h2>
      <div className="bg-white p-4 rounded-lg shadow">
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
                <p className="text-xs text-gray-500">
                  WAV, MP3, or M4A (MAX. 10MB)
                </p>
              </div>
              <input
                id="audio-upload"
                type="file"
                className="hidden"
                accept="audio/*"
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
        <div className="bg-gray-100 p-4 rounded min-h-[200px] mb-4">
          {transcription || "Transcription will appear here..."}
        </div>
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
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            Save to Patient Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionContent;
