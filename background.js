
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      autoTranslate: true,
      showTLDR: true,
      showELI5: false,
      darkMode: false
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translateText') {
    handleTranslation(request, sendResponse);
    return true;
  }
});

async function handleTranslation(request, sendResponse) {
  try {
    const { text, type } = request;
    const result = await chrome.storage.sync.get(['apiKey']);
    
    if (!result.apiKey) {
      sendResponse({ 
        success: false, 
        error: 'API key not configured. Please set your Gemini API key in the extension popup.' 
      });
      return;
    }
    
    const translatedText = await translateWithGemini(text, type, result.apiKey);
    sendResponse({ success: true, data: translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    sendResponse({ 
      success: false, 
      error: 'Translation failed. Please check your API key and try again.' 
    });
  }
}

async function translateWithGemini(text, type, apiKey) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  
  let prompt = '';
  
  switch (type) {
    case 'translate':
      prompt = `Translate the following text from Hindi/Hinglish to fluent English. Preserve the original meaning and tone, but make it natural and readable in English:\n\n${text}`;
      break;
    case 'tldr':
      prompt = `Create a comprehensive yet concise TL;DR summary that captures ALL key points, main ideas, and essential details without missing anything important. Structure it in 3-5 bullet points or short paragraphs that cover the complete scope:\n\n${text}`;
      break;
    case 'eli5':
      prompt = `Explain this concept to a young child (5-8 years old) in great detail. Use very simple words, analogies that kids understand, step-by-step explanations, and be thorough but age-appropriate. Make it educational and engaging:\n\n${text}`;
      break;
    case 'thread-tldr':
    case 'thread-summary':
      prompt = `Create a comprehensive TL;DR summary of this entire Reddit thread (post + all comments). Cover ALL key aspects without missing important points:

• Main topic and original question/post
• Key insights and information shared
• Most important advice or solutions
• Common opinions and consensus
• Notable disagreements or debates
• Best answers or most helpful comments
• Overall conclusion and takeaways

Be thorough but concise - don't miss any important details:

${text.substring(0, 15000)}`;
      break;
    case 'format':
      prompt = `Clean up and format the following Hinglish text. Fix spacing, punctuation, and grammar while preserving the original meaning:\n\n${text}`;
      break;
    default:
      prompt = `Translate the following text to English:\n\n${text}`;
  }
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };
  
  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text;
}
