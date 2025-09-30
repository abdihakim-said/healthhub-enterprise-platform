import { APIGatewayProxyHandler } from "aws-lambda";
import { AIInteractionService } from "../services/aiInteractionService";

const aiInteractionService = new AIInteractionService();

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    let data;
    try {
      data = JSON.parse(event.body!);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }
    
    const interaction = await aiInteractionService.create(data);
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(interaction),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error creating AI interaction:', error);
    }
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not create AI interaction" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const interaction = await aiInteractionService.get(id);
    if (!interaction) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "AI interaction not found" }),
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(interaction),
    };
  } catch (error) {
    console.error('Error getting AI interaction:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not retrieve AI interaction" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const interaction = await aiInteractionService.update(id, data);
    if (!interaction) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "AI interaction not found" }),
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(interaction),
    };
  } catch (error) {
    console.error('Error updating AI interaction:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not update AI interaction" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const success = await aiInteractionService.delete(id);
    if (!success) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "AI interaction not found" }),
      };
    }
    return {
      statusCode: 204,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: "",
    };
  } catch (error) {
    console.error('Error deleting AI interaction:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not delete AI interaction" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      // Return all interactions for dashboard analytics
      const allInteractions = await aiInteractionService.listAll();
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(allInteractions),
      };
    }

    const interactions = await aiInteractionService.list(userId);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(interactions),
    };
  } catch (error) {
    console.error('Error listing AI interactions:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not retrieve AI interactions" }),
    };
  }
};

export const processVirtualAssistant: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId, query } = JSON.parse(event.body!);
    
    if (!userId || !query) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "userId and query are required" }),
      };
    }

    const response = await aiInteractionService.processVirtualAssistant(query, userId);

    // Create interaction record
    const interaction = await aiInteractionService.create({
      userId,
      interactionType: "virtualAssistant",
      content: query,
      response,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        response: response,
        interactionId: interaction.id,
        status: "success"
      }),
    };
  } catch (error) {
    console.error('Error processing virtual assistant request:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Could not process virtual assistant request" }),
    };
  }
};

export const virtualAssistant: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId, query } = JSON.parse(event.body!);
    const response = await aiInteractionService.handleVirtualAssistant(
      query,
      userId
    );

    const interaction = await aiInteractionService.create({
      userId,
      interactionType: "virtualAssistant",
      content: query,
      response,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ interaction, response }),
    };
  } catch (error) {
    console.error('Error processing virtual assistant request:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Could not process virtual assistant query",
      }),
    };
  }
};

export const textToSpeech: APIGatewayProxyHandler = async (event) => {
  try {
    const { text, language } = JSON.parse(event.body!);

    if (!text || !language) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Text and language are required" }),
      };
    }

    const result = await aiInteractionService.textToSpeech(text, language);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to convert text to speech" }),
    };
  }
};
