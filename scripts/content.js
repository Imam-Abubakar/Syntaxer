const insert = (content) => {
let newContent = `${content}`;
document.getElementById("article_body_markdown").value = newContent;

  return true;
};

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.message === 'inject') {
      const { content } = request;
			
      const result = insert(content);
      if (!result) {
        sendResponse({ status: 'failed' });
      }
      sendResponse({ status: 'success' });
    }
  }
);