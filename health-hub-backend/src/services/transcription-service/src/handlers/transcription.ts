import { APIGatewayProxyHandler } from "aws-lambda";
import { TranscriptionService } from "../services/transcriptionService";
import { parseFormData } from "./parseFormData";
const transcriptionService = new TranscriptionService();

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body!);
    const transcription = await transcriptionService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(transcription),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create transcription" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const transcription = await transcriptionService.get(id);
    if (!transcription) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Transcription not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(transcription),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve transcription" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const transcription = await transcriptionService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(transcription),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update transcription" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    await transcriptionService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete transcription" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const { patientId } = event.queryStringParameters || {};
    let transcriptions;

    if (patientId) {
      transcriptions = await transcriptionService.findByPatientId(patientId);
    } else {
      transcriptions = await transcriptionService.list();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(transcriptions),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not list transcriptions" }),
    };
  }
};

export const transcribeAudio: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No body found in the request" }),
      };
    }

    const { file, fields } = await parseFormData(event);
    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "failed to parse audio" }),
      };
    }
    
    const language = fields?.language || "en-US";
    const transcription = await transcriptionService.transcribeAudio(
      //@ts-ignore
      file.content,
      language
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ transcription }),
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not transcribe audio" }),
    };
  }
};
