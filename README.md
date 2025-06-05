# Explain Like I'm Five - Chrome Extension

- A Chrome Extension that uses OpenAI to explain any selected text like you're 5 years old.
- You can download the chrome extension [here](https://chromewebstore.google.com/detail/explain-like-im-five/jcojpeajmkfipglkldfjbkicapbekgin?hl=en-US&utm_source=ext_sidebar) if you're not interested in the code.

## Features
- Select any text on a webpage, right-click, and choose "Explain Like I'm Five" to get a simple explanation.
- Powered by OpenAI and AWS Lambda.

## Setup Instructions

### 1. Chrome Extension
1. Clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" (toggle in the top-right corner).
4. Click "Load unpacked" and select the `chrome-extension/` folder.

### 2. AWS Lambda Function
1. Go to the [AWS Lambda Console](https://aws.amazon.com/lambda/).
2. Create a new Lambda function:
   - Runtime: Python 3.x
   - Architecture: x86_64 or arm64 (as per your preference)
3. Add the OpenAI layer:
   - In the Lambda function, go to the **Layers** section.
   - Add a layer with the ARN for the OpenAI Python library (e.g., `arn:aws:lambda:us-east-2:123456789012:layer:openai:1`).
4. Add the Lambda function code:
   - Replace the default code with the following:
     ```python
     import json
     import os
     from openai import OpenAI

     # Initialize OpenAI client with environment variable
     client = OpenAI(api_key=os.getenv("ELIF_OPENAI_KEY"))

     def lambda_handler(event, context):
         try:
             # Parse the request body
             body = json.loads(event.get("body", "{}"))
             user_text = body.get("text", "")

             if not user_text:
                 return {
                     "statusCode": 400,
                     "headers": {
                         "Access-Control-Allow-Origin": "*",  # Allow all origins (CORS fix)
                         "Content-Type": "application/json"
                     },
                     "body": json.dumps({"error": "Text input is required."})
                 }

             # Generate response using GPT-4
             chat_completion = client.chat.completions.create(
                model="gpt-4o-mini",
                 messages=[{"role": "user", "content": f"Explain this like I'm five: {user_text}"}],
                 temperature=0.7,
                 max_tokens=200
             )

             explanation = chat_completion.choices[0].message.content.strip()

             return {
                 "statusCode": 200,
                 "headers": {
                     "Access-Control-Allow-Origin": "*",  # Allow all origins (CORS fix)
                     "Content-Type": "application/json"
                 },
                 "body": json.dumps({"explanation": explanation})
             }

         except Exception as e:
             return {
                 "statusCode": 500,
                 "headers": {
                     "Access-Control-Allow-Origin": "*",  # Allow all origins (CORS fix)
                     "Content-Type": "application/json"
                 },
                 "body": json.dumps({"error": str(e)})
             }
     ```
5. Add the OpenAI API key:
   - In the Lambda function, go to the **Configuration** tab.
   - Under **Environment variables**, add a new variable:
     - Key: `ELIF_OPENAI_KEY`
     - Value: `your_openai_api_key_here`
    
6. Enable Lambda Function URL:
   - Go to the **Function URL** section.
   - Click **Create function URL**.
   - Choose the **Auth type** (e.g., `NONE` for public access).
   - Copy the Function URL.

### 3. Update API URL in `background.js`
1. Open the `background.js` file in the `chrome-extension/` folder.
2. Replace the `apiUrl` variable with your AWS Lambda function's API Gateway endpoint:
   ```javascript
   const apiUrl = "YOUR_AWS_LAMBDA_API_GATEWAY_ENDPOINT_HERE";
### 4. Test the Extension
1. Reload the Chrome Extension in `chrome://extensions/`.
2. Select any text on a webpage, right-click, and choose "Explain Like I'm Five".
