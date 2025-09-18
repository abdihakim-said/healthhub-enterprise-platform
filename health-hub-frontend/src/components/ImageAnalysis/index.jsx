import React, { useState } from "react";
import { Upload, Send } from "lucide-react";
import { medicalImageService } from "../../services/api";
import PatientSelector from "../PatientSelectior";

const ImageAnalysis = () => {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [imageType, setImageType] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");

  const handlePatientSelect = (patientId) => {
    setSelectedPatient(patientId);
  };

  const handleImageTypeChange = (e) => {
    setImageType(e.target.value);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedPatient("");
    setImageType("");
    setImageFile(null);
    setImagePreview("");
    setAnalysisResults(null);
    setIsUploading(false);
    setIsAnalyzing(false);
    setAnalysisMessage("");
  };

  const handleAnalyzeImage = async () => {
    if (!selectedPatient || !imageType || !imageFile) {
      alert("Please select a patient, image type, and upload an image.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisMessage("");
    setAnalysisResults(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];
        try {
          const response = await medicalImageService.uploadMedicalImage({
            patientId: selectedPatient,
            imageType: imageType,
            imageData: base64Image,
          });
          setIsUploading(false);
          setIsAnalyzing(true);
          try {
            const analysisResponse =
              await medicalImageService.analyzeMedicalImage(response.data.id);
            
            
            // Validate response structure
            if (!analysisResponse || !analysisResponse.data) {
              throw new Error('Invalid response structure from image analysis service');
            }
            
            if (!analysisResponse.data.detectedConditions || analysisResponse.data.detectedConditions.length === 0) {
              setAnalysisMessage("No conditions detected in the image");
            } else {
              // Fix: Use detectedConditions instead of conditions
              setAnalysisResults(analysisResponse.data.detectedConditions);
              setAnalysisMessage(
                "Analysis complete. Here are the detected conditions:"
              );
            }
          } catch (analysisError) {
            console.error("Error analyzing image:", analysisError);
            setAnalysisMessage(`Failed to analyze image: ${analysisError.message}`);
          } finally {
            setIsAnalyzing(false);
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          setAnalysisMessage("Failed to upload image. Please try again.");
          resetForm();
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Error reading file:", error);
      setAnalysisMessage("Failed to read image file. Please try again.");
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Medical Image Analysis
      </h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <PatientSelector onSelectPatient={handlePatientSelect} />

        <div className="mt-4">
          <label
            htmlFor="image-type"
            className="block text-sm font-medium text-gray-700"
          >
            Image Type
          </label>
          <select
            id="image-type"
            className="border rounded p-2"
            value={imageType}
            onChange={handleImageTypeChange}
          >
            <option value="">Select Image Type</option>
            <option value="xray">X-Ray</option>
            <option value="mri">MRI</option>
            <option value="ct">CT Scan</option>
            <option value="ultrasound">Ultrasound</option>
          </select>
        </div>

        <div className="mt-4">
          <label
            htmlFor="image-upload"
            className="block text-sm font-medium text-gray-700"
          >
            Upload Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full h-auto"
            />
          </div>
        )}

        <button
          onClick={handleAnalyzeImage}
          disabled={
            isUploading ||
            isAnalyzing ||
            !selectedPatient ||
            !imageType ||
            !imageFile
          }
          className={`mt-4 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            isUploading ||
            isAnalyzing ||
            !selectedPatient ||
            !imageType ||
            !imageFile
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          }`}
        >
          {isUploading || isAnalyzing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isUploading ? "Uploading..." : "Analyzing..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Analyze Image
            </>
          )}
        </button>

        {analysisMessage && (
          <div
            className={`mt-4 p-4 ${
              analysisResults
                ? "bg-green-100 border-green-500 text-green-700"
                : "bg-yellow-100 border-yellow-500 text-yellow-700"
            } border-l-4`}
          >
            <p>{analysisMessage}</p>
          </div>
        )}

        {analysisResults && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Analysis Results:</h3>
            <div className="space-y-4">
              {analysisResults.map((result, index) => {
                
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {result.condition || result.description || 'Unknown condition'}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {result.confidence ? Math.round(result.confidence * 100) : result.confidence || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${result.confidence ? Math.round(result.confidence * 100) : result.confidence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
