import { defineEventHandler } from 'h3'

export interface LabStep {
  id: number
  title: string
  description: string
  hint: string
  starterCode: string
  validation?: {
    type: 'output' | 'code'
    pattern?: string
    requiredStrings?: string[]
  }
}

export interface Lab {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  category: string
  language: 'javascript' | 'python'
  steps: LabStep[]
}

export const labs: Lab[] = [
  {
    id: 'watson-101',
    title: 'Watson Assistant Basics',
    description: 'Build your first AI chatbot with Watson Assistant SDK',
    difficulty: 'beginner',
    duration: '15 min',
    category: 'AI',
    language: 'javascript',
    steps: [
      {
        id: 1,
        title: 'Setup Watson Assistant Client',
        description: 'Import the Watson Assistant SDK and create an authenticated client instance.',
        hint: 'Use the IamAuthenticator with your API key. The Assistant v2 requires a version date.',
        starterCode: `// Import Watson SDK
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

// TODO: Create assistant instance with authenticator
const assistant = new AssistantV2({
  version: '2023-06-15',
  authenticator: new IamAuthenticator({
    apikey: 'demo-key-will-be-provided'
  }),
  serviceUrl: 'https://api.us-south.assistant.watson.cloud.ibm.com'
});

console.log('Watson Assistant client created');`,
        validation: {
          type: 'output',
          requiredStrings: ['Watson Assistant client created']
        }
      },
      {
        id: 2,
        title: 'Create a Session',
        description: 'Sessions allow you to maintain conversation context with Watson Assistant.',
        hint: 'Use assistant.createSession() with your assistant ID.',
        starterCode: `// Create a session
async function createSession(assistantId) {
  const response = await assistant.createSession({
    assistantId: assistantId
  });
  console.log('Session ID:', response.result.session_id);
  return response.result.session_id;
}

// Run it (using demo assistant ID)
createSession('demo-assistant-id').catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Session ID:']
        }
      },
      {
        id: 3,
        title: 'Send a Message',
        description: 'Send a text message to Watson and receive a response.',
        hint: 'Use assistant.message() with sessionId, assistantId, and input object.',
        starterCode: `async function sendMessage(assistantId, sessionId, text) {
  const response = await assistant.message({
    assistantId: assistantId,
    sessionId: sessionId,
    input: {
      message_type: 'text',
      text: text
    }
  });

  const reply = response.result.output.generic[0].text;
  console.log('Watson says:', reply);
  return reply;
}

// Send a greeting
sendMessage('demo-assistant-id', 'demo-session-id', 'Hello Watson!').catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Watson says:']
        }
      },
      {
        id: 4,
        title: 'Handle Multiple Turns',
        description: 'Create a conversation flow with multiple message exchanges.',
        hint: 'Reuse the same sessionId to maintain context between messages.',
        starterCode: `async function conversation() {
  const assistantId = 'demo-assistant-id';
  const sessionId = await createSession(assistantId);

  // Turn 1
  await sendMessage(assistantId, sessionId, 'Hello');

  // Turn 2
  await sendMessage(assistantId, sessionId, 'What can you help me with?');

  // Turn 3
  await sendMessage(assistantId, sessionId, 'Thank you');

  console.log('Conversation completed');
}

conversation().catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Conversation completed']
        }
      },
      {
        id: 5,
        title: 'Error Handling',
        description: 'Add proper error handling for API calls.',
        hint: 'Use try-catch blocks and check for specific error codes.',
        starterCode: `async function safeConversation() {
  try {
    const assistantId = 'demo-assistant-id';
    const sessionId = await createSession(assistantId);
    const response = await sendMessage(assistantId, sessionId, 'Test message');
    console.log('Success:', response);
  } catch (error) {
    if (error.code === 404) {
      console.error('Assistant not found');
    } else if (error.code === 401) {
      console.error('Authentication failed');
    } else {
      console.error('Error:', error.message);
    }
  }
}

safeConversation();`,
        validation: {
          type: 'code',
          requiredStrings: ['try', 'catch', 'error']
        }
      }
    ]
  },
  {
    id: 'gemini-101',
    title: 'Generative AI with Gemini',
    description: 'Build your first AI chatbot application using Google Gemini 2.5 Flash',
    difficulty: 'beginner',
    duration: '15 min',
    category: 'AI',
    language: 'javascript',
    steps: [
      {
        id: 1,
        title: 'Setup Gemini Client',
        description: 'Import the Google Generative AI SDK and initialize the client.',
        hint: 'Use GoogleGenerativeAI with your API key (available as process.env.GEMINI_API_KEY in this sandbox).',
        starterCode: `// Import Gemini SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get API Key from environment
const apiKey = process.env.GEMINI_API_KEY;

// TODO: Initialize the client
const genAI = new GoogleGenerativeAI(apiKey);

// Get the model (gemini-2.5-flash)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

console.log('Gemini client initialized for model:', 'gemini-2.5-flash');`,
        validation: {
          type: 'output',
          requiredStrings: ['Gemini client initialized for model: gemini-2.5-flash']
        }
      },
      {
        id: 2,
        title: 'Generate Content',
        description: 'Send a simple prompt to the model and print the response.',
        hint: 'Use model.generateContent() and await the response.',
        starterCode: `async function generateText() {
  const prompt = "Explain how AI works in one sentence.";
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('Response:', text);
  return text;
}

generateText().catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Response:']
        }
      },
      {
        id: 3,
        title: 'Start a Chat Session',
        description: 'Initialize a chat session for multi-turn conversations.',
        hint: 'Use model.startChat() to create a chat object.',
        starterCode: `async function startChat() {
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: "Hello, I am learning deployment."
      },
      {
        role: "model",
        parts: "Great to meet you. I can help with that."
      }
    ],
  });
  
  // Send a new message
  const result = await chat.sendMessage("What is the first step?");
  const response = await result.response;
  const text = response.text();
  
  console.log('Chat output:', text);
}

startChat().catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Chat output:']
        }
      },
      {
        id: 4,
        title: 'Streaming Response',
        description: 'Handle partial results for a better user experience.',
        hint: 'Use generateContentStream and iterate over the stream.',
        starterCode: `async function streamContent() {
  const prompt = "Write a haiku about coding.";
  
  const result = await model.generateContentStream(prompt);
  
  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    process.stdout.write(chunkText); // Print without newline
    fullText += chunkText;
  }
  console.log('\\nStream complete');
}

streamContent().catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Stream complete']
        }
      },
      {
        id: 5,
        title: 'Error Handling',
        description: 'Safely handle potential API errors.',
        hint: 'Wrap your API calls in try-catch blocks.',
        starterCode: `async function safeGenerate() {
  try {
    // Intentionally empty prompt to potentially cause issues or just test safety
    const result = await model.generateContent("Hello"); 
    const response = await result.response;
    console.log('Success:', response.text());
  } catch (error) {
    console.error('Error generating content:', error.message);
  }
}

safeGenerate();`,
        validation: {
          type: 'code',
          requiredStrings: ['try', 'catch']
        }
      }
    ]
  },
  {
    id: 'cloudant-crud',
    title: 'Cloudant CRUD Operations',
    description: 'Learn database operations with Cloudant NoSQL',
    difficulty: 'beginner',
    duration: '20 min',
    category: 'Database',
    language: 'javascript',
    steps: [
      {
        id: 1,
        title: 'Connect to Cloudant',
        description: 'Initialize a connection to IBM Cloudant database.',
        hint: 'Use @ibm-cloud/cloudant with IAM authentication.',
        starterCode: `const { CloudantV1 } = require('@ibm-cloud/cloudant');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');

const client = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({
    apikey: 'demo-cloudant-key'
  })
});

console.log('Cloudant client initialized');`,
        validation: {
          type: 'output',
          requiredStrings: ['Cloudant client initialized']
        }
      },
      {
        id: 2,
        title: 'Create a Document',
        description: 'Insert a new document into a Cloudant database.',
        hint: 'Use client.postDocument() with database name and document object.',
        starterCode: `async function createDocument(db, doc) {
  const response = await client.postDocument({
    db: db,
    document: doc
  });
  console.log('Created document:', response.result.id);
  return response.result;
}

const myDoc = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

createDocument('users', myDoc).catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Created document:']
        }
      },
      {
        id: 3,
        title: 'Read a Document',
        description: 'Retrieve a document by its ID.',
        hint: 'Use client.getDocument() with database and document ID.',
        starterCode: `async function readDocument(db, docId) {
  const response = await client.getDocument({
    db: db,
    docId: docId
  });
  console.log('Document:', response.result);
  return response.result;
}

readDocument('users', 'demo-doc-id').catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Document:']
        }
      },
      {
        id: 4,
        title: 'Update a Document',
        description: 'Modify an existing document (requires _rev).',
        hint: 'Get the document first to obtain its _rev, then update.',
        starterCode: `async function updateDocument(db, docId, updates) {
  // First, get current document
  const current = await client.getDocument({ db, docId });

  // Merge updates
  const updated = { ...current.result, ...updates };

  // Update document
  const response = await client.postDocument({
    db: db,
    document: updated
  });

  console.log('Updated document, new rev:', response.result.rev);
  return response.result;
}

updateDocument('users', 'demo-doc-id', { age: 31 }).catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Updated document']
        }
      },
      {
        id: 5,
        title: 'Delete a Document',
        description: 'Remove a document from the database.',
        hint: 'Use client.deleteDocument() with database, ID, and current rev.',
        starterCode: `async function deleteDocument(db, docId) {
  // Get current rev
  const doc = await client.getDocument({ db, docId });

  // Delete
  const response = await client.deleteDocument({
    db: db,
    docId: docId,
    rev: doc.result._rev
  });

  console.log('Deleted document:', docId);
  return response.result;
}

deleteDocument('users', 'demo-doc-id').catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Deleted document:']
        }
      },
      {
        id: 6,
        title: 'Query with Selector',
        description: 'Find documents using Cloudant Query (Mango syntax).',
        hint: 'Use client.postFind() with a selector object.',
        starterCode: `async function findDocuments(db, selector) {
  const response = await client.postFind({
    db: db,
    selector: selector,
    limit: 10
  });

  console.log('Found', response.result.docs.length, 'documents');
  return response.result.docs;
}

// Find all users over age 25
findDocuments('users', { age: { $gt: 25 } }).catch(console.error);`,
        validation: {
          type: 'output',
          requiredStrings: ['Found', 'documents']
        }
      }
    ]
  }
]

export default defineEventHandler(() => {
  return labs.map(lab => ({
    id: lab.id,
    title: lab.title,
    description: lab.description,
    difficulty: lab.difficulty,
    duration: lab.duration,
    category: lab.category,
    steps: lab.steps.length
  }))
})
