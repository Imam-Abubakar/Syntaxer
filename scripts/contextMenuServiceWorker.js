const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }else {
          console.log('Injection Successful')
        }
      }
    );
  });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';

  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-002',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });

  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
  try {
    // Send mesage with generating text (this will be like a loading indicator)
    sendMessage('Creating your dev.to article');

    const { selectionText } = info;
    const basePromptPrefix = `
    Write me a well detailed and professional table of contents for an article with the title below.
      
      Title:
      `;

      const baseCompletion = await generate(
        `${basePromptPrefix}${selectionText}`
      );
      
      const secondPrompt = `
      Take the table of contents and title of the article below to generate a well summarized article. Kindly ensure that the article is well-constructed and concise. Explain each points in detail.
        
        Title: ${selectionText}
        
        Table of Contents: ${baseCompletion.text}
        
        Article:
		  `;
      
      const secondPromptCompletion = await generate(secondPrompt);   
      
      sendMessage(secondPromptCompletion.text);
      console.log(secondPromptCompletion.text)
  } catch (error) {
    console.log(error);
    sendMessage(error.toString());
  }
};
chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate blog post',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);