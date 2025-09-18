import React, { useState, useEffect } from "react";
import {
  transcriptionService,
  medicalImageService,
  aiInteractionService,
} from "../../services/api";

const MedicalRecords = ({ userId }) => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [medicalImages, setMedicalImages] = useState([]);
  const [aiSpeech, setAiSpeech] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          transcriptionsResponse,
          medicalImagesResponse,
          aiSpeechResponse,
        ] = await Promise.all([
          transcriptionService.getTranscriptions({ patientId: userId }),
          medicalImageService.getMedicalImages({ patientId: userId }),
          aiInteractionService.getAIInteractions({
            params: {
              userId,
              interactionType: "speechConversion",
            },
          }),
        ]);
        setTranscriptions(transcriptionsResponse.data);
        setMedicalImages(medicalImagesResponse.data);
        setAiSpeech(aiSpeechResponse.data);
      } catch (error) {
        console.error("Error fetching medical records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Medical Records</h2>

      {/* AI Speech Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">AI Speech Conversions</h3>
        {aiSpeech.length > 0 ? (
          <ul className="space-y-4">
            {aiSpeech.map((speech) => (
              <li key={speech.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-600">
                    Date: {new Date(speech.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="font-medium text-gray-700">Original Text:</p>
                  <p className="mt-1 text-gray-600">{speech.content}</p>
                </div>
                {speech.audioUrl && (
                  <div className="mt-2">
                    <audio controls src={speech.audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No AI speech conversions available</p>
        )}
      </div>

      {/* Transcriptions Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Transcriptions</h3>
        {transcriptions.length > 0 ? (
          <ul className="space-y-4">
            {transcriptions.map((transcription) => (
              <li key={transcription.id} className="border-b pb-2">
                <p className="text-sm text-gray-600">
                  Date: {new Date(transcription.createdAt).toLocaleString()}
                </p>
                <p
                  className="mt-1"
                  dangerouslySetInnerHTML={{
                    __html: transcription.content,
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No transcriptions available</p>
        )}
      </div>

      {/* Medical Images Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Medical Images</h3>
        {medicalImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {medicalImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={image.imageUrl}
                    alt="Medical"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-2">
                  <p className="text-sm text-gray-600">
                    Date: {new Date(image.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: {image.imageType}
                  </p>
                  {image.analysisResults && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Analysis Results:</p>
                      {image.analysisResults.map((result, index) => (
                        <div key={index} className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${result.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {result.description}: {result.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No medical images available</p>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
